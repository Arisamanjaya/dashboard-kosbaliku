export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry'] as const,
  version: 'weekly',
};

export const DEFAULT_MAP_CENTER = {
  lat: -6.2088, // Jakarta center
  lng: 106.8456,
};

export const DEFAULT_MAP_ZOOM = 13;