# Database Documentation - Everything App

## Overview

The Everything App uses a **flexible, JSONB-based schema** designed to support extensible trip data without requiring migrations. The database is built on MySQL/TiDB with Drizzle ORM for type-safe operations.

## Design Philosophy

### JSONB Strategy
Instead of creating rigid columns for every possible trip attribute, the schema uses JSONB fields to store flexible, unstructured data. This approach provides:

- **Schema Flexibility:** Add new fields without migrations
- **Type Safety:** TypeScript interfaces define expected structures
- **Query Performance:** JSONB indexes for efficient querying
- **Backward Compatibility:** Old data coexists with new structures

### Example: Trip Data Evolution

```typescript
// Version 1: Basic trip
const tripV1 = {
  budget: 5000,
  travelers: 2,
};

// Version 2: Added interests (no migration needed)
const tripV2 = {
  budget: 5000,
  travelers: 2,
  interests: ['hiking', 'culture', 'food'],
};

// Version 3: Added custom fields (no migration needed)
const tripV3 = {
  budget: 5000,
  travelers: 2,
  interests: ['hiking', 'culture', 'food'],
  customPreferences: {
    preferredHotels: ['Marriott', 'Hyatt'],
    dietaryRestrictions: ['vegetarian'],
  },
};
```

## Core Tables

### 1. Users Table

Stores user authentication and profile information.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Unique user identifier
- `openId`: Everything App OAuth identifier
- `name`: User's display name
- `email`: User's email address
- `loginMethod`: Authentication method (oauth, email, etc.)
- `role`: User role for access control
- `createdAt`: Account creation timestamp
- `updatedAt`: Last profile update
- `lastSignedIn`: Last login timestamp

**Indexes:**
- `UNIQUE INDEX idx_openId (openId)`

---

### 2. Trips Table

Stores trip metadata and configuration with extensible JSONB data.

```sql
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  status ENUM('draft', 'planned', 'in-progress', 'completed', 'archived') DEFAULT 'draft',
  
  -- Extensible JSONB field for trip metadata
  tripData JSON NOT NULL DEFAULT '{}',
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_startDate (startDate)
);
```

**Fields:**
- `id`: Trip identifier
- `userId`: Owner of the trip
- `name`: Trip title
- `description`: Trip description
- `startDate`: Trip start date
- `endDate`: Trip end date
- `status`: Trip lifecycle status
- `tripData`: Extensible JSONB field

**JSONB Structure (tripData):**
```typescript
interface TripData {
  // Budget & Finance
  budget?: number;
  currency?: string;
  spent?: number;
  
  // Trip Details
  travelers?: number;
  travelersInfo?: Array<{
    name: string;
    email?: string;
    role?: 'organizer' | 'participant';
  }>;
  
  // Interests & Preferences
  interests?: string[];
  transportMode?: 'flight' | 'car' | 'train' | 'mixed';
  accommodationType?: 'hotel' | 'airbnb' | 'hostel' | 'resort';
  
  // Safety & Accessibility
  accessibilityNeeds?: string[];
  medicalConditions?: string[];
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  
  // Custom Fields (extensible)
  [key: string]: unknown;
}
```

**Indexes:**
- `INDEX idx_userId (userId)`
- `INDEX idx_startDate (startDate)`
- `FULLTEXT INDEX idx_name_description (name, description)`

---

### 3. Itineraries Table

Stores complete trip itineraries with activities and logistics.

```sql
CREATE TABLE itineraries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tripId INT NOT NULL,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Extensible JSONB fields
  itineraryData JSON NOT NULL DEFAULT '{}',
  safetyNotes JSON NOT NULL DEFAULT '{}',
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tripId (tripId),
  INDEX idx_userId (userId)
);
```

**JSONB Structure (itineraryData):**
```typescript
interface ItineraryData {
  // Itinerary Configuration
  mode?: 'calendar' | 'timeline' | 'map';
  
  // Logistics
  mainDestination?: string;
  waypoints?: Array<{
    location: string;
    coordinates: { lat: number; lon: number };
    duration?: number; // in hours
  }>;
  
  // Transportation
  flights?: Array<{
    from: string;
    to: string;
    date: string;
    time: string;
    airline?: string;
    flightNumber?: string;
    bookingRef?: string;
  }>;
  
  // Accommodation
  accommodations?: Array<{
    name: string;
    location: string;
    checkIn: string;
    checkOut: string;
    bookingRef?: string;
    notes?: string;
  }>;
  
  // Custom Fields
  [key: string]: unknown;
}

interface SafetyNotes {
  emergencyAlerts?: Array<{
    type: 'earthquake' | 'flood' | 'cyclone' | 'volcano';
    severity: 'red' | 'orange' | 'green';
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
```

---

### 4. Activities Table

Stores individual activities and events within an itinerary.

```sql
CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itineraryId INT NOT NULL,
  tripId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Timing
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  duration INT, -- in minutes
  
  -- Location
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Activity Details
  category VARCHAR(100), -- 'sightseeing', 'dining', 'transport', etc.
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  
  -- Extensible JSONB
  activityDetails JSON NOT NULL DEFAULT '{}',
  
  -- Status
  completed BOOLEAN DEFAULT FALSE,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (itineraryId) REFERENCES itineraries(id) ON DELETE CASCADE,
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_itineraryId (itineraryId),
  INDEX idx_startDate (startDate),
  SPATIAL INDEX idx_location (POINT(latitude, longitude))
);
```

**JSONB Structure (activityDetails):**
```typescript
interface ActivityDetails {
  // Booking Information
  bookingRef?: string;
  bookingUrl?: string;
  cost?: number;
  
  // Recommendations
  rating?: number;
  reviews?: string;
  website?: string;
  phone?: string;
  
  // Weather Impact
  weatherSensitive?: boolean;
  alternativeActivities?: string[];
  
  // Notes & Reminders
  notes?: string;
  reminders?: Array<{
    time: string;
    message: string;
  }>;
  
  // Custom Fields
  [key: string]: unknown;
}
```

---

### 5. Bookings Table

Stores flight and hotel reservations.

```sql
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tripId INT NOT NULL,
  userId INT NOT NULL,
  
  -- Booking Details
  bookingType ENUM('flight', 'hotel', 'car', 'activity') NOT NULL,
  bookingRef VARCHAR(100) UNIQUE NOT NULL,
  provider VARCHAR(100), -- 'Amadeus', 'Duffel', 'Booking.com', etc.
  
  -- Dates
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  
  -- Financial
  totalPrice DECIMAL(10, 2),
  currency VARCHAR(3),
  discountCode VARCHAR(100),
  discountAmount DECIMAL(10, 2),
  
  -- Status
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  
  -- Extensible JSONB
  bookingDetails JSON NOT NULL DEFAULT '{}',
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tripId (tripId),
  INDEX idx_bookingRef (bookingRef),
  INDEX idx_startDate (startDate)
);
```

**JSONB Structure (bookingDetails):**
```typescript
interface BookingDetails {
  // Flight Booking
  flight?: {
    airline: string;
    flightNumber: string;
    from: string;
    to: string;
    departure: string;
    arrival: string;
    seatNumber?: string;
    seatClass?: 'economy' | 'business' | 'first';
  };
  
  // Hotel Booking
  hotel?: {
    name: string;
    address: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    confirmationNumber: string;
  };
  
  // Passenger/Guest Information
  passengers?: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  
  // Cancellation & Modification
  cancellationPolicy?: string;
  modificationPolicy?: string;
  
  // Custom Fields
  [key: string]: unknown;
}
```

---

### 6. Alerts Table

Stores weather and emergency alerts.

```sql
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tripId INT,
  userId INT,
  
  -- Alert Details
  alertType ENUM('weather', 'emergency', 'booking', 'system') NOT NULL,
  severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
  
  -- Location
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Timing
  alertDate TIMESTAMP NOT NULL,
  expiryDate TIMESTAMP,
  
  -- Status
  acknowledged BOOLEAN DEFAULT FALSE,
  
  -- Extensible JSONB
  alertData JSON NOT NULL DEFAULT '{}',
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tripId (tripId),
  INDEX idx_userId (userId),
  INDEX idx_alertDate (alertDate),
  SPATIAL INDEX idx_location (POINT(latitude, longitude))
);
```

**JSONB Structure (alertData):**
```typescript
interface AlertData {
  // Weather Alert
  weather?: {
    condition: string;
    temperature?: number;
    windSpeed?: number;
    precipitation?: number;
    recommendation?: string;
  };
  
  // Emergency Alert (GDACS)
  emergency?: {
    eventType: 'earthquake' | 'flood' | 'cyclone' | 'volcano';
    magnitude?: number;
    depth?: number;
    source: 'GDACS' | 'USGS' | 'other';
    externalLink?: string;
  };
  
  // Booking Alert
  booking?: {
    bookingRef: string;
    change: string;
  };
  
  // Custom Fields
  [key: string]: unknown;
}
```

---

## Query Examples

### Get Trip with All Activities

```typescript
export async function getTripWithActivities(tripId: string) {
  return db.query.trips.findFirst({
    where: eq(trips.id, parseInt(tripId)),
    with: {
      itineraries: {
        with: {
          activities: {
            orderBy: asc(activities.startDate),
          },
        },
      },
      bookings: true,
    },
  });
}
```

### Query Activities by Date Range

```typescript
export async function getActivitiesByDateRange(
  tripId: string,
  startDate: Date,
  endDate: Date
) {
  return db.select()
    .from(activities)
    .where(
      and(
        eq(activities.tripId, parseInt(tripId)),
        gte(activities.startDate, startDate),
        lte(activities.endDate, endDate)
      )
    )
    .orderBy(asc(activities.startDate));
}
```

### Search Trips by Interest (JSONB Query)

```typescript
export async function searchTripsByInterest(userId: string, interest: string) {
  return db.select()
    .from(trips)
    .where(
      and(
        eq(trips.userId, parseInt(userId)),
        // JSONB contains check (MySQL syntax)
        sql`JSON_CONTAINS(tripData, JSON_ARRAY(${interest}), '$.interests')`
      )
    );
}
```

### Update Trip Data (Extensible)

```typescript
export async function updateTripData(
  tripId: string,
  updates: Partial<TripData>
) {
  return db.update(trips)
    .set({
      tripData: sql`JSON_MERGE_PATCH(tripData, ${JSON.stringify(updates)})`,
      updatedAt: new Date(),
    })
    .where(eq(trips.id, parseInt(tripId)));
}
```

### Get Alerts Near Location

```typescript
export async function getAlertsNearLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 100
) {
  return db.select()
    .from(alerts)
    .where(
      and(
        sql`ST_DISTANCE_SPHERE(
          POINT(${longitude}, ${latitude}),
          POINT(longitude, latitude)
        ) / 1000 <= ${radiusKm}`,
        gte(alerts.expiryDate, new Date())
      )
    )
    .orderBy(asc(alerts.alertDate));
}
```

## Indexes Strategy

### Performance Indexes
- `idx_userId`: Fast user lookups
- `idx_tripId`: Fast trip lookups
- `idx_startDate`: Efficient date range queries
- `idx_bookingRef`: Booking reference lookups

### Spatial Indexes
- `SPATIAL INDEX idx_location`: Geographic queries for alerts and activities

### Full-Text Indexes
- `FULLTEXT INDEX`: Search trips by name and description

### JSONB Indexes
- Generated indexes for frequently queried JSONB paths
- Example: Index on `tripData.interests` for interest-based searches

## Backup & Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Backup retention: 30 days

### Recovery Procedures
1. Identify recovery point
2. Restore from backup
3. Verify data integrity
4. Resume operations

## Migration Guide

### Adding New JSONB Fields

No database migration needed! Simply update TypeScript interfaces:

```typescript
// Old interface
interface TripData {
  budget?: number;
  travelers?: number;
}

// New interface (no migration needed)
interface TripData {
  budget?: number;
  travelers?: number;
  newField?: string; // Add new field
}
```

### Adding New Tables

1. Update `drizzle/schema.ts`
2. Run `pnpm db:push`
3. Update query helpers in `server/db.ts`
4. Create tRPC procedures

### Changing JSONB Structure

1. Update TypeScript interface
2. Create migration script if data transformation needed
3. Deploy new code
4. Run migration script (if needed)

## Performance Optimization

### Query Optimization
- Use indexes for WHERE clauses
- Limit result sets with pagination
- Avoid N+1 queries with eager loading

### JSONB Optimization
- Index frequently queried JSONB paths
- Use JSON_EXTRACT for specific field queries
- Denormalize frequently accessed data

### Caching Strategy
- Cache user trips in Redis
- Cache weather forecasts (5-minute TTL)
- Cache alert data (10-minute TTL)

## Data Privacy & Security

### Encryption
- All data encrypted in transit (HTTPS)
- Sensitive data encrypted at rest
- JSONB data validated before storage

### Access Control
- Row-level security: Users can only access their own trips
- Role-based access: Admin users have elevated privileges
- API rate limiting to prevent abuse

### Compliance
- GDPR compliance: User data deletion support
- Data retention policies
- Audit logging for sensitive operations
