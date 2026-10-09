import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

// The auditor fetches URLs that strangers type in, so it must never be talked into reaching
// private or internal addresses (server-side request forgery). Defences, in order:
//  1. only http/https, no credentials in the URL, only the default ports
//  2. IP literals are checked directly
//  3. host names are resolved with our own lookup, which rejects blocked addresses at connect
//     time (so DNS rebinding cannot swap in a private address after the check)
//  4. redirects are followed by hand, and every hop goes through steps 1-3
//  5. hard limits on hops, time, and we never read the response body

const blocked = new net.BlockList();
const v4: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];
for (const [addr, bits] of v4) blocked.addSubnet(addr, bits, "ipv4");
const v6: [string, number][] = [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["64:ff9b::", 96], // NAT64
  ["100::", 64], // discard-only
  ["2001:db8::", 32], // documentation
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
];
for (const [addr, bits] of v6) blocked.addSubnet(addr, bits, "ipv6");

export class BlockedAddressError extends Error {}
export class FetchFailedError extends Error {}

export function isBlockedIp(address: string): boolean {
  const family = net.isIP(address);
  if (family === 0) return true; // not an IP: treat as unsafe
  // Node checks IPv4-mapped IPv6 addresses (::ffff:a.b.c.d) against the IPv4 rules, so a private
  // address can't hide in that form.
  return blocked.check(address, family === 4 ? "ipv4" : "ipv6");
}

// dns.lookup replacement used by the socket at connect time.
function safeLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some((a) => isBlockedIp(a.address))) {
      return callback(new BlockedAddressError("blocked address") as NodeJS.ErrnoException, "", 0);
    }
    if (options.all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

export type FetchResult = {
  finalUrl: string;
  status: number;
  headers: Record<string, string | string[] | undefined>;
  redirects: { from: string; status: number; to: string }[];
};

const MAX_REDIRECTS = 4;
const REQUEST_TIMEOUT_MS = 6000;
const TOTAL_TIMEOUT_MS = 12000;

function validate(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedAddressError("only http and https are allowed");
  }
  if (url.username || url.password) throw new BlockedAddressError("credentials in URLs are not allowed");
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new BlockedAddressError("only the default web ports are allowed");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host) throw new BlockedAddressError("missing host");
  if (net.isIP(host) && isBlockedIp(host)) throw new BlockedAddressError("blocked address");
}

function requestOnce(url: URL): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: safeLookup as never,
        headers: { "user-agent": "HeaderAuditor/1.0 (portfolio demo)", accept: "*/*" },
        timeout: REQUEST_TIMEOUT_MS,
      },
      resolve,
    );
    req.on("timeout", () => req.destroy(new FetchFailedError("timed out")));
    req.on("error", reject);
    req.end();
  });
}

export async function fetchHeaders(startUrl: string): Promise<FetchResult> {
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  const redirects: FetchResult["redirects"] = [];
  let current = new URL(startUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (Date.now() > deadline) throw new FetchFailedError("timed out");
    validate(current);

    let res: http.IncomingMessage;
    try {
      res = await requestOnce(current);
    } catch (e) {
      // our lookup's rejection can surface wrapped; keep it recognisable
      if (e instanceof BlockedAddressError || (e as { cause?: unknown })?.cause instanceof BlockedAddressError) {
        throw new BlockedAddressError("blocked address");
      }
      throw e instanceof FetchFailedError ? e : new FetchFailedError("could not connect");
    }

    res.destroy(); // headers are all we need; never download the body
    const status = res.statusCode ?? 0;
    const location = res.headers.location;
    if (status >= 300 && status < 400 && location) {
      const next = new URL(location, current);
      redirects.push({ from: current.href, status, to: next.href });
      current = next;
      continue;
    }
    return { finalUrl: current.href, status, headers: res.headers, redirects };
  }
  throw new FetchFailedError("too many redirects");
}
