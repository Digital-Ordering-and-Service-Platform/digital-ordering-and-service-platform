"use client";

import { useEffect, useState } from "react";

interface OfflineBannerProps {
  lang?: "en" | "am";
}

export default function OfflineBanner({ lang = "en" }: OfflineBannerProps) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-buna text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-center space-x-2 animate-in slide-in-from-top"
    >
      <span className="w-2 h-2 rounded-full bg-gold-text animate-pulse inline-block" />
      <span>
        {lang === "am"
          ? "ግንኙነት ተቋርጧል፣ እንደገና በመሞከር ላይ… (Connection lost, retrying)"
          : "Connection lost, retrying"}
      </span>
    </div>
  );
}
