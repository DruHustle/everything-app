import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, MapPin, AlertCircle, Cloud } from "lucide-react";
import { toast } from "sonner";

/**
 * Trip Details Page
 * Displays trip information with Calendar, Itinerary, Weather, and Alerts views
 */
export default function TripDetails() {
  const params = useParams();
  const tripId = params?.tripId ? parseInt(params.tripId as string) : null;
  const [, setLocation] = useLocation();
  const [activeMode, setActiveMode] = useState<"calendar" | "itinerary" | "weather" | "alerts">(
    "calendar"
  );

  const {
    data: trip,
    isLoading,
    error,
  } = trpc.trips.getWithDetails.useQuery(
    { tripId: tripId || 0 },
    { enabled: !!tripId }
  );

  if (!tripId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Trip Not Found</h2>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-destructive/10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Trip</h2>
          <p className="text-muted-foreground mb-4">{error?.message || "Trip not found"}</p>
          <Button onClick={() => setLocation("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const activities = (trip.tripData?.activities as any[]) || [];
  const budget = trip.tripData?.budget;
  const travelers = trip.tripData?.travelers || 1;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{trip.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(trip.startDate).toLocaleDateString()} -{" "}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setLocation("/trips")}>
              Back to Trips
            </Button>
          </div>
        </div>

        {/* Trip Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activities.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {Math.ceil(
                  (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Travelers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{travelers}</p>
            </CardContent>
          </Card>

          {budget && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${budget.toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs for Different Views */}
        <Tabs value={activeMode} onValueChange={(v: any) => setActiveMode(v)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>
                  Your activities organized by date. Drag and drop to reschedule.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No activities planned yet
                    </p>
                  ) : (
                    activities
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() - new Date(b.date).getTime()
                      )
                      .map((activity, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold">{activity.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString()} {activity.time}
                              </p>
                              {activity.location && (
                                <p className="text-sm flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {activity.location}
                                </p>
                              )}
                              {activity.notes && (
                                <p className="text-sm mt-2 text-muted-foreground">
                                  {activity.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Itinerary View */}
          <TabsContent value="itinerary" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Itinerary Timeline</CardTitle>
                <CardDescription>
                  Your complete trip itinerary in chronological order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No activities planned yet
                    </p>
                  ) : (
                    activities
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() - new Date(b.date).getTime()
                      )
                      .map((activity, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-primary mt-2" />
                            {idx < activities.length - 1 && (
                              <div className="w-0.5 h-16 bg-border my-2" />
                            )}
                          </div>
                          <div className="pb-4">
                            <h3 className="font-semibold">{activity.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString()}
                              {activity.time && ` at ${activity.time}`}
                            </p>
                            {activity.location && (
                              <p className="text-sm flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {activity.location}
                              </p>
                            )}
                            {activity.notes && (
                              <p className="text-sm mt-2 text-muted-foreground">
                                {activity.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weather View */}
          <TabsContent value="weather" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Weather Forecast
                </CardTitle>
                <CardDescription>
                  Real-time weather data for your destination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Weather integration coming soon</p>
                  <p className="text-sm">
                    We'll display Open-Meteo weather forecasts for your destination
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts View */}
          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Safety Alerts
                </CardTitle>
                <CardDescription>
                  Emergency and weather alerts for your destination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Alert integration coming soon</p>
                  <p className="text-sm">
                    We'll display GDACS emergency alerts and safety recommendations
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
