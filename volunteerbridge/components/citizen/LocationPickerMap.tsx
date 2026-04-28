"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Blue marker for user location
const getBlueIcon = () => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#007bff" width="32px" height="32px">
      <circle cx="12" cy="12" r="6" fill="#fff" />
      <circle cx="12" cy="12" r="4" fill="#007bff" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;

  return L.divIcon({
    className: "custom-map-marker",
    html: svgIcon,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Black marker for selected issue location
const getBlackIcon = () => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1c1c18" width="32px" height="32px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;

  return L.divIcon({
    className: "custom-map-marker",
    html: svgIcon,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function LocationMarker({ position, onChange }: { position: [number, number] | null; onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={getBlackIcon()} />
  );
}

export default function LocationPickerMap({ 
  location, 
  onChange 
}: { 
  location: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [center, setCenter] = useState<[number, number]>([23.0225, 72.5714]); // default
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCenter([lat, lng]);
          setUserLocation([lat, lng]);
          // We intentionally DO NOT call onChange here so the user has to click to place the black marker.
        },
        () => {
          console.warn("Geolocation denied or failed");
        }
      );
    }
  }, []);

  return (
    <div style={{ height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "2px solid #ccd6a6", marginTop: "1rem", position: "relative" }}>
      <MapContainer 
        key={center.join(",")} // Force re-render when center updates
        center={location ? [location.lat, location.lng] : center} 
        zoom={14} 
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {userLocation && <Marker position={userLocation} icon={getBlueIcon()} />}
        <LocationMarker position={location ? [location.lat, location.lng] : null} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
