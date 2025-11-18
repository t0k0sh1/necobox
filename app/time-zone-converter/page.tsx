"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface ConvertedTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
  timeZone: string;
  timeZoneAbbr: string;
  formatted: string;
  utcOffset: string;
}

interface TimeZoneInfo {
  ianaName: string;
  abbreviation: string;
  offset: string;
  displayName: string;
}

export default function TimeZoneConverterPage() {
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [hour, setHour] = useState<string>("");
  const [minute, setMinute] = useState<string>("");
  const [fromTimeZone, setFromTimeZone] = useState<string>("Asia/Tokyo");
  const [toTimeZone, setToTimeZone] = useState<string>("America/New_York");
  const [timeZones, setTimeZones] = useState<TimeZoneInfo[]>([]);
  const [result, setResult] = useState<ConvertedTime | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Set current date/time as default
    const now = new Date();
    setYear(String(now.getFullYear()));
    setMonth(String(now.getMonth() + 1));
    setDay(String(now.getDate()));
    setHour(String(now.getHours()));
    setMinute(String(now.getMinutes()));

    // Fetch available timezones
    fetch("/api/v1/time-zone-converter")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTimeZones(data.data.timeZones);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch timezones:", err);
        setError("Failed to load timezones. Please refresh the page.");
      });
  }, []);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/time-zone-converter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: parseInt(year),
          month: parseInt(month),
          day: parseInt(day),
          hour: parseInt(hour),
          minute: parseInt(minute),
          fromTimeZone,
          toTimeZone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to convert timezone");
      }
    } catch (err) {
      setError("Failed to process request");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    const text = `${result.formatted} ${result.timeZoneAbbr} ${result.utcOffset}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapTimeZones = () => {
    const temp = fromTimeZone;
    setFromTimeZone(toTimeZone);
    setToTimeZone(temp);
  };

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-2xl">
        <Breadcrumbs items={[{ label: "Time Zone Converter" }]} />

        <div className="space-y-6 bg-white dark:bg-black rounded-lg p-6 border mt-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Time Zone Converter</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Convert date and time between different time zones
            </p>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            {/* Date Input */}
            <div>
              <Label>Date</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="1900"
                    max="2100"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Day"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    min="1"
                    max="31"
                  />
                </div>
              </div>
            </div>

            {/* Time Input */}
            <div>
              <Label>Time</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Hour"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    min="0"
                    max="23"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Minute"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            </div>

            {/* Timezone Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="from-timezone">From Time Zone</Label>
                <select
                  id="from-timezone"
                  value={fromTimeZone}
                  onChange={(e) => setFromTimeZone(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                >
                  {timeZones.map((tz) => (
                    <option key={tz.ianaName} value={tz.ianaName}>
                      {tz.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={swapTimeZones}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-90" />
                  Swap
                </Button>
              </div>

              <div>
                <Label htmlFor="to-timezone">To Time Zone</Label>
                <select
                  id="to-timezone"
                  value={toTimeZone}
                  onChange={(e) => setToTimeZone(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border rounded-md bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                >
                  {timeZones.map((tz) => (
                    <option key={tz.ianaName} value={tz.ianaName}>
                      {tz.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleConvert}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Converting..." : "Convert"}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Converted Time
                  </p>
                  <p className="text-2xl font-semibold">
                    {result.formatted}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.timeZoneAbbr} {result.utcOffset}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
