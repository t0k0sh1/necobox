"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

export default function ShowGipPage() {
  const [ip, setIp] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch("/api/v1/show-gip");
        const data = await response.json();
        if (response.ok) {
          setIp(data.ip);
        } else {
          setError(data.error || "Failed to fetch IP");
        }
      } catch {
        setError("Failed to fetch IP address");
      }
    };

    fetchIp();
  }, []);

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={[{ label: "Show Global IP" }]} />
        <div className="mt-6">
          <div className="text-center bg-white dark:bg-black rounded-lg p-6 border">
            <h1 className="text-3xl font-semibold mb-4">Show Global IP</h1>
            {error ? (
              <p className="text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Your IP Address:</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-2xl font-mono font-semibold">{ip}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={copied ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100" : ""}
                      onClick={() => {
                        navigator.clipboard.writeText(ip);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

