'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react'; // 1. Import useCallback
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG, DEFAULT_MAP_ZOOM } from '@/lib/googleMaps';

interface MapDisplayProps {
  lat: number;
  lng: number;
  title?: string;
  height?: string;
  className?: string;
  zoom?: number;
}

export default function MapDisplay({ 
  lat, 
  lng, 
  title = 'Location', 
  height = '300px',
  className = '',
  zoom = DEFAULT_MAP_ZOOM 
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Wrap the initializeMap function in useCallback
  // This memoizes the function so it doesn't get recreated on every render
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    const location = { lat, lng };
    
    const map = new google.maps.Map(mapRef.current, {
      center: location,
      zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false,
      zoomControl: true,
      scrollwheel: true,
    });

    new google.maps.Marker({
      position: location,
      map,
      title,
    });

    setLoading(false);
  }, [lat, lng, title, zoom]); // Its own dependencies

  // 3. Move useEffect to the top level, before any conditional returns
  useEffect(() => {
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_CONFIG.apiKey,
      version: GOOGLE_MAPS_CONFIG.version,
      libraries: [...GOOGLE_MAPS_CONFIG.libraries],
    });

    loader
      .load()
      .then(() => {
        if (mapRef.current) {
          initializeMap();
        }
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
        setLoading(false);
      });
  // The dependency array is correct now that initializeMap is memoized
  }, [initializeMap]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
      />
    </div>
  );
}