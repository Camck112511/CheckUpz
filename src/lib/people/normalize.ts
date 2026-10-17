import { getPath, type FieldMap, type PersonRecord } from "@/lib/people/model";

const NAME_FALLBACKS = ["full_name", "display_name", "name"];
const TITLE_FALLBACKS = ["job_title", "title", "position", "headline"];
const COMPANY_FALLBACKS = ["job_company_name", "company", "company_name", "organization.name", "organization_name"];
const LOCATION_FALLBACKS = ["location_name", "location", "formatted_address", "city"];
const EMAIL_FALLBACKS = ["emails", "email", "work_email", "personal_emails"];
const PHONE_FALLBACKS = ["phone_numbers", "phones", "phone", "mobile_phone", "phone_number"];
const PROFILE_FALLBACKS = ["linkedin_url", "linkedin", "profile_url", "profile"];
const ID_FALLBACKS = ["id", "person_id"];

export function normalizePayload(payload: unknown, resultPath: string, fields: FieldMap): PersonRecord[] {
  const records = extractRecords(payload, resultPath).slice(0, 25);
  const note = likelihoodNote(payload);
  return records
    .map((record, index) => {
      const person: PersonRecord = {
        name: pickString(record, fields.name, NAME_FALLBACKS) || joinName(record),
        title: pickString(record, fields.title, TITLE_FALLBACKS),
        company: pickString(record, fields.company, COMPANY_FALLBACKS),
        location: pickString(record, fields.location, LOCATION_FALLBACKS),
        emails: pickMany(record, fields.emails, EMAIL_FALLBACKS),
        phones: pickMany(record, fields.phones, PHONE_FALLBACKS),
        linkedin: pickString(record, fields.linkedin, PROFILE_FALLBACKS),
        id: pickString(record, fields.id, ID_FALLBACKS),
        note: index === 0 ? note : "",
      };
      return person;
    })
    .filter((person) =>
      Boolean(person.name || person.title || person.company || person.emails.length || person.phones.length || person.linkedin),
    );
}

function joinName(record: unknown): string {
  const first = firstString(getPath(record, "first_name"));
  const last = firstString(getPath(record, "last_name"));
  return [first, last].filter(Boolean).join(" ");
}

function extractRecords(payload: unknown, resultPath: string): unknown[] {
  if (resultPath) {
    const node = getPath(payload, resultPath);
    if (Array.isArray(node)) return node;
    if (node && typeof node === "object") return [node];
    return [];
  }
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["data", "results", "people", "persons", "matches", "records", "items", "profiles"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object" && (key === "data" || key === "person")) return [value];
  }
  return [payload];
}

function likelihoodNote(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const likelihood = (payload as Record<string, unknown>).likelihood;
  if (typeof likelihood === "number" && Number.isFinite(likelihood)) return `Likelihood ${likelihood}`;
  return "";
}

function pickString(record: unknown, path: string, fallbacks: string[]): string {
  if (path) return clip(firstString(getPath(record, path)));
  for (const fallback of fallbacks) {
    const value = firstString(getPath(record, fallback));
    if (value) return clip(value);
  }
  return "";
}

function pickMany(record: unknown, path: string, fallbacks: string[]): string[] {
  if (path) return unique(toStrings(getPath(record, path))).slice(0, 5);
  for (const fallback of fallbacks) {
    const values = unique(toStrings(getPath(record, fallback)));
    if (values.length) return values.slice(0, 5);
  }
  return [];
}

function firstString(value: unknown): string {
  return toStrings(value)[0] ?? "";
}

function toStrings(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text ? [text] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => toStrings(item));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["address", "email", "number", "phone", "value", "url", "name"]) {
      if (record[key] != null) return toStrings(record[key]);
    }
  }
  return [];
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clip(value));
  }
  return out;
}

function clip(value: string): string {
  return value.length > 180 ? `${value.slice(0, 177)}…` : value;
}
