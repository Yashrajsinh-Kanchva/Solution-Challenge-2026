"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export type MapPoint = {
  id: string;
  label: string;
  position: [number, number];
  intensity?: number;
  description?: string;
};

type MapViewProps = {
  center: [number, number];
  points: MapPoint[];
  zoom?: number;
  mode: "heat" | "ngo" | "volunteer";
};

const modeColor: Record<MapViewProps["mode"], string> = {
  heat: "#d14343",
  ngo: "#2463eb",
  volunteer: "#1f9d55",
};

export default function Component({ center, points, zoom = 12, mode }: MapViewProps) {
  return (
    <div className="map-wrapper">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={point.position}
            radius={Math.max(8, point.intensity ?? 9)}
            pathOptions={{
              color: modeColor[mode],
              fillOpacity: mode === "heat" ? 0.55 : 0.35,
            }}
          >
            <Popup>
              <strong>{point.label}</strong>
              {point.description ? <p>{point.description}</p> : null}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
