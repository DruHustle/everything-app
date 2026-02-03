import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Trips Router - Manage trip creation, retrieval, and updates
 */
const tripsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Trip name required"),
        description: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        tripData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          // Allow anonymous trip creation
          return await db.createTrip(0, input);
        }
        return await db.createTrip(userId, input);
      } catch (error) {
        console.error("Failed to create trip:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create trip",
        });
      }
    }),

  get: publicProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input }) => {
      try {
        const trip = await db.getTripById(input.tripId);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Trip not found",
          });
        }
        return trip;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve trip",
        });
      }
    }),

  getWithDetails: publicProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input }) => {
      try {
        const trip = await db.getTripWithDetails(input.tripId);
        if (!trip) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Trip not found",
          });
        }
        return trip;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve trip details",
        });
      }
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const { trips, total } = await db.listUserTrips(
          ctx.user.id,
          input.limit,
          input.offset
        );
        return {
          trips,
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list trips",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        tripId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "planned", "in-progress", "completed", "archived"]).optional(),
        tripData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const trip = await db.getTripById(input.tripId);
        if (!trip || trip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to update this trip",
          });
        }
        return await db.updateTrip(input.tripId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update trip",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const trip = await db.getTripById(input.tripId);
        if (!trip || trip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to delete this trip",
          });
        }
        await db.deleteTrip(input.tripId);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete trip",
        });
      }
    }),
});

/**
 * Itineraries Router - Manage itinerary creation and updates
 */
const itinerariesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        tripId: z.number(),
        title: z.string().min(1, "Title required"),
        description: z.string().optional(),
        itineraryData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const trip = await db.getTripById(input.tripId);
        if (!trip || trip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to create itinerary for this trip",
          });
        }
        return await db.createItinerary(input.tripId, ctx.user.id, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create itinerary",
        });
      }
    }),

  getWithActivities: publicProcedure
    .input(z.object({ itineraryId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const itinerary = await db.getItineraryWithActivities(input.itineraryId);
        if (!itinerary) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Itinerary not found",
          });
        }
        return itinerary;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve itinerary",
        });
      }
    }),

  addActivity: protectedProcedure
    .input(
      z.object({
        itineraryId: z.number(),
        tripId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        location: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        category: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        activityDetails: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const trip = await db.getTripById(input.tripId);
        if (!trip || trip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }
        return await db.createActivity(input.itineraryId, input.tripId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add activity",
        });
      }
    }),

  reorderActivities: protectedProcedure
    .input(
      z.object({
        itineraryId: z.number(),
        activityIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const activities = await db.reorderActivities(
          input.itineraryId,
          input.activityIds
        );
        return { success: true, activities };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reorder activities",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        itineraryId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        itineraryData: z.record(z.string(), z.any()).optional(),
        safetyNotes: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await db.updateItinerary(input.itineraryId, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update itinerary",
        });
      }
    }),
});

/**
 * Weather Router - Get weather forecasts
 */
const weatherRouter = router({
  getForecast: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        days: z.number().min(1).max(16).default(7),
      })
    )
    .query(async ({ input }) => {
      try {
        // Call Open-Meteo API
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();
        return {
          location: {
            latitude: input.latitude,
            longitude: input.longitude,
          },
          forecast: data.daily.time.slice(0, input.days).map((date: string, i: number) => ({
            date: new Date(date),
            temperatureMax: data.daily.temperature_2m_max[i],
            temperatureMin: data.daily.temperature_2m_min[i],
            precipitation: data.daily.precipitation_sum[i],
            weatherCode: data.daily.weathercode[i],
          })),
        };
      } catch (error) {
        console.error("Weather forecast error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch weather forecast",
        });
      }
    }),
});

/**
 * Alerts Router - Get emergency and weather alerts
 */
const alertsRouter = router({
  getEmergencies: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusKm: z.number().default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Call GDACS API for emergency alerts
        const response = await fetch(
          "https://www.gdacs.org/gdacsapi/api/events/geteventlist?limit=100&sortby=eventdate&sortorder=DESC"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch emergency alerts");
        }

        const data = await response.json();

        // Filter by proximity (simplified - in production, use proper geospatial queries)
        const alerts = data.events
          .slice(0, 20)
          .map((event: any) => ({
            id: event.eventid,
            type: event.eventtype,
            severity: event.severity,
            location: event.eventname,
            description: event.description || event.eventname,
            timestamp: new Date(event.eventdate),
            coordinates: {
              latitude: parseFloat(event.lat),
              longitude: parseFloat(event.lon),
            },
            externalLink: event.url,
          }));

        return { alerts, totalCount: alerts.length };
      } catch (error) {
        console.error("Emergency alerts error:", error);
        // Return empty array instead of throwing to prevent UI breakage
        return { alerts: [], totalCount: 0 };
      }
    }),

  checkDestinationSafety: publicProcedure
    .input(
      z.object({
        destination: z.string(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Placeholder for destination safety check
      return {
        destination: "Unknown",
        safetyScore: 75,
        riskLevel: "moderate",
        activeAlerts: [],
        recommendations: [
          "Check local travel advisories",
          "Register with your embassy",
          "Keep emergency contacts handy",
        ],
        lastUpdated: new Date(),
      };
    }),
});

/**
 * Recommendations Router - Get AI-powered recommendations
 */
const recommendationsRouter = router({
  getDestinations: publicProcedure
    .input(
      z.object({
        interests: z.array(z.string()).optional(),
        budget: z.number().optional(),
        travelers: z.number().optional(),
        season: z.enum(["spring", "summer", "fall", "winter"]).optional(),
        travelDuration: z.number().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      // Placeholder for destination recommendations
      const sampleDestinations = [
        {
          name: "Paris",
          country: "France",
          coordinates: { latitude: 48.8566, longitude: 2.3522 },
          description: "The City of Light offers world-class museums and cuisine",
          bestTime: "April-May, September-October",
          estimatedCost: 2500,
          highlights: ["Eiffel Tower", "Louvre Museum", "Notre-Dame"],
          rating: 4.8,
          matchScore: 95,
        },
        {
          name: "Tokyo",
          country: "Japan",
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          description: "Modern metropolis blending tradition and technology",
          bestTime: "March-May, September-November",
          estimatedCost: 3000,
          highlights: ["Senso-ji Temple", "Tokyo Tower", "Shibuya Crossing"],
          rating: 4.7,
          matchScore: 88,
        },
      ];

      return { destinations: sampleDestinations.slice(0, input.limit) };
    }),

  getActivities: publicProcedure
    .input(
      z.object({
        destination: z.string(),
        interests: z.array(z.string()).optional(),
        duration: z.number().optional(),
        budget: z.number().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      // Placeholder for activity recommendations
      const sampleActivities = [
        {
          id: "1",
          title: "City Walking Tour",
          description: "Explore the historic city center",
          category: "sightseeing",
          location: input.destination,
          coordinates: { latitude: 0, longitude: 0 },
          duration: 3,
          cost: 50,
          rating: 4.6,
          reviews: "Great tour with knowledgeable guide",
        },
        {
          id: "2",
          title: "Local Food Experience",
          description: "Taste authentic local cuisine",
          category: "dining",
          location: input.destination,
          coordinates: { latitude: 0, longitude: 0 },
          duration: 2,
          cost: 80,
          rating: 4.8,
          reviews: "Delicious food and great atmosphere",
        },
      ];

      return { activities: sampleActivities.slice(0, input.limit) };
    }),

  optimizeItinerary: protectedProcedure
    .input(
      z.object({
        itineraryId: z.number(),
        considerWeather: z.boolean().default(true),
        considerSafety: z.boolean().default(true),
        optimizeFor: z.enum(["time", "cost", "experience"]).default("experience"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Placeholder for itinerary optimization
      return {
        optimizedActivities: [],
        suggestions: [
          {
            type: "weather",
            description: "Consider moving indoor activities to rainy days",
            priority: "medium",
          },
        ],
        estimatedCost: 0,
        estimatedDuration: 0,
      };
    }),
});

/**
 * Bookings Router - Manage bookings
 */
const bookingsRouter = router({
  search: publicProcedure
    .input(
      z.object({
        bookingType: z.enum(["flight", "hotel"]),
        from: z.string().optional(),
        to: z.string(),
        checkIn: z.coerce.date(),
        checkOut: z.coerce.date().optional(),
        passengers: z.number().optional(),
        rooms: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      // Placeholder for booking search
      return {
        results: [
          {
            id: "1",
            provider: "Sample Provider",
            title: "Sample Booking",
            price: 500,
            currency: "USD",
            details: {},
            link: "#",
          },
        ],
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.number(),
        bookingType: z.enum(["flight", "hotel", "car", "activity"]),
        provider: z.string(),
        bookingRef: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        totalPrice: z.number(),
        currency: z.string().default("USD"),
        discountCode: z.string().optional(),
        bookingDetails: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const trip = await db.getTripById(input.tripId);
        if (!trip || trip.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized",
          });
        }
        return await db.createBooking(input.tripId, ctx.user.id, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create booking",
        });
      }
    }),
});

/**
 * Auth Router - Authentication operations
 */
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

/**
 * Main App Router
 */
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  trips: tripsRouter,
  itineraries: itinerariesRouter,
  weather: weatherRouter,
  alerts: alertsRouter,
  recommendations: recommendationsRouter,
  bookings: bookingsRouter,
});

export type AppRouter = typeof appRouter;
