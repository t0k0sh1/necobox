"use client";

import { CopyButton } from "@/app/components/CopyButton";
import { MapView } from "@/app/components/MapView";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface IPInfoData {
  input: string;
  ip?: string;
  hostname?: string;
  basicInfo?: {
    ip?: string;
    hostname?: string;
    reverseDNS?: string[];
  };
  geoip?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    isp?: string;
    as?: string;
    asname?: string;
  };
  whois?: string | Record<string, unknown>;
  dns?: {
    a?: string[];
    aaaa?: string[];
    mx?: Array<{ priority: number; exchange: string }>;
    txt?: string[];
    ns?: string[];
    cname?: string[];
    soa?: {
      nsname: string;
      hostmaster: string;
      serial: number;
      refresh: number;
      retry: number;
      expire: number;
      minttl: number;
    };
  };
  ssl?: {
    issuer?: string;
    subject?: string;
    validFrom?: string;
    validTo?: string;
    san?: string[];
  };
  error?: string;
}

export default function IPInfoPage() {
  const t = useTranslations("ipInfo");
  const tCommon = useTranslations("common");

  const [input, setInput] = useState("");
  const [data, setData] = useState<IPInfoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) {
      setError(t("error.emptyInput"));
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch("/api/v1/ip-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t("error.fetchFailed"));
        setLoading(false);
        return;
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setData(result);
    } catch {
      setError(t("error.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex h-full items-start justify-center py-4 px-4">
      <div className="w-full max-w-6xl">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <div className="mt-6 space-y-6 bg-white dark:bg-black rounded-lg p-6 border">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("description")}
            </p>
          </div>

          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("inputPlaceholder")}
                className="w-full"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tCommon("loading")}
                </>
              ) : (
                t("search")
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {data && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">{t("tabs.basic")}</TabsTrigger>
                <TabsTrigger value="geoip">{t("tabs.geoip")}</TabsTrigger>
                <TabsTrigger value="whois">{t("tabs.whois")}</TabsTrigger>
                <TabsTrigger value="dns">{t("tabs.dns")}</TabsTrigger>
                <TabsTrigger value="ssl">{t("tabs.ssl")}</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {data.basicInfo?.ip && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("basicInfo.ipAddress")}
                        </p>
                        <p className="text-lg font-mono font-semibold">
                          {data.basicInfo.ip}
                        </p>
                      </div>
                      <CopyButton text={data.basicInfo.ip} />
                    </div>
                  )}
                  {data.basicInfo?.hostname && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("basicInfo.hostname")}
                        </p>
                        <p className="text-lg font-mono font-semibold">
                          {data.basicInfo.hostname}
                        </p>
                      </div>
                      <CopyButton text={data.basicInfo.hostname} />
                    </div>
                  )}
                  {data.basicInfo?.reverseDNS &&
                    data.basicInfo.reverseDNS.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("basicInfo.reverseDNS")}
                          </p>
                          <p className="text-lg font-mono font-semibold">
                            {data.basicInfo.reverseDNS.join(", ")}
                          </p>
                        </div>
                        <CopyButton
                          text={data.basicInfo.reverseDNS.join(", ")}
                        />
                      </div>
                    )}
                  {!data.basicInfo?.ip &&
                    !data.basicInfo?.hostname &&
                    !data.basicInfo?.reverseDNS && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        {t("noData")}
                      </p>
                    )}
                </div>
              </TabsContent>

              {/* GeoIP Info Tab */}
              <TabsContent value="geoip" className="space-y-4 mt-4">
                {data.geoip ? (
                  <div className="space-y-3">
                    {data.geoip.country && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.country")}
                        </p>
                        <p className="text-lg font-semibold">
                          {data.geoip.country}
                        </p>
                      </div>
                    )}
                    {data.geoip.region && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.region")}
                        </p>
                        <p className="text-lg font-semibold">
                          {data.geoip.region}
                        </p>
                      </div>
                    )}
                    {data.geoip.city && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.city")}
                        </p>
                        <p className="text-lg font-semibold">
                          {data.geoip.city}
                        </p>
                      </div>
                    )}
                    {(data.geoip.lat || data.geoip.lon) && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.latitude")} / {t("geoipInfo.longitude")}
                        </p>
                        <p className="text-lg font-semibold">
                          {data.geoip.lat}, {data.geoip.lon}
                        </p>
                      </div>
                    )}
                    {data.geoip.lat && data.geoip.lon && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t("geoipInfo.map")}
                        </p>
                        <MapView
                          lat={data.geoip.lat}
                          lon={data.geoip.lon}
                          city={data.geoip.city}
                          country={data.geoip.country}
                        />
                      </div>
                    )}
                    {data.geoip.timezone && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.timezone")}
                        </p>
                        <p className="text-lg font-semibold">
                          {data.geoip.timezone}
                        </p>
                      </div>
                    )}
                    {data.geoip.isp && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.isp")}
                        </p>
                        <p className="text-lg font-semibold">
                          {data.geoip.isp}
                        </p>
                      </div>
                    )}
                    {data.geoip.as && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.as")}
                        </p>
                        <p className="text-lg font-semibold">{data.geoip.as}</p>
                      </div>
                    )}
                    {data.geoip.asname && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("geoipInfo.asname")}
                        </p>
                        <p className="text-lg font-semibold">
                          {data.geoip.asname}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t("noData")}
                  </p>
                )}
              </TabsContent>

              {/* Whois Info Tab */}
              <TabsContent value="whois" className="space-y-4 mt-4">
                {data.whois ? (
                  <div className="space-y-3">
                    {typeof data.whois === "string" ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            {t("whoisInfo.raw")}
                          </p>
                          <CopyButton text={data.whois} />
                        </div>
                        <pre className="text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto">
                          {data.whois}
                        </pre>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.whois.ip && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              IP
                            </p>
                            <p className="text-lg font-semibold">
                              {data.whois.ip}
                            </p>
                          </div>
                        )}
                        {data.whois.country && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t("geoipInfo.country")}
                            </p>
                            <p className="text-lg font-semibold">
                              {data.whois.country}
                            </p>
                          </div>
                        )}
                        {data.whois.isp && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t("geoipInfo.isp")}
                            </p>
                            <p className="text-lg font-semibold">
                              {data.whois.isp}
                            </p>
                          </div>
                        )}
                        {data.whois.as && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t("geoipInfo.as")}
                            </p>
                            <p className="text-lg font-semibold">
                              {data.whois.as}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t("noData")}
                  </p>
                )}
              </TabsContent>

              {/* DNS Info Tab */}
              <TabsContent value="dns" className="space-y-4 mt-4">
                {data.dns && Object.keys(data.dns).length > 0 ? (
                  <div className="space-y-4">
                    {data.dns.a && data.dns.a.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm font-medium mb-2">
                          {t("dnsInfo.aRecords")}
                        </p>
                        <div className="space-y-1">
                          {data.dns.a.map((record, idx) => (
                            <p key={idx} className="font-mono text-sm">
                              {record}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.dns.aaaa && data.dns.aaaa.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm font-medium mb-2">
                          {t("dnsInfo.aaaaRecords")}
                        </p>
                        <div className="space-y-1">
                          {data.dns.aaaa.map((record, idx) => (
                            <p key={idx} className="font-mono text-sm">
                              {record}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.dns.mx && data.dns.mx.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm font-medium mb-2">
                          {t("dnsInfo.mxRecords")}
                        </p>
                        <div className="space-y-2">
                          {data.dns.mx.map((record, idx) => (
                            <div key={idx} className="font-mono text-sm">
                              {record.priority} {record.exchange}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.dns.txt && data.dns.txt.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm font-medium mb-2">
                          {t("dnsInfo.txtRecords")}
                        </p>
                        <div className="space-y-1">
                          {data.dns.txt.map((record, idx) => (
                            <p
                              key={idx}
                              className="font-mono text-sm break-words"
                            >
                              {record}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.dns.ns && data.dns.ns.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm font-medium mb-2">
                          {t("dnsInfo.nsRecords")}
                        </p>
                        <div className="space-y-1">
                          {data.dns.ns.map((record, idx) => (
                            <p key={idx} className="font-mono text-sm">
                              {record}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.dns.cname && data.dns.cname.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm font-medium mb-2">
                          {t("dnsInfo.cnameRecords")}
                        </p>
                        <div className="space-y-1">
                          {data.dns.cname.map((record, idx) => (
                            <p key={idx} className="font-mono text-sm">
                              {record}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.dns.soa && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm font-medium mb-2">
                          {t("dnsInfo.soaRecord")}
                        </p>
                        <div className="space-y-1 font-mono text-sm">
                          <p>NS: {data.dns.soa.nsname}</p>
                          <p>Hostmaster: {data.dns.soa.hostmaster}</p>
                          <p>Serial: {data.dns.soa.serial}</p>
                          <p>Refresh: {data.dns.soa.refresh}</p>
                          <p>Retry: {data.dns.soa.retry}</p>
                          <p>Expire: {data.dns.soa.expire}</p>
                          <p>Min TTL: {data.dns.soa.minttl}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t("noData")}
                  </p>
                )}
              </TabsContent>

              {/* SSL Info Tab */}
              <TabsContent value="ssl" className="space-y-4 mt-4">
                {data.ssl ? (
                  <div className="space-y-3">
                    {data.ssl.issuer && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("sslInfo.issuer")}
                        </p>
                        <p className="text-lg font-semibold break-words">
                          {data.ssl.issuer}
                        </p>
                      </div>
                    )}
                    {data.ssl.subject && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("sslInfo.subject")}
                        </p>
                        <p className="text-lg font-semibold break-words">
                          {data.ssl.subject}
                        </p>
                      </div>
                    )}
                    {data.ssl.validFrom && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("sslInfo.validFrom")}
                        </p>
                        <p className="text-lg font-semibold">
                          {new Date(data.ssl.validFrom).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {data.ssl.validTo && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("sslInfo.validTo")}
                        </p>
                        <p className="text-lg font-semibold">
                          {new Date(data.ssl.validTo).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {data.ssl.san && data.ssl.san.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {t("sslInfo.san")}
                        </p>
                        <div className="space-y-1">
                          {data.ssl.san.map((san, idx) => (
                            <p key={idx} className="font-mono text-sm">
                              {san}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    {t("noData")}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
