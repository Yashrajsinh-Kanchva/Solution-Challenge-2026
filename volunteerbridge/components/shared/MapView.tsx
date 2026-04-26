"use client";

import {
  CircleMarker, MapContainer, Popup, TileLayer, Marker, useMap, useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";
import L from "leaflet";

export type MapPoint = {
  id: string;
  label: string;
  position: [number, number];
  intensity?: number;
  description?: string;
};

type MapViewProps = {
  center:  [number, number];
  points:  MapPoint[];
  zoom?:   number;
  mode:    "heat" | "ngo" | "volunteer";
};

// ── Premium tile layers ───────────────────────────────────────────────────
const TILES = {
  heat: {
    // Esri World Imagery — satellite, very premium, doesn't look cheap/black
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA",
    name: "Esri Satellite Imagery",
  },
  ngo: {
    // Stadia Alidade Smooth — warm, modern, premium
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    attribution: "&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a> &copy; OpenStreetMap",
    name: "Stadia Alidade Smooth",
  },
  volunteer: {
    // CartoDB Voyager — crisp, colourful, professional
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; <a href='https://carto.com/'>CARTO</a> &copy; OpenStreetMap contributors",
    name: "CartoDB Voyager",
  },
};

// ── Marker colours ────────────────────────────────────────────────────────
const MODE_COLOR = {
  heat:      { fill:"#ff6b35", stroke:"#ffe0cc", glow:"rgba(255,107,53,0.35)" },
  ngo:       { fill:"#59623c", stroke:"#ccd6a6", glow:"rgba(89,98,60,0.35)"   },
  volunteer: { fill:"#2563eb", stroke:"#bfdbfe", glow:"rgba(37,99,235,0.35)"  },
};

// ── Custom cluster icon factory ───────────────────────────────────────────
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  const size  = count > 20 ? 52 : count > 10 ? 44 : 36;
  return L.divIcon({
    html: `
      <div style="
        width:${size}px; height:${size}px; border-radius:50%;
        background:rgba(89,98,60,0.92);
        border:3px solid #ccd6a6;
        display:flex; align-items:center; justify-content:center;
        color:white; font-size:${size > 44 ? 14 : 12}px; font-weight:900;
        font-family:'Public Sans',sans-serif;
        box-shadow:0 4px 20px rgba(89,98,60,0.5);
        backdrop-filter:blur(4px);
      ">${count}</div>`,
    className: "",
    iconSize:   L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}

// ── Custom pin marker (teardrop) ──────────────────────────────────────────
function makePin(color: string, glowColor: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="
          width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:${color};border:3px solid white;
          box-shadow:0 4px 18px ${glowColor},0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          margin-top:-2px;background:${color};color:white;
          font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          font-family:'Public Sans',sans-serif;
          white-space:nowrap;max-width:100px;overflow:hidden;text-overflow:ellipsis;
        ">${label}</div>
      </div>`,
    iconSize:   [38, 58],
    iconAnchor: [19, 58],
    popupAnchor:[0, -62],
  });
}

// ── Coordinate tracker ────────────────────────────────────────────────────
function CoordTracker({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({ mousemove(e) { onMove(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 13, { duration: 1.2 }); }, [center]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────
export default function MapView({ center, points, zoom = 13, mode }: MapViewProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const tile = TILES[mode];
  const col  = MODE_COLOR[mode];

  return (
    <div style={{ position:"relative", width:"100%", height:"100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ width:"100%", height:"100%", borderRadius:"inherit" }}
        zoomControl
      >
        <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={19} />
        <CoordTracker onMove={(lat, lng) => setCoords({ lat, lng })} />
        <FlyTo center={center} />

        {/* Heatmap: circle markers (no clustering for heat — overlaps are intentional) */}
        {mode === "heat" && points.map(point => {
          const r = Math.max(14, (point.intensity ?? 8) * 1.6);
          return (
            <CircleMarker
              key={point.id}
              center={point.position}
              radius={r}
              pathOptions={{
                color:       col.stroke,
                fillColor:   col.fill,
                fillOpacity: 0.72,
                weight:      2.5,
                opacity:     0.95,
              }}
            >
              <Popup>
                <div style={{ fontFamily:"'Public Sans',sans-serif", minWidth:170 }}>
                  <strong style={{ fontSize:"0.92rem" }}>{point.label}</strong>
                  {point.description && <p style={{ marginTop:5, fontSize:"0.78rem", color:"#46483e" }}>{point.description}</p>}
                  {point.intensity !== undefined && (
                    <>
                      <div style={{ marginTop:8, display:"flex", justifyContent:"space-between", fontSize:"0.72rem", fontWeight:700, color:"#6b7466" }}>
                        <span>Intensity</span><span style={{ color:"#ef4444" }}>{point.intensity}/20</span>
                      </div>
                      <div style={{ marginTop:4, height:6, borderRadius:999, background:"#e5e7eb" }}>
                        <div style={{ width:`${Math.min(100, point.intensity*5)}%`, height:"100%", borderRadius:999, background:"linear-gradient(90deg,#f97316,#ef4444)" }}/>
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* NGO & Volunteer: CLUSTERED pin markers */}
        {mode !== "heat" && (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={60}
            showCoverageOnHover={false}
            zoomToBoundsOnClick
            animate
            animateAddingMarkers
          >
            {points.map(point => (
              <Marker
                key={point.id}
                position={point.position}
                icon={makePin(col.fill, col.glow, point.label)}
              >
                <Popup>
                  <div style={{ fontFamily:"'Public Sans',sans-serif", minWidth:170 }}>
                    <strong style={{ fontSize:"0.92rem" }}>{point.label}</strong>
                    {point.description && <p style={{ marginTop:5, fontSize:"0.78rem", color:"#46483e" }}>{point.description}</p>}
                    {point.intensity !== undefined && (
                      <span style={{ fontSize:"0.78rem", fontWeight:700, color:col.fill, marginTop:6, display:"block" }}>
                        {mode === "ngo" ? "NGO units" : "Volunteers"}: {point.intensity}
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {/* Live coordinate pill */}
      {coords && (
        <div style={{
          position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)",
          background:"rgba(28,28,24,0.82)", backdropFilter:"blur(10px)",
          color:"white", padding:"5px 14px", borderRadius:999,
          fontSize:"0.68rem", fontWeight:700, zIndex:1000,
          fontFamily:"monospace", letterSpacing:"0.05em",
          border:"1px solid rgba(255,255,255,0.15)",
          pointerEvents:"none",
        }}>
          📍 {coords.lat.toFixed(5)}°N &nbsp; {coords.lng.toFixed(5)}°E
        </div>
      )}
    </div>
  );
}
