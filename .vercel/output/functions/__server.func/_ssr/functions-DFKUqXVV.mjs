import { n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { _ as remainingSearches, a as emptyFields, b as tokensFromQuery, c as getPath, d as keyHint, f as paramValue, g as queryHasMappedValue, h as providerLabel, l as hostOf, m as parseQuery, p as parseDraft, r as collectPaths, y as suggestMapping } from "./model-DbkB9fhJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-DFKUqXVV.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var NAME_FALLBACKS = [
	"full_name",
	"display_name",
	"name"
];
var TITLE_FALLBACKS = [
	"job_title",
	"title",
	"position",
	"headline"
];
var COMPANY_FALLBACKS = [
	"job_company_name",
	"company",
	"company_name",
	"organization.name",
	"organization_name"
];
var LOCATION_FALLBACKS = [
	"location_name",
	"location",
	"formatted_address",
	"city"
];
var EMAIL_FALLBACKS = [
	"emails",
	"email",
	"work_email",
	"personal_emails"
];
var PHONE_FALLBACKS = [
	"phone_numbers",
	"phones",
	"phone",
	"mobile_phone",
	"phone_number"
];
var PROFILE_FALLBACKS = [
	"linkedin_url",
	"linkedin",
	"profile_url",
	"profile"
];
var ID_FALLBACKS = ["id", "person_id"];
function normalizePayload(payload, resultPath, fields) {
	const records = extractRecords(payload, resultPath).slice(0, 25);
	const note = likelihoodNote(payload);
	return records.map((record, index) => {
		return {
			name: pickString(record, fields.name, NAME_FALLBACKS) || joinName(record),
			title: pickString(record, fields.title, TITLE_FALLBACKS),
			company: pickString(record, fields.company, COMPANY_FALLBACKS),
			location: pickString(record, fields.location, LOCATION_FALLBACKS),
			emails: pickMany(record, fields.emails, EMAIL_FALLBACKS),
			phones: pickMany(record, fields.phones, PHONE_FALLBACKS),
			linkedin: pickString(record, fields.linkedin, PROFILE_FALLBACKS),
			id: pickString(record, fields.id, ID_FALLBACKS),
			note: index === 0 ? note : ""
		};
	}).filter((person) => Boolean(person.name || person.title || person.company || person.emails.length || person.phones.length || person.linkedin));
}
function joinName(record) {
	return [firstString(getPath(record, "first_name")), firstString(getPath(record, "last_name"))].filter(Boolean).join(" ");
}
function extractRecords(payload, resultPath) {
	if (resultPath) {
		const node = getPath(payload, resultPath);
		if (Array.isArray(node)) return node;
		if (node && typeof node === "object") return [node];
		return [];
	}
	if (Array.isArray(payload)) return payload;
	if (!payload || typeof payload !== "object") return [];
	const obj = payload;
	for (const key of [
		"data",
		"results",
		"people",
		"persons",
		"matches",
		"records",
		"items",
		"profiles"
	]) {
		const value = obj[key];
		if (Array.isArray(value)) return value;
		if (value && typeof value === "object" && (key === "data" || key === "person")) return [value];
	}
	return [payload];
}
function likelihoodNote(payload) {
	if (!payload || typeof payload !== "object") return "";
	const likelihood = payload.likelihood;
	if (typeof likelihood === "number" && Number.isFinite(likelihood)) return `Likelihood ${likelihood}`;
	return "";
}
function pickString(record, path, fallbacks) {
	if (path) return clip(firstString(getPath(record, path)));
	for (const fallback of fallbacks) {
		const value = firstString(getPath(record, fallback));
		if (value) return clip(value);
	}
	return "";
}
function pickMany(record, path, fallbacks) {
	if (path) return unique(toStrings(getPath(record, path))).slice(0, 5);
	for (const fallback of fallbacks) {
		const values = unique(toStrings(getPath(record, fallback)));
		if (values.length) return values.slice(0, 5);
	}
	return [];
}
function firstString(value) {
	return toStrings(value)[0] ?? "";
}
function toStrings(value) {
	if (typeof value === "string" || typeof value === "number") {
		const text = String(value).trim();
		return text ? [text] : [];
	}
	if (Array.isArray(value)) return value.flatMap((item) => toStrings(item));
	if (value && typeof value === "object") {
		const record = value;
		for (const key of [
			"address",
			"email",
			"number",
			"phone",
			"value",
			"url",
			"name"
		]) if (record[key] != null) return toStrings(record[key]);
	}
	return [];
}
function unique(values) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const value of values) {
		const key = value.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(clip(value));
	}
	return out;
}
function clip(value) {
	return value.length > 180 ? `${value.slice(0, 177)}…` : value;
}
var HOUR_MS = 36e5;
var SESSION_FALLBACK = "people-search-studio-session-seal-v1";
async function sessionConfig() {
	const { getRequestProtocol } = await import("./ssr.mjs").then((n) => n.o).then((n) => n.t);
	const fromEnv = process.env.PEOPLESEARCH_SESSION_SECRET?.trim();
	const password = fromEnv && fromEnv.length >= 32 ? fromEnv : SESSION_FALLBACK;
	const maxAge = 43200;
	return {
		password,
		name: "pss",
		maxAge,
		sessionHeader: false,
		cookie: {
			httpOnly: true,
			secure: getRequestProtocol() === "https",
			sameSite: "lax",
			path: "/",
			maxAge
		}
	};
}
function freshStamps(stamps, now) {
	if (!Array.isArray(stamps)) return [];
	return stamps.filter((stamp) => typeof stamp === "number" && now - stamp < HOUR_MS).slice(-24);
}
function toPublic(data) {
	if (!data.key || data.key.length < 8 || !data.endpoint || !data.authStyle) return { connected: false };
	const stamps = freshStamps(data.searches, Date.now());
	const providerId = data.providerId || "custom";
	return {
		connected: true,
		providerId,
		label: data.label || providerLabel(providerId),
		host: hostOf(data.endpoint),
		endpoint: data.endpoint,
		method: data.method === "POST" ? "POST" : "GET",
		transport: data.transport === "json" ? "json" : "query",
		authStyle: data.authStyle,
		authName: data.authName || "",
		keyHint: keyHint(data.key),
		docsUrl: data.docsUrl || "",
		params: Array.isArray(data.params) ? data.params : [],
		resultPath: data.resultPath || "",
		fields: data.fields ?? emptyFields(),
		searchesRemaining: remainingSearches(stamps)
	};
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function redact(text, key) {
	if (!text) return "";
	const clipped = text.length > 280 ? text.slice(0, 280) : text;
	if (!key || key.length < 4) return clipped;
	return clipped.split(key).join("[redacted]");
}
function scrubText(value, key) {
	return redact(value, key).replaceAll("[redacted]", "").trim();
}
function scrubRecords(records, key) {
	return records.map((record) => ({
		name: scrubText(record.name, key),
		title: scrubText(record.title, key),
		company: scrubText(record.company, key),
		location: scrubText(record.location, key),
		linkedin: scrubText(record.linkedin, key),
		id: scrubText(record.id, key),
		note: scrubText(record.note, key),
		emails: record.emails.map((email) => scrubText(email, key)).filter(Boolean),
		phones: record.phones.map((phone) => scrubText(phone, key)).filter(Boolean)
	}));
}
function messageFromPayload(payload) {
	if (!isRecord(payload)) return "";
	const error = payload.error;
	if (typeof error === "string") return error;
	if (isRecord(error) && typeof error.message === "string") return error.message;
	if (typeof payload.message === "string") return payload.message;
	return "";
}
function statusMessage(status, payload, key, parsedJson) {
	if (status === 401 || status === 403) return "The provider rejected the key. Check the auth style and that the key is active on your account.";
	if (status === 404) {
		if (!parsedJson) return "HTTP 404, and the body was not JSON. Check the endpoint path in your provider docs. A JSON 404 can mean the key worked and nobody matched.";
		return "No match. The provider accepted the key and found nobody for this lookup.";
	}
	if (status === 429) return "The provider rate-limited this key. Wait before trying again.";
	if (!parsedJson) return "The provider did not return JSON. Check the endpoint in your provider docs.";
	const detail = messageFromPayload(payload);
	if (detail) return redact(detail, key);
	if (status >= 200 && status < 300) return "";
	return `The provider returned HTTP ${status}.`;
}
async function readLimited(response) {
	const reader = response.body?.getReader();
	if (!reader) return "";
	const chunks = [];
	let total = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (!value) continue;
		total += value.byteLength;
		if (total > 1e6) {
			await reader.cancel();
			throw new Error("The provider response was too large to read.");
		}
		chunks.push(value);
	}
	const merged = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(merged);
}
async function callProvider(parsed, key, query) {
	const mapped = queryHasMappedValue(query, parsed.params);
	if (mapped) throw new Error(mapped);
	const { assertPublicHttps } = await import("./guard.server-DSnAk0CX.mjs");
	const url = await assertPublicHttps(parsed.endpoint);
	const tokens = tokensFromQuery(query);
	const headers = new Headers({
		Accept: "application/json",
		"User-Agent": "PeopleSearchStudio/1.0"
	});
	let body;
	if (parsed.transport === "json" && parsed.method === "POST") {
		const json = {};
		for (const param of parsed.params) {
			const value = paramValue(param, tokens);
			if (!value) continue;
			json[param.name] = param.as === "array" ? [value] : value;
		}
		if (parsed.authStyle === "json") json[parsed.authName] = key;
		body = JSON.stringify(json);
		headers.set("Content-Type", "application/json");
	} else for (const param of parsed.params) {
		const value = paramValue(param, tokens);
		if (!value) continue;
		url.searchParams.append(param.name, value);
	}
	if (parsed.authStyle === "bearer") headers.set("Authorization", `Bearer ${key}`);
	else if (parsed.authStyle === "header") headers.set(parsed.authName, key);
	else if (parsed.authStyle === "query") url.searchParams.set(parsed.authName, key);
	try {
		return await fetch(url, {
			method: parsed.method,
			headers,
			body: parsed.method === "POST" ? body : void 0,
			redirect: "error",
			signal: AbortSignal.timeout(12e3)
		});
	} catch (error) {
		const name = error instanceof Error ? error.name : "";
		if (name === "TimeoutError" || name === "AbortError") throw new Error("The provider took too long to answer.");
		throw new Error("Could not reach that HTTPS endpoint. Check the URL in your provider docs.");
	}
}
async function runLookup(parsed, key, query) {
	const { useSession } = await import("./ssr.mjs").then((n) => n.o).then((n) => n.t);
	const session = await useSession(await sessionConfig());
	const now = Date.now();
	const searches = freshStamps(session.data.searches, now);
	if (searches.length >= 24) throw new Error("This sealed session has used its 24 lookups for the hour.");
	const response = await callProvider(parsed, key, query);
	searches.push(now);
	await session.update({ searches });
	const text = await readLimited(response);
	let payload = null;
	let parsedJson = false;
	if (text) try {
		payload = JSON.parse(text);
		parsedJson = true;
	} catch {
		parsedJson = false;
	}
	else parsedJson = true;
	const results = parsedJson ? scrubRecords(normalizePayload(payload, parsed.resultPath, parsed.fields), key) : [];
	const suggested = parsedJson ? suggestMapping(payload) : {
		resultPath: "",
		fields: emptyFields()
	};
	const paths = parsedJson ? collectPaths(payload).map((path) => scrubText(path, key)).filter(Boolean) : [];
	let message = statusMessage(response.status, payload, key, parsedJson);
	if (!message && results.length === 0) message = "The provider responded, but no mapped person fields were found. Use the paths below or the Response step.";
	if (!message) message = results.length === 1 ? "1 record mapped from the provider response." : `${results.length} records mapped from the provider response.`;
	return {
		httpStatus: response.status,
		authRejected: response.status === 401 || response.status === 403,
		message,
		results,
		paths,
		suggested,
		searchesRemaining: remainingSearches(searches, now)
	};
}
var getConnection_createServerFn_handler = createServerRpc({
	id: "e5fb51953a6ea0f846043933c8fa773fb1290d7e4096f875902983999f507680",
	name: "getConnection",
	filename: "src/lib/people/functions.ts"
}, (opts) => getConnection.__executeServer(opts));
var getConnection = createServerFn({ method: "GET" }).handler(getConnection_createServerFn_handler, async () => {
	try {
		const { useSession } = await import("./ssr.mjs").then((n) => n.o).then((n) => n.t);
		return toPublic((await useSession(await sessionConfig())).data);
	} catch {
		return { connected: false };
	}
});
var disconnect_createServerFn_handler = createServerRpc({
	id: "7a9a3382d85a3899a198822b66be91b3983ae93b984659850e8adb947c9ba2e3",
	name: "disconnect",
	filename: "src/lib/people/functions.ts"
}, (opts) => disconnect.__executeServer(opts));
var disconnect = createServerFn({ method: "POST" }).handler(disconnect_createServerFn_handler, async () => {
	const { clearSession } = await import("./ssr.mjs").then((n) => n.o).then((n) => n.t);
	await clearSession(await sessionConfig());
	return { connected: false };
});
var saveConnection_createServerFn_handler = createServerRpc({
	id: "76459034dbe2584f84de7151ef80f9ee8596438dc61a6483dfa5a7d146026382",
	name: "saveConnection",
	filename: "src/lib/people/functions.ts"
}, (opts) => saveConnection.__executeServer(opts));
var saveConnection = createServerFn({ method: "POST" }).validator((data) => data).handler(saveConnection_createServerFn_handler, async ({ data }) => {
	const { useSession } = await import("./ssr.mjs").then((n) => n.o).then((n) => n.t);
	const session = await useSession(await sessionConfig());
	const existingKey = typeof session.data.key === "string" ? session.data.key : "";
	const parsed = parseDraft(data, { keyOptional: existingKey.length >= 8 });
	const key = parsed.key || existingKey;
	if (key.length < 8) throw new Error("Enter the API key from your provider account.");
	const searches = freshStamps(session.data.searches, Date.now());
	const next = {
		purposeAccepted: true,
		providerId: parsed.providerId,
		label: parsed.label,
		endpoint: parsed.endpoint,
		method: parsed.method,
		transport: parsed.transport,
		authStyle: parsed.authStyle,
		authName: parsed.authName,
		key,
		docsUrl: parsed.docsUrl,
		params: parsed.params,
		resultPath: parsed.resultPath,
		fields: parsed.fields,
		searches
	};
	await session.update(next);
	return toPublic(next);
});
var testConnection_createServerFn_handler = createServerRpc({
	id: "8a9e7ba678a9a9d9cabf274824df93f5153cb473e0b19959cd76b57db892015a",
	name: "testConnection",
	filename: "src/lib/people/functions.ts"
}, (opts) => testConnection.__executeServer(opts));
var testConnection = createServerFn({ method: "POST" }).validator((data) => {
	if (!isRecord(data)) throw new Error("The test request was incomplete.");
	return {
		draft: data.draft,
		query: parseQuery(data.query)
	};
}).handler(testConnection_createServerFn_handler, async ({ data }) => {
	const { useSession } = await import("./ssr.mjs").then((n) => n.o).then((n) => n.t);
	const session = await useSession(await sessionConfig());
	const existingKey = typeof session.data.key === "string" ? session.data.key : "";
	const parsed = parseDraft(data.draft, { keyOptional: existingKey.length >= 8 });
	const key = parsed.key || existingKey;
	if (key.length < 8) throw new Error("Enter the API key from your provider account.");
	return runLookup(parsed, key, data.query);
});
var searchPeople_createServerFn_handler = createServerRpc({
	id: "f495ae9298fcb543a656a4a8f51d2c44a4d4a8094e367197135d30d2fc79301f",
	name: "searchPeople",
	filename: "src/lib/people/functions.ts"
}, (opts) => searchPeople.__executeServer(opts));
var searchPeople = createServerFn({ method: "POST" }).validator((data) => parseQuery(data)).handler(searchPeople_createServerFn_handler, async ({ data }) => {
	const { useSession } = await import("./ssr.mjs").then((n) => n.o).then((n) => n.t);
	const session = await useSession(await sessionConfig());
	if (!session.data.key || !session.data.endpoint) throw new Error("Seal an API key before running a lookup.");
	return runLookup(parseDraft({
		acknowledged: true,
		providerId: session.data.providerId,
		endpoint: session.data.endpoint,
		method: session.data.method,
		transport: session.data.transport,
		authStyle: session.data.authStyle,
		authName: session.data.authName,
		key: session.data.key,
		docsUrl: session.data.docsUrl ?? "",
		params: session.data.params,
		resultPath: session.data.resultPath ?? "",
		fields: session.data.fields
	}, { keyOptional: false }), session.data.key, data);
});
//#endregion
export { disconnect_createServerFn_handler, getConnection_createServerFn_handler, saveConnection_createServerFn_handler, searchPeople_createServerFn_handler, testConnection_createServerFn_handler };
