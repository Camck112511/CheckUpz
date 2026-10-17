import { endpointIssue } from "@/lib/people/guard";

export const SOURCES = [
  "name",
  "first",
  "last",
  "email",
  "phone",
  "location",
  "company",
  "domain",
  "profile",
  "literal",
] as const;

export type SourceId = (typeof SOURCES)[number];

export type ParamBind = {
  name: string;
  source: SourceId;
  as: "string" | "array";
  literal: string;
};

export type FieldMap = {
  name: string;
  title: string;
  company: string;
  location: string;
  emails: string;
  phones: string;
  linkedin: string;
  id: string;
};

export const FIELD_LABELS: { key: keyof FieldMap; label: string; hint: string }[] = [
  { key: "name", label: "Name", hint: "full_name" },
  { key: "title", label: "Title", hint: "job_title" },
  { key: "company", label: "Company", hint: "organization.name" },
  { key: "location", label: "Location", hint: "location_name" },
  { key: "emails", label: "Emails", hint: "emails" },
  { key: "phones", label: "Phones", hint: "phone_numbers" },
  { key: "linkedin", label: "Profile URL", hint: "linkedin_url" },
  { key: "id", label: "Record id", hint: "id" },
];

export type LookupQuery = {
  name: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  domain: string;
  profile: string;
};

export type AuthStyle = "bearer" | "header" | "query" | "json";
export type HttpMethod = "GET" | "POST";
export type Transport = "query" | "json";

export type ConnectionDraft = {
  providerId: string;
  endpoint: string;
  method: HttpMethod;
  transport: Transport;
  authStyle: AuthStyle;
  authName: string;
  key: string;
  docsUrl: string;
  params: ParamBind[];
  resultPath: string;
  fields: FieldMap;
  acknowledged: boolean;
};

export type PersonRecord = {
  name: string;
  title: string;
  company: string;
  location: string;
  emails: string[];
  phones: string[];
  linkedin: string;
  id: string;
  note: string;
};

export type PublicConnection =
  | { connected: false }
  | {
      connected: true;
      providerId: string;
      label: string;
      host: string;
      endpoint: string;
      method: HttpMethod;
      transport: Transport;
      authStyle: AuthStyle;
      authName: string;
      keyHint: string;
      docsUrl: string;
      params: ParamBind[];
      resultPath: string;
      fields: FieldMap;
      searchesRemaining: number;
    };

export type Preset = {
  id: string;
  label: string;
  summary: string;
  docsUrl: string;
  endpoint: string;
  method: HttpMethod;
  transport: Transport;
  authStyle: AuthStyle;
  authName: string;
  params: ParamBind[];
  resultPath: string;
  fields: FieldMap;
};

const PROVIDER_LABELS: Record<string, string> = {
  custom: "Custom API",
  pdl: "People Data Labs",
  apollo: "Apollo",
  hunter: "Hunter",
};

export function emptyFields(): FieldMap {
  return {
    name: "",
    title: "",
    company: "",
    location: "",
    emails: "",
    phones: "",
    linkedin: "",
    id: "",
  };
}

export function emptyQuery(): LookupQuery {
  return {
    name: "",
    email: "",
    phone: "",
    location: "",
    company: "",
    domain: "",
    profile: "",
  };
}

function bind(name: string, source: SourceId, as: "string" | "array" = "string", literal = ""): ParamBind {
  return { name, source, as, literal };
}

export const PRESETS: Preset[] = [
  {
    id: "custom",
    label: "My provider isn't listed",
    summary:
      "Use this when the vendor site is still unknown. Paste the HTTPS endpoint and parameter names from the docs that came with your key.",
    docsUrl: "",
    endpoint: "",
    method: "GET",
    transport: "query",
    authStyle: "header",
    authName: "X-Api-Key",
    params: [bind("name", "name"), bind("email", "email"), bind("phone", "phone")],
    resultPath: "",
    fields: emptyFields(),
  },
  {
    id: "pdl",
    label: "People Data Labs",
    summary:
      "Person Enrichment on your own PDL account. A match spends a provider credit. The studio calls their official API with your key.",
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
      bind("profile", "profile"),
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
      id: "id",
    },
  },
  {
    id: "apollo",
    label: "Apollo",
    summary:
      "People API Search by name, location, or company domain. This endpoint does not return email addresses or phone numbers.",
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
      bind("per_page", "literal", "string", "8"),
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
      id: "id",
    },
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
      bind("company", "company"),
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
      id: "",
    },
  },
];

export function providerLabel(id: string): string {
  return PROVIDER_LABELS[id] ?? "Custom API";
}

export function draftFromPreset(preset: Preset, previous?: ConnectionDraft): ConnectionDraft {
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
    acknowledged: previous?.acknowledged ?? false,
  };
}

export function draftFromConnection(connection: PublicConnection): ConnectionDraft {
  if (!connection.connected) return draftFromPreset(PRESETS[0]);
  return {
    providerId: connection.providerId,
    endpoint: connection.endpoint,
    method: connection.method,
    transport: connection.transport,
    authStyle: connection.authStyle,
    authName: connection.authName,
    key: "",
    docsUrl: connection.docsUrl,
    params: connection.params.map((param) => ({ ...param })),
    resultPath: connection.resultPath,
    fields: { ...connection.fields },
    acknowledged: true,
  };
}

const PATH_RE = /^[A-Za-z0-9_.[\]]{0,80}$/;
const PARAM_RE = /^[A-Za-z0-9_.[\]]{1,64}$/;
const NAME_RE = /^[A-Za-z0-9-]{1,40}$/;

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseQuery(input: unknown): LookupQuery {
  const raw = isRecord(input) ? input : {};
  return {
    name: clean(raw.name, 120),
    email: clean(raw.email, 200),
    phone: clean(raw.phone, 40),
    location: clean(raw.location, 80),
    company: clean(raw.company, 120),
    domain: clean(raw.domain, 120),
    profile: clean(raw.profile, 300),
  };
}

export type ParsedDraft = {
  providerId: string;
  label: string;
  endpoint: string;
  method: HttpMethod;
  transport: Transport;
  authStyle: AuthStyle;
  authName: string;
  key: string;
  docsUrl: string;
  params: ParamBind[];
  resultPath: string;
  fields: FieldMap;
};

export function parseDraft(input: unknown, options: { keyOptional: boolean }): ParsedDraft {
  if (!isRecord(input)) throw new Error("The integration details were incomplete.");
  if (input.acknowledged !== true) {
    throw new Error("Confirm the lawful-use acknowledgement before saving a key.");
  }
  const providerId = PROVIDER_LABELS[clean(input.providerId, 32)] ? clean(input.providerId, 32) : "custom";
  const endpoint = clean(input.endpoint, 300);
  const endpointError = endpointIssue(endpoint);
  if (endpointError) throw new Error(endpointError);
  const method: HttpMethod = input.method === "POST" ? "POST" : "GET";
  const transport: Transport = input.transport === "json" ? "json" : "query";
  const authStyle: AuthStyle =
    input.authStyle === "bearer" || input.authStyle === "query" || input.authStyle === "json" || input.authStyle === "header"
      ? input.authStyle
      : "header";
  if (authStyle === "json" && (method !== "POST" || transport !== "json")) {
    throw new Error("A JSON body key requires POST with a JSON body.");
  }
  let authName = clean(input.authName, 40);
  if (authStyle === "bearer") authName = "Authorization";
  if (authStyle !== "bearer" && !NAME_RE.test(authName)) {
    throw new Error("Enter the header, query, or JSON field name your provider uses for the key.");
  }
  if (authStyle === "header" && BANNED_AUTH_HEADERS.has(authName.toLowerCase())) {
    throw new Error("That header name is reserved. Choose the header from your provider docs.");
  }
  const key = clean(input.key, 512);
  if (!options.keyOptional && key.length < 8) {
    throw new Error("Enter the API key from your provider account. It stays on the server after this step.");
  }
  if (key && key.length < 8) throw new Error("That key looks too short. Paste the full key from your provider.");
  const docsUrl = clean(input.docsUrl, 300);
  if (docsUrl) {
    const docsError = endpointIssue(docsUrl);
    if (docsError) throw new Error("The docs link must be a public HTTPS URL, or leave it blank.");
  }
  const params = parseParams(input.params);
  if (!params.some((param) => param.source !== "literal")) {
    throw new Error("Map at least one search field to a request parameter.");
  }
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
    fields,
  };
}

const BANNED_AUTH_HEADERS = new Set([
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
  "referer",
]);

function parseParams(input: unknown): ParamBind[] {
  if (!Array.isArray(input)) throw new Error("Add at least one request parameter.");
  const params: ParamBind[] = [];
  for (const item of input) {
    if (!isRecord(item)) continue;
    const name = clean(item.name, 64);
    if (!name) continue;
    if (!PARAM_RE.test(name)) throw new Error(`Parameter “${name}” uses unsupported characters.`);
    const source = SOURCES.includes(item.source as SourceId) ? (item.source as SourceId) : null;
    if (!source) throw new Error(`Parameter “${name}” is not tied to a search field.`);
    const as = item.as === "array" ? "array" : "string";
    const literal = source === "literal" ? clean(item.literal, 40) : "";
    if (source === "literal" && !literal) continue;
    params.push({ name, source, as, literal });
    if (params.length > 16) throw new Error("Use 16 parameters or fewer.");
  }
  return params;
}

function parseFields(input: unknown): FieldMap {
  const raw = isRecord(input) ? input : {};
  const fields = emptyFields();
  for (const key of Object.keys(fields) as (keyof FieldMap)[]) {
    const path = clean(raw[key], 80);
    if (!PATH_RE.test(path)) throw new Error(`The ${key} path uses unsupported characters.`);
    fields[key] = path;
  }
  return fields;
}

export type TokenBag = Record<Exclude<SourceId, "literal">, string>;

export function tokensFromQuery(query: LookupQuery): TokenBag {
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
    profile: query.profile.trim(),
  };
}

export function paramValue(param: ParamBind, tokens: TokenBag): string {
  if (param.source === "literal") return param.literal.trim();
  return tokens[param.source].trim();
}

export function queryHasMappedValue(query: LookupQuery, params: ParamBind[]): string | null {
  const tokens = tokensFromQuery(query);
  const identity = Object.entries(tokens).filter(([, value]) => value);
  if (identity.length === 0) {
    return "Enter at least a name, email, phone, company, domain, or profile URL.";
  }
  const used = params.some((param) => param.source !== "literal" && paramValue(param, tokens));
  if (!used) return "None of the filled fields are mapped to a request parameter. Add a mapping on the Request step.";
  return null;
}

export function hostOf(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return "";
  }
}

export function keyHint(key: string): string {
  if (key.length < 8) return "sealed";
  return `···· ${key.slice(-4)}`;
}

const HOUR_MS = 60 * 60 * 1000;
export const HOURLY_LIMIT = 24;

export function remainingSearches(stamps: number[], now = Date.now()): number {
  const recent = stamps.filter((stamp) => now - stamp < HOUR_MS);
  return Math.max(0, HOURLY_LIMIT - recent.length);
}

type PathHit = { path: string; key: string; parent: string };

export function suggestMapping(payload: unknown): { resultPath: string; fields: FieldMap } {
  const fields = emptyFields();
  if (!isRecord(payload)) return { resultPath: "", fields };
  const resultPath = chooseResultPath(payload);
  const record = resultPath ? getPath(payload, resultPath) : payload;
  const sample = Array.isArray(record) ? record[0] : record;
  if (!sample || typeof sample !== "object") return { resultPath, fields };
  const hits: PathHit[] = [];
  walk(sample, "", hits, 0);
  fields.name = matchHit(hits, /^(full_?name|display_?name|name)$/i);
  fields.title = matchHit(hits, /^(job_?title|title|position|headline)$/i);
  fields.company =
    hits.find((hit) => /^(organization|company)$/i.test(hit.parent) && /^name$/i.test(hit.key))?.path ??
    matchHit(hits, /^(job_?company_?name|company_?name|organization_?name|company)$/i);
  fields.location = matchHit(hits, /^(location_?name|formatted_address|location|city)$/i);
  fields.emails = matchHit(hits, /^(emails?|work_?email|email_?address)$/i);
  fields.phones = matchHit(hits, /^(phone_?numbers?|phones?|mobile_?phone|phone_?number)$/i);
  fields.linkedin = matchHit(hits, /^(linkedin_?url|linkedin|profile_?url)$/i);
  fields.id = matchHit(hits, /^(person_?id|id)$/i);
  return { resultPath, fields };
}

function chooseResultPath(payload: Record<string, unknown>): string {
  const preferred = ["people", "results", "persons", "matches", "records", "items", "profiles", "data"];
  for (const key of preferred) {
    const value = payload[key];
    if (Array.isArray(value) && value.some((item) => item && typeof item === "object")) return key;
  }
  if (isRecord(payload.data)) return "data";
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value) && value.some((item) => item && typeof item === "object")) return key;
  }
  return "";
}

function matchHit(hits: PathHit[], pattern: RegExp): string {
  return hits.find((hit) => pattern.test(hit.key))?.path ?? "";
}

function walk(node: unknown, prefix: string, hits: PathHit[], depth: number) {
  if (depth > 4 || hits.length > 80 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    if (node[0] && typeof node[0] === "object") walk(node[0], prefix, hits, depth + 1);
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    hits.push({ path, key, parent: prefix.split(".").pop() ?? "" });
    if (value && typeof value === "object") walk(value, path, hits, depth + 1);
  }
}

export function getPath(root: unknown, path: string): unknown {
  if (!path) return root;
  const parts = path.replace(/\[(\d+)]/g, ".$1").split(".").filter(Boolean);
  let current: unknown = root;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function collectPaths(payload: unknown): string[] {
  const hits: PathHit[] = [];
  const root = isRecord(payload) ? payload : { value: payload };
  walk(root, "", hits, 0);
  return hits.slice(0, 40).map((hit) => hit.path);
}

export function safeHttpUrl(raw: string): string | null {
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
