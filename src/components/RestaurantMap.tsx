import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Restaurant {
  name: string;
  type: string;
  rating: number;
  cuisine: string[];
  address: string;
  coords: { lat: number; lng: number };
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  mapboxToken: string;
}

const RestaurantMap = ({ restaurants, mapboxToken }: RestaurantMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate center point from all restaurants
    const avgLat = restaurants.reduce((sum, r) => sum + r.coords.lat, 0) / restaurants.length;
    const avgLng = restaurants.reduce((sum, r) => sum + r.coords.lng, 0) / restaurants.length;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [avgLng, avgLat],
      zoom: 13,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false,
      }),
      'top-right'
    );

    // Add markers for each restaurant
    restaurants.forEach((restaurant) => {
      const el = document.createElement('div');
      el.className = 'restaurant-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'hsl(var(--accent-teal))';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      el.style.cursor = 'pointer';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: 600; margin: 0 0 4px 0; color: hsl(var(--foreground));">${restaurant.name}</h3>
          <p style="margin: 0 0 4px 0; color: hsl(var(--muted-foreground)); font-size: 0.875rem;">${restaurant.type}</p>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
            <span style="color: hsl(var(--accent-teal)); font-size: 0.875rem;">★ ${restaurant.rating}</span>
          </div>
          <p style="margin: 0 0 6px 0; color: hsl(var(--muted-foreground)); font-size: 0.75rem;">${restaurant.address}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${restaurant.cuisine.map(c => `<span style="padding: 2px 8px; background: hsl(var(--accent-teal) / 0.1); border-radius: 12px; font-size: 0.75rem; color: hsl(var(--accent-teal));">${c}</span>`).join('')}
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([restaurant.coords.lng, restaurant.coords.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [restaurants, mapboxToken]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-3xl" />
    </div>
  );
};

export default RestaurantMap;
