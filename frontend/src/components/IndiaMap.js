import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands",
  "Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry"
];

const STATE_COORDS = {
  "Andhra Pradesh": [15.9129, 79.74],
  "Arunachal Pradesh": [28.2180, 94.7278],
  "Assam": [26.2006, 92.9376],
  "Bihar": [25.0961, 85.3131],
  "Chhattisgarh": [21.2787, 81.8661],
  "Goa": [15.2993, 74.1240],
  "Gujarat": [22.2587, 71.1924],
  "Haryana": [29.0588, 76.0856],
  "Himachal Pradesh": [31.1048, 77.1734],
  "Jharkhand": [23.6102, 85.2799],
  "Karnataka": [15.3173, 75.7139],
  "Kerala": [10.8505, 76.2711],
  "Madhya Pradesh": [22.9734, 78.6569],
  "Maharashtra": [19.7515, 75.7139],
  "Manipur": [24.6637, 93.9063],
  "Meghalaya": [25.4670, 91.3662],
  "Mizoram": [23.1645, 92.9376],
  "Nagaland": [26.1584, 94.5624],
  "Odisha": [20.9517, 85.0985],
  "Punjab": [31.1471, 75.3412],
  "Rajasthan": [27.0238, 74.2179],
  "Sikkim": [27.5330, 88.5122],
  "Tamil Nadu": [11.1271, 78.6569],
  "Telangana": [18.1124, 79.0193],
  "Tripura": [23.9408, 91.9882],
  "Uttar Pradesh": [26.8467, 80.9462],
  "Uttarakhand": [30.0668, 79.0193],
  "West Bengal": [22.9868, 87.8550],
  "Andaman and Nicobar Islands": [11.7401, 92.6586],
  "Chandigarh": [30.7333, 76.7794],
  "Dadra and Nagar Haveli and Daman and Diu": [20.1809, 73.0169],
  "Delhi": [28.7041, 77.1025],
  "Jammu and Kashmir": [33.7782, 76.5762],
  "Ladakh": [34.1526, 77.5770],
  "Lakshadweep": [10.5621, 72.6369],
  "Puducherry": [11.9416, 79.8083],
};

const MapPanToSelected = ({ latlng }) => {
  const map = useMap();
  useEffect(() => {
    if (latlng) map.flyTo(latlng, 6);
  }, [latlng, map]);
  return null;
};

const IndiaMap = ({ onSelectState, products = [] }) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("./data/india_states.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading geojson:", err));
  }, []);

  // Get states with products and count
  const statesWithProducts = products.reduce((acc, product) => {
    if (!acc[product.state]) {
      acc[product.state] = 0;
    }
    acc[product.state]++;
    return acc;
  }, {});

  // Custom pin icon with emoji
  const createCustomIcon = (count) => {
    return L.divIcon({
      html: `<div style="
        font-size: 28px;
        text-align: center;
        cursor: pointer;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        position: relative;
      ">
        📍
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          border: 2px solid white;
        ">${count}</div>
      </div>`,
      className: 'custom-pin-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  const onEachState = (feature, layer) => {
    const stateName = feature.properties?.st_nm;

    layer.on({
      mouseover: (e) => {
        if (!selectedState || selectedState.name !== stateName) {
          e.target.setStyle({ weight: 2, color: "blue", fillOpacity: 0.3 });
        }
      },
      mouseout: (e) => {
        if (!selectedState || selectedState.name !== stateName) {
          e.target.setStyle({ weight: 1, color: "#666", fillOpacity: 0.1 });
        }
      },
      click: (e) => {
        if (statesWithProducts[stateName]) {
          handleStateSelect(stateName, e.latlng, layer);
        }
      },
    });
  };

  const handleStateSelect = (stateName, latlng, layer = null) => {
    if (selectedState?.layer) {
      selectedState.layer.setStyle({ weight: 1, color: "#666", fillOpacity: 0.1 });
    }

    if (layer) {
      layer.setStyle({ weight: 3, color: "#2563eb", fillOpacity: 0.3 });
    }

    const coords = latlng || STATE_COORDS[stateName] || [22.9734, 78.6569];

    setSelectedState({ name: stateName, latlng: coords, layer });

    if (onSelectState) onSelectState(stateName);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const stateName = INDIA_STATES.find(
      (s) => s.toLowerCase() === searchTerm.toLowerCase()
    );
    if (stateName && statesWithProducts[stateName]) {
      handleStateSelect(stateName);
    } else if (stateName) {
      alert("No products available in this state!");
    } else {
      alert("State not found!");
    }
  };

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Search Box */}
      <div style={{ padding: "8px", background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            placeholder="Search states..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: "6px 10px", 
              flex: 1,
              border: "1px solid #ced4da",
              borderRadius: "4px",
              fontSize: "13px"
            }}
          />
          <button 
            type="submit" 
            style={{ 
              padding: "6px 12px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500"
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {geoData && (
            <GeoJSON
              data={geoData}
              style={{ 
                fillColor: "#fef3c7", 
                weight: 1, 
                color: "#666", 
                fillOpacity: 0.1 
              }}
              onEachFeature={onEachState}
            />
          )}
          
          {/* Render pins for states with products */}
          {Object.entries(statesWithProducts).map(([stateName, count]) => {
            const coords = STATE_COORDS[stateName];
            if (!coords) return null;
            
            return (
              <Marker 
                key={stateName}
                position={coords} 
                icon={createCustomIcon(count)}
                eventHandlers={{
                  click: () => handleStateSelect(stateName, coords)
                }}
              >
                <Popup>
                  <div style={{ textAlign: "center", minWidth: "120px" }}>
                    <strong style={{ fontSize: "14px" }}>{stateName}</strong>
                    <br />
                    <span style={{ fontSize: "13px", color: "#666" }}>
                      {count} {count === 1 ? 'product' : 'products'} available
                    </span>
                    <br />
                    <button
                      onClick={() => handleStateSelect(stateName, coords)}
                      style={{
                        marginTop: "8px",
                        padding: "4px 12px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      View Products
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {selectedState && selectedState.latlng && (
            <MapPanToSelected latlng={selectedState.latlng} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default IndiaMap;