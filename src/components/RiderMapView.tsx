import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const myIcon = new L.DivIcon({ html: '<div style="font-size:24px;text-align:center">📍</div>', iconSize: [32, 32], iconAnchor: [16, 32], className: '' });
const shopIcon = new L.DivIcon({ html: '<div style="font-size:24px;text-align:center">🏪</div>', iconSize: [32, 32], iconAnchor: [16, 32], className: '' });
const customerIcon = new L.DivIcon({ html: '<div style="font-size:24px;text-align:center">🏠</div>', iconSize: [32, 32], iconAnchor: [16, 32], className: '' });

const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [positions, map]);
  return null;
};

interface RiderMapProps {
  myLat: number;
  myLng: number;
  shopLat?: number | null;
  shopLng?: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
  shopName?: string;
}

const RiderMapView = ({ myLat, myLng, shopLat, shopLng, customerLat, customerLng, shopName }: RiderMapProps) => {
  const positions: [number, number][] = [[myLat, myLng]];
  if (shopLat && shopLng) positions.push([shopLat, shopLng]);
  if (customerLat && customerLng) positions.push([customerLat, customerLng]);

  return (
    <div className="rounded-xl overflow-hidden border border-border mb-3">
      <MapContainer center={[myLat, myLng]} zoom={14} style={{ height: '200px', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        <Marker position={[myLat, myLng]} icon={myIcon}>
          <Popup>You 📍</Popup>
        </Marker>
        {shopLat && shopLng && (
          <Marker position={[shopLat, shopLng]} icon={shopIcon}>
            <Popup>{shopName || 'Shop'} 🏪</Popup>
          </Marker>
        )}
        {customerLat && customerLng && (
          <Marker position={[customerLat, customerLng]} icon={customerIcon}>
            <Popup>Customer 🏠</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default RiderMapView;
