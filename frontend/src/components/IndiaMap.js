"use client";
import React, { useState, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// Raw GitHub link for Subhash9325 GeoJSON
const INDIA_GEO_JSON =
  "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States/states.geojson";

function IndiaMap({ onSelectState }) {
  const [position, setPosition] = useState({ coordinates: [82.8, 22.6], zoom: 1 });
  const [tooltip, setTooltip] = useState({ name: "", x: 0, y: 0, show: false });
  const [search, setSearch] = useState("");
  const [features, setFeatures] = useState([]);
  const geographiesRef = useRef([]);

  useEffect(() => {
    fetch(INDIA_GEO_JSON)
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          setFeatures(data.features);
        } else {
          console.error("GeoJSON has no features:", data);
        }
      })
      .catch((err) => {
        console.error("Error loading GeoJSON:", err);
      });
  }, []);

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (pos) => {
    setPosition(pos);
  };

  const handleSearch = () => {
    const match = geographiesRef.current.find(
      (geo) =>
        geo.properties.st_nm?.toLowerCase() === search.trim().toLowerCase() ||
        geo.properties.STATE?.toLowerCase() === search.trim().toLowerCase()
    );
    if (match) {
      // compute centroid: you could use a library or GeoJSON’s geometry itself
      // Here using bbox if available
      if (match.bbox) {
        const [minX, minY, maxX, maxY] = match.bbox;
        const centroid = [(minX + maxX) / 2, (minY + maxY) / 2];
        setPosition({ coordinates: centroid, zoom: 3 });
      } else {
        // fallback: just center on bounds of geometry (less precise)
        const centroid = [
          (position.coordinates[0] + 82.8) / 2,
          (position.coordinates[1] + 22.6) / 2,
        ];
        setPosition({ coordinates: centroid, zoom: 3 });
      }
    } else {
      alert("State not found. Try full, exact name (e.g., Karnataka)");
    }
  };

  return (
    <div className="map-wrap relative p-4 bg-white rounded-2xl shadow">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-500">Click a region to filter products</div>
        <div className="badge px-2 py-1 bg-green-100 text-green-700 rounded">🇮🇳 India Regions</div>
      </div>

      {/* Search Bar */}
      <div className="flex mb-3">
        <input
          type="text"
          placeholder="Search state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-l px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-green-300"
        />
        <button
          onClick={handleSearch}
          className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700"
        >
          Search
        </button>
      </div>

      {/* Zoom Buttons */}
      <div className="absolute right-4 top-32 flex flex-col bg-white rounded shadow-md z-10">
        <button onClick={handleZoomIn} className="px-2 py-1 border-b text-lg font-bold hover:bg-gray-100">
          +
        </button>
        <button onClick={handleZoomOut} className="px-2 py-1 text-lg font-bold hover:bg-gray-100">
          –
        </button>
      </div>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded shadow"
          style={{ left: tooltip.x + 10, top: tooltip.y - 20 }}
        >
          {tooltip.name}
        </div>
      )}

      {/* Map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1000, center: [82.8, 22.6] }}
        width={600}
        height={500}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={handleMoveEnd}>
          <Geographies geography={{ type: "FeatureCollection", features }}>
            {({ geographies }) => {
              geographiesRef.current = geographies;
              return geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onSelectState?.(geo.properties.st_nm || geo.properties.STATE)}
                  onMouseEnter={(e) =>
                    setTooltip({ name: geo.properties.st_nm || geo.properties.STATE, x: e.clientX, y: e.clientY, show: true })
                  }
                  onMouseMove={(e) => setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }))}
                  onMouseLeave={() => setTooltip({ name: "", x: 0, y: 0, show: false })}
                  style={{
                    default: { fill: "#ecfeff", stroke: "#0f766e", strokeWidth: 0.5, outline: "none" },
                    hover: { fill: "#99f6e4", stroke: "#0f766e", strokeWidth: 1, cursor: "pointer" },
                    pressed: { fill: "#14b8a6", stroke: "#0f766e", strokeWidth: 1 },
                  }}
                />
              ));
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

export default IndiaMap;