import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar, MapPin, AlertCircle, Cloud, Thermometer, Wind, Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  // Mock coordinates for weather/alerts if not available in trip data
  // In a real app, these would come from the destination geocoding
  const lat = 48.8566; 
  const lon = 2.3522;

  const { data: weatherData, isLoading: isWeatherLoading } = trpc.weather.getForecast.useQuery(
    { latitude: lat, longitude: lon, days: 7 },
    { enabled: activeMode === "weather" }
  );

  const { data: alertsData, isLoading: isAlertsLoading } = trpc.alerts.getEmergencies.useQuery(
    { latitude: lat, longitude: lon, radiusKm: 500 },
    { enabled: activeMode === "alerts" }
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

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "☁️";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "❓";
  };

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
                  Your activities organized by date.
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
                  7-day weather forecast for {trip.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isWeatherLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin h-8 w-8" />
                  </div>
                ) : weatherData?.forecast ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {weatherData.forecast.map((day: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg text-center bg-muted/30">
                        <p className="text-sm font-medium mb-2">
                          {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="text-3xl mb-2">{getWeatherIcon(day.weatherCode)}</div>
                        <div className="flex justify-center gap-2 mb-2">
                          <span className="font-bold">{Math.round(day.temperatureMax)}°</span>
                          <span className="text-muted-foreground">{Math.round(day.temperatureMin)}°</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Droplets className="h-3 w-3" />
                          {day.precipitation}mm
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No weather data available</p>
                )}
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
                  Emergency alerts for {trip.name} and surrounding areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAlertsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin h-8 w-8" />
                  </div>
                ) : alertsData?.alerts && alertsData.alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alertsData.alerts.map((alert: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg border-l-4 border-l-destructive bg-destructive/5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={alert.severity === 'Red' ? 'destructive' : 'outline'}>
                                {alert.severity}
                              </Badge>
                              <h3 className="font-bold">{alert.type}</h3>
                            </div>
                            <p className="font-medium mb-1">{alert.location}</p>
                            <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                              {alert.externalLink && (
                                <a href={alert.externalLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  More Info
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-background rounded border text-sm">
                          <p className="font-semibold mb-1">Safety Recommendation:</p>
                          <p>Stay away from affected areas. Follow local authority instructions and monitor local news for updates.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active emergency alerts for this destination.</p>
                    <p className="text-sm mt-2">Always stay informed of local conditions during your trip.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
