"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon issue in Next.js/Webpack
const iconRetinaUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png";
const iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface GISMapInnerProps {
  lat: number;
  lng: number;
  detectedZone: string;
  zoneConflict: boolean;
  protectedArea: boolean;
}

export default function GISMapInner({
  lat,
  lng,
  detectedZone,
  zoneConflict,
  protectedArea
}: GISMapInnerProps) {
  // Define coordinate zones matching our mock zones in lib/mock_zones.json
  const zones = [
    {
      name: "Green Valley (Residential)",
      landuse: "residential",
      coords: [
        [28.61, 77.20],
        [28.61, 77.21],
        [28.62, 77.21],
        [28.62, 77.20]
      ] as [number, number][],
      color: "#22c55e" // green
    },
    {
      name: "Central Business District (Commercial)",
      landuse: "commercial",
      coords: [
        [28.61, 77.22],
        [28.61, 77.23],
        [28.62, 77.23],
        [28.62, 77.22]
      ] as [number, number][],
      color: "#3b82f6" // blue
    },
    {
      name: "Industrial Park (Industrial)",
      landuse: "industrial",
      coords: [
        [28.61, 77.24],
        [28.61, 77.25],
        [28.62, 77.25],
        [28.62, 77.24]
      ] as [number, number][],
      color: "#f59e0b" // amber
    },
    {
      name: "Protected Wetland (Conservation)",
      landuse: "nature_reserve",
      coords: [
        [28.61, 77.26],
        [28.61, 77.27],
        [28.62, 77.27],
        [28.62, 77.26]
      ] as [number, number][],
      color: "#ef4444" // red
    }
  ];

  return (
    <div className="w-full h-full min-h-[350px] relative rounded-xl overflow-hidden border border-gray-200 shadow-lg">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw zoning zones */}
        {zones.map((zone, idx) => (
          <Polygon
            key={idx}
            positions={zone.coords}
            pathOptions={{
              color: zone.color,
              fillColor: zone.color,
              fillOpacity: 0.15,
              weight: 2
            }}
          >
            <Popup>
              <div className="text-xs font-semibold">{zone.name}</div>
              <div className="text-xs text-gray-500">Landuse: {zone.landuse}</div>
            </Popup>
          </Polygon>
        ))}

        {/* Site Location Marker */}
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="p-1">
              <h4 className="font-bold text-sm text-gray-900">Application Site</h4>
              <p className="text-xs text-gray-600 mt-1">Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
              <div className="mt-2 flex flex-col gap-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block w-fit ${
                  protectedArea 
                    ? "bg-red-100 text-red-800" 
                    : zoneConflict 
                    ? "bg-amber-100 text-amber-800" 
                    : "bg-green-100 text-green-800"
                }`}>
                  Zone: {detectedZone.toUpperCase()}
                </span>
                {zoneConflict && (
                  <span className="text-[9px] text-red-600 font-semibold">⚠️ Zoning Exception Required</span>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
