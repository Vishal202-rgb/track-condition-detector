import React from "react";
import { Camera, MapPin } from "lucide-react";

export const TRACK_SECTORS = [
  { id: "sector-1", name: "Sector 1 (Turn 1-4)", code: "SEC-01" },
  { id: "sector-2", name: "Sector 2 (Chicane)", code: "SEC-02" },
  { id: "sector-3", name: "Sector 3 (Straight)", code: "SEC-03" },
  { id: "pit-lane", name: "Pit Lane", code: "PIT" },
];

export default function SectorSelector({ activeSector, onSectorChange }) {
  return (
    <div className="sector-bar">
      {TRACK_SECTORS.map((sector) => {
        const isActive = activeSector === sector.id;
        return (
          <button
            key={sector.id}
            className={`sector-btn ${isActive ? "active" : ""}`}
            onClick={() => onSectorChange(sector.id)}
          >
            {isActive ? <Camera size={14} /> : <MapPin size={14} />}
            <span>{sector.name}</span>
          </button>
        );
      })}
    </div>
  );
}
