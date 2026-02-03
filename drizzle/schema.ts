import {
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Trips table - stores trip metadata with extensible JSONB data.
 * Uses JSONB for flexible trip data without requiring migrations.
 */
export const trips = mysqlTable(
  "trips",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    status: mysqlEnum("status", ["draft", "planned", "in-progress", "completed", "archived"])
      .default("draft")
      .notNull(),

    // Extensible JSONB field for trip metadata
    tripData: json("tripData").$type<TripData>().notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
    index("idx_userId").on(table.userId),
    index("idx_startDate").on(table.startDate),
  ]
);

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

/**
 * Trip data interface - extensible structure stored in JSONB
 */
export interface TripData {
  budget?: number;
  currency?: string;
  spent?: number;
  travelers?: number;
  travelersInfo?: Array<{
    name: string;
    email?: string;
    role?: "organizer" | "participant";
  }>;
  interests?: string[];
  transportMode?: "flight" | "car" | "train" | "mixed";
  accommodationType?: "hotel" | "airbnb" | "hostel" | "resort";
  accessibilityNeeds?: string[];
  medicalConditions?: string[];
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  [key: string]: unknown;
}

/**
 * Itineraries table - stores complete trip itineraries with activities.
 */
export const itineraries = mysqlTable(
  "itineraries",
  {
    id: int("id").autoincrement().primaryKey(),
    tripId: int("tripId").notNull(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    // Extensible JSONB fields
    itineraryData: json("itineraryData").$type<ItineraryData>().notNull(),
    safetyNotes: json("safetyNotes").$type<SafetyNotes>().notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.tripId], foreignColumns: [trips.id] }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
    index("idx_itinerary_tripId").on(table.tripId),
    index("idx_itinerary_userId").on(table.userId),
  ]
);

export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = typeof itineraries.$inferInsert;

/**
 * Itinerary data interface - extensible structure for trip planning
 */
export interface ItineraryData {
  mode?: "calendar" | "timeline" | "map";
  mainDestination?: string;
  waypoints?: Array<{
    location: string;
    coordinates: { lat: number; lon: number };
    duration?: number;
  }>;
  flights?: Array<{
    from: string;
    to: string;
    date: string;
    time: string;
    airline?: string;
    flightNumber?: string;
    bookingRef?: string;
  }>;
  accommodations?: Array<{
    name: string;
    location: string;
    checkIn: string;
    checkOut: string;
    bookingRef?: string;
    notes?: string;
  }>;
  [key: string]: unknown;
}

/**
 * Safety notes interface - stores emergency and weather information
 */
export interface SafetyNotes {
  emergencyAlerts?: Array<{
    type: "earthquake" | "flood" | "cyclone" | "volcano";
    severity: "red" | "orange" | "green";
    location: string;
    description: string;
    timestamp: string;
  }>;
  weatherWarnings?: Array<{
    date: string;
    warning: string;
    recommendation: string;
  }>;
  safetyTips?: string[];
  [key: string]: unknown;
}

/**
 * Activities table - stores individual activities and events.
 */
export const activities = mysqlTable(
  "activities",
  {
    id: int("id").autoincrement().primaryKey(),
    itineraryId: int("itineraryId").notNull(),
    tripId: int("tripId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    duration: int("duration"), // in minutes

    location: varchar("location", { length: 255 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),

    category: varchar("category", { length: 100 }),
    priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),

    activityDetails: json("activityDetails").$type<ActivityDetails>().notNull(),

    completed: boolean("completed").default(false),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.itineraryId], foreignColumns: [itineraries.id] }).onDelete("cascade"),
    foreignKey({ columns: [table.tripId], foreignColumns: [trips.id] }).onDelete("cascade"),
    index("idx_activity_itineraryId").on(table.itineraryId),
    index("idx_activity_startDate").on(table.startDate),
  ]
);

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Activity details interface - extensible structure for activity information
 */
export interface ActivityDetails {
  bookingRef?: string;
  bookingUrl?: string;
  cost?: number;
  rating?: number;
  reviews?: string;
  website?: string;
  phone?: string;
  weatherSensitive?: boolean;
  alternativeActivities?: string[];
  notes?: string;
  reminders?: Array<{
    time: string;
    message: string;
  }>;
  [key: string]: unknown;
}

/**
 * Bookings table - stores flight and hotel reservations.
 */
export const bookings = mysqlTable(
  "bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    tripId: int("tripId").notNull(),
    userId: int("userId").notNull(),

    bookingType: mysqlEnum("bookingType", ["flight", "hotel", "car", "activity"]).notNull(),
    bookingRef: varchar("bookingRef", { length: 100 }).notNull().unique(),
    provider: varchar("provider", { length: 100 }),

    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate"),

    totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }),
    discountCode: varchar("discountCode", { length: 100 }),
    discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }),

    status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"])
      .default("pending")
      .notNull(),

    bookingDetails: json("bookingDetails").$type<BookingDetails>().notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.tripId], foreignColumns: [trips.id] }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
    index("idx_booking_tripId").on(table.tripId),
    index("idx_booking_bookingRef").on(table.bookingRef),
    index("idx_booking_startDate").on(table.startDate),
  ]
);

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Booking details interface - extensible structure for booking information
 */
export interface BookingDetails {
  flight?: {
    airline: string;
    flightNumber: string;
    from: string;
    to: string;
    departure: string;
    arrival: string;
    seatNumber?: string;
    seatClass?: "economy" | "business" | "first";
  };
  hotel?: {
    name: string;
    address: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    confirmationNumber: string;
  };
  passengers?: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  cancellationPolicy?: string;
  modificationPolicy?: string;
  [key: string]: unknown;
}

/**
 * Alerts table - stores weather and emergency alerts.
 */
export const alerts = mysqlTable(
  "alerts",
  {
    id: int("id").autoincrement().primaryKey(),
    tripId: int("tripId"),
    userId: int("userId"),

    alertType: mysqlEnum("alertType", ["weather", "emergency", "booking", "system"]).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info"),

    location: varchar("location", { length: 255 }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    alertDate: timestamp("alertDate").notNull(),
    expiryDate: timestamp("expiryDate"),

    acknowledged: boolean("acknowledged").default(false),

    alertData: json("alertData").$type<AlertData>().notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.tripId], foreignColumns: [trips.id] }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
    index("idx_alert_tripId").on(table.tripId),
    index("idx_alert_userId").on(table.userId),
    index("idx_alert_alertDate").on(table.alertDate),
  ]
);

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Alert data interface - extensible structure for alert information
 */
export interface AlertData {
  weather?: {
    condition: string;
    temperature?: number;
    windSpeed?: number;
    precipitation?: number;
    recommendation?: string;
  };
  emergency?: {
    eventType: "earthquake" | "flood" | "cyclone" | "volcano";
    magnitude?: number;
    depth?: number;
    source: "GDACS" | "USGS" | "other";
    externalLink?: string;
  };
  booking?: {
    bookingRef: string;
    change: string;
  };
  [key: string]: unknown;
}
