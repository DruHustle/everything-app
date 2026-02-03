# Everything App - Travel & Itinerary Planner

A comprehensive travel planning application that combines intelligent scheduling, AI-driven recommendations, and real-time safety features into a unified platform. The app enables users to create complete travel itineraries anonymously, with optional authentication only when saving.

## Features

### 1. Calendar View
- Visual scheduling interface for managing travel activities and time blocks
- Drag-and-drop event creation and modification
- Multi-day trip visualization with activity organization

### 2. Travel Guide Mode
- AI-driven destination recommendations based on user preferences
- Local attractions discovery with descriptions and ratings
- Curated travel tips and cultural insights for each destination

### 3. Itinerary Planning
- Drag-and-drop interface for organizing trips, accommodations, and transport
- Timeline visualization of the complete journey
- Activity sequencing with automatic conflict detection
- Support for multiple trip segments and waypoints

### 4. Ticket Booking Integration
- Flight and hotel search integration
- Discount code support for bookings
- Price comparison and deal alerts
- Booking confirmation and itinerary integration

### 5. Real-Time Weather Forecasts
- Open-Meteo API integration for 7-day forecasts
- Weather overlays on itinerary dates
- Proactive AI suggestions for weather-related activity adjustments
- Severe weather warnings and alerts

### 6. Emergency Alert System
- GDACS API integration for global disaster monitoring
- Real-time alerts for earthquakes, floods, cyclones, and volcanic eruptions
- Location-based emergency notifications
- Safety recommendations and alternative route suggestions

### 7. Delayed Authentication
- Create full itineraries anonymously without account creation
- Optional authentication only when saving trips
- Seamless transition from anonymous to authenticated user
- Local storage of draft itineraries

### 8. Server-Driven UI (SDUI)
- Dynamic layout rendering based on backend configuration
- Seamless mode switching between Calendar, Guide, Itinerary, and Booking
- No app updates required for UI changes
- Platform-aware responses for mobile and web

### 9. AI Agent Backend
- Intelligent trip optimization recommendations
- Proactive safety monitoring and alerts
- Activity suggestion based on weather and interests
- Real-time itinerary adjustments

## Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **State Management:** TanStack React Query + tRPC
- **Calendar:** FullCalendar or React Native Calendars
- **Maps:** MapLibre GL (open-source alternative to Google Maps)

### Backend
- **Runtime:** Node.js with Express 4
- **API Layer:** tRPC 11 with type safety
- **Database:** MySQL/TiDB with Drizzle ORM
- **Authentication:** Manus OAuth
- **AI Integration:** LLM via Manus Forge API

### External APIs
- **Weather:** Open-Meteo (free, no API key required)
- **Emergencies:** GDACS REST API
- **Travel Data:** Amadeus for Developers
- **Booking:** Duffel or Skyscanner Partners

## Database Architecture

The database uses an **extensible JSONB-based schema** to support flexible trip data without requiring migrations:

### Core Tables
- **users:** User authentication and profile
- **trips:** Trip metadata and configuration
- **itineraries:** Complete trip plans with JSONB data
- **activities:** Individual activities and events
- **bookings:** Flight and hotel reservations
- **alerts:** Weather and emergency notifications

### JSONB Fields
All trip-specific data is stored in JSONB columns, allowing arbitrary fields to be added without schema changes:
- `tripData`: Flexible trip metadata
- `activityDetails`: Activity-specific information
- `bookingDetails`: Booking-specific data
- `safetyNotes`: Emergency and safety information

See [DATABASE.md](./docs/DATABASE.md) for detailed schema documentation.

## Architecture

The application follows a **layered architecture** with clear separation of concerns:

1. **Frontend Layer:** React components with SDUI engine for dynamic UI rendering
2. **API Layer:** tRPC procedures for type-safe backend communication
3. **Business Logic Layer:** AI agent orchestration and trip optimization
4. **Data Layer:** Drizzle ORM with MySQL/TiDB backend
5. **External Services:** Weather, emergency alerts, and booking APIs

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## API Documentation

The application exposes a comprehensive tRPC API for all operations:

### Trip Management
- `trips.create` - Create a new trip
- `trips.get` - Retrieve trip details
- `trips.update` - Update trip information
- `trips.list` - List user's trips
- `trips.delete` - Delete a trip

### Itinerary Operations
- `itineraries.create` - Create itinerary
- `itineraries.update` - Update itinerary
- `itineraries.addActivity` - Add activity to itinerary
- `itineraries.reorderActivities` - Reorder activities

### Weather & Safety
- `weather.getForecast` - Get 7-day forecast for location
- `alerts.getEmergencies` - Get active emergency alerts
- `alerts.checkDestinationSafety` - Check safety status of destination

### Recommendations
- `recommendations.getDestinations` - Get AI-recommended destinations
- `recommendations.getActivities` - Get activity suggestions
- `recommendations.optimizeItinerary` - Optimize trip based on weather/safety

See [API.md](./docs/API.md) for complete API reference.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- MySQL/TiDB database instance
- Manus OAuth credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/DruHustle/everything-app.git
cd everything-app

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
```

## Project Structure

```
everything-app/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layouts/        # SDUI layout renderers
│   │   │   ├── modes/          # Calendar, Guide, Itinerary, Booking modes
│   │   │   └── ui/             # shadcn/ui components
│   │   ├── pages/              # Page-level components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── contexts/           # React contexts
│   │   ├── lib/                # Utilities and helpers
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   └── public/                 # Static assets
├── server/                      # Backend Express application
│   ├── db.ts                   # Database query helpers
│   ├── routers.ts              # tRPC procedure definitions
│   ├── ai/                     # AI agent logic
│   ├── services/               # External API integrations
│   └── _core/                  # Framework internals
├── drizzle/                     # Database schema and migrations
│   └── schema.ts               # Table definitions
├── docs/                        # Documentation
│   ├── README.md               # This file
│   ├── ARCHITECTURE.md         # System architecture
│   ├── API.md                  # API reference
│   └── DATABASE.md             # Database schema
└── package.json                # Dependencies and scripts
```

## Development Workflow

### Adding a New Feature

1. **Update Database Schema:** Edit `drizzle/schema.ts` and run `pnpm db:push`
2. **Add Query Helpers:** Create helper functions in `server/db.ts`
3. **Create tRPC Procedures:** Add procedures in `server/routers.ts`
4. **Build UI Components:** Create React components in `client/src/components/`
5. **Wire Frontend:** Connect UI to procedures via tRPC hooks
6. **Write Tests:** Add vitest tests in `server/*.test.ts`
7. **Test Locally:** Run `pnpm dev` and verify functionality

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Building for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

## Deployment

The application is designed for deployment on Manus, Vercel, or Northflank:

1. **Frontend:** Deploy via Vercel or Northflank
2. **Backend:** Deploy via Northflank or Railway
3. **Database:** Use Supabase PostgreSQL or TiDB Cloud

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Collaborative trip planning
- [ ] Social features (share itineraries, reviews)
- [ ] Advanced analytics and insights
- [ ] Integration with more booking platforms
- [ ] Offline mode with sync
- [ ] Multi-language support
- [ ] Advanced AI personalization

## Acknowledgments

- Open-Meteo for weather data
- GDACS for emergency alerts
- Amadeus for travel data
- Manus platform for infrastructure
