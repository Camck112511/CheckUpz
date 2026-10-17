import { createServerFn } from "@tanstack/react-start";
import { normalizePayload } from "@/lib/people/normalize";
import {
  HOURLY_LIMIT,
  collectPaths,
  emptyFields,
  hostOf,
  keyHint,
  paramValue,
  parseDraft,
  parseQuery,
  providerLabel,
  queryHasMappedValue,
  remainingSearches,
  suggestMapping,
  tokensFromQuery,
  type FieldMap,
  type HttpMethod,
  type ParamBind,
  type ParsedDraft,
  type PersonRecord,
  type PublicConnection,
  type Transport,
  type AuthStyle,
} from "@/lib/people/model";

const HOUR_MS = 60 * 60 * 1000;
const SESSION_FALLBACK = "people-search-studio-session-seal-v1";

type Vault = {
  purposeAccepted: boolean;
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
  searches: number[];
};

type SessionConfig = {
  password: string;
  name: string;
  maxAge: number;
  sessionHeader: false;
  cookie: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
};

async function sessionConfig(): Promise<SessionConfig> {
  const { getRequestProtocol } = await import("@tanstack/react-start/server");
  const fromEnv = process.env.PEOPLESEARCH_SESSION_SECRET?.trim();
  const password = fromEnv && fromEnv.length >= 32 ? fromEnv : SESSION_FALLBACK;
  const maxAge = 60 * 60 * 12;
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
      maxAge,
    },
  };
}

function freshStamps(stamps: unknown, now: number): number[] {
  if (!Array.isArray(stamps)) return [];
  return stamps
    .filter((stamp): stamp is number => typeof stamp === "number" && now - stamp < HOUR_MS)
    .slice(-HOURLY_LIMIT);
}

function toPublic(data: Partial<Vault>): PublicConnection {
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
    searchesRemaining: remainingSearches(stamps),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function redact(text: string, key: string): string {
  if (!text) return "";
  const clipped = text.length > 280 ? text.slice(0, 280) : text;
  if (!key || key.length < 4) return clipped;
  return clipped.split(key).join("[redacted]");
}

function scrubText(value: string, key: string): string {
  return redact(value, key).replaceAll("[redacted]", "").trim();
}

function scrubRecords(records: PersonRecord[], key: string): PersonRecord[] {
  return records.map((record) => ({
    name: scrubText(record.name, key),
    title: scrubText(record.title, key),
    company: scrubText(record.company, key),
    location: scrubText(record.location, key),
    linkedin: scrubText(record.linkedin, key),
    id: scrubText(record.id, key),
    note: scrubText(record.note, key),
    emails: record.emails.map((email) => scrubText(email, key)).filter(Boolean),
    phones: record.phones.map((phone) => scrubText(phone, key)).filter(Boolean),
  }));
}

function messageFromPayload(payload: unknown): string {
  if (!isRecord(payload)) return "";
  const error = payload.error;
  if (typeof error === "string") return error;
  if (isRecord(error) && typeof error.message === "string") return error.message;
  if (typeof payload.message === "string") return payload.message;
  return "";
}

function statusMessage(status: number, payload: unknown, key: string, parsedJson: boolean): string {
  if (status === 401 || status === 403) {
    return "The provider rejected the key. Check the auth style and that the key is active on your account.";
  }
  if (status === 404) {
    if (!parsedJson) {
      return "HTTP 404, and the body was not JSON. Check the endpoint path in your provider docs. A JSON 404 can mean the key worked and nobody matched.";
    }
    return "No match. The provider accepted the key and found nobody for this lookup.";
  }
  if (status === 429) return "The provider rate-limited this key. Wait before trying again.";
  if (!parsedJson) return "The provider did not return JSON. Check the endpoint in your provider docs.";
  const detail = messageFromPayload(payload);
  if (detail) return redact(detail, key);
  if (status >= 200 && status < 300) return "";
  return `The provider returned HTTP ${status}.`;
}

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > 1_000_000) {
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

async function callProvider(parsed: ParsedDraft, key: string, query: ReturnType<typeof parseQuery>) {
  const mapped = queryHasMappedValue(query, parsed.params);
  if (mapped) throw new Error(mapped);
  const { assertPublicHttps } = await import("./guard.server");
  const url = await assertPublicHttps(parsed.endpoint);
  const tokens = tokensFromQuery(query);
  const headers = new Headers({
    Accept: "application/json",
    "User-Agent": "PeopleSearchStudio/1.0",
  });
  let body: string | undefined;
  if (parsed.transport === "json" && parsed.method === "POST") {
    const json: Record<string, unknown> = {};
    for (const param of parsed.params) {
      const value = paramValue(param, tokens);
      if (!value) continue;
      json[param.name] = param.as === "array" ? [value] : value;
    }
    if (parsed.authStyle === "json") json[parsed.authName] = key;
    body = JSON.stringify(json);
    headers.set("Content-Type", "application/json");
  } else {
    for (const param of parsed.params) {
      const value = paramValue(param, tokens);
      if (!value) continue;
      url.searchParams.append(param.name, value);
    }
  }
  if (parsed.authStyle === "bearer") headers.set("Authorization", `Bearer ${key}`);
  else if (parsed.authStyle === "header") headers.set(parsed.authName, key);
  else if (parsed.authStyle === "query") url.searchParams.set(parsed.authName, key);

  try {
    return await fetch(url, {
      method: parsed.method,
      headers,
      body: parsed.method === "POST" ? body : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error("The provider took too long to answer.");
    }
    throw new Error("Could not reach that HTTPS endpoint. Check the URL in your provider docs.");
  }
}

async function runLookup(parsed: ParsedDraft, key: string, query: ReturnType<typeof parseQuery>) {
  const { useSession } = await import("@tanstack/react-start/server");
  const session = await useSession<Vault>(await sessionConfig());
  const now = Date.now();
  const searches = freshStamps(session.data.searches, now);
  if (searches.length >= HOURLY_LIMIT) {
    throw new Error("This sealed session has used its 24 lookups for the hour.");
  }
  const response = await callProvider(parsed, key, query);
  searches.push(now);
  await session.update({ searches });
  const text = await readLimited(response);
  let payload: unknown = null;
  let parsedJson = false;
  if (text) {
    try {
      payload = JSON.parse(text);
      parsedJson = true;
    } catch {
      parsedJson = false;
    }
  } else {
    parsedJson = true;
  }
  const results = parsedJson ? scrubRecords(normalizePayload(payload, parsed.resultPath, parsed.fields), key) : [];
  const suggested = parsedJson ? suggestMapping(payload) : { resultPath: "", fields: emptyFields() };
  const paths = parsedJson ? collectPaths(payload).map((path) => scrubText(path, key)).filter(Boolean) : [];
  let message = statusMessage(response.status, payload, key, parsedJson);
  if (!message && results.length === 0) {
    message = "The provider responded, but no mapped person fields were found. Use the paths below or the Response step.";
  }
  if (!message) {
    message = results.length === 1 ? "1 record mapped from the provider response." : `${results.length} records mapped from the provider response.`;
  }
  return {
    httpStatus: response.status,
    authRejected: response.status === 401 || response.status === 403,
    message,
    results,
    paths,
    suggested,
    searchesRemaining: remainingSearches(searches, now),
  };
}

export const getConnection = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { useSession } = await import("@tanstack/react-start/server");
    const session = await useSession<Vault>(await sessionConfig());
    return toPublic(session.data);
  } catch {
    return { connected: false as const };
  }
});

export const disconnect = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSession } = await import("@tanstack/react-start/server");
  await clearSession(await sessionConfig());
  return { connected: false as const };
});

export const saveConnection = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { useSession } = await import("@tanstack/react-start/server");
    const session = await useSession<Vault>(await sessionConfig());
    const existingKey = typeof session.data.key === "string" ? session.data.key : "";
    const parsed = parseDraft(data, { keyOptional: existingKey.length >= 8 });
    const key = parsed.key || existingKey;
    if (key.length < 8) throw new Error("Enter the API key from your provider account.");
    const searches = freshStamps(session.data.searches, Date.now());
    const next: Vault = {
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
      searches,
    };
    await session.update(next);
    return toPublic(next);
  });

export const testConnection = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!isRecord(data)) throw new Error("The test request was incomplete.");
    return { draft: data.draft, query: parseQuery(data.query) };
  })
  .handler(async ({ data }) => {
    const { useSession } = await import("@tanstack/react-start/server");
    const session = await useSession<Vault>(await sessionConfig());
    const existingKey = typeof session.data.key === "string" ? session.data.key : "";
    const parsed = parseDraft(data.draft, { keyOptional: existingKey.length >= 8 });
    const key = parsed.key || existingKey;
    if (key.length < 8) throw new Error("Enter the API key from your provider account.");
    return runLookup(parsed, key, data.query);
  });

export const searchPeople = createServerFn({ method: "POST" })
  .validator((data: unknown) => parseQuery(data))
  .handler(async ({ data }) => {
    const { useSession } = await import("@tanstack/react-start/server");
    const session = await useSession<Vault>(await sessionConfig());
    if (!session.data.key || !session.data.endpoint) {
      throw new Error("Seal an API key before running a lookup.");
    }
    const parsed = parseDraft(
      {
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
        fields: session.data.fields,
      },
      { keyOptional: false },
    );
    return runLookup(parsed, session.data.key, data);
  });
