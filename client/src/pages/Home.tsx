import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Calendar, MapPin, Plane, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleStartPlanning = () => {
    if (isAuthenticated) {
      setLocation("/trips");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Travel Planner</h1>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground py-2">
                  Welcome, {user?.name || "Traveler"}
                </span>
                <Button variant="outline" onClick={() => setLocation("/trips")}>
                  My Trips
                </Button>
              </>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Plan Your Perfect Journey
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create comprehensive travel itineraries with real-time weather forecasts,
            emergency alerts, and AI-powered recommendations. All in one place.
          </p>
          <Button size="lg" onClick={handleStartPlanning}>
            Start Planning Now
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Calendar Feature */}
            <div className="p-6 bg-background border border-border rounded-lg">
              <Calendar className="w-8 h-8 mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Calendar View</h4>
              <p className="text-sm text-muted-foreground">
                Visualize your entire trip with drag-and-drop event management
              </p>
            </div>

            {/* Travel Guide Feature */}
            <div className="p-6 bg-background border border-border rounded-lg">
              <MapPin className="w-8 h-8 mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Travel Guide</h4>
              <p className="text-sm text-muted-foreground">
                Discover destinations and attractions with AI recommendations
              </p>
            </div>

            {/* Itinerary Feature */}
            <div className="p-6 bg-background border border-border rounded-lg">
              <Plane className="w-8 h-8 mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Itinerary Planning</h4>
              <p className="text-sm text-muted-foreground">
                Organize flights, hotels, and activities seamlessly
              </p>
            </div>

            {/* Safety Feature */}
            <div className="p-6 bg-background border border-border rounded-lg">
              <AlertCircle className="w-8 h-8 mb-4 text-primary" />
              <h4 className="font-semibold mb-2">Safety Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Real-time weather and emergency notifications
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-2">Create Your Trip</h4>
                <p className="text-muted-foreground">
                  Start planning anonymously. Add destinations, dates, and preferences
                  without creating an account.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-2">Build Your Itinerary</h4>
                <p className="text-muted-foreground">
                  Add activities, book flights and hotels, and organize your schedule
                  with our intuitive interface.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-2">Get Smart Recommendations</h4>
                <p className="text-muted-foreground">
                  Receive AI-powered suggestions based on weather, safety, and your
                  interests.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-2">Save and Share</h4>
                <p className="text-muted-foreground">
                  Sign in to save your trip, access it anywhere, and share with travel
                  companions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Explore?</h3>
          <p className="text-lg mb-8 opacity-90">
            Start planning your next adventure today
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleStartPlanning}
          >
            Begin Planning
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Travel Planner. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
