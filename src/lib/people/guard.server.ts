import { lookup } from "node:dns/promises";
import { endpointIssue, isBlockedIp } from "@/lib/people/guard";

export async function assertPublicHttps(raw: string): Promise<URL> {
  const issue = endpointIssue(raw);
  if (issue) throw new Error(issue);
  const url = new URL(raw.trim());
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (isBlockedIp(host)) {
    throw new Error("That host is not allowed. Use your provider's public HTTPS API.");
  }
  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error("Could not resolve the provider host.");
  }
  if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
    throw new Error("That host is not allowed. Use your provider's public HTTPS API.");
  }
  return url;
}
