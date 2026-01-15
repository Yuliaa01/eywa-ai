import { ArrowLeft, MapPin, Clock, Map, List, Utensils, Star, Filter, X, Navigation, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import RestaurantMap from "@/components/RestaurantMap";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NearbyRestaurants() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapboxToken, setMapboxToken] = useState(import.meta.env.VITE_MAPBOX_TOKEN || '');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userPreferences, setUserPreferences] = useState<{
    diet: string[];
    allergies: string[];
  }>({ diet: [], allergies: [] });
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  
  // Filter states
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [matchUserDiet, setMatchUserDiet] = useState(false);

  useEffect(() => {
    loadUserPreferences();
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to NYC if geolocation fails
          setUserLocation({ lat: 40.7580, lng: -73.9855 });
        }
      );
    } else {
      // Default to NYC if geolocation not supported
      setUserLocation({ lat: 40.7580, lng: -73.9855 });
    }
  }, []);

  const handleSaveToken = () => {
    if (mapboxToken) {
      localStorage.setItem('mapbox_token', mapboxToken);
    }
  };

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

  // Generate nearby restaurants based on user location
  const allPlaces = userLocation ? [
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
      coords: { lat: userLocation.lat + 0.002, lng: userLocation.lng - 0.003 }
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
      coords: { lat: userLocation.lat + 0.005, lng: userLocation.lng + 0.008 }
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
      coords: { lat: userLocation.lat - 0.012, lng: userLocation.lng + 0.018 }
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
      coords: { lat: userLocation.lat + 0.033, lng: userLocation.lng - 0.015 }
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
      coords: { lat: userLocation.lat + 0.001, lng: userLocation.lng + 0.011 }
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
      coords: { lat: userLocation.lat + 0.020, lng: userLocation.lng + 0.013 }
    },
  ] : [];

  // Get unique cuisines and price levels for filters
  const allCuisines = useMemo(() => {
    const cuisines = new Set<string>();
    allPlaces.forEach(place => place.cuisine.forEach(c => cuisines.add(c)));
    return Array.from(cuisines).sort();
  }, [allPlaces]);

  const allPriceLevels = ["$", "$$", "$$$"];

  // Filter restaurants
  const nearbyPlaces = useMemo(() => {
    return allPlaces.filter(place => {
      // Cuisine filter
      if (selectedCuisines.length > 0) {
        const hasMatchingCuisine = place.cuisine.some(c => selectedCuisines.includes(c));
        if (!hasMatchingCuisine) return false;
      }

      // Price filter
      if (selectedPrices.length > 0) {
        if (!selectedPrices.includes(place.priceLevel)) return false;
      }

      // User diet preference filter
      if (matchUserDiet && userPreferences.diet.length > 0) {
        const matchesDiet = place.cuisine.some(c => 
          userPreferences.diet.some(pref => 
            c.toLowerCase().includes(pref.toLowerCase()) || 
            pref.toLowerCase().includes(c.toLowerCase())
          )
        );
        if (!matchesDiet) return false;
      }

      return true;
    });
  }, [allPlaces, selectedCuisines, selectedPrices, matchUserDiet, userPreferences.diet]);

  const activeFilterCount = selectedCuisines.length + selectedPrices.length + (matchUserDiet ? 1 : 0);

  const clearFilters = () => {
    setSelectedCuisines([]);
    setSelectedPrices([]);
    setMatchUserDiet(false);
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const togglePrice = (price: string) => {
    setSelectedPrices(prev => 
      prev.includes(price) 
        ? prev.filter(p => p !== price)
        : [...prev, price]
    );
  };

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
            
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-accent-teal text-white">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 bg-card border-border shadow-lg z-50" 
                  align="end"
                  sideOffset={8}
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base">Filter Restaurants</h4>
                      <p className="text-sm text-muted-foreground">
                        Narrow down by cuisine, price, and diet
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* User Diet Preferences */}
                      {userPreferences.diet.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Your Dietary Preferences</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="match-diet" 
                              checked={matchUserDiet}
                              onCheckedChange={(checked) => setMatchUserDiet(checked === true)}
                            />
                            <label
                              htmlFor="match-diet"
                              className="text-sm leading-none cursor-pointer"
                            >
                              Match my diet ({userPreferences.diet.join(", ")})
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Cuisine Types */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Cuisine Type</Label>
                        <ScrollArea className="h-40 w-full rounded-md border border-border p-2 bg-background">
                          <div className="space-y-2">
                            {allCuisines.map((cuisine) => (
                              <div key={cuisine} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`cuisine-${cuisine}`}
                                  checked={selectedCuisines.includes(cuisine)}
                                  onCheckedChange={() => toggleCuisine(cuisine)}
                                />
                                <label
                                  htmlFor={`cuisine-${cuisine}`}
                                  className="text-sm leading-none cursor-pointer"
                                >
                                  {cuisine}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Price Level */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Price Level</Label>
                        <div className="space-y-2">
                          {allPriceLevels.map((price) => (
                            <div key={price} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`price-${price}`}
                                checked={selectedPrices.includes(price)}
                                onCheckedChange={() => togglePrice(price)}
                              />
                              <label
                                htmlFor={`price-${price}`}
                                className="text-sm leading-none cursor-pointer"
                              >
                                {price}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {activeFilterCount > 0 && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2 bg-card rounded-xl p-1 border border-border">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-accent-teal text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-accent-teal text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-6 rounded-3xl overflow-hidden border border-border shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
            {mapboxToken ? (
              <div className="w-full h-[500px]">
                <RestaurantMap restaurants={nearbyPlaces} mapboxToken={mapboxToken} userLocation={userLocation} />
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
                        onClick={handleSaveToken}
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
          {nearbyPlaces.length === 0 ? (
            <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-12 text-center">
              <Utensils className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-rounded text-xl font-semibold text-foreground mb-2">
                No restaurants match your filters
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filter settings to see more options
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            nearbyPlaces.map((place, index) => (
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

                  <div className="flex flex-wrap gap-2">
                    {place.cuisine.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-sm font-medium mb-1">
                    {place.match}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.coords.lat},${place.coords.lng}`, '_blank')}
                      className="flex-1"
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Direction
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedRestaurant(place)}
                    >
                      <Info className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-accent-teal to-accent-teal-alt hover:opacity-90">
                    View Menu
                  </Button>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Restaurant Details Dialog */}
      <Dialog open={!!selectedRestaurant} onOpenChange={(open) => !open && setSelectedRestaurant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-rounded">
              {selectedRestaurant?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRestaurant && (
            <div className="space-y-6">
              {/* Rating and Match */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{selectedRestaurant.rating}</span>
                </div>
                <Badge className="bg-accent-teal text-white">
                  {selectedRestaurant.match}
                </Badge>
                <span className="text-muted-foreground">{selectedRestaurant.priceLevel}</span>
              </div>

              {/* Location and Hours */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-accent-teal mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{selectedRestaurant.address}</p>
                    <p className="text-sm text-accent-teal">{selectedRestaurant.distance} away</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-accent-teal mt-0.5" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-muted-foreground">{selectedRestaurant.hours}</p>
                  </div>
                </div>
              </div>

              {/* Cuisine Tags */}
              <div>
                <p className="font-medium mb-2">Cuisine Types</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRestaurant.cuisine.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-accent-teal/10 text-accent-teal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Diet Options */}
              {selectedRestaurant.dietOptions && (
                <div>
                  <p className="font-medium mb-2">Dietary Options Available</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.dietOptions.map((option: string) => (
                      <Badge key={option} variant="outline">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-accent-teal to-accent-teal-alt hover:opacity-90"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedRestaurant.coords.lat},${selectedRestaurant.coords.lng}`, '_blank')}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                <Button variant="outline" className="flex-1">
                  <Utensils className="w-4 h-4 mr-2" />
                  View Menu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
