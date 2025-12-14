"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface MapViewProps {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

export function MapView({ lat, lon, city, country }: MapViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const t = useTranslations("ipInfo");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return;

    // LeafletのCSSを動的に読み込む
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // クライアントサイドでのみLeafletを動的インポート
    import("leaflet").then((L) => {
      // Leafletのデフォルトアイコンの問題を修正
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // 地図を初期化
      const map = L.default
        .map(mapContainerRef.current!)
        .setView([lat, lon], 10);

      // OpenStreetMapタイルレイヤーを追加
      L.default
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map);

      // マーカーを追加
      const marker = L.default.marker([lat, lon]).addTo(map);
      const popupText =
        city && country ? `${city}, ${country}` : country || city || "Location";
      marker.bindPopup(popupText).openPopup();

      mapRef.current = map;
    });

    // クリーンアップ
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // CSSリンクを削除
      const existingLink = document.querySelector(
        'link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]'
      );
      if (existingLink) {
        existingLink.remove();
      }
    };
  }, [isClient, lat, lon, city, country]);

  if (!isClient) {
    return (
      <div
        className="w-full h-[400px] rounded-md border border-gray-200 dark:border-gray-700 z-0 flex items-center justify-center"
        style={{ minHeight: "400px" }}
      >
        <span className="text-gray-500 dark:text-gray-400">
          {t("loading.map") || "Loading map..."}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[400px] rounded-md border border-gray-200 dark:border-gray-700 z-0"
      style={{ minHeight: "400px" }}
    />
  );
}
