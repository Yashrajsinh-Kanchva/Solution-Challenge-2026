"use client";

import {
  MapContainer, Popup, TileLayer, Marker, useMap, CircleMarker,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";
import L from "leaflet";
import { UserPlus, Shield, MapPin, Zap } from "lucide-react";

// ── Icons ──────────────────────────────────────────────────────────────────
function makePin(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:${color};border:2px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
        "></div>
        <div style="
          margin-top:-2px;background:${color};color:white;
          font-size:8px;font-weight:900;padding:1px 5px;border-radius:4px;
          box-shadow:0 1px 4px rgba(0,0,0,0.2);
          font-family:'Public Sans',sans-serif;
          white-space:nowrap;
        ">${label}</div>
      </div>`,
    iconSize:   [30, 45],
    iconAnchor: [15, 45],
    popupAnchor:[0, -48],
  });
}

function makeNgoIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:40px;height:40px;border-radius:12px;
        background:${color};border:3px solid white;
        display:flex;align-items:center;justify-content:center;
        color:white;box-shadow:0 4px 15px rgba(0,0,0,0.4);
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      </div>`,
    iconSize:   [40, 40],
    iconAnchor: [20, 20],
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 13, { duration: 1.5 }); }, [center]);
  return null;
}

const URGENCY_COLORS = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#f59e0b",
  low:      "#22c55e"
};

// ── Component ─────────────────────────────────────────────────────────────
export default function NgoMapView({ 
  center, 
  requests, 
  volunteers, 
  ngoLocation,
  onAssign
}: { 
  center: [number, number],
  requests: any[],
  volunteers: any[],
  ngoLocation: [number, number],
  onAssign: (requestId: string, volunteerId: string) => Promise<void>
}) {
  const [assigning, setAssigning] = useState<string | null>(null);

  const handleAssign = async (requestId: string, volunteerId: string) => {
    setAssigning(volunteerId);
    try {
      await onAssign(requestId, volunteerId);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: "inherit" }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FlyTo center={center} />

        {/* NGO HQ Marker */}
        <Marker position={ngoLocation} icon={makeNgoIcon("#59623c")}>
          <Popup>
            <div className="p-2 font-sans">
              <strong className="text-sm block mb-1">Organization HQ</strong>
              <p className="text-xs text-secondary/60">Operational command center</p>
            </div>
          </Popup>
        </Marker>

        {/* Volunteer Markers (Blue) */}
        <MarkerClusterGroup>
          {volunteers
            .filter(vol =>
              vol?.location &&
              typeof vol.location.lat === "number" &&
              typeof vol.location.lng === "number" &&
              isFinite(vol.location.lat) &&
              isFinite(vol.location.lng)
            )
            .map(vol => (
            <Marker 
              key={vol.volunteerId} 
              position={[vol.location.lat, vol.location.lng]}
              icon={makePin("#2563eb", "VOLUNTEER")}
            >
              <Popup>
                <div className="p-3 font-sans min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                      {vol.name[0]}
                    </div>
                    <div>
                      <strong className="text-sm block">{vol.name}</strong>
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Active Now</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-secondary/60 mb-2 uppercase tracking-tighter">Skills: {vol.skills.join(", ")}</p>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-secondary/60">
                    <MapPin size={12} />
                    {vol.location.address}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Request Markers (Urgency Colors) */}
        {requests
          .filter(req =>
            req?.location &&
            typeof req.location.lat === "number" &&
            typeof req.location.lng === "number" &&
            isFinite(req.location.lat) &&
            isFinite(req.location.lng)
          )
          .map(req => {
          const color = (URGENCY_COLORS as any)[req.urgency?.toLowerCase()] || "#6b7466";
          return (
            <Marker 
              key={req.requestId} 
              position={[req.location.lat, req.location.lng]}
              icon={makePin(color, req.urgency?.toUpperCase() ?? "NEED")}
            >
              <Popup>
                <div className="p-4 font-sans min-w-[240px]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-secondary/40 block mb-1">#{req.requestId}</span>
                      <strong className="text-base font-black text-on-surface block leading-tight">{req.title}</strong>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-variant text-[9px] font-black text-secondary">
                      <Zap size={10} />
                      {req.category}
                    </div>
                  </div>

                  <p className="text-xs text-secondary/60 mb-4 line-clamp-2">{req.description}</p>

                  <div className="border-t border-outline/30 pt-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-3 flex items-center gap-2">
                      <UserPlus size={14} className="text-primary" />
                      Dispatch Nearby
                    </h5>
                    
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {volunteers.length > 0 ? volunteers.map(vol => (
                        <div key={vol.volunteerId} className="flex items-center justify-between p-2 bg-surface-variant/20 rounded-lg border border-outline/30 hover:border-primary/40 transition-all group">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[9px] font-black text-primary border border-outline/60">
                              {(vol.name || vol.volunteerId || "V")[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-on-surface">{vol.name || vol.volunteerId}</span>
                          </div>
                          <button 
                            disabled={assigning === vol.volunteerId}
                            onClick={() => handleAssign(req.requestId, vol.volunteerId)}
                            className="p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-95"
                          >
                            {assigning === vol.volunteerId ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <UserPlus size={14} />
                            )}
                          </button>
                        </div>
                      )) : (
                        <p className="text-[10px] font-medium text-secondary/40 italic">No available volunteers nearby</p>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
}
