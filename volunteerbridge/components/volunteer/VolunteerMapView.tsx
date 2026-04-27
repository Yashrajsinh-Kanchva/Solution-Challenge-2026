"use client";

import {
  MapContainer, Popup, TileLayer, Marker, useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import { MapPin, Users, Flag } from "lucide-react";

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 14, { duration: 1.5 }); }, [center, map]);
  return null;
}

function makeCampIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:44px;height:44px;border-radius:12px;
          background:#59623c;border:3px solid white;
          display:flex;align-items:center;justify-content:center;
          color:white;box-shadow:0 4px 20px rgba(89,98,60,0.6);
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div style="
          margin-top:2px;background:#59623c;color:white;
          font-size:8px;font-weight:900;padding:2px 6px;border-radius:5px;
          font-family:'Public Sans',sans-serif;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
        ">CAMP</div>
      </div>`,
    iconSize: [44, 60],
    iconAnchor: [22, 60],
    popupAnchor: [0, -64],
  });
}

function makeVolunteerIcon(initial: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:#2563eb;border:3px solid white;
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:13px;font-weight:900;
          box-shadow:0 4px 14px rgba(37,99,235,0.5);
          font-family:'Public Sans',sans-serif;
        ">${initial}</div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
}

export default function VolunteerMapView({
  campLocation,
  teamMembers = [],
  campName = "Camp HQ",
}: {
  campLocation: [number, number];
  teamMembers?: Array<{ name: string; location?: { lat: number; lng: number; address?: string } }>;
  campName?: string;
}) {
  return (
    <div style={{ width: "100%", height: "100%", borderRadius: "inherit" }}>
      <MapContainer
        center={campLocation}
        zoom={14}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FlyTo center={campLocation} />

        {/* Camp marker */}
        <Marker position={campLocation} icon={makeCampIcon()}>
          <Popup>
            <div className="p-3 font-sans min-w-[180px]">
              <strong className="text-base block mb-1">{campName}</strong>
              <p className="text-xs text-gray-500">Camp Headquarters</p>
            </div>
          </Popup>
        </Marker>

        {/* Team member markers */}
        {teamMembers
          .filter(m => m?.location && typeof m.location.lat === "number" && typeof m.location.lng === "number")
          .map((member, i) => (
            <Marker
              key={i}
              position={[member.location!.lat, member.location!.lng]}
              icon={makeVolunteerIcon(member.name?.[0] || "V")}
            >
              <Popup>
                <div className="p-2 font-sans">
                  <strong className="text-sm block">{member.name}</strong>
                  {member.location?.address && <p className="text-xs text-gray-500">{member.location.address}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
