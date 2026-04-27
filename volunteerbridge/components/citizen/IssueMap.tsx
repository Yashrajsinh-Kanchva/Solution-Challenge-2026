"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for Leaflet default marker icon issues in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const getCustomIcon = (urgency: string) => {
  let color = "#2e7d32"; // low
  if (urgency === "medium") color = "#b45309";
  if (urgency === "high" || urgency === "critical") color = "#ba1a1a";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px">
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

export default function IssueMap({ reports = [] }: { reports?: any[] }) {
  // Filter out reports that don't have valid coordinate data
  const validReports = reports.filter(r => {
    // rawLocation holds the original lat/lng
    if (typeof r.rawLocation === "object" && r.rawLocation?.lat && r.rawLocation?.lng) return true;
    return false;
  });

  // Default center (e.g., Ahmedabad, or user's location)
  const center: [number, number] = [23.0225, 72.5714];

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "16px", overflow: "hidden", border: "2px solid #ccd6a6" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Soft, clean map style
        />
        {validReports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.rawLocation.lat, report.rawLocation.lng]} 
            icon={getCustomIcon(report.urgency)}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <strong style={{ display: "block", fontSize: "14px", color: "#1c1c18", marginBottom: "4px" }}>{report.title}</strong>
                <span style={{ fontSize: "12px", color: "#6b7466", display: "block" }}>{report.category} • {report.urgency} urgency</span>
                <span style={{ fontSize: "11px", color: "#8c9686", display: "block", marginTop: "4px" }}>{report.rawLocation.address || "Unknown location"}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
