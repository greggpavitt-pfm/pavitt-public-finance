"use client"
// World map highlighting countries where PPF has worked.
// Uses react-simple-maps with Natural Earth GeoJSON for real country outlines.
import { useState } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps"

// Natural Earth 110m world topology — hosted CDN, small file
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// ISO 3166-1 numeric codes for each country we want to highlight
// These match the "id" field in the Natural Earth GeoJSON
const highlightedCountries: Record<
  string,
  { name: string; region: string; current?: boolean }
> = {
  // Sub-Saharan Africa
  "566": { name: "Nigeria", region: "Sub-Saharan Africa" },
  "288": { name: "Ghana", region: "Sub-Saharan Africa" },
  "430": { name: "Liberia", region: "Sub-Saharan Africa" },
  "694": { name: "Sierra Leone", region: "Sub-Saharan Africa" },
  "706": { name: "Somalia", region: "Sub-Saharan Africa" },
  "404": { name: "Kenya", region: "Sub-Saharan Africa" },
  "834": { name: "Tanzania", region: "Sub-Saharan Africa" },
  "508": { name: "Mozambique", region: "Sub-Saharan Africa" },
  "454": { name: "Malawi", region: "Sub-Saharan Africa" },
  "894": { name: "Zambia", region: "Sub-Saharan Africa" },
  // South Asia
  "004": { name: "Afghanistan", region: "South Asia" },
  "586": { name: "Pakistan", region: "South Asia" },
  // Pacific
  "598": { name: "Papua New Guinea", region: "Pacific" },
  "090": { name: "Solomon Islands", region: "Pacific", current: true },
  "583": { name: "Micronesia", region: "Pacific" },
}

// Color scheme based on PPF brand colors
const regionFill: Record<string, string> = {
  "Sub-Saharan Africa": "#1F7FCF", // ppf-sky
  "South Asia": "#0A6AB9",         // ppf-blue
  Pacific: "#1F7FCF",              // ppf-sky
}

const currentFill = "#06B6D4" // Cyan for current engagement

// Label markers for small Pacific island nations that are hard to see
// (coordinates are [longitude, latitude])
const markerLabels: { name: string; coordinates: [number, number]; current?: boolean }[] = [
  { name: "Solomon Is.", coordinates: [160.0, -9.4], current: true },
  { name: "FSM", coordinates: [158.2, 6.9] },
]

export default function RegionsMap() {
  const [tooltip, setTooltip] = useState("")

  return (
    <div className="w-full overflow-hidden rounded-lg bg-ppf-pale">
      {/* Tooltip display — fixed height so map doesn't jump when tooltip appears */}
      <div className="min-h-[36px] text-center py-2 text-sm font-semibold text-ppf-navy bg-ppf-light">
        {tooltip}
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 180,
          center: [50, 5],
        }}
        width={960}
        height={500}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryId = geo.id
                const match = highlightedCountries[countryId]

                // Determine fill color
                let fill = "#E2E8F0" // Default: light gray for non-highlighted
                let stroke = "#CBD5E1"
                let strokeWidth = 0.5

                if (match) {
                  fill = match.current ? currentFill : regionFill[match.region]
                  stroke = "#072A80" // ppf-navy border
                  strokeWidth = 1
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    onMouseEnter={() => {
                      if (match) {
                        const label = match.current
                          ? `${match.name} — Current Engagement`
                          : `${match.name} — ${match.region}`
                        setTooltip(label)
                      }
                    }}
                    onMouseLeave={() => setTooltip("")}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: match ? (match.current ? "#22D3EE" : "#3B9AE1") : "#E2E8F0",
                        outline: "none",
                        cursor: match ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                )
              })
            }
          </Geographies>

          {/* Labels for small Pacific islands */}
          {markerLabels.map((marker) => (
            <Marker key={marker.name} coordinates={marker.coordinates}>
              <circle
                r={4}
                fill={marker.current ? currentFill : "#1F7FCF"}
                stroke="#072A80"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                y={-10}
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: 10,
                  fill: "#072A80",
                  fontWeight: marker.current ? "bold" : "normal",
                }}
              >
                {marker.name}
              </text>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 px-4 pb-4 text-xs text-ppf-navy">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#1F7FCF" }} />
          Sub-Saharan Africa
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#0A6AB9" }} />
          South Asia
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: "#06B6D4" }} />
          Current Engagement
        </span>
      </div>
    </div>
  )
}
