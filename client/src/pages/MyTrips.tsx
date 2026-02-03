import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Plus, MapPin, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * My Trips Page
 * Lists all trips for the authenticated user
 */
export default function MyTrips() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const {
    data: tripsData,
    isLoading,
    refetch,
  } = trpc.trips.list.useQuery(
    { limit, offset },
    { enabled: isAuthenticated }
  );

  const deleteTrip = trpc.trips.delete.useMutation({
    onSuccess: () => {
      toast.success("Trip deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete trip");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to view your trips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trips = tripsData?.trips || [];
  const total = tripsData?.total || 0;
  const hasMore = tripsData?.hasMore || false;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Trips</h1>
            <p className="text-muted-foreground">
              {total} trip{total !== 1 ? "s" : ""} planned
            </p>
          </div>
          <Button onClick={() => setLocation("/create-trip")} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-4">
                Start planning your next adventure
              </p>
              <Button onClick={() => setLocation("/create-trip")}>
                Create Your First Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {trips.map((trip) => {
                const startDate = new Date(trip.startDate);
                const endDate = new Date(trip.endDate);
                const duration = Math.ceil(
                  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                const activities = (trip.tripData?.activities as any[]) || [];

                return (
                  <Card
                    key={trip.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setLocation(`/trips/${trip.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {trip.name}
                      </CardTitle>
                      {trip.description && (
                        <CardDescription>{trip.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{trip.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>📋 {activities.length} activities</span>
                          <span>•</span>
                          <span>{duration} days</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/trips/${trip.id}`);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                "Are you sure you want to delete this trip?"
                              )
                            ) {
                              deleteTrip.mutate({ tripId: trip.id });
                            }
                          }}
                          disabled={deleteTrip.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setOffset(offset + limit)}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
