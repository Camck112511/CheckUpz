import { useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { saveConnection, testConnection } from "@/lib/people/functions";
import { endpointIssue } from "@/lib/people/guard";
import {
  FIELD_LABELS,
  PRESETS,
  draftFromPreset,
  emptyQuery,
  suggestMapping,
  type ConnectionDraft,
  type HttpMethod,
  type LookupQuery,
  type PersonRecord,
  type PublicConnection,
  type SourceId,
  type Transport,
} from "@/lib/people/model";

const STEPS = [
  { title: "Purpose", kicker: "What this desk is for" },
  { title: "Provider", kicker: "Account you already have" },
  { title: "Key", kicker: "Paste it from your account" },
  { title: "Request", kicker: "Authorized endpoint" },
  { title: "Response", kicker: "Fields to keep" },
  { title: "Test", kicker: "Prove the key" },
] as const;

const SOURCE_LABELS: Record<SourceId, string> = {
  name: "Full name",
  first: "First name",
  last: "Last name",
  email: "Email",
  phone: "Phone",
  location: "Location",
  company: "Company",
  domain: "Company domain",
  profile: "Profile URL",
  literal: "Fixed value",
};

const SEND_AS = [
  { id: "header", label: "Header named X-Api-Key" },
  { id: "bearer", label: "Authorization: Bearer" },
  { id: "query", label: "Query parameter named api_key" },
  { id: "json", label: "JSON field named api_key" },
  { id: "other", label: "A different name" },
] as const;

type SendAsId = (typeof SEND_AS)[number]["id"];

const KNOWN_KEY: Record<string, string> = {
  pdl: "People Data Labs reads this as the X-Api-Key header. Paste the key from your PDL dashboard. You don't set a header name here.",
  apollo: "Apollo reads this as the x-api-key header. Paste the key from your Apollo account. You don't set a header name here.",
  hunter: "Hunter reads this as the api_key parameter. Paste the key from your Hunter account. You don't set a parameter name here.",
};

function sendAsId(draft: ConnectionDraft): SendAsId {
  if (draft.authStyle === "bearer") return "bearer";
  if (draft.authStyle === "header" && draft.authName === "X-Api-Key") return "header";
  if (draft.authStyle === "query" && draft.authName === "api_key") return "query";
  if (draft.authStyle === "json" && draft.authName === "api_key") return "json";
  return "other";
}

type Probe = {
  httpStatus: number;
  authRejected: boolean;
  message: string;
  results: PersonRecord[];
  paths: string[];
  suggested: { resultPath: string; fields: ConnectionDraft["fields"] };
};

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Try again.";
}

export function Wizard({
  connection,
  onSealed,
  onCancel,
}: {
  connection: PublicConnection;
  onSealed: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const sealed = connection.connected;
  const [step, setStep] = useState(sealed ? 3 : 0);
  const [draft, setDraft] = useState<ConnectionDraft>(() =>
    sealed ? { ...connectionToDraft(connection), acknowledged: true } : draftFromPreset(PRESETS[0]),
  );
  const [query, setQuery] = useState<LookupQuery>(emptyQuery);
  const [sample, setSample] = useState("");
  const [sampleNote, setSampleNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"test" | "save" | null>(null);
  const [probe, setProbe] = useState<Probe | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const [sendAs, setSendAs] = useState<SendAsId | null>(null);

  function patch(partial: Partial<ConnectionDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setProbe(null);
  }

  function choosePreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id) ?? PRESETS[0];
    setDraft((current) => draftFromPreset(preset, current));
    setSendAs(null);
    setProbe(null);
    setError("");
  }

  function applySendAs(id: SendAsId) {
    setSendAs(id);
    setDraft((current) => {
      if (id === "header") return { ...current, authStyle: "header", authName: "X-Api-Key" };
      if (id === "bearer") return { ...current, authStyle: "bearer", authName: "Authorization" };
      if (id === "query") return { ...current, authStyle: "query", authName: "api_key" };
      if (id === "json") {
        return { ...current, authStyle: "json", authName: "api_key", method: "POST", transport: "json" };
      }
      const alreadyCustom = sendAsId(current) === "other";
      return {
        ...current,
        authStyle: current.authStyle === "bearer" || current.authStyle === "json" ? "header" : current.authStyle,
        authName: alreadyCustom ? current.authName : "",
      };
    });
    setProbe(null);
  }

  function setOtherWhere(style: "header" | "query" | "json") {
    setDraft((current) => {
      const next: ConnectionDraft = { ...current, authStyle: style };
      if (style === "json") {
        next.method = "POST";
        next.transport = "json";
      }
      return next;
    });
    setProbe(null);
  }

  function setMethod(method: HttpMethod) {
    setDraft((current) => {
      const next: ConnectionDraft = { ...current, method };
      if (method === "GET") {
        next.transport = "query";
        if (current.authStyle === "json") {
          next.authStyle = "header";
          next.authName = "X-Api-Key";
        }
      }
      return next;
    });
    setProbe(null);
  }

  function tryNext() {
    const issue = issueForStep(step, draft, sealed);
    if (issue) {
      setError(issue);
      return;
    }
    setError("");
    setStep((current) => Math.min(5, current + 1));
  }

  async function runTest() {
    const issue = issueForStep(5, draft, sealed);
    if (issue) {
      setError(issue);
      return;
    }
    setBusy("test");
    setError("");
    try {
      const result = await testConnection({ data: { draft, query } });
      setProbe(result);
    } catch (err) {
      setProbe(null);
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function seal() {
    if (probe?.authRejected) return;
    const issue = issueForStep(5, draft, sealed);
    if (issue) {
      setError(issue);
      return;
    }
    setBusy("save");
    setError("");
    try {
      await saveConnection({ data: draft });
      await router.invalidate();
      onSealed();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  function applySample() {
    try {
      const parsed = JSON.parse(sample) as unknown;
      const suggested = suggestMapping(parsed);
      setDraft((current) => ({
        ...current,
        resultPath: suggested.resultPath || current.resultPath,
        fields: { ...current.fields, ...compactFields(suggested.fields) },
      }));
      setSampleNote(suggested.resultPath ? `Result path set to “${suggested.resultPath}”.` : "Filled paths from the top-level object.");
      setError("");
    } catch {
      setSampleNote("");
      setError("That sample is not valid JSON. Paste a redacted response from your docs.");
    }
  }

  const stepMeta = STEPS[step];

  return (
    <form
      className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 5) tryNext();
        else void runTest();
      }}
    >
      <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {STEPS.map((item, index) => {
          const active = index === step;
          return (
            <li key={item.title} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (index <= step) {
                    setError("");
                    setStep(index);
                  }
                }}
                className={`flex h-11 min-w-28 items-center gap-3 rounded-md px-3 text-left lg:w-full ${
                  active ? "bg-raised text-fg" : "text-muted"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span className="font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium">{item.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-6">
        <p className="text-sm text-muted">{stepMeta.kicker}</p>
        <h2 className="mt-1 font-display text-3xl leading-tight font-medium tracking-tight">{stepMeta.title}</h2>
        <div className="mt-6">{renderStep()}</div>
        {error ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
          ) : null}
          {step < 5 ? (
            <Button type="submit">
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <>
              <Button type="submit" disabled={busy !== null}>
                {busy === "test" ? "Testing…" : "Test with my key"}
              </Button>
              <Button variant="secondary" disabled={busy !== null || probe?.authRejected === true} onClick={() => void seal()}>
                {busy === "save" ? "Saving…" : "Save key and open desk"}
              </Button>
            </>
          )}
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              Back to desk
            </Button>
          ) : null}
        </div>
      </section>
    </form>
  );

  function renderStep() {
    if (step === 0) {
      return (
        <div className="grid gap-4">
          <p className="max-w-xl text-base leading-relaxed text-muted">
            You already have a provider account and an API key. This desk does not sell data and does not search the open
            web. It calls only the HTTPS API you authorize, for other lawful people-search use.
          </p>
          <label className="flex items-start gap-3 rounded-md border border-line bg-bg p-4">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={draft.acknowledged}
              onChange={(event) => patch({ acknowledged: event.target.checked })}
            />
            <span className="text-sm leading-relaxed text-fg">
              I will use this only for lawful lookups. I will not use it for credit, employment, housing, insurance, or
              any other purpose that needs a permissible purpose under the FCRA unless my provider contract allows it.
            </span>
          </label>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="grid gap-4">
          <p className="max-w-xl text-base leading-relaxed text-muted">
            The provider site can stay unknown. Pick a documented account if it matches the key you already have, or
            stay on the custom request and paste the endpoint from your docs.
          </p>
          <div className="grid gap-3">
            {PRESETS.map((preset) => {
              const selected = draft.providerId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => choosePreset(preset.id)}
                  className={`rounded-md border p-4 text-left ${selected ? "border-line-strong bg-raised" : "border-line bg-bg"}`}
                  aria-pressed={selected}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-medium text-fg">{preset.label}</span>
                    {selected ? <span className="text-xs text-muted">Selected</span> : null}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted">{preset.summary}</span>
                </button>
              );
            })}
          </div>
          <Field label="Docs or dashboard link" hint="Optional. Stored so you can reopen it. This app never fetches that page.">
            <Input
              value={draft.docsUrl}
              placeholder="https://"
              inputMode="url"
              onChange={(event) => patch({ docsUrl: event.target.value, providerId: draft.providerId })}
            />
          </Field>
        </div>
      );
    }

    if (step === 2) {
      const known = KNOWN_KEY[draft.providerId];
      const mode = sendAs ?? sendAsId(draft);
      const savedHint = connection.connected ? connection.keyHint : "";
      return (
        <div className="grid gap-5">
          <p className="max-w-xl text-base leading-relaxed text-muted">
            {known ??
              "Paste the key from the account that issued it. Leave the menu on “Header named X-Api-Key” unless the docs name something else."}
          </p>
          <Field
            label="API key"
            hint={
              sealed
                ? `A key is already saved (${savedHint}). Leave this blank to keep it, or paste a new one to replace it.`
                : "This box is only for the secret. Don't type a header name here."
            }
          >
            <div className="flex gap-2">
              <Input
                className="min-w-0 flex-1"
                type={revealKey ? "text" : "password"}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={draft.key}
                placeholder={sealed ? "Leave blank to keep the saved key" : "Paste your key"}
                onChange={(event) => patch({ key: event.target.value })}
              />
              <Button variant="secondary" className="shrink-0" aria-pressed={revealKey} onClick={() => setRevealKey((value) => !value)}>
                {revealKey ? "Hide" : "Show"}
              </Button>
            </div>
          </Field>
          {known ? null : (
            <Field label="How should the key be sent?" hint="Listed providers skip this. Custom APIs default to an X-Api-Key header.">
              <Select value={mode} onChange={(event) => applySendAs(event.target.value as SendAsId)}>
                {SEND_AS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {!known && mode === "other" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Where" hint="The place named in the docs, not the key.">
                <Select
                  value={draft.authStyle === "query" || draft.authStyle === "json" ? draft.authStyle : "header"}
                  onChange={(event) => setOtherWhere(event.target.value as "header" | "query" | "json")}
                >
                  <option value="header">A request header</option>
                  <option value="query">A query parameter</option>
                  <option value="json">A JSON field</option>
                </Select>
              </Field>
              <Field label="Name from the docs" hint="Example: X-Api-Key. Do not paste the key here.">
                <Input
                  value={draft.authName}
                  placeholder="X-Api-Key"
                  autoComplete="off"
                  onChange={(event) => patch({ authName: event.target.value })}
                />
              </Field>
            </div>
          ) : null}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="grid gap-5">
          <p className="max-w-xl text-base leading-relaxed text-muted">
            Use the API reference that belongs to your key, not a marketing homepage. The studio will refuse local,
            private, and non-HTTPS addresses.
          </p>
          <Field label="HTTPS endpoint" hint="No query string. Example: https://api.example.com/v1/people">
            <Input
              value={draft.endpoint}
              inputMode="url"
              placeholder="https://"
              onChange={(event) => patch({ endpoint: event.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Method">
              <Select value={draft.method} onChange={(event) => setMethod(event.target.value as HttpMethod)}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </Select>
            </Field>
            <Field label="Parameters travel in">
              <Select
                value={draft.transport}
                disabled={draft.method === "GET" || draft.authStyle === "json"}
                onChange={(event) => patch({ transport: event.target.value as Transport })}
              >
                <option value="query">Query string</option>
                <option value="json">JSON body</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-fg">Field mapping</h3>
              <Button
                variant="ghost"
                onClick={() =>
                  patch({
                    params: [...draft.params, { name: "", source: "name", as: "string", literal: "" }],
                  })
                }
              >
                Add parameter
              </Button>
            </div>
            {draft.params.map((param, index) => (
              <div key={`${param.name}-${index}`} className="grid gap-2 rounded-md border border-line bg-bg p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Input
                  aria-label="Parameter name"
                  placeholder="parameter"
                  value={param.name}
                  onChange={(event) => updateParam(index, { name: event.target.value })}
                />
                <Select
                  aria-label="Value source"
                  value={param.source}
                  onChange={(event) => updateParam(index, { source: event.target.value as SourceId })}
                >
                  {Object.entries(SOURCE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
                {param.source === "literal" ? (
                  <Input
                    aria-label="Fixed value"
                    placeholder="Fixed value"
                    value={param.literal}
                    onChange={(event) => updateParam(index, { literal: event.target.value })}
                  />
                ) : (
                  <Select
                    aria-label="Value shape"
                    value={param.as}
                    onChange={(event) => updateParam(index, { as: event.target.value as "string" | "array" })}
                  >
                    <option value="string">String</option>
                    <option value="array">Single-item array</option>
                  </Select>
                )}
                <Button
                  variant="ghost"
                  className="sm:col-span-3 sm:justify-self-start"
                  onClick={() => patch({ params: draft.params.filter((_, item) => item !== index) })}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="grid gap-5">
          <p className="max-w-xl text-base leading-relaxed text-muted">
            Tell the desk which JSON paths are a person. Leave a path blank and common names such as full_name or email
            are used. Paste a redacted sample if you want paths suggested. Do not paste a real person’s record.
          </p>
          <Field label="Result path" hint="Where the person or list lives. Examples: data, people, results. Blank uses common keys.">
            <Input
              value={draft.resultPath}
              placeholder="data"
              onChange={(event) => patch({ resultPath: event.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELD_LABELS.map((field) => (
              <Field key={field.key} label={field.label} hint={`Example: ${field.hint}`}>
                <Input
                  value={draft.fields[field.key]}
                  placeholder={field.hint}
                  onChange={(event) =>
                    patch({ fields: { ...draft.fields, [field.key]: event.target.value } })
                  }
                />
              </Field>
            ))}
          </div>
          <Field label="Redacted sample JSON" hint="Optional. Used only in this browser to suggest paths. It is not saved.">
            <Textarea
              value={sample}
              placeholder='{"data":{"full_name":"Example Person","emails":["person@example.com"]}}'
              onChange={(event) => setSample(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={applySample} disabled={!sample.trim()}>
              Suggest paths
            </Button>
            {sampleNote ? <p className="text-sm text-muted">{sampleNote}</p> : null}
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-5">
        <p className="max-w-xl text-base leading-relaxed text-muted">
          Run one lookup through your account. A 404 with a valid key still counts as connected. An auth rejection
          blocks sealing until the key or auth style changes.
        </p>
        <LookupFields query={query} onChange={setQuery} />
        {probe ? (
          <div className="rounded-md border border-line bg-bg p-4" aria-live="polite">
            <p className="text-sm text-fg">
              HTTP {probe.httpStatus}. {probe.message}
            </p>
            {probe.results.length > 0 ? (
              <ul className="mt-3 grid gap-2">
                {probe.results.slice(0, 3).map((person, index) => (
                  <li key={`${person.id}-${index}`} className="text-sm text-muted">
                    {person.name || "Unnamed record"}
                    {person.company ? ` · ${person.company}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            {probe.paths.length > 0 ? (
              <p className="mt-3 text-sm leading-relaxed break-all text-faint">{probe.paths.slice(0, 12).join(" · ")}</p>
            ) : null}
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() =>
                patch({
                  resultPath: probe.suggested.resultPath || draft.resultPath,
                  fields: { ...draft.fields, ...compactFields(probe.suggested.fields) },
                })
              }
            >
              Apply suggested paths
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  function updateParam(index: number, partial: Partial<ConnectionDraft["params"][number]>) {
    patch({
      params: draft.params.map((param, item) => (item === index ? { ...param, ...partial } : param)),
    });
  }
}

function connectionToDraft(connection: PublicConnection): ConnectionDraft {
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

function issueForStep(step: number, draft: ConnectionDraft, sealed: boolean): string {
  if (step === 0 && !draft.acknowledged) return "Confirm the lawful-use acknowledgement to continue.";
  if (step === 1 && draft.docsUrl.trim()) {
    const docs = endpointIssue(draft.docsUrl.trim());
    if (docs) return "The docs link must be a public HTTPS URL, or leave it blank.";
  }
  if (step >= 2 && !sealed && draft.key.trim().length < 8) {
    return "Paste the API key from your provider account.";
  }
  if (step >= 2 && draft.key.trim() && draft.key.trim().length < 8) {
    return "That key looks too short. Paste the full key.";
  }
  if (step >= 2 && draft.authStyle !== "bearer" && !/^[A-Za-z0-9-]{1,40}$/.test(draft.authName.trim())) {
    return "Enter the header, query, or JSON field name from your provider docs.";
  }
  if (step >= 3) {
    const endpoint = endpointIssue(draft.endpoint.trim());
    if (endpoint) return endpoint;
    if (!draft.params.some((param) => param.name.trim() && param.source !== "literal")) {
      return "Map at least one search field to a parameter name.";
    }
  }
  return "";
}

function compactFields(fields: ConnectionDraft["fields"]): Partial<ConnectionDraft["fields"]> {
  const next: Partial<ConnectionDraft["fields"]> = {};
  for (const key of Object.keys(fields) as (keyof ConnectionDraft["fields"])[]) {
    if (fields[key]) next[key] = fields[key];
  }
  return next;
}

export function LookupFields({ query, onChange }: { query: LookupQuery; onChange: (query: LookupQuery) => void }) {
  const fields: { key: keyof LookupQuery; label: string; placeholder: string }[] = [
    { key: "name", label: "Full name", placeholder: "First Last" },
    { key: "location", label: "Location", placeholder: "City, region" },
    { key: "email", label: "Email", placeholder: "name@company.com" },
    { key: "phone", label: "Phone", placeholder: "+1…" },
    { key: "company", label: "Company", placeholder: "Company name" },
    { key: "domain", label: "Company domain", placeholder: "company.com" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          <Input
            value={query[field.key]}
            placeholder={field.placeholder}
            autoComplete="off"
            onChange={(event) => onChange({ ...query, [field.key]: event.target.value })}
          />
        </Field>
      ))}
      <div className="sm:col-span-2">
        <Field label="Profile URL" hint="Sent only as a parameter to your provider. This app does not open it.">
          <Input
            value={query.profile}
            placeholder="https://www.linkedin.com/in/…"
            inputMode="url"
            autoComplete="off"
            onChange={(event) => onChange({ ...query, profile: event.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-sm leading-relaxed text-muted">{hint}</span> : null}
    </label>
  );
}
