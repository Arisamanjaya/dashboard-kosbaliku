'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/googleMaps';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
  className?: string;
}

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation, 
  height = '400px',
  className = '' 
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Maps
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
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
        setError('Failed to load Google Maps');
        setLoading(false);
      });
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    const center = initialLocation || DEFAULT_MAP_CENTER;
    
    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom: DEFAULT_MAP_ZOOM,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false,
    });

    // Create initial marker
    const markerInstance = new google.maps.Marker({
      position: center,
      map: mapInstance,
      draggable: true,
      title: 'Drag to select location',
    });

    // Setup search box
    if (searchInputRef.current) {
      const searchBoxInstance = new google.maps.places.SearchBox(searchInputRef.current);
      mapInstance.controls[google.maps.ControlPosition.TOP_LEFT].push(searchInputRef.current);

      // Bias the SearchBox results towards current map's viewport
      mapInstance.addListener('bounds_changed', () => {
        searchBoxInstance.setBounds(mapInstance.getBounds() as google.maps.LatLngBounds);
      });

      // Listen for search results
      searchBoxInstance.addListener('places_changed', () => {
        const places = searchBoxInstance.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry && place.geometry.location) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            
            // Update map and marker
            mapInstance.setCenter(location);
            markerInstance.setPosition(location);
            
            // Get formatted address
            getAddressFromCoordinates(location.lat, location.lng).then(address => {
              onLocationSelect({
                ...location,
                address: address || place.formatted_address,
              });
            });
          }
        }
      });

      setSearchBox(searchBoxInstance);
    }

    // Handle map click
    mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        
        markerInstance.setPosition(location);
        
        // Get address for the location
        getAddressFromCoordinates(location.lat, location.lng).then(address => {
          onLocationSelect({
            ...location,
            address: address ?? undefined,
          });
        });
      }
    });

    // Handle marker drag
    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      if (position) {
        const location = {
          lat: position.lat(),
          lng: position.lng(),
        };
        
        // Get address for the location
        getAddressFromCoordinates(location.lat, location.lng).then(address => {
          onLocationSelect({
            ...location,
            address: address || undefined,
          });
        });
      }
    });

    setMap(mapInstance);
    setMarker(markerInstance);
    setLoading(false);

    // Call initial location select if we have initial location
    if (initialLocation) {
      getAddressFromCoordinates(initialLocation.lat, initialLocation.lng).then(address => {
        onLocationSelect({
          ...initialLocation,
          address: address ?? undefined,
        });
      });
    }
  }, [initialLocation, onLocationSelect]);

  // Get address from coordinates using Geocoding API
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng },
      });

      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
    return null;
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (map && marker) {
          map.setCenter(location);
          marker.setPosition(location);
          
          getAddressFromCoordinates(location.lat, location.lng).then(address => {
            onLocationSelect({
              ...location,
              address: address ?? undefined,
            });
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        alert('Error getting your current location');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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
      {/* Search Input */}
      <div className="absolute top-2 left-2 right-2 z-10">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a location..."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* Current Location Button */}
      <button
        onClick={getCurrentLocation}
        className="absolute top-14 right-2 z-10 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Get current location"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
      />

      {/* Instructions */}
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <p>💡 Click on the map or drag the marker to select a location. You can also search for a place using the search box above.</p>
      </div>
    </div>
  );
}