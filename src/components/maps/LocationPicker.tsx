'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/googleMaps';

// Interface Props tetap sama
interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
  className?: string;
}

// Styling untuk map container
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem', // Sesuaikan dengan style Anda
};

export default function LocationPicker({ 
  onLocationSelect, 
  initialLocation, 
  height = '400px',
  className = '' 
}: LocationPickerProps) {

  // Hook dari library untuk memuat Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_CONFIG.apiKey,
    libraries: GOOGLE_MAPS_CONFIG.libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState(initialLocation || DEFAULT_MAP_CENTER);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  // Helper function untuk mendapatkan alamat, dibungkus useCallback
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
      const geocoder = new Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        return response.results[0].formatted_address;
      }
    } catch (e) {
      console.error('Error getting address:', e);
    }
    return null;
  }, []);

  // Handler saat lokasi berubah, untuk memanggil onLocationSelect
  const handleLocationChange = useCallback(async (lat: number, lng: number, addressOverride?: string) => {
    const address = await getAddressFromCoordinates(lat, lng);
    onLocationSelect({ lat, lng, address: addressOverride || address || undefined });
  }, [getAddressFromCoordinates, onLocationSelect]);
  
  // Efek untuk memanggil onLocationSelect saat komponen pertama kali dimuat dengan initialLocation
  useEffect(() => {
    if (isLoaded && initialLocation) {
      handleLocationChange(initialLocation.lat, initialLocation.lng);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, initialLocation]);


  // Handler untuk berbagai event
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => setAutocomplete(autocompleteInstance), []);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = place.geometry.location.toJSON();
        setMarkerPosition(location);
        map?.panTo(location);
        handleLocationChange(location.lat, location.lng, place.formatted_address);
      }
    }
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const location = e.latLng.toJSON();
      setMarkerPosition(location);
      handleLocationChange(location.lat, location.lng);
    }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const location = e.latLng.toJSON();
      setMarkerPosition(location);
      handleLocationChange(location.lat, location.lng);
    }
  };
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMarkerPosition(location);
        map?.panTo(location);
        handleLocationChange(location.lat, location.lng);
      });
    }
  };

  if (loadError) return <div className="p-4 text-red-700 bg-red-100 rounded-lg">Error memuat peta.</div>;
  if (!isLoaded) return (
      <div style={{ height }} className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Memuat Peta...</p>
          </div>
      </div>
  );

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={DEFAULT_MAP_ZOOM}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          mapId: 'KOSBALIKU_MAP_ID', // Wajib untuk Advanced Markers
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
        }}
      >
        <Marker
          position={markerPosition}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
        />
      </GoogleMap>
      
      {/* Search dan Current Location Button */}
      <div className="absolute top-2 left-2 right-2 z-10">
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Cari lokasi..."
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </Autocomplete>
      </div>

      <button
        onClick={getCurrentLocation}
        className="absolute top-14 right-2 z-10 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Dapatkan lokasi saat ini"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        <p>💡 Klik peta, geser penanda, atau cari untuk memilih lokasi.</p>
      </div>
    </div>
  );
}