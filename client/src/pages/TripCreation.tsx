import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Sparkles, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DraftTrip {
  destination: string;
  startDate: Date;
  endDate: Date;
  activities: Array<{
    id: string;
    title: string;
    date: Date;
    time?: string;
    location?: string;
    notes?: string;
  }>;
  budget?: number;
  travelers?: number;
}

/**
 * Trip Creation Page - Anonymous-first flow
 * Users can create full itineraries without authentication
 * Authentication is only required when saving
 */
export default function TripCreation() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<DraftTrip>({
    destination: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    activities: [],
    budget: undefined,
    travelers: 1,
  });

  const [newActivity, setNewActivity] = useState({
    title: "",
    date: trip.startDate,
    time: "",
    location: "",
    notes: "",
  });

  const createTripMutation = trpc.trips.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Trip saved successfully!");
      setLocation(`/trips/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save trip");
    },
  });

  const { data: recommendations, isLoading: isRecommending, refetch: getRecommendations } = trpc.recommendations.getActivities.useQuery(
    { 
      destination: trip.destination,
      budget: trip.budget,
      limit: 5
    },
    { enabled: false }
  );

  const handleAddActivity = (activityData?: any) => {
    const title = activityData?.title || newActivity.title;
    if (!title.trim()) {
      toast.error("Activity title is required");
      return;
    }

    const activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title,
      date: activityData?.date || newActivity.date,
      time: activityData?.time || newActivity.time,
      location: activityData?.location || newActivity.location,
      notes: activityData?.notes || newActivity.notes || activityData?.description,
    };

    setTrip({
      ...trip,
      activities: [...trip.activities, activity],
    });

    if (!activityData) {
      setNewActivity({
        title: "",
        date: trip.startDate,
        time: "",
        location: "",
        notes: "",
      });
    }

    toast.success("Activity added!");
  };

  const handleRemoveActivity = (activityId: string) => {
    setTrip({
      ...trip,
      activities: trip.activities.filter((a) => a.id !== activityId),
    });
  };

  const handleSaveTrip = async () => {
    if (!trip.destination.trim()) {
      toast.error("Destination is required");
      return;
    }

    if (trip.activities.length === 0) {
      toast.error("Add at least one activity");
      return;
    }

    // If not authenticated, prompt login
    if (!isAuthenticated) {
      toast.error("Please log in to save your trip");
      return;
    }

    createTripMutation.mutate({
      name: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      tripData: {
        activities: trip.activities,
        budget: trip.budget,
        travelers: trip.travelers,
        notes: "",
      },
    });
  };

  const handleSaveDraft = () => {
    // Save to localStorage for offline support
    localStorage.setItem("draftTrip", JSON.stringify(trip));
    toast.success("Draft saved to your device");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Your Trip</h1>
          <p className="text-muted-foreground">
            Plan your perfect journey. You can save your draft anytime and come back later.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Basics */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Basics</CardTitle>
                <CardDescription>Where and when are you traveling?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Destination</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Paris, France"
                      value={trip.destination}
                      onChange={(e) => setTrip({ ...trip, destination: e.target.value })}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={() => getRecommendations()}
                      disabled={!trip.destination || isRecommending}
                    >
                      {isRecommending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Get AI Suggestions
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={trip.startDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setTrip({ ...trip, startDate: new Date(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <Input
                      type="date"
                      value={trip.endDate.toISOString().split("T")[0]}
                      onChange={(e) => setTrip({ ...trip, endDate: new Date(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget (USD)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 5000"
                      value={trip.budget || ""}
                      onChange={(e) =>
                        setTrip({ ...trip, budget: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Travelers</label>
                    <Input
                      type="number"
                      min="1"
                      value={trip.travelers}
                      onChange={(e) => setTrip({ ...trip, travelers: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            {recommendations?.activities && recommendations.activities.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Recommendations for {trip.destination}
                  </CardTitle>
                  <CardDescription>Based on your destination and budget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.activities.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 bg-background rounded-lg border flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">{rec.title}</h4>
                            <Badge variant="outline">{rec.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {rec.rating}</span>
                            <span>Est. Cost: ${rec.cost}</span>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleAddActivity({
                          title: rec.title,
                          location: rec.location,
                          notes: rec.description,
                          date: trip.startDate
                        })}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Add Activities</CardTitle>
                <CardDescription>What will you do on your trip?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Activity Title</label>
                  <Input
                    placeholder="e.g., Visit Eiffel Tower"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <Input
                      type="date"
                      value={newActivity.date.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, date: new Date(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time (Optional)</label>
                    <Input
                      type="time"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                  <Input
                    placeholder="e.g., Champ de Mars"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                  <Input
                    placeholder="Add any notes or details"
                    value={newActivity.notes}
                    onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                  />
                </div>

                <Button onClick={() => handleAddActivity()} className="w-full">
                  Add Activity
                </Button>
              </CardContent>
            </Card>

            {/* Activities List */}
            {trip.activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Activities ({trip.activities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trip.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 border border-border rounded-lg flex items-start justify-between gap-4"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                            {activity.time && ` at ${activity.time}`}
                          </p>
                          {activity.location && (
                            <p className="text-sm text-muted-foreground">📍 {activity.location}</p>
                          )}
                          {activity.notes && <p className="text-sm mt-1">{activity.notes}</p>}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveActivity(activity.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Trip Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Trip Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-semibold">{trip.destination || "Not set"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {trip.startDate.toLocaleDateString()} -{" "}
                    {trip.endDate.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Activities</p>
                  <p className="font-semibold">{trip.activities.length} planned</p>
                </div>

                {trip.budget && (
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-semibold">${trip.budget.toLocaleString()}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Travelers</p>
                  <p className="font-semibold">{trip.travelers} person(s)</p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Button onClick={handleSaveDraft} variant="outline" className="w-full">
                    Save Draft
                  </Button>
                  <Button
                    onClick={handleSaveTrip}
                    className="w-full"
                    disabled={createTripMutation.isPending}
                  >
                    {createTripMutation.isPending ? "Saving..." : "Save Trip"}
                  </Button>
                </div>

                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground text-center">
                    You'll need to log in to save your trip permanently.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
