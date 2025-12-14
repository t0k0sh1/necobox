"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface MapViewProps {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

// Leafletのデフォルトアイコンの問題を修正
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export function MapView({ lat, lon, city, country }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // 地図を初期化
    const map = L.map(mapContainerRef.current).setView([lat, lon], 10);

    // OpenStreetMapタイルレイヤーを追加
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // マーカーを追加
    const marker = L.marker([lat, lon]).addTo(map);
    const popupText =
      city && country ? `${city}, ${country}` : country || city || "Location";
    marker.bindPopup(popupText).openPopup();

    mapRef.current = map;

    // クリーンアップ
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lon, city, country]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[400px] rounded-md border border-gray-200 dark:border-gray-700 z-0"
      style={{ minHeight: "400px" }}
    />
  );
}
