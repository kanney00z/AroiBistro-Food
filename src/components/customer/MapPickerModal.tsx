import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  Navigation,
  Search,
  Check,
  Building,
  FileText,
  Clock,
  Bike,
  Sparkles,
  Compass,
  AlertCircle,
  LocateFixed,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import L from 'leaflet';
import { useRestaurant } from '../../context/RestaurantContext';
import { DeliveryLocation } from '../../types';

// Haversine distance calculator in KM
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Popular Bangkok & Thailand delivery hotspots for fast 1-click pinning
const POPULAR_HOTSPOTS = [
  { name: 'ทองหล่อ (Thonglor 13)', lat: 13.7325, lng: 100.5822, address: 'สุขุมวิท 55 ซอยทองหล่อ 13 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ' },
  { name: 'เอกมัย (Ekkamai)', lat: 13.7208, lng: 100.5855, address: 'สุขุมวิท 63 ถนนเอกมัย แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพฯ' },
  { name: 'พร้อมพงษ์ (EmQuartier)', lat: 13.7303, lng: 100.5698, address: 'สุขุมวิท 35 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ' },
  { name: 'อโศก / สุขุมวิท 21', lat: 13.738, lng: 100.5605, address: 'ถนนอโศกมนตรี (สุขุมวิท 21) แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ' },
  { name: 'สยาม / พารากอน', lat: 13.7462, lng: 100.5347, address: 'ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ' },
  { name: 'สีลม / สาทร', lat: 13.7246, lng: 100.5332, address: 'ถนนสาทรใต้ แขวงทุ่งมหาเมฆ เขตสาทร กรุงเทพฯ' },
  { name: 'พระราม 9 / รัชดา', lat: 13.7578, lng: 100.5658, address: 'ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ' },
  { name: 'อารีย์ / พหลโยธิน', lat: 13.7797, lng: 100.5448, address: 'พหลโยธินซอย 7 (ซอยอารีย์) แขวงพญาไท เขตพญาไท กรุงเทพฯ' },
];

export const MapPickerModal: React.FC = () => {
  const {
    isMapPickerOpen,
    setIsMapPickerOpen,
    deliveryLocation,
    setDeliveryLocation,
    setDeliveryAddress,
    settings,
    showToast,
  } = useRestaurant();

  // Restaurant coordinates (Default: Thonglor area)
  const restaurantLat = settings.restaurantLat || 13.7367;
  const restaurantLng = settings.restaurantLng || 100.5831;
  const maxDeliveryDistance = settings.deliveryMaxDistanceKm ?? 15;

  // Selected Pin Coordinates
  const [selectedLat, setSelectedLat] = useState<number>(deliveryLocation?.lat || 13.7325);
  const [selectedLng, setSelectedLng] = useState<number>(deliveryLocation?.lng || 100.5822);
  const [addressText, setAddressText] = useState<string>(deliveryLocation?.address || 'สุขุมวิท 55 ซอยทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ');
  const [buildingDetails, setBuildingDetails] = useState<string>(deliveryLocation?.buildingDetails || '');
  const [driverNote, setDriverNote] = useState<string>(deliveryLocation?.driverNote || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isMapPickerOpen && deliveryLocation) {
      setSelectedLat(deliveryLocation.lat);
      setSelectedLng(deliveryLocation.lng);
      setAddressText(deliveryLocation.address);
      setBuildingDetails(deliveryLocation.buildingDetails || '');
      setDriverNote(deliveryLocation.driverNote || '');
    }
  }, [isMapPickerOpen, deliveryLocation]);

  // Reverse Geocoding helper (OpenStreetMap Nominatim)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=th,en`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AroiBistroFoodApp/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Format clean Thai address
          const road = data.address?.road || data.address?.suburb || '';
          const district = data.address?.city_district || data.address?.subdistrict || data.address?.district || '';
          const city = data.address?.city || data.address?.province || 'กรุงเทพมหานคร';
          const shortAddress = [road, district, city].filter(Boolean).join(' ');
          setAddressText(shortAddress || data.display_name);
          return;
        }
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    }
    setAddressText(`พิกัดละติจูด ${lat.toFixed(5)}, ลองจิจูด ${lng.toFixed(5)}`);
  };

  // Custom Leaflet Pin Icon
  const createCustomPinIcon = () => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
          <div style="
            background: linear-gradient(135deg, #FF5C00, #FF7729);
            color: white;
            padding: 8px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 10px 25px rgba(255, 92, 0, 0.45);
            border: 2px solid white;
            display: flex;
            align-items: center;
            gap: 5px;
            letter-spacing: 0.5px;
          ">
            <span>🛵</span>
            <span>จุดส่งอาหารของคุณ</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 10px solid #FF5C00;
            margin-top: -2px;
          "></div>
          <div style="
            width: 12px;
            height: 4px;
            background: rgba(0,0,0,0.35);
            border-radius: 50%;
            margin-top: 2px;
            filter: blur(1px);
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  // Restaurant Map Pin Icon
  const createRestaurantPinIcon = () => {
    return L.divIcon({
      className: 'restaurant-map-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="
            background: #111112;
            color: #FF5C00;
            padding: 6px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            border: 1.5px solid #FF5C00;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>🍳</span>
            <span>${settings.name || 'ร้านอาหาร'}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #111112;
            margin-top: -2px;
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  // Helper to update circle & polyline
  const updateOverlays = (map: L.Map, cLat: number, cLng: number) => {
    // Radius Circle
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }
    if (maxDeliveryDistance > 0) {
      const circle = L.circle([restaurantLat, restaurantLng], {
        radius: maxDeliveryDistance * 1000,
        color: '#FF5C00',
        weight: 1.5,
        opacity: 0.75,
        fillColor: '#FF5C00',
        fillOpacity: 0.08,
        dashArray: '6, 8',
      }).addTo(map);
      radiusCircleRef.current = circle;
    }

    // Route connecting polyline
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    const dist = calculateDistanceKm(restaurantLat, restaurantLng, cLat, cLng);
    const isOut = maxDeliveryDistance > 0 && dist > maxDeliveryDistance;
    const polyline = L.polyline(
      [
        [restaurantLat, restaurantLng],
        [cLat, cLng],
      ],
      {
        color: isOut ? '#F43F5E' : '#FF5C00',
        weight: 2.5,
        opacity: 0.85,
        dashArray: '4, 6',
      }
    ).addTo(map);
    routeLineRef.current = polyline;
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!isMapPickerOpen || !mapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        // Create Map
        const map = L.map(mapContainerRef.current, {
          center: [selectedLat, selectedLng],
          zoom: 14,
          zoomControl: true,
        });

        // Add OSM Dark/Styled Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          className: 'leaflet-dark-tiles',
        }).addTo(map);

        // Add Restaurant Marker
        const restMarker = L.marker([restaurantLat, restaurantLng], {
          icon: createRestaurantPinIcon(),
          interactive: false,
        }).addTo(map);
        restaurantMarkerRef.current = restMarker;

        // Add Customer Pin Marker
        const pinMarker = L.marker([selectedLat, selectedLng], {
          icon: createCustomPinIcon(),
          draggable: true,
        }).addTo(map);

        // Handle Marker Drag End
        pinMarker.on('dragend', () => {
          const pos = pinMarker.getLatLng();
          setSelectedLat(pos.lat);
          setSelectedLng(pos.lng);
          updateOverlays(map, pos.lat, pos.lng);
          reverseGeocode(pos.lat, pos.lng);
        });

        // Handle Map Click to Reposition Pin
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setSelectedLat(lat);
          setSelectedLng(lng);
          pinMarker.setLatLng([lat, lng]);
          updateOverlays(map, lat, lng);
          reverseGeocode(lat, lng);
        });

        markerInstanceRef.current = pinMarker;
        mapInstanceRef.current = map;
        updateOverlays(map, selectedLat, selectedLng);
      } else {
        // Update existing map size and center
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([selectedLat, selectedLng], 14);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([selectedLat, selectedLng]);
        }
        updateOverlays(mapInstanceRef.current, selectedLat, selectedLng);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isMapPickerOpen]);

  // Clean up on modal close
  useEffect(() => {
    if (!isMapPickerOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
      restaurantMarkerRef.current = null;
      radiusCircleRef.current = null;
      routeLineRef.current = null;
    }
  }, [isMapPickerOpen]);

  // Move pin to specific lat/lng
  const moveToLocation = (lat: number, lng: number, address?: string) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    if (address) {
      setAddressText(address);
    } else {
      reverseGeocode(lat, lng);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 0.8 });
      updateOverlays(mapInstanceRef.current, lat, lng);
    }
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  };

  // Get User's Current GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('อุปกรณ์ของคุณไม่รองรับระบบระบุตำแหน่ง GPS', 'warning');
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGeolocating(false);
        const { latitude, longitude } = pos.coords;
        moveToLocation(latitude, longitude);
        showToast('ระบุพิกัด GPS ตำแหน่งปัจจุบันของคุณแล้ว 📍', 'success');
      },
      (err) => {
        setIsGeolocating(false);
        console.warn('Geolocation error:', err);
        showToast('ไม่สามารถเข้าถึง GPS ได้ กรุณาเลือกจุดบนแผนที่โดยตรง', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Address or Landmark
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery + ' Thailand'
      )}&limit=1&accept-language=th,en`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AroiBistroFoodApp/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          moveToLocation(lat, lon, item.display_name);
          showToast(`พบสถานที่: ${searchQuery}`, 'success');
          setIsSearching(false);
          return;
        }
      }
      showToast('ไม่พบสถานที่ที่ค้นหา กรุณาลองแตะปักหมุดบนแผนที่', 'warning');
    } catch (err) {
      console.warn('Search geocode error:', err);
      showToast('เกิดข้อผิดพลาดในการค้นหาสถานที่', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate Distance & Dynamic Delivery Estimate
  const distanceKm = calculateDistanceKm(restaurantLat, restaurantLng, selectedLat, selectedLng);
  const estimatedMins = Math.max(15, Math.round(15 + distanceKm * 3));
  
  const baseFee = settings.deliveryBaseFee ?? 40;
  const freeKm = settings.deliveryFreeKm ?? 3;
  const perKmFee = settings.deliveryPerKmFee ?? 10;
  
  let calculatedFee = baseFee;
  if (distanceKm > freeKm && perKmFee > 0) {
    calculatedFee = baseFee + Math.ceil(distanceKm - freeKm) * perKmFee;
  }

  const isOutOfRadius = maxDeliveryDistance > 0 && distanceKm > maxDeliveryDistance;
  const isBlockOrder = isOutOfRadius && !settings.allowOutOfRadiusOrder;

  // Save Location and Confirm
  const handleConfirmLocation = () => {
    if (isBlockOrder) {
      showToast(
        settings.outOfRadiusMessage ||
          `ตำแหน่งนี้อยู่นอกเขตรัศมีจัดส่ง (${distanceKm} กม. / สูงสุด ${maxDeliveryDistance} กม.)`,
        'error'
      );
      return;
    }

    const newLoc: DeliveryLocation = {
      lat: selectedLat,
      lng: selectedLng,
      address: addressText.trim() || 'สุขุมวิท 55 ซอยทองหล่อ 13 แขวงคลองตันเหนือ กรุงเทพฯ',
      buildingDetails: buildingDetails.trim(),
      driverNote: driverNote.trim(),
      distanceKm,
    };

    setDeliveryLocation(newLoc);
    setDeliveryAddress(newLoc.address);
    setIsMapPickerOpen(false);
    showToast('ปักหมุดและบันทึกตำแหน่งจัดส่งอาหารเรียบร้อยแล้ว! 🛵📍', 'success');
  };

  if (!isMapPickerOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          id="map-picker-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMapPickerOpen(false)}
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          id="map-picker-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#111112] rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5C00]/20 border border-[#FF5C00]/40 flex items-center justify-center text-[#FF5C00]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg sm:text-xl text-white flex items-center gap-2">
                  <span>ปักหมุดตำแหน่งจัดส่งอาหาร</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF5C00]/20 text-[#FF5C00] font-bold border border-[#FF5C00]/30">
                    GPS PIN
                  </span>
                </h3>
                <p className="text-xs text-stone-400 font-medium">
                  แตะบนแผนที่ หรือลากหมุด 🛵 เพื่อระบุจุดส่งอาหารให้ไรเดอร์ไปส่งถูกที่
                </p>
              </div>
            </div>

            <button
              id="btn-close-map-picker"
              onClick={() => setIsMapPickerOpen(false)}
              className="w-9 h-9 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1 custom-scrollbar">
            
            {/* Search & GPS Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleSearchAddress} className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหาชื่อสถานที่, ซอย, คอนโด, หรือถนน..."
                  className="w-full bg-[#161618] border border-white/10 rounded-xl pl-9 pr-24 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#FF5C00] transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-[#FF5C00] hover:bg-[#FF7729] text-white text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? 'กำลังหา...' : 'ค้นหา'}
                </button>
              </form>

              <button
                type="button"
                id="btn-gps-current-location"
                onClick={handleGetCurrentLocation}
                disabled={isGeolocating}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1D1D20] hover:bg-[#28282C] border border-white/15 text-xs font-bold text-amber-300 hover:text-amber-200 transition-all cursor-pointer shrink-0"
              >
                <LocateFixed className={`w-4 h-4 ${isGeolocating ? 'animate-spin' : ''}`} />
                <span>{isGeolocating ? 'กำลังค้นหา GPS...' : 'ตำแหน่งของฉัน'}</span>
              </button>
            </div>

            {/* Popular Hotspots Pill Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#FF5C00]" />
                <span>จุดปักหมุดยอดนิยม (แตะเพื่อปักหมุดทันที):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_HOTSPOTS.map((spot) => (
                  <button
                    key={spot.name}
                    type="button"
                    onClick={() => moveToLocation(spot.lat, spot.lng, spot.address)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#161618] hover:bg-[#FF5C00]/20 text-stone-300 hover:text-[#FF5C00] border border-white/10 hover:border-[#FF5C00]/40 transition-all font-medium cursor-pointer"
                  >
                    📍 {spot.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-inner bg-[#0A0A0B] h-64 sm:h-72 w-full">
              <div ref={mapContainerRef} className="w-full h-full" />
              
              {/* Map Overlay Badge */}
              <div className="absolute top-3 left-3 z-[1000] bg-[#0A0A0B]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[11px] text-stone-300 font-bold flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse" />
                <span>แตะหรือลากหมุดบนแผนที่ได้อิสระ</span>
              </div>

              {/* Coordinates Badge */}
              <div className="absolute bottom-3 right-3 z-[1000] bg-[#0A0A0B]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[10px] font-mono text-stone-400 shadow-md">
                {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
              </div>
            </div>

            {/* Coordinates & Geofence Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isOutOfRadius ? (
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>อยู่นอกเขตรัศมีจัดส่ง ({distanceKm} กม. / สูงสุด {maxDeliveryDistance} กม.)</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>อยู่ในเขตรัศมีจัดส่ง ({distanceKm} กม. / สูงสุด {maxDeliveryDistance} กม.)</span>
                  </span>
                )}
              </div>

              <div className="text-[10px] font-mono text-stone-400">
                GPS: {selectedLat.toFixed(5)}, {selectedLng.toFixed(5)}
              </div>
            </div>

            {/* Out of Radius Warning Box */}
            {isOutOfRadius && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  isBlockOrder
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <ShieldAlert
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isBlockOrder ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
                <div className="space-y-1">
                  <div className="font-bold">
                    {isBlockOrder ? 'ร้านไม่สามารถจัดส่งอาหารไปยังจุดนี้ได้' : 'จุดปักหมุดอยู่นอกเขตรัศมีบริการปกติ'}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {settings.outOfRadiusMessage ||
                      (isBlockOrder
                        ? `ทางร้านจำกัดรัศมีจัดส่งสูงสุด ${maxDeliveryDistance} กม. เพื่อรักษาคุณภาพความสดใหม่ของอาหาร กรุณาเลือกสั่งแบบรับกลับที่ร้าน (Takeaway) หรือเปลี่ยนจุดรับใกล้ร้านครับ`
                        : `ตำแหน่งนี้ห่างจากร้าน ${distanceKm} กม. ระบบจะคิดค่าส่งตามระยะทางจริงเพิ่มเติม`)}
                  </p>
                </div>
              </div>
            )}

            {/* Distance & Delivery Stats */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#161618] border border-white/10 text-center">
              <div className="space-y-0.5">
                <div className="text-[10px] text-stone-400 font-bold uppercase flex items-center justify-center gap-1">
                  <Compass className="w-3 h-3 text-[#FF5C00]" />
                  <span>ระยะทาง</span>
                </div>
                <div className="text-sm font-black text-white font-mono">{distanceKm} กม.</div>
              </div>

              <div className="space-y-0.5 border-x border-white/10">
                <div className="text-[10px] text-stone-400 font-bold uppercase flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>เวลาจัดส่ง</span>
                </div>
                <div className="text-sm font-black text-amber-300">~{estimatedMins} นาที</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[10px] text-stone-400 font-bold uppercase flex items-center justify-center gap-1">
                  <Bike className="w-3 h-3 text-emerald-400" />
                  <span>ค่าจัดส่งประเมิน</span>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono">
                  {isOutOfRadius && isBlockOrder ? '🚫 นอกเขต' : `฿${calculatedFee}`}
                </div>
              </div>
            </div>

            {/* Address & Building Details Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="label-caps block mb-1 text-stone-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5C00]" />
                  <span>ที่อยู่ / ตำแหน่งที่ปักหมุด (Address)</span>
                </label>
                <textarea
                  rows={2}
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="ระบุชื่อซอย ถนน แขวง เขต หรือสถานที่ใกล้เคียง..."
                  className="w-full bg-[#161618] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#FF5C00] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-caps block mb-1 text-stone-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>ชื่ออาคาร / คอนโด / ชั้น / ห้อง</span>
                  </label>
                  <input
                    type="text"
                    value={buildingDetails}
                    onChange={(e) => setBuildingDetails(e.target.value)}
                    placeholder="เช่น คอนโด The Esse ชั้น 12 ห้อง 1205"
                    className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#FF5C00] transition-colors"
                  />
                </div>

                <div>
                  <label className="label-caps block mb-1 text-stone-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>หมายเหตุถึงไรเดอร์ / คนขับ</span>
                  </label>
                  <input
                    type="text"
                    value={driverNote}
                    onChange={(e) => setDriverNote(e.target.value)}
                    placeholder="เช่น ฝากไว้ที่ป้อม รปภ. / โทรเมื่อถึง"
                    className="w-full bg-[#161618] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#FF5C00] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0A0A0B] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMapPickerOpen(false)}
              className="px-5 py-3 rounded-xl bg-[#161618] hover:bg-[#202024] text-stone-300 hover:text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              id="btn-confirm-map-location"
              onClick={handleConfirmLocation}
              disabled={isBlockOrder}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                isBlockOrder
                  ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  : 'bg-[#FF5C00] hover:bg-[#FF7729] text-white shadow-lg shadow-[#FF5C00]/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-white/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isBlockOrder
                  ? '🚫 นอกเขตจัดส่ง (กรุณาเลือกหมุดใหม่หรือสั่งรับที่ร้าน)'
                  : 'ยืนยันตำแหน่งปักหมุดจัดส่งอาหาร (Confirm Pin)'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
