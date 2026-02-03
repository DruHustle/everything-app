# Architecture Documentation - Everything App

## System Overview

The Everything App follows a **layered, modular architecture** designed for scalability, maintainability, and extensibility. The system separates concerns into distinct layers that communicate through well-defined interfaces.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SDUI Engine (Layout Renderer)                       │   │
│  │  ├─ Calendar Mode                                   │   │
│  │  ├─ Travel Guide Mode                               │   │
│  │  ├─ Itinerary Mode                                  │   │
│  │  └─ Booking Mode                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (tRPC)                           │
│  Type-safe RPC procedures with automatic serialization     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Business Logic Layer (Express)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Trip Management Service                             │   │
│  │  Itinerary Optimization Service                      │   │
│  │  Weather & Safety Service                            │   │
│  │  AI Agent Orchestration                              │   │
│  │  Recommendation Engine                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (Drizzle ORM)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MySQL/TiDB Database                                 │   │
│  │  ├─ Users Table                                      │   │
│  │  ├─ Trips Table (with JSONB)                         │   │
│  │  ├─ Itineraries Table (with JSONB)                   │   │
│  │  ├─ Activities Table                                 │   │
│  │  ├─ Bookings Table                                   │   │
│  │  └─ Alerts Table                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           External Services Integration                     │
│  ├─ Open-Meteo (Weather)                                    │
│  ├─ GDACS (Emergency Alerts)                                │
│  ├─ Amadeus (Travel Data)                                   │
│  ├─ Duffel (Booking)                                        │
│  └─ Manus Forge (LLM & Storage)                             │
└─────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Frontend Layer

The frontend is built with React 19 and implements a **Server-Driven UI (SDUI)** engine that dynamically renders layouts based on backend configuration.

#### SDUI Engine
The core of the frontend is the **Layout Renderer**, which interprets `layout_id` from the backend and renders corresponding pre-defined components:

```typescript
// Layout Renderer Pattern
interface LayoutConfig {
  layout_id: string;
  data: Record<string, unknown>;
  mode: 'calendar' | 'guide' | 'itinerary' | 'booking';
}

const layoutMap = {
  'calendar-month': CalendarMonthLayout,
  'calendar-week': CalendarWeekLayout,
  'guide-destinations': GuideDestinationsLayout,
  'itinerary-timeline': ItineraryTimelineLayout,
  'booking-search': BookingSearchLayout,
};
```

#### Mode System
The app supports four distinct modes that can be switched dynamically:

1. **Calendar Mode:** Visual scheduling with time blocks and event management
2. **Travel Guide Mode:** Destination discovery and recommendations
3. **Itinerary Mode:** Trip planning with drag-and-drop organization
4. **Booking Mode:** Flight and hotel search and reservation

Each mode has its own set of layout components and data requirements.

#### State Management
- **React Query:** Manages server state and caching
- **tRPC Hooks:** Type-safe data fetching and mutations
- **React Context:** Shares global state (auth, current trip, mode)
- **Local Storage:** Persists draft itineraries for anonymous users

### 2. API Layer (tRPC)

tRPC provides a type-safe RPC layer that eliminates the need for manual REST endpoints and client code generation.

#### Procedure Organization

```typescript
// Router structure
appRouter = {
  trips: {
    create: protectedProcedure,
    get: publicProcedure,
    update: protectedProcedure,
    list: protectedProcedure,
    delete: protectedProcedure,
  },
  itineraries: {
    create: protectedProcedure,
    update: protectedProcedure,
    addActivity: protectedProcedure,
    reorderActivities: protectedProcedure,
  },
  weather: {
    getForecast: publicProcedure,
    getAlerts: publicProcedure,
  },
  recommendations: {
    getDestinations: publicProcedure,
    getActivities: publicProcedure,
    optimizeItinerary: protectedProcedure,
  },
};
```

#### Authentication Flow

- **Public Procedures:** Accessible without authentication (weather, recommendations, initial trip creation)
- **Protected Procedures:** Require authentication (saving trips, accessing user data)
- **Admin Procedures:** Restricted to admin users (system configuration)

The unique **delayed authentication** flow allows users to create complete itineraries anonymously, with authentication only required when saving.

### 3. Business Logic Layer

The business logic layer implements core services for trip management, AI recommendations, and safety monitoring.

#### Trip Management Service
Handles CRUD operations for trips and itineraries with support for JSONB data:

```typescript
interface TripService {
  createTrip(data: TripData): Promise<Trip>;
  updateTrip(id: string, data: Partial<TripData>): Promise<Trip>;
  getTrip(id: string): Promise<Trip>;
  listTrips(userId: string): Promise<Trip[]>;
  deleteTrip(id: string): Promise<void>;
}
```

#### Itinerary Optimization Service
Analyzes trip data and provides optimization recommendations:

```typescript
interface ItineraryOptimizer {
  optimizeActivities(itinerary: Itinerary): Promise<OptimizedItinerary>;
  detectConflicts(activities: Activity[]): Conflict[];
  suggestAlternatives(activity: Activity): Promise<Activity[]>;
}
```

#### Weather & Safety Service
Integrates with external APIs to provide real-time weather and emergency information:

```typescript
interface WeatherSafetyService {
  getWeatherForecast(lat: number, lon: number): Promise<Forecast>;
  getEmergencyAlerts(lat: number, lon: number, radius: number): Promise<Alert[]>;
  checkDestinationSafety(destination: string): Promise<SafetyStatus>;
}
```

#### AI Agent Orchestration
Coordinates LLM calls for intelligent recommendations and proactive suggestions:

```typescript
interface AIAgent {
  recommendDestinations(preferences: UserPreferences): Promise<Destination[]>;
  suggestActivities(destination: string, interests: string[]): Promise<Activity[]>;
  generateItinerary(trip: Trip): Promise<Itinerary>;
  proactiveAlert(itinerary: Itinerary, weather: Forecast): Promise<Alert[]>;
}
```

### 4. Data Layer

The data layer uses **Drizzle ORM** with MySQL/TiDB for flexible, type-safe database operations.

#### JSONB Schema Strategy

The database uses JSONB columns to store flexible, unstructured data without requiring schema migrations:

```typescript
// Example: Trips table with JSONB
export const trips = mysqlTable('trips', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: timestamp('startDate').notNull(),
  endDate: timestamp('endDate').notNull(),
  
  // Flexible JSONB field for trip metadata
  tripData: json('tripData').$type<TripData>().notNull().default({}),
  
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

interface TripData {
  budget?: number;
  travelers?: number;
  interests?: string[];
  transportMode?: 'flight' | 'car' | 'train';
  [key: string]: unknown; // Extensible
}
```

#### Query Helpers

Database helpers in `server/db.ts` provide reusable query logic:

```typescript
export async function getTripWithActivities(tripId: string) {
  return db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      activities: true,
      bookings: true,
    },
  });
}

export async function updateTripData(tripId: string, data: Partial<TripData>) {
  return db.update(trips)
    .set({ tripData: data })
    .where(eq(trips.id, tripId));
}
```

### 5. External Services Integration

#### Open-Meteo Weather API
- **Endpoint:** https://api.open-meteo.com/v1/forecast
- **Authentication:** None required
- **Data:** 7-day forecast, current conditions, alerts
- **Update Frequency:** Real-time

#### GDACS Emergency API
- **Endpoint:** https://www.gdacs.org/gdacsapi/api/events/geteventlist
- **Authentication:** None required
- **Data:** Earthquakes, floods, cyclones, volcanic eruptions
- **Alert Levels:** Red (critical), Orange (warning), Green (information)

#### Amadeus Travel API
- **Endpoint:** https://api.amadeus.com
- **Authentication:** OAuth 2.0
- **Data:** Flight search, hotel search, price predictions
- **Rate Limits:** Depends on plan

#### Duffel Booking API
- **Endpoint:** https://api.duffel.com
- **Authentication:** Bearer token
- **Data:** Flight bookings, seat selection, ancillaries
- **Rate Limits:** Depends on plan

## Authentication & Authorization

### OAuth Flow
1. User clicks "Login" button
2. Redirected to Manus OAuth portal
3. OAuth callback returns session token
4. Session cookie set with JWT
5. User authenticated for protected procedures

### Delayed Authentication Strategy
1. User creates itinerary anonymously
2. Draft stored in local storage
3. When saving, user prompted to authenticate
4. Draft transferred to user account
5. Full access to trip management features

### Role-Based Access Control
- **User:** Standard access to own trips
- **Admin:** Access to system configuration and analytics

## Data Flow Examples

### Creating an Itinerary (Anonymous → Authenticated)

```
1. User creates itinerary in browser
   ↓
2. Data stored in local storage (draft)
   ↓
3. User adds activities, weather displays
   ↓
4. User clicks "Save Trip"
   ↓
5. App prompts for authentication
   ↓
6. User logs in via OAuth
   ↓
7. Draft transferred to database
   ↓
8. Itinerary now accessible across devices
```

### Weather-Based Activity Suggestion

```
1. User views itinerary
   ↓
2. Frontend requests weather forecast
   ↓
3. Backend calls Open-Meteo API
   ↓
4. AI Agent analyzes weather + activities
   ↓
5. Proactive suggestions generated
   ↓
6. UI updated with recommendations
```

### Emergency Alert Handling

```
1. Backend polls GDACS API (every 5 minutes)
   ↓
2. New alert detected near user's destination
   ↓
3. Alert stored in database
   ↓
4. User notified via push notification
   ↓
5. Safety banner displayed in UI
   ↓
6. Alternative routes/activities suggested
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers can be deployed behind load balancer
- Database read replicas for high-traffic queries
- Redis caching for frequently accessed data

### Vertical Scaling
- JSONB queries optimized with indexes
- Batch processing for bulk operations
- Async job queue for long-running tasks

### Performance Optimization
- API response caching with React Query
- Lazy loading of trip data
- Pagination for large activity lists
- Debounced weather/alert updates

## Security

### Data Protection
- All data encrypted in transit (HTTPS)
- Sensitive data encrypted at rest
- JSONB data validated before storage

### Access Control
- JWT-based session authentication
- Row-level security for user data
- API rate limiting to prevent abuse

### Input Validation
- All tRPC inputs validated with Zod
- JSONB data schema validation
- SQL injection prevention via ORM

## Error Handling

### Frontend Error Handling
- tRPC error boundaries for graceful degradation
- User-friendly error messages
- Automatic retry for transient failures

### Backend Error Handling
- Structured error responses
- Logging for debugging
- Graceful degradation for external API failures

## Monitoring & Observability

### Logging
- Server-side logs for all API calls
- Client-side error tracking
- External API integration logs

### Metrics
- API response times
- Database query performance
- External API availability
- User engagement metrics

### Alerting
- Critical error notifications
- API availability alerts
- Database performance alerts
