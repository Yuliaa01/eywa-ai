import { ArrowLeft, MapPin, Calendar, Clock, Cloud, Map, List, Utensils, Star, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import RestaurantMap from "@/components/RestaurantMap";
import { Input } from "@/components/ui/input";

export default function LocalEvents() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapboxToken, setMapboxToken] = useState('');
  const [userPreferences, setUserPreferences] = useState<{
    diet: string[];
    allergies: string[];
  }>({ diet: [], allergies: [] });

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('diet_preferences, allergies')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      setUserPreferences({
        diet: profile.diet_preferences || [],
        allergies: profile.allergies || []
      });
    }
  };

  const nearbyPlaces = [
    {
      name: "Green Bowl Café",
      type: "Café",
      distance: "0.3 mi",
      rating: 4.8,
      priceLevel: "$$",
      cuisine: ["Vegan", "Vegetarian", "Healthy"],
      address: "123 Main St",
      match: "95% match",
      hours: "7:00 AM - 8:00 PM",
      coords: { lat: 40.7580, lng: -73.9855 }
    },
    {
      name: "Protein Kitchen",
      type: "Restaurant",
      distance: "0.5 mi",
      rating: 4.6,
      priceLevel: "$$$",
      cuisine: ["High-protein", "Low-carb", "Keto"],
      address: "456 Park Ave",
      match: "90% match",
      hours: "11:00 AM - 10:00 PM",
      coords: { lat: 40.7614, lng: -73.9776 }
    },
    {
      name: "Fresh & Fit",
      type: "Café",
      distance: "0.7 mi",
      rating: 4.9,
      priceLevel: "$$",
      cuisine: ["Gluten-free", "Organic", "Smoothies"],
      address: "789 Broadway",
      match: "88% match",
      hours: "6:30 AM - 7:00 PM",
      coords: { lat: 40.7489, lng: -73.9680 }
    },
    {
      name: "Mediterranean Delight",
      type: "Restaurant",
      distance: "0.9 mi",
      rating: 4.7,
      priceLevel: "$$",
      cuisine: ["Mediterranean", "Vegetarian", "Healthy"],
      address: "321 5th Ave",
      match: "85% match",
      hours: "11:30 AM - 9:30 PM",
      coords: { lat: 40.7831, lng: -73.9712 }
    },
    {
      name: "Juice Bar Plus",
      type: "Café",
      distance: "1.1 mi",
      rating: 4.5,
      priceLevel: "$",
      cuisine: ["Juices", "Smoothies", "Vegan"],
      address: "654 Lexington Ave",
      match: "82% match",
      hours: "7:00 AM - 6:00 PM",
      coords: { lat: 40.7589, lng: -73.9664 }
    },
    {
      name: "Paleo Paradise",
      type: "Restaurant",
      distance: "1.3 mi",
      rating: 4.8,
      priceLevel: "$$$",
      cuisine: ["Paleo", "Gluten-free", "Organic"],
      address: "987 Madison Ave",
      match: "80% match",
      hours: "10:00 AM - 9:00 PM",
      coords: { lat: 40.7736, lng: -73.9566 }
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent-teal/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-rounded text-4xl font-bold text-foreground mb-2">
                Nearby Restaurants & Cafés
              </h1>
              <p className="text-muted-foreground">
                Discover healthy dining options near you that match your preferences
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex gap-2 bg-card/60 backdrop-blur-xl border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-accent-teal text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'map'
                    ? 'bg-accent-teal text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Map className="w-4 h-4" />
                Map
              </button>
            </div>
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-6 rounded-3xl overflow-hidden border border-border shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
            {mapboxToken ? (
              <div className="w-full h-[500px]">
                <RestaurantMap restaurants={nearbyPlaces} mapboxToken={mapboxToken} />
              </div>
            ) : (
              <div className="w-full h-[500px] bg-card/60 backdrop-blur-xl flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/5 to-accent-teal-alt/5" />
                <div className="relative z-10 text-center space-y-4 p-8 max-w-md">
                  <Map className="w-16 h-16 text-accent-teal mx-auto" />
                  <div>
                    <h3 className="font-rounded text-xl font-semibold text-foreground mb-2">
                      Enter Mapbox Token
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      To view the interactive map, please enter your Mapbox public token.
                      Get one free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline">mapbox.com</a>
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="pk.eyJ1..."
                        value={mapboxToken}
                        onChange={(e) => setMapboxToken(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => {}}
                        disabled={!mapboxToken}
                        className="bg-gradient-to-r from-accent-teal to-accent-teal-alt"
                      >
                        Load Map
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        <div className="space-y-4">
          {nearbyPlaces.map((place, index) => (
            <div
              key={index}
              className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-6 hover:border-accent-teal/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                      <Utensils className="w-6 h-6 text-accent-teal" />
                    </div>
                    <div>
                      <h3 className="font-rounded text-xl font-semibold text-foreground">
                        {place.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{place.type}</span>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-accent-teal text-accent-teal" />
                          <span className="text-sm font-medium text-foreground">{place.rating}</span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{place.priceLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-accent-teal" />
                      <span className="text-muted-foreground">{place.address}</span>
                      <span className="text-accent-teal font-medium">• {place.distance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-accent-teal" />
                      <span className="text-muted-foreground">{place.hours}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-xs font-rounded font-medium">
                      {place.match}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {place.cuisine.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 rounded-full bg-accent-teal/5 border border-accent-teal/10 text-muted-foreground text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    className="bg-gradient-to-r from-accent-teal to-accent-teal-alt hover:opacity-90 text-white whitespace-nowrap"
                  >
                    View Menu
                  </Button>
                  <Button
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    Directions
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
