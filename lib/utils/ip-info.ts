import * as dns from "dns/promises";
import * as tls from "tls";
import { lookup as whoisLookup } from "whois";
import { isValidIP } from "./ip-validator";

const DNS_TIMEOUT = 5000; // 5 seconds
const TLS_TIMEOUT = 5000; // 5 seconds
const WHOIS_TIMEOUT = 10000; // 10 seconds

// 内部IPアドレスをチェック（DNSリバインディング攻撃対策）
const isPrivateIP = (ip: string): boolean => {
  // IPv4 private ranges
  if (/^10\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^127\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true; // Link-local
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;
  // IPv6 private ranges (simplified)
  if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
  return false;
};

// ホスト名形式を検証
const isValidHostname = (hostname: string): boolean => {
  if (hostname.length > 253) return false;
  const hostnameRegex =
    /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return hostnameRegex.test(hostname) || hostnameRegex.test(hostname + ".");
};

// ホスト名からIPアドレスを解決
export const resolveHostname = async (
  hostname: string
): Promise<string | null> => {
  try {
    const addresses = await Promise.race([
      dns.resolve4(hostname),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
      ),
    ]);
    return addresses && addresses.length > 0 ? addresses[0] : null;
  } catch (error) {
    console.error("DNS resolution error:", error);
    return null;
  }
};

// リバースDNS（PTRレコード）を取得
export const getReverseDNS = async (ip: string): Promise<string[]> => {
  try {
    if (isPrivateIP(ip)) {
      return [];
    }
    const hostnames = await Promise.race([
      dns.reverse(ip),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
      ),
    ]);
    return hostnames || [];
  } catch (error) {
    console.error("Reverse DNS error:", error);
    return [];
  }
};

// DNS情報を取得
export const getDNSInfo = async (
  hostname: string
): Promise<{
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
}> => {
  const result: {
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
  } = {};

  try {
    // Aレコード
    try {
      const aRecords = await Promise.race([
        dns.resolve4(hostname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
        ),
      ]);
      if (aRecords && aRecords.length > 0) {
        result.a = aRecords;
      }
    } catch {
      // Aレコードが取得できない場合は無視
    }

    // AAAAレコード
    try {
      const aaaaRecords = await Promise.race([
        dns.resolve6(hostname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
        ),
      ]);
      if (aaaaRecords && aaaaRecords.length > 0) {
        result.aaaa = aaaaRecords;
      }
    } catch {
      // AAAAレコードが取得できない場合は無視
    }

    // MXレコード
    try {
      const mxRecords = await Promise.race([
        dns.resolveMx(hostname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
        ),
      ]);
      if (mxRecords && mxRecords.length > 0) {
        result.mx = mxRecords;
      }
    } catch {
      // MXレコードが取得できない場合は無視
    }

    // TXTレコード
    try {
      const txtRecords = await Promise.race([
        dns.resolveTxt(hostname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
        ),
      ]);
      if (txtRecords && txtRecords.length > 0) {
        result.txt = txtRecords.flat();
      }
    } catch {
      // TXTレコードが取得できない場合は無視
    }

    // NSレコード
    try {
      const nsRecords = await Promise.race([
        dns.resolveNs(hostname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
        ),
      ]);
      if (nsRecords && nsRecords.length > 0) {
        result.ns = nsRecords;
      }
    } catch {
      // NSレコードが取得できない場合は無視
    }

    // CNAMEレコード
    try {
      const cnameRecords = await Promise.race([
        dns.resolveCname(hostname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
        ),
      ]);
      if (cnameRecords && cnameRecords.length > 0) {
        result.cname = cnameRecords;
      }
    } catch {
      // CNAMEレコードが取得できない場合は無視
    }

    // SOAレコード
    try {
      const soaRecord = await Promise.race([
        dns.resolveSoa(hostname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
        ),
      ]);
      if (soaRecord) {
        result.soa = soaRecord;
      }
    } catch {
      // SOAレコードが取得できない場合は無視
    }
  } catch (error) {
    console.error("DNS info error:", error);
  }

  return result;
};

// SSL証明書情報を取得
export const getSSLInfo = async (
  hostname: string
): Promise<{
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  san?: string[];
} | null> => {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        socket.end();

        if (!cert) {
          resolve(null);
          return;
        }

        const result: {
          issuer?: string;
          subject?: string;
          validFrom?: string;
          validTo?: string;
          san?: string[];
        } = {};

        // issuerを文字列に変換
        if (cert.issuer) {
          if (typeof cert.issuer === "string") {
            result.issuer = cert.issuer;
          } else if (typeof cert.issuer === "object") {
            // オブジェクトの場合は各フィールドを組み合わせて文字列化
            const issuerParts: string[] = [];
            const issuer = cert.issuer as unknown as Record<string, string>;
            if (issuer.CN) issuerParts.push(`CN=${issuer.CN}`);
            if (issuer.O) issuerParts.push(`O=${issuer.O}`);
            if (issuer.OU) issuerParts.push(`OU=${issuer.OU}`);
            if (issuer.L) issuerParts.push(`L=${issuer.L}`);
            if (issuer.ST) issuerParts.push(`ST=${issuer.ST}`);
            if (issuer.C) issuerParts.push(`C=${issuer.C}`);
            if (issuer.STREET) issuerParts.push(`STREET=${issuer.STREET}`);
            if (issuerParts.length > 0) {
              result.issuer = issuerParts.join(", ");
            } else {
              result.issuer = JSON.stringify(issuer);
            }
          }
        }

        // subjectを文字列に変換
        if (cert.subject) {
          if (typeof cert.subject === "string") {
            result.subject = cert.subject;
          } else if (typeof cert.subject === "object") {
            // オブジェクトの場合は各フィールドを組み合わせて文字列化
            const subjectParts: string[] = [];
            const subject = cert.subject as unknown as Record<string, string>;
            if (subject.CN) subjectParts.push(`CN=${subject.CN}`);
            if (subject.O) subjectParts.push(`O=${subject.O}`);
            if (subject.OU) subjectParts.push(`OU=${subject.OU}`);
            if (subject.L) subjectParts.push(`L=${subject.L}`);
            if (subject.ST) subjectParts.push(`ST=${subject.ST}`);
            if (subject.C) subjectParts.push(`C=${subject.C}`);
            if (subject.STREET) subjectParts.push(`STREET=${subject.STREET}`);
            if (subjectParts.length > 0) {
              result.subject = subjectParts.join(", ");
            } else {
              result.subject = JSON.stringify(subject);
            }
          }
        }

        if (cert.valid_from) {
          result.validFrom = cert.valid_from;
        }
        if (cert.valid_to) {
          result.validTo = cert.valid_to;
        }
        if (cert.subjectaltname) {
          // subjectaltnameが文字列の場合は分割、配列の場合はそのまま
          if (typeof cert.subjectaltname === "string") {
            result.san = cert.subjectaltname.split(", ");
          } else if (Array.isArray(cert.subjectaltname)) {
            result.san = cert.subjectaltname;
          }
        }

        resolve(result);
      }
    );

    socket.on("error", () => {
      socket.destroy();
      resolve(null);
    });

    // タイムアウト
    setTimeout(() => {
      socket.destroy();
      resolve(null);
    }, TLS_TIMEOUT);
  });
};

// whois情報を取得（npmパッケージ）
export const getWhoisInfo = async (ip: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (isPrivateIP(ip)) {
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => {
      resolve(null);
    }, WHOIS_TIMEOUT);

    whoisLookup(ip, (err: Error | null, data: string | unknown) => {
      clearTimeout(timeout);
      if (err) {
        console.error("Whois error:", err);
        resolve(null);
      } else {
        // dataが文字列の場合はそのまま、配列の場合は文字列に変換
        const result = typeof data === "string" ? data : JSON.stringify(data);
        resolve(result);
      }
    });
  });
};

// whois情報を外部APIから取得（フォールバック）
export const getWhoisInfoFromAPI = async (
  ip: string
): Promise<{
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  as?: string;
  asname?: string;
} | null> => {
  try {
    if (isPrivateIP(ip)) {
      return null;
    }

    // ip-api.comを試行
    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp,as,asname,query`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          return {
            ip: data.query,
            country: data.country,
            region: data.regionName,
            city: data.city,
            lat: data.lat,
            lon: data.lon,
            timezone: data.timezone,
            isp: data.isp,
            as: data.as,
            asname: data.asname,
          };
        }
      }
    } catch {
      // ip-api.comが失敗した場合は次のAPIを試行
    }

    // ipwhois.appを試行
    try {
      const response = await fetch(`https://ipwhois.app/json/${ip}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            ip: data.ip,
            country: data.country,
            region: data.region,
            city: data.city,
            lat: data.latitude,
            lon: data.longitude,
            timezone: data.timezone_gmt,
            isp: data.isp,
            as: data.org,
            asname: data.org,
          };
        }
      }
    } catch {
      // ipwhois.appが失敗した場合はnullを返す
    }

    return null;
  } catch (error) {
    console.error("Whois API error:", error);
    return null;
  }
};

// GeoIP情報を取得
export const getGeoIPInfo = async (
  ip: string
): Promise<{
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  as?: string;
  asname?: string;
} | null> => {
  try {
    if (isPrivateIP(ip)) {
      return null;
    }

    // ipapi.isを試行
    try {
      const response = await fetch(`https://ipapi.is/${ip}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.location) {
          return {
            country: data.location.country,
            region: data.location.region,
            city: data.location.city,
            lat: data.location.latitude,
            lon: data.location.longitude,
            timezone: data.location.timezone,
            isp: data.connection?.isp,
            as: data.connection?.asn,
            asname: data.connection?.org,
          };
        }
      }
    } catch {
      // ipapi.isが失敗した場合は次のAPIを試行
    }

    // ip-api.comを試行
    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp,as,asname,query`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          return {
            country: data.country,
            region: data.regionName,
            city: data.city,
            lat: data.lat,
            lon: data.lon,
            timezone: data.timezone,
            isp: data.isp,
            as: data.as,
            asname: data.asname,
          };
        }
      }
    } catch {
      // ip-api.comが失敗した場合は次のAPIを試行
    }

    // ipwhois.appを試行
    try {
      const response = await fetch(`https://ipwhois.app/json/${ip}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            country: data.country,
            region: data.region,
            city: data.city,
            lat: data.latitude,
            lon: data.longitude,
            timezone: data.timezone_gmt,
            isp: data.isp,
            as: data.org,
            asname: data.org,
          };
        }
      }
    } catch {
      // ipwhois.appが失敗した場合はnullを返す
    }

    return null;
  } catch (error) {
    console.error("GeoIP error:", error);
    return null;
  }
};

// メイン関数：IPアドレスまたはホスト名からすべての情報を取得
export const getIPInfo = async (
  input: string
): Promise<{
  input: string;
  ip?: string;
  hostname?: string;
  reverseDNS?: string[];
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
}> => {
  const result: {
    input: string;
    ip?: string;
    hostname?: string;
    reverseDNS?: string[];
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
  } = {
    input,
  };

  // 入力値の検証
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    result.error = "入力が空です";
    return result;
  }

  const isIP = isValidIP(trimmedInput);
  const isHostname = isValidHostname(trimmedInput);

  if (!isIP && !isHostname) {
    result.error = "無効なIPアドレスまたはホスト名です";
    return result;
  }

  let ip: string | null = null;
  let hostname: string | null = null;

  if (isIP) {
    ip = trimmedInput;
    if (isPrivateIP(ip)) {
      result.error = "内部IPアドレスはサポートされていません";
      return result;
    }
    result.ip = ip;
  } else {
    hostname = trimmedInput;
    result.hostname = hostname;
    // ホスト名からIPアドレスを解決
    ip = await resolveHostname(hostname);
    if (ip) {
      result.ip = ip;
    }
  }

  // 並列で情報を取得
  const [reverseDNS, geoip, whoisRaw, dnsInfo, sslInfo] = await Promise.all([
    ip ? getReverseDNS(ip) : Promise.resolve([]),
    ip ? getGeoIPInfo(ip) : Promise.resolve(null),
    ip
      ? Promise.all([getWhoisInfo(ip), getWhoisInfoFromAPI(ip)]).then(
          ([whoisData, apiData]) => {
            return whoisData || apiData || null;
          }
        )
      : Promise.resolve(null),
    hostname ? getDNSInfo(hostname) : Promise.resolve(null),
    hostname ? getSSLInfo(hostname) : Promise.resolve(null),
  ]);

  result.basicInfo = {
    ip: result.ip,
    hostname: result.hostname,
    reverseDNS: reverseDNS.length > 0 ? reverseDNS : undefined,
  };

  if (geoip) {
    result.geoip = geoip;
  }

  if (whoisRaw) {
    result.whois = whoisRaw;
  }

  if (dnsInfo && Object.keys(dnsInfo).length > 0) {
    result.dns = dnsInfo;
  }

  if (sslInfo) {
    result.ssl = sslInfo;
  }

  return result;
};
