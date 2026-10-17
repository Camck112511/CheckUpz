const BANNED_HOSTS = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "metadata.google.com",
]);

export function endpointIssue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Paste the HTTPS endpoint from your provider docs.";
  if (trimmed.length > 300) return "That endpoint URL is too long.";
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "That endpoint is not a valid URL.";
  }
  if (url.protocol !== "https:") return "Only HTTPS endpoints are allowed.";
  if (url.username || url.password) {
    return "Don't put a key in the URL. Use the credential step.";
  }
  if (url.search || url.hash) {
    return "Paste the endpoint without query parameters. Map the key and fields in the steps here.";
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host.length > 253) return "That host name is not allowed.";
  if (BANNED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return "That host is not allowed. Use your provider's public HTTPS API.";
  }
  if (host.startsWith("0x") || /^\d+$/.test(host)) {
    return "That host is not allowed. Use your provider's public HTTPS API.";
  }
  if (isBlockedIp(host)) {
    return "That host is not allowed. Use your provider's public HTTPS API.";
  }
  return null;
}

export function isBlockedIp(raw: string): boolean {
  const host = raw.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return true;
  if (host.includes(":")) return isBlockedIpv6(host);
  if (!/^[\d.]+$/.test(host)) return false;
  const parts = host.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return true;
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => n > 255)) return true;
  const [a, b] = nums;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isBlockedIpv6(host: string): boolean {
  const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isBlockedIp(mapped[1]);
  if (host === "::1" || host === "::" || host === "0:0:0:0:0:0:0:1") return true;
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb")) {
    return true;
  }
  if (host.startsWith("ff")) return true;
  return false;
}
