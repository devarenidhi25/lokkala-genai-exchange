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

// Default lat/lng for each state to show marker
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

// Pan map to selected state
const MapPanToSelected = ({ latlng }) => {
  const map = useMap();
  useEffect(() => {
    if (latlng) map.flyTo(latlng, 6);
  }, [latlng]);
  return null;
};

const IndiaMap = ({ onSelectState }) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("./data/india_states.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading geojson:", err));
  }, []);

  // Custom marker icon
  const customIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -20],
  });

  const onEachState = (feature, layer) => {
    const stateName = feature.properties?.st_nm;

    layer.on({
      mouseover: (e) => {
        if (!selectedState || selectedState.name !== stateName) {
          e.target.setStyle({ weight: 2, color: "blue", fillOpacity: 0.4 });
        }
      },
      mouseout: (e) => {
        if (!selectedState || selectedState.name !== stateName) {
          e.target.setStyle({ weight: 1, color: "black", fillOpacity: 0.2 });
        }
      },
      click: (e) => {
        handleStateSelect(stateName, e.latlng, layer);
      },
    });
  };

  const handleStateSelect = (stateName, latlng, layer = null) => {
    if (selectedState?.layer) {
      selectedState.layer.setStyle({ weight: 1, color: "black", fillOpacity: 0.2 });
    }

    if (layer) {
      layer.setStyle({ weight: 3, color: "red", fillOpacity: 0.5 });
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
    if (stateName) {
      handleStateSelect(stateName);
    } else {
      alert("State not found!");
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {/* Search Box */}
      <div style={{ padding: "10px", background: "#f0f0f0" }}>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search states..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "5px", width: "200px" }}
          />
          <button type="submit" style={{ marginLeft: "5px", padding: "5px 10px" }}>
            Search
          </button>
        </form>
      </div>

      {/* Map */}
      <MapContainer
        center={[22.9734, 78.6569]}
        zoom={5}
        style={{ height: "calc(100% - 60px)", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={{ fillColor: "orange", weight: 1, color: "black", fillOpacity: 0.2 }}
            onEachFeature={onEachState}
          />
        )}
        {selectedState && selectedState.latlng && (
          <>
            <Marker position={selectedState.latlng} icon={customIcon}>
              <Popup>
                <div style={{ textAlign: "center" }}>
                  <strong>{selectedState.name}</strong>
                  <br />
                  ✅ Products available here
                </div>
              </Popup>
            </Marker>
            <MapPanToSelected latlng={selectedState.latlng} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default IndiaMap;
