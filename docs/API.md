# API Documentation - Everything App

## Overview

The Everything App exposes a comprehensive tRPC API for all operations. All endpoints are type-safe with automatic serialization and error handling.

## Authentication

### Public Procedures
Accessible without authentication:
- Weather forecasts
- Emergency alerts
- Destination recommendations
- Initial trip creation (anonymous)

### Protected Procedures
Require Everything App OAuth authentication:
- Trip management (save, update, delete)
- Itinerary operations
- Booking management
- User preferences

### Authentication Flow

```typescript
// Frontend
const { user, isAuthenticated } = useAuth();

// Protected procedure call
if (isAuthenticated) {
  const result = await trpc.trips.save.mutate(tripData);
}
```

## Trip Management API

### trips.create
Create a new trip (anonymous or authenticated).

**Access:** Public / Protected

**Input:**
```typescript
{
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  tripData?: TripData;
}
```

**Output:**
```typescript
{
  id: string;
  userId?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'planned' | 'in-progress' | 'completed' | 'archived';
  tripData: TripData;
  createdAt: Date;
}
```

**Example:**
```typescript
const trip = await trpc.trips.create.mutate({
  name: 'Summer Europe Tour',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-30'),
  tripData: {
    budget: 5000,
    travelers: 2,
    interests: ['hiking', 'culture'],
  },
});
```

---

### trips.get
Retrieve trip details.

**Access:** Public (own trips) / Protected

**Input:**
```typescript
{
  tripId: string;
}
```

**Output:**
```typescript
{
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  tripData: TripData;
  itineraries: Itinerary[];
  bookings: Booking[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```typescript
const trip = await trpc.trips.get.query({ tripId: '123' });
```

---

### trips.update
Update trip information.

**Access:** Protected (owner only)

**Input:**
```typescript
{
  tripId: string;
  name?: string;
  description?: string;
  status?: string;
  tripData?: Partial<TripData>;
}
```

**Output:**
```typescript
{
  id: string;
  name: string;
  status: string;
  tripData: TripData;
  updatedAt: Date;
}
```

**Example:**
```typescript
const updated = await trpc.trips.update.mutate({
  tripId: '123',
  tripData: {
    budget: 6000,
    interests: ['hiking', 'culture', 'food'],
  },
});
```

---

### trips.list
List user's trips with pagination.

**Access:** Protected

**Input:**
```typescript
{
  limit?: number; // default: 20
  offset?: number; // default: 0
  status?: string;
}
```

**Output:**
```typescript
{
  trips: Trip[];
  total: number;
  hasMore: boolean;
}
```

**Example:**
```typescript
const { trips, total } = await trpc.trips.list.query({
  limit: 10,
  offset: 0,
});
```

---

### trips.delete
Delete a trip.

**Access:** Protected (owner only)

**Input:**
```typescript
{
  tripId: string;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

**Example:**
```typescript
await trpc.trips.delete.mutate({ tripId: '123' });
```

---

### trips.save
Save anonymous trip to user account.

**Access:** Protected

**Input:**
```typescript
{
  draftTrip: Trip; // From local storage
  mergeWithExisting?: boolean;
}
```

**Output:**
```typescript
{
  id: string;
  userId: string;
  name: string;
  status: 'draft' | 'planned';
}
```

**Example:**
```typescript
const saved = await trpc.trips.save.mutate({
  draftTrip: localStorageTrip,
});
```

---

## Itinerary API

### itineraries.create
Create a new itinerary for a trip.

**Access:** Protected

**Input:**
```typescript
{
  tripId: string;
  title: string;
  description?: string;
  itineraryData?: ItineraryData;
}
```

**Output:**
```typescript
{
  id: string;
  tripId: string;
  title: string;
  itineraryData: ItineraryData;
  createdAt: Date;
}
```

**Example:**
```typescript
const itinerary = await trpc.itineraries.create.mutate({
  tripId: '123',
  title: 'Paris & London',
  itineraryData: {
    mainDestination: 'Paris',
    waypoints: [
      { location: 'Paris', coordinates: { lat: 48.8566, lon: 2.3522 } },
      { location: 'London', coordinates: { lat: 51.5074, lon: -0.1278 } },
    ],
  },
});
```

---

### itineraries.addActivity
Add an activity to an itinerary.

**Access:** Protected

**Input:**
```typescript
{
  itineraryId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  activityDetails?: ActivityDetails;
}
```

**Output:**
```typescript
{
  id: string;
  itineraryId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  activityDetails: ActivityDetails;
  createdAt: Date;
}
```

**Example:**
```typescript
const activity = await trpc.itineraries.addActivity.mutate({
  itineraryId: '456',
  title: 'Eiffel Tower Visit',
  startDate: new Date('2024-06-10T09:00:00'),
  endDate: new Date('2024-06-10T12:00:00'),
  location: 'Eiffel Tower, Paris',
  latitude: 48.8584,
  longitude: 2.2945,
  category: 'sightseeing',
  activityDetails: {
    bookingRef: 'EIFFEL123',
    cost: 25,
    rating: 4.8,
  },
});
```

---

### itineraries.reorderActivities
Reorder activities in an itinerary (drag-and-drop).

**Access:** Protected

**Input:**
```typescript
{
  itineraryId: string;
  activityIds: string[]; // New order
}
```

**Output:**
```typescript
{
  success: boolean;
  activities: Activity[];
}
```

**Example:**
```typescript
await trpc.itineraries.reorderActivities.mutate({
  itineraryId: '456',
  activityIds: ['act1', 'act3', 'act2'], // Reordered
});
```

---

### itineraries.update
Update itinerary details.

**Access:** Protected

**Input:**
```typescript
{
  itineraryId: string;
  title?: string;
  description?: string;
  itineraryData?: Partial<ItineraryData>;
  safetyNotes?: Partial<SafetyNotes>;
}
```

**Output:**
```typescript
{
  id: string;
  title: string;
  itineraryData: ItineraryData;
  safetyNotes: SafetyNotes;
  updatedAt: Date;
}
```

---

## Weather & Safety API

### weather.getForecast
Get 7-day weather forecast for a location.

**Access:** Public

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  days?: number; // default: 7
}
```

**Output:**
```typescript
{
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  forecast: Array<{
    date: Date;
    temperature: number;
    condition: string;
    windSpeed: number;
    precipitation: number;
    humidity: number;
    uvIndex: number;
  }>;
}
```

**Example:**
```typescript
const forecast = await trpc.weather.getForecast.query({
  latitude: 48.8566,
  longitude: 2.3522, // Paris
});
```

---

### alerts.getEmergencies
Get active emergency alerts for a location.

**Access:** Public

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
  radiusKm?: number; // default: 100
  alertTypes?: Array<'earthquake' | 'flood' | 'cyclone' | 'volcano'>;
}
```

**Output:**
```typescript
{
  alerts: Array<{
    id: string;
    type: string;
    severity: 'red' | 'orange' | 'green';
    location: string;
    description: string;
    timestamp: Date;
    coordinates: { latitude: number; longitude: number };
    externalLink?: string;
  }>;
  totalCount: number;
}
```

**Example:**
```typescript
const alerts = await trpc.alerts.getEmergencies.query({
  latitude: 48.8566,
  longitude: 2.3522,
  radiusKm: 200,
});
```

---

### alerts.checkDestinationSafety
Check overall safety status of a destination.

**Access:** Public

**Input:**
```typescript
{
  destination: string; // City name or coordinates
  startDate?: Date;
  endDate?: Date;
}
```

**Output:**
```typescript
{
  destination: string;
  safetyScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  activeAlerts: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
  lastUpdated: Date;
}
```

**Example:**
```typescript
const safety = await trpc.alerts.checkDestinationSafety.query({
  destination: 'Paris, France',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-30'),
});
```

---

## Recommendations API

### recommendations.getDestinations
Get AI-recommended destinations based on preferences.

**Access:** Public

**Input:**
```typescript
{
  interests?: string[];
  budget?: number;
  travelers?: number;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  travelDuration?: number; // in days
  limit?: number; // default: 10
}
```

**Output:**
```typescript
{
  destinations: Array<{
    name: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
    description: string;
    bestTime: string;
    estimatedCost: number;
    highlights: string[];
    rating: number;
    matchScore: number; // 0-100
  }>;
}
```

**Example:**
```typescript
const destinations = await trpc.recommendations.getDestinations.query({
  interests: ['hiking', 'culture'],
  budget: 5000,
  travelers: 2,
  season: 'summer',
  travelDuration: 14,
});
```

---

### recommendations.getActivities
Get activity suggestions for a destination.

**Access:** Public

**Input:**
```typescript
{
  destination: string;
  interests?: string[];
  duration?: number; // in days
  budget?: number;
  limit?: number; // default: 20
}
```

**Output:**
```typescript
{
  activities: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    coordinates: { latitude: number; longitude: number };
    duration: number; // in hours
    cost: number;
    rating: number;
    reviews: string;
    website?: string;
    phone?: string;
  }>;
}
```

**Example:**
```typescript
const activities = await trpc.recommendations.getActivities.query({
  destination: 'Paris, France',
  interests: ['culture', 'food'],
  duration: 3,
  budget: 500,
});
```

---

### recommendations.optimizeItinerary
Get AI-optimized itinerary based on weather and safety.

**Access:** Protected

**Input:**
```typescript
{
  itineraryId: string;
  considerWeather?: boolean;
  considerSafety?: boolean;
  optimizeFor?: 'time' | 'cost' | 'experience';
}
```

**Output:**
```typescript
{
  optimizedActivities: Activity[];
  suggestions: Array<{
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  estimatedCost: number;
  estimatedDuration: number;
}
```

**Example:**
```typescript
const optimized = await trpc.recommendations.optimizeItinerary.mutate({
  itineraryId: '456',
  considerWeather: true,
  considerSafety: true,
  optimizeFor: 'experience',
});
```

---

## Booking API

### bookings.search
Search available flights and hotels.

**Access:** Public

**Input:**
```typescript
{
  bookingType: 'flight' | 'hotel';
  from?: string; // For flights
  to: string;
  checkIn: Date;
  checkOut?: Date; // For hotels
  passengers?: number;
  rooms?: number;
}
```

**Output:**
```typescript
{
  results: Array<{
    id: string;
    provider: string;
    title: string;
    price: number;
    currency: string;
    details: Record<string, unknown>;
    link: string;
  }>;
}
```

---

### bookings.create
Create a booking for a trip.

**Access:** Protected

**Input:**
```typescript
{
  tripId: string;
  bookingType: 'flight' | 'hotel' | 'car' | 'activity';
  provider: string;
  bookingRef: string;
  startDate: Date;
  endDate?: Date;
  totalPrice: number;
  currency: string;
  discountCode?: string;
  bookingDetails: Record<string, unknown>;
}
```

**Output:**
```typescript
{
  id: string;
  tripId: string;
  bookingRef: string;
  status: 'pending' | 'confirmed';
  totalPrice: number;
  createdAt: Date;
}
```

---

### bookings.applyDiscount
Apply discount code to booking.

**Access:** Protected

**Input:**
```typescript
{
  bookingId: string;
  discountCode: string;
}
```

**Output:**
```typescript
{
  discountAmount: number;
  newTotal: number;
  currency: string;
}
```

---

## Authentication API

### auth.me
Get current user information.

**Access:** Public

**Output:**
```typescript
{
  id: string;
  openId: string;
  name?: string;
  email?: string;
  role: 'user' | 'admin';
  createdAt: Date;
} | null
```

**Example:**
```typescript
const user = await trpc.auth.me.query();
```

---

### auth.logout
Logout current user.

**Access:** Protected

**Output:**
```typescript
{
  success: boolean;
}
```

**Example:**
```typescript
await trpc.auth.logout.mutate();
```

---

## Error Handling

### Error Response Format

```typescript
{
  code: string; // 'UNAUTHORIZED' | 'NOT_FOUND' | 'BAD_REQUEST' | etc.
  message: string;
  data?: Record<string, unknown>;
}
```

### Common Error Codes

| Code | Status | Description |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Error Handling Example

```typescript
try {
  const trip = await trpc.trips.get.query({ tripId: 'invalid' });
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    console.log('Trip not found');
  } else if (error.code === 'UNAUTHORIZED') {
    console.log('Please login');
  }
}
```

---

## Rate Limiting

### Limits

- **Public endpoints:** 100 requests per minute per IP
- **Protected endpoints:** 1000 requests per minute per user
- **Search endpoints:** 50 requests per minute per user

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## Pagination

### Query Parameters

```typescript
{
  limit: number; // Items per page (default: 20, max: 100)
  offset: number; // Pagination offset (default: 0)
}
```

### Response Format

```typescript
{
  items: T[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}
```

---

## Webhooks

### Trip Status Changed

Triggered when trip status changes.

**Payload:**
```typescript
{
  event: 'trip.status_changed';
  tripId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
}
```

### Emergency Alert

Triggered when new emergency alert affects user's trip.

**Payload:**
```typescript
{
  event: 'alert.emergency';
  tripId: string;
  alertId: string;
  severity: string;
  description: string;
  timestamp: Date;
}
```
