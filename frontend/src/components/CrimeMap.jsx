import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import api from '../api';

export default function CrimeMap() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.get('/dashboard/locations-geospatial')
      .then(res => setLocations(res.data))
      .catch(console.error);
      
    // Fix Leaflet's infamous "grey tile" bug when rendered inside dynamic grid containers
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="card p-5 z-10 relative">
      <h2 className="section-title mb-4">Geospatial Crime Density</h2>
      <div className="h-[300px] w-full rounded-xl overflow-hidden border border-navy-700">
        <MapContainer 
          center={[20.5937, 78.9629]} // Center of India
          zoom={4} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%', background: '#09152b' }}
        >
          {/* Dark themed map tiles (CartoDB Dark Matter) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {locations.map((loc, idx) => (
            <CircleMarker
              key={idx}
              center={[Number(loc.latitude) || 0, Number(loc.longitude) || 0]}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.6,
                weight: 1
              }}
              radius={Math.max(5, Math.min(25, loc.crime_count * 2))} // Dynamic radius based on crime count
            >
              <Popup className="custom-popup">
                <div className="text-center font-sans tracking-wide">
                  <p className="font-bold text-slate-800 text-sm">{loc.city}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-bold text-red-600">{loc.crime_count}</span> Recorded Crimes
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
