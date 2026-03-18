import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const shopIcon = new L.DivIcon({
  html: '<div style="font-size:24px;text-align:center">🏪</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: '',
});

const customerIcon = new L.DivIcon({
  html: '<div style="font-size:24px;text-align:center">🏠</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: '',
});

const riderIcon = new L.DivIcon({
  html: '<div style="font-size:24px;text-align:center;animation:pulse 1.5s infinite">🛵</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: '',
});

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

interface LiveMapProps {
  riderId: string;
  riderName: string;
  shopLat?: number | null;
  shopLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
}

const LiveMapTracking = ({ riderId, riderName, shopLat, shopLng, deliveryLat, deliveryLng }: LiveMapProps) => {
  const { t } = useLanguage();
  const [riderPos, setRiderPos] = useState<[number, number] | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Fetch initial rider position
    const fetchPos = async () => {
      const { data } = await (supabase as any).from('riders')
        .select('current_lat, current_lng')
        .eq('user_id', riderId).single();
      if (data?.current_lat && data?.current_lng) {
        setRiderPos([data.current_lat, data.current_lng]);
      }
    };
    fetchPos();

    // Subscribe to rider location updates
    const channel = supabase.channel(`rider-location-${riderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'riders',
        filter: `user_id=eq.${riderId}`,
      }, (payload: any) => {
        const { current_lat, current_lng } = payload.new;
        if (current_lat && current_lng) {
          setRiderPos([current_lat, current_lng]);
          // Smooth marker update
          if (markerRef.current) {
            markerRef.current.setLatLng([current_lat, current_lng]);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [riderId]);

  if (!riderPos) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">{t('order_on_its_way')}</p>
      </div>
    );
  }

  const positions: [number, number][] = [riderPos];
  if (shopLat && shopLng) positions.push([shopLat, shopLng]);
  if (deliveryLat && deliveryLng) positions.push([deliveryLat, deliveryLng]);

  const center = riderPos;

  return (
    <div className="rounded-xl overflow-hidden border border-border mb-4">
      <MapContainer center={center} zoom={14} style={{ height: '280px', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        {/* Rider marker */}
        <Marker position={riderPos} icon={riderIcon} ref={markerRef}>
          <Popup>{riderName} 🛵</Popup>
        </Marker>

        {/* Shop marker */}
        {shopLat && shopLng && (
          <Marker position={[shopLat, shopLng]} icon={shopIcon}>
            <Popup>Shop 🏪</Popup>
          </Marker>
        )}

        {/* Customer marker */}
        {deliveryLat && deliveryLng && (
          <Marker position={[deliveryLat, deliveryLng]} icon={customerIcon}>
            <Popup>Delivery 🏠</Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="bg-card px-3 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
        <p className="text-sm font-semibold">🛵 {riderName} {t('rider_on_the_way')}</p>
      </div>
    </div>
  );
};

export default LiveMapTracking;
