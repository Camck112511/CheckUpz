import { s as endpointIssue, u as isBlockedIp } from "./model-DbkB9fhJ.mjs";
import { lookup } from "node:dns/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/guard.server-DSnAk0CX.js
async function assertPublicHttps(raw) {
	const issue = endpointIssue(raw);
	if (issue) throw new Error(issue);
	const url = new URL(raw.trim());
	const host = url.hostname.toLowerCase().replace(/\.$/, "");
	if (isBlockedIp(host)) throw new Error("That host is not allowed. Use your provider's public HTTPS API.");
	let records;
	try {
		records = await lookup(host, {
			all: true,
			verbatim: true
		});
	} catch {
		throw new Error("Could not resolve the provider host.");
	}
	if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) throw new Error("That host is not allowed. Use your provider's public HTTPS API.");
	return url;
}
//#endregion
export { assertPublicHttps };
