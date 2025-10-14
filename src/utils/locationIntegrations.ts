import { supabase } from "@/integrations/supabase/client";

export interface VenueSearchResult {
  name: string;
  address: string;
  type: 'cafe' | 'restaurant' | 'grocery' | 'delivery';
  latitude: number;
  longitude: number;
  menu?: MenuItem[];
}

export interface MenuItem {
  name: string;
  category?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
}

// Apple Maps/Places Integration (Mock)
export class ApplePlacesProvider {
  static async searchNearby(
    latitude: number,
    longitude: number,
    type?: string
  ): Promise<VenueSearchResult[]> {
    console.log('Apple Places: Searching nearby venues...', { latitude, longitude, type });
    
    // Mock implementation - would use Apple MapKit JS or native API
    return [
      {
        name: 'Healthy Eats Cafe',
        address: '123 Main St',
        type: 'cafe',
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
        menu: [
          {
            name: 'Avocado Toast',
            category: 'Breakfast',
            nutrition: {
              calories: 350,
              protein: 12,
              carbs: 45,
              fat: 18,
              fiber: 8,
            }
          },
          {
            name: 'Green Smoothie',
            category: 'Beverages',
            nutrition: {
              calories: 180,
              protein: 5,
              carbs: 32,
              fat: 3,
              fiber: 6,
            }
          }
        ]
      },
      {
        name: 'Fresh Market',
        address: '456 Oak Ave',
        type: 'grocery',
        latitude: latitude + 0.002,
        longitude: longitude - 0.001,
      }
    ];
  }

  static async getVenueDetails(placeId: string): Promise<VenueSearchResult | null> {
    console.log('Apple Places: Getting venue details...', placeId);
    // Mock implementation
    return null;
  }
}

// Save venue to local database
export async function saveVenue(venue: VenueSearchResult): Promise<void> {
  const { error } = await supabase.from('local_venues').insert([{
    name: venue.name,
    type: venue.type,
    address: venue.address,
    geo: `(${venue.latitude},${venue.longitude})` as any,
    menu_json: JSON.parse(JSON.stringify(venue.menu || null)),
  }]);

  if (error) throw error;
  console.log('Venue saved:', venue.name);
}

// Search saved venues
export async function searchSavedVenues(type?: 'cafe' | 'restaurant' | 'grocery' | 'delivery') {
  let query = supabase.from('local_venues').select('*');
  
  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data;
}

// Get current location (browser geolocation)
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true }
    );
  });
}
