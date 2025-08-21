export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry', 'marker'] as ('places' | 'marker' | 'geometry')[],
  version: 'weekly',
};

export const DEFAULT_MAP_CENTER = { lat: -8.6705, lng: 115.2126 }; // Denpasar
export const DEFAULT_MAP_ZOOM = 12;