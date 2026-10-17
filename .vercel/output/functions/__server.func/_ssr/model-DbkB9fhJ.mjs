//#region node_modules/.nitro/vite/services/ssr/assets/model-DbkB9fhJ.js
var BANNED_HOSTS = /* @__PURE__ */ new Set([
	"localhost",
	"metadata",
	"metadata.google.internal",
	"metadata.google.com"
]);
function endpointIssue(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return "Paste the HTTPS endpoint from your provider docs.";
	if (trimmed.length > 300) return "That endpoint URL is too long.";
	let url;
	try {
		url = new URL(trimmed);
	} catch {
		return "That endpoint is not a valid URL.";
	}
	if (url.protocol !== "https:") return "Only HTTPS endpoints are allowed.";
	if (url.username || url.password) return "Don't put a key in the URL. Use the credential step.";
	if (url.search || url.hash) return "Paste the endpoint without query parameters. Map the key and fields in the steps here.";
	const host = url.hostname.toLowerCase().replace(/\.$/, "");
	if (!host || host.length > 253) return "That host name is not allowed.";
	if (BANNED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return "That host is not allowed. Use your provider's public HTTPS API.";
	if (host.startsWith("0x") || /^\d+$/.test(host)) return "That host is not allowed. Use your provider's public HTTPS API.";
	if (isBlockedIp(host)) return "That host is not allowed. Use your provider's public HTTPS API.";
	return null;
}
function isBlockedIp(raw) {
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
function isBlockedIpv6(host) {
	const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
	if (mapped) return isBlockedIp(mapped[1]);
	if (host === "::1" || host === "::" || host === "0:0:0:0:0:0:0:1") return true;
	if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb")) return true;
	if (host.startsWith("ff")) return true;
	return false;
}
var SOURCES = [
	"name",
	"first",
	"last",
	"email",
	"phone",
	"location",
	"company",
	"domain",
	"profile",
	"literal"
];
var FIELD_LABELS = [
	{
		key: "name",
		label: "Name",
		hint: "full_name"
	},
	{
		key: "title",
		label: "Title",
		hint: "job_title"
	},
	{
		key: "company",
		label: "Company",
		hint: "organization.name"
	},
	{
		key: "location",
		label: "Location",
		hint: "location_name"
	},
	{
		key: "emails",
		label: "Emails",
		hint: "emails"
	},
	{
		key: "phones",
		label: "Phones",
		hint: "phone_numbers"
	},
	{
		key: "linkedin",
		label: "Profile URL",
		hint: "linkedin_url"
	},
	{
		key: "id",
		label: "Record id",
		hint: "id"
	}
];
var PROVIDER_LABELS = {
	custom: "Custom API",
	pdl: "People Data Labs",
	apollo: "Apollo",
	hunter: "Hunter"
};
function emptyFields() {
	return {
		name: "",
		title: "",
		company: "",
		location: "",
		emails: "",
		phones: "",
		linkedin: "",
		id: ""
	};
}
function emptyQuery() {
	return {
		name: "",
		email: "",
		phone: "",
		location: "",
		company: "",
		domain: "",
		profile: ""
	};
}
function bind(name, source, as = "string", literal = "") {
	return {
		name,
		source,
		as,
		literal
	};
}
var PRESETS = [
	{
		id: "custom",
		label: "My provider isn't listed",
		summary: "Use this when the vendor site is still unknown. Paste the HTTPS endpoint and parameter names from the docs that came with your key.",
		docsUrl: "",
		endpoint: "",
		method: "GET",
		transport: "query",
		authStyle: "header",
		authName: "X-Api-Key",
		params: [
			bind("name", "name"),
			bind("email", "email"),
			bind("phone", "phone")
		],
		resultPath: "",
		fields: emptyFields()
	},
	{
		id: "pdl",
		label: "People Data Labs",
		summary: "Person Enrichment on your own PDL account. A match spends a provider credit. The studio calls their official API with your key.",
		docsUrl: "https://docs.peopledatalabs.com/docs/reference-person-enrichment-api",
		endpoint: "https://api.peopledatalabs.com/v5/person/enrich",
		method: "GET",
		transport: "query",
		authStyle: "header",
		authName: "X-Api-Key",
		params: [
			bind("name", "name"),
			bind("first_name", "first"),
			bind("last_name", "last"),
			bind("email", "email"),
			bind("phone", "phone"),
			bind("location", "location"),
			bind("company", "company"),
			bind("profile", "profile")
		],
		resultPath: "data",
		fields: {
			name: "full_name",
			title: "job_title",
			company: "job_company_name",
			location: "location_name",
			emails: "emails",
			phones: "phone_numbers",
			linkedin: "linkedin_url",
			id: "id"
		}
	},
	{
		id: "apollo",
		label: "Apollo",
		summary: "People API Search by name, location, or company domain. This endpoint does not return email addresses or phone numbers.",
		docsUrl: "https://docs.apollo.io/reference/people-api-search",
		endpoint: "https://api.apollo.io/api/v1/mixed_people/api_search",
		method: "POST",
		transport: "query",
		authStyle: "header",
		authName: "x-api-key",
		params: [
			bind("person_name", "name"),
			bind("person_locations[]", "location", "array"),
			bind("q_organization_domains_list[]", "domain", "array"),
			bind("per_page", "literal", "string", "8")
		],
		resultPath: "people",
		fields: {
			name: "name",
			title: "title",
			company: "organization.name",
			location: "city",
			emails: "",
			phones: "",
			linkedin: "linkedin_url",
			id: "id"
		}
	},
	{
		id: "hunter",
		label: "Hunter",
		summary: "Email Finder. Send a first and last name plus a company domain. Uses the API key on your Hunter account.",
		docsUrl: "https://hunter.io/api-documentation/v2",
		endpoint: "https://api.hunter.io/v2/email-finder",
		method: "GET",
		transport: "query",
		authStyle: "query",
		authName: "api_key",
		params: [
			bind("first_name", "first"),
			bind("last_name", "last"),
			bind("domain", "domain"),
			bind("company", "company")
		],
		resultPath: "data",
		fields: {
			name: "",
			title: "position",
			company: "company",
			location: "",
			emails: "email",
			phones: "phone_number",
			linkedin: "linkedin",
			id: ""
		}
	}
];
function providerLabel(id) {
	return PROVIDER_LABELS[id] ?? "Custom API";
}
function draftFromPreset(preset, previous) {
	return {
		providerId: preset.id,
		endpoint: preset.endpoint,
		method: preset.method,
		transport: preset.transport,
		authStyle: preset.authStyle,
		authName: preset.authName,
		key: previous?.key ?? "",
		docsUrl: preset.docsUrl,
		params: preset.params.map((param) => ({ ...param })),
		resultPath: preset.resultPath,
		fields: { ...preset.fields },
		acknowledged: previous?.acknowledged ?? false
	};
}
var PATH_RE = /^[A-Za-z0-9_.[\]]{0,80}$/;
var PARAM_RE = /^[A-Za-z0-9_.[\]]{1,64}$/;
var NAME_RE = /^[A-Za-z0-9-]{1,40}$/;
function clean(value, max) {
	if (typeof value !== "string") return "";
	return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseQuery(input) {
	const raw = isRecord(input) ? input : {};
	return {
		name: clean(raw.name, 120),
		email: clean(raw.email, 200),
		phone: clean(raw.phone, 40),
		location: clean(raw.location, 80),
		company: clean(raw.company, 120),
		domain: clean(raw.domain, 120),
		profile: clean(raw.profile, 300)
	};
}
function parseDraft(input, options) {
	if (!isRecord(input)) throw new Error("The integration details were incomplete.");
	if (input.acknowledged !== true) throw new Error("Confirm the lawful-use acknowledgement before saving a key.");
	const providerId = PROVIDER_LABELS[clean(input.providerId, 32)] ? clean(input.providerId, 32) : "custom";
	const endpoint = clean(input.endpoint, 300);
	const endpointError = endpointIssue(endpoint);
	if (endpointError) throw new Error(endpointError);
	const method = input.method === "POST" ? "POST" : "GET";
	const transport = input.transport === "json" ? "json" : "query";
	const authStyle = input.authStyle === "bearer" || input.authStyle === "query" || input.authStyle === "json" || input.authStyle === "header" ? input.authStyle : "header";
	if (authStyle === "json" && (method !== "POST" || transport !== "json")) throw new Error("A JSON body key requires POST with a JSON body.");
	let authName = clean(input.authName, 40);
	if (authStyle === "bearer") authName = "Authorization";
	if (authStyle !== "bearer" && !NAME_RE.test(authName)) throw new Error("Enter the header, query, or JSON field name your provider uses for the key.");
	if (authStyle === "header" && BANNED_AUTH_HEADERS.has(authName.toLowerCase())) throw new Error("That header name is reserved. Choose the header from your provider docs.");
	const key = clean(input.key, 512);
	if (!options.keyOptional && key.length < 8) throw new Error("Enter the API key from your provider account. It stays on the server after this step.");
	if (key && key.length < 8) throw new Error("That key looks too short. Paste the full key from your provider.");
	const docsUrl = clean(input.docsUrl, 300);
	if (docsUrl) {
		if (endpointIssue(docsUrl)) throw new Error("The docs link must be a public HTTPS URL, or leave it blank.");
	}
	const params = parseParams(input.params);
	if (!params.some((param) => param.source !== "literal")) throw new Error("Map at least one search field to a request parameter.");
	const resultPath = clean(input.resultPath, 80);
	if (!PATH_RE.test(resultPath)) throw new Error("The result path can only use letters, numbers, dots, and brackets.");
	const fields = parseFields(input.fields);
	return {
		providerId,
		label: providerLabel(providerId),
		endpoint,
		method,
		transport,
		authStyle,
		authName,
		key,
		docsUrl,
		params,
		resultPath,
		fields
	};
}
var BANNED_AUTH_HEADERS = /* @__PURE__ */ new Set([
	"host",
	"cookie",
	"set-cookie",
	"content-length",
	"content-type",
	"transfer-encoding",
	"connection",
	"upgrade",
	"proxy-authorization",
	"forwarded",
	"x-forwarded-for",
	"x-forwarded-host",
	"x-forwarded-proto",
	"origin",
	"referer"
]);
function parseParams(input) {
	if (!Array.isArray(input)) throw new Error("Add at least one request parameter.");
	const params = [];
	for (const item of input) {
		if (!isRecord(item)) continue;
		const name = clean(item.name, 64);
		if (!name) continue;
		if (!PARAM_RE.test(name)) throw new Error(`Parameter “${name}” uses unsupported characters.`);
		const source = SOURCES.includes(item.source) ? item.source : null;
		if (!source) throw new Error(`Parameter “${name}” is not tied to a search field.`);
		const as = item.as === "array" ? "array" : "string";
		const literal = source === "literal" ? clean(item.literal, 40) : "";
		if (source === "literal" && !literal) continue;
		params.push({
			name,
			source,
			as,
			literal
		});
		if (params.length > 16) throw new Error("Use 16 parameters or fewer.");
	}
	return params;
}
function parseFields(input) {
	const raw = isRecord(input) ? input : {};
	const fields = emptyFields();
	for (const key of Object.keys(fields)) {
		const path = clean(raw[key], 80);
		if (!PATH_RE.test(path)) throw new Error(`The ${key} path uses unsupported characters.`);
		fields[key] = path;
	}
	return fields;
}
function tokensFromQuery(query) {
	const name = query.name.replace(/\s+/g, " ").trim();
	const parts = name ? name.split(" ") : [];
	let domain = query.domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
	domain = domain.replace(/^www\./i, "");
	return {
		name,
		first: parts[0] ?? "",
		last: parts.length > 1 ? parts.slice(1).join(" ") : "",
		email: query.email.trim(),
		phone: query.phone.trim(),
		location: query.location.trim(),
		company: query.company.trim(),
		domain,
		profile: query.profile.trim()
	};
}
function paramValue(param, tokens) {
	if (param.source === "literal") return param.literal.trim();
	return tokens[param.source].trim();
}
function queryHasMappedValue(query, params) {
	const tokens = tokensFromQuery(query);
	if (Object.entries(tokens).filter(([, value]) => value).length === 0) return "Enter at least a name, email, phone, company, domain, or profile URL.";
	if (!params.some((param) => param.source !== "literal" && paramValue(param, tokens))) return "None of the filled fields are mapped to a request parameter. Add a mapping on the Request step.";
	return null;
}
function hostOf(endpoint) {
	try {
		return new URL(endpoint).host;
	} catch {
		return "";
	}
}
function keyHint(key) {
	if (key.length < 8) return "sealed";
	return `···· ${key.slice(-4)}`;
}
var HOUR_MS = 36e5;
function remainingSearches(stamps, now = Date.now()) {
	const recent = stamps.filter((stamp) => now - stamp < HOUR_MS);
	return Math.max(0, 24 - recent.length);
}
function suggestMapping(payload) {
	const fields = emptyFields();
	if (!isRecord(payload)) return {
		resultPath: "",
		fields
	};
	const resultPath = chooseResultPath(payload);
	const record = resultPath ? getPath(payload, resultPath) : payload;
	const sample = Array.isArray(record) ? record[0] : record;
	if (!sample || typeof sample !== "object") return {
		resultPath,
		fields
	};
	const hits = [];
	walk(sample, "", hits, 0);
	fields.name = matchHit(hits, /^(full_?name|display_?name|name)$/i);
	fields.title = matchHit(hits, /^(job_?title|title|position|headline)$/i);
	fields.company = hits.find((hit) => /^(organization|company)$/i.test(hit.parent) && /^name$/i.test(hit.key))?.path ?? matchHit(hits, /^(job_?company_?name|company_?name|organization_?name|company)$/i);
	fields.location = matchHit(hits, /^(location_?name|formatted_address|location|city)$/i);
	fields.emails = matchHit(hits, /^(emails?|work_?email|email_?address)$/i);
	fields.phones = matchHit(hits, /^(phone_?numbers?|phones?|mobile_?phone|phone_?number)$/i);
	fields.linkedin = matchHit(hits, /^(linkedin_?url|linkedin|profile_?url)$/i);
	fields.id = matchHit(hits, /^(person_?id|id)$/i);
	return {
		resultPath,
		fields
	};
}
function chooseResultPath(payload) {
	for (const key of [
		"people",
		"results",
		"persons",
		"matches",
		"records",
		"items",
		"profiles",
		"data"
	]) {
		const value = payload[key];
		if (Array.isArray(value) && value.some((item) => item && typeof item === "object")) return key;
	}
	if (isRecord(payload.data)) return "data";
	for (const [key, value] of Object.entries(payload)) if (Array.isArray(value) && value.some((item) => item && typeof item === "object")) return key;
	return "";
}
function matchHit(hits, pattern) {
	return hits.find((hit) => pattern.test(hit.key))?.path ?? "";
}
function walk(node, prefix, hits, depth) {
	if (depth > 4 || hits.length > 80 || !node || typeof node !== "object") return;
	if (Array.isArray(node)) {
		if (node[0] && typeof node[0] === "object") walk(node[0], prefix, hits, depth + 1);
		return;
	}
	for (const [key, value] of Object.entries(node)) {
		const path = prefix ? `${prefix}.${key}` : key;
		hits.push({
			path,
			key,
			parent: prefix.split(".").pop() ?? ""
		});
		if (value && typeof value === "object") walk(value, path, hits, depth + 1);
	}
}
function getPath(root, path) {
	if (!path) return root;
	const parts = path.replace(/\[(\d+)]/g, ".$1").split(".").filter(Boolean);
	let current = root;
	for (const part of parts) {
		if (!current || typeof current !== "object") return void 0;
		current = current[part];
	}
	return current;
}
function collectPaths(payload) {
	const hits = [];
	walk(isRecord(payload) ? payload : { value: payload }, "", hits, 0);
	return hits.slice(0, 40).map((hit) => hit.path);
}
function safeHttpUrl(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	try {
		const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") return null;
		if (!url.hostname.includes(".")) return null;
		return url.toString();
	} catch {
		return null;
	}
}
//#endregion
export { remainingSearches as _, emptyFields as a, tokensFromQuery as b, getPath as c, keyHint as d, paramValue as f, queryHasMappedValue as g, providerLabel as h, draftFromPreset as i, hostOf as l, parseQuery as m, PRESETS as n, emptyQuery as o, parseDraft as p, collectPaths as r, endpointIssue as s, FIELD_LABELS as t, isBlockedIp as u, safeHttpUrl as v, suggestMapping as y };
