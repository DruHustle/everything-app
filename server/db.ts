import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  trips,
  itineraries,
  activities,
  bookings,
  alerts,
  type Trip,
  type Itinerary,
  type Activity,
  type Booking,
  type Alert,
  type TripData,
  type ItineraryData,
  type ActivityDetails,
  type SafetyNotes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management
 */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Trip Management
 */

export async function createTrip(
  userId: number,
  data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    tripData?: TripData;
  }
): Promise<Trip> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(trips).values({
    userId,
    name: data.name,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    tripData: data.tripData || {},
    status: "draft",
  });

  const tripId = result[0].insertId;
  const created = await db.select().from(trips).where(eq(trips.id, tripId));
  return created[0];
}

export async function getTripById(tripId: number): Promise<Trip | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  return result[0];
}

export async function getTripWithDetails(tripId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const trip = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  if (!trip[0]) return undefined;

  const tripItineraries = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.tripId, tripId));

  const tripActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.tripId, tripId))
    .orderBy(asc(activities.startDate));

  const tripBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.tripId, tripId))
    .orderBy(asc(bookings.startDate));

  return {
    ...trip[0],
    itineraries: tripItineraries,
    activities: tripActivities,
    bookings: tripBookings,
  };
}

export async function listUserTrips(
  userId: number,
  limit: number = 20,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return { trips: [], total: 0 };

  const userTrips = await db
    .select()
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(desc(trips.startDate))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: trips.id })
    .from(trips)
    .where(eq(trips.userId, userId));

  return {
    trips: userTrips,
    total: countResult.length > 0 ? countResult.length : 0,
  };
}

export async function updateTrip(
  tripId: number,
  updates: {
    name?: string;
    description?: string;
    status?: string;
    tripData?: Partial<TripData>;
  }
): Promise<Trip | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateData: Record<string, unknown> = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.description) updateData.description = updates.description;
  if (updates.status) updateData.status = updates.status;

  // Merge tripData if provided
  if (updates.tripData) {
    const current = await getTripById(tripId);
    if (current) {
      updateData.tripData = { ...current.tripData, ...updates.tripData };
    } else {
      updateData.tripData = updates.tripData;
    }
  }

  await db.update(trips).set(updateData).where(eq(trips.id, tripId));

  return getTripById(tripId);
}

export async function deleteTrip(tripId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(trips).where(eq(trips.id, tripId));
}

/**
 * Itinerary Management
 */

export async function createItinerary(
  tripId: number,
  userId: number,
  data: {
    title: string;
    description?: string;
    itineraryData?: ItineraryData;
  }
): Promise<Itinerary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(itineraries).values({
    tripId,
    userId,
    title: data.title,
    description: data.description,
    itineraryData: data.itineraryData || {},
    safetyNotes: {},
  });

  const itineraryId = result[0].insertId;
  const created = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.id, itineraryId));
  return created[0];
}

export async function getItineraryWithActivities(itineraryId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const itinerary = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.id, itineraryId))
    .limit(1);

  if (!itinerary[0]) return undefined;

  const itineraryActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.itineraryId, itineraryId))
    .orderBy(asc(activities.startDate));

  return {
    ...itinerary[0],
    activities: itineraryActivities,
  };
}

export async function updateItinerary(
  itineraryId: number,
  updates: {
    title?: string;
    description?: string;
    itineraryData?: Partial<ItineraryData>;
    safetyNotes?: Partial<SafetyNotes>;
  }
): Promise<Itinerary | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateData: Record<string, unknown> = {};
  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;

  if (updates.itineraryData) {
    const current = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1);
    if (current[0]) {
      updateData.itineraryData = { ...current[0].itineraryData, ...updates.itineraryData };
    }
  }

  if (updates.safetyNotes) {
    const current = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1);
    if (current[0]) {
      updateData.safetyNotes = { ...current[0].safetyNotes, ...updates.safetyNotes };
    }
  }

  await db.update(itineraries).set(updateData).where(eq(itineraries.id, itineraryId));

  const result = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.id, itineraryId))
    .limit(1);
  return result[0];
}

/**
 * Activity Management
 */

export async function createActivity(
  itineraryId: number,
  tripId: number,
  data: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    latitude?: number;
    longitude?: number;
    category?: string;
    priority?: string;
    activityDetails?: ActivityDetails;
  }
): Promise<Activity> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const duration =
    (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60);

  const result = await db.insert(activities).values({
    itineraryId,
    tripId,
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    duration: Math.round(duration),
    location: data.location,
    latitude: data.latitude ? String(data.latitude) : undefined,
    longitude: data.longitude ? String(data.longitude) : undefined,
    category: data.category,
    priority: (data.priority as any) || "medium",
    activityDetails: data.activityDetails || {},
  });

  const activityId = result[0].insertId;
  const created = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId));
  return created[0];
}

export async function getActivitiesByDateRange(
  tripId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.tripId, tripId),
        gte(activities.startDate, startDate),
        lte(activities.endDate, endDate)
      )
    )
    .orderBy(asc(activities.startDate));
}

export async function updateActivity(
  activityId: number,
  updates: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    activityDetails?: Partial<ActivityDetails>;
    completed?: boolean;
  }
): Promise<Activity | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const updateData: Record<string, unknown> = {};
  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.startDate) updateData.startDate = updates.startDate;
  if (updates.endDate) updateData.endDate = updates.endDate;
  if (updates.location) updateData.location = updates.location;
  if (updates.completed !== undefined) updateData.completed = updates.completed;

  if (updates.activityDetails) {
    const current = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    if (current[0]) {
      updateData.activityDetails = {
        ...current[0].activityDetails,
        ...updates.activityDetails,
      };
    }
  }

  await db.update(activities).set(updateData).where(eq(activities.id, activityId));

  const result = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
  return result[0];
}

export async function reorderActivities(
  itineraryId: number,
  activityIds: number[]
): Promise<Activity[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all activities and sort by the provided order
  const allActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.itineraryId, itineraryId));

  // Create a map for quick lookup
  const activityMap = new Map(allActivities.map((a) => [a.id, a]));
  const ordered = activityIds
    .map((id) => activityMap.get(id))
    .filter((a) => a !== undefined) as Activity[];

  return ordered;
}

/**
 * Booking Management
 */

export async function createBooking(
  tripId: number,
  userId: number,
  data: {
    bookingType: string;
    bookingRef: string;
    provider?: string;
    startDate: Date;
    endDate?: Date;
    totalPrice?: number;
    currency?: string;
    discountCode?: string;
    discountAmount?: number;
    bookingDetails?: Record<string, unknown>;
  }
): Promise<Booking> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bookings).values({
    tripId,
    userId,
    bookingType: data.bookingType as any,
    bookingRef: data.bookingRef,
    provider: data.provider,
    startDate: data.startDate,
    endDate: data.endDate,
    totalPrice: data.totalPrice ? String(data.totalPrice) : undefined,
    currency: data.currency,
    discountCode: data.discountCode,
    discountAmount: data.discountAmount ? String(data.discountAmount) : undefined,
    bookingDetails: data.bookingDetails || {},
    status: "pending",
  });

  const bookingId = result[0].insertId;
  const created = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));
  return created[0];
}

export async function getBookingsByTrip(tripId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(bookings)
    .where(eq(bookings.tripId, tripId))
    .orderBy(asc(bookings.startDate));
}

/**
 * Alert Management
 */

export async function createAlert(
  data: {
    tripId?: number;
    userId?: number;
    alertType: string;
    severity?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    title: string;
    description?: string;
    alertDate: Date;
    expiryDate?: Date;
    alertData?: Record<string, unknown>;
  }
): Promise<Alert> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(alerts).values({
    tripId: data.tripId,
    userId: data.userId,
    alertType: data.alertType as any,
    severity: (data.severity as any) || "info",
    location: data.location,
    latitude: data.latitude ? String(data.latitude) : undefined,
    longitude: data.longitude ? String(data.longitude) : undefined,
    title: data.title,
    description: data.description,
    alertDate: data.alertDate,
    expiryDate: data.expiryDate,
    alertData: data.alertData || {},
  });

  const alertId = result[0].insertId;
  const created = await db
    .select()
    .from(alerts)
    .where(eq(alerts.id, alertId));
  return created[0];
}

export async function getAlertsByTrip(tripId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(alerts)
    .where(eq(alerts.tripId, tripId))
    .orderBy(desc(alerts.alertDate));
}

export async function getActiveAlerts(
  latitude: number,
  longitude: number,
  radiusKm: number = 100
) {
  const db = await getDb();
  if (!db) return [];

  // For now, return all active alerts (spatial queries would need additional setup)
  return db
    .select()
    .from(alerts)
    .where(gte(alerts.expiryDate, new Date()))
    .orderBy(desc(alerts.alertDate));
}

export async function acknowledgeAlert(alertId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(alerts).set({ acknowledged: true }).where(eq(alerts.id, alertId));
}
