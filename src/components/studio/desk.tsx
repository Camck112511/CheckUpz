import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LookupFields } from "@/components/studio/wizard";
import { searchPeople } from "@/lib/people/functions";
import { emptyQuery, safeHttpUrl, type LookupQuery, type PersonRecord, type PublicConnection } from "@/lib/people/model";

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The lookup did not finish. Try again.";
}

export function Desk({ connection }: { connection: Extract<PublicConnection, { connected: true }> }) {
  const router = useRouter();
  const [query, setQuery] = useState<LookupQuery>(emptyQuery);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<PersonRecord[] | null>(null);
  const [remaining, setRemaining] = useState(connection.searchesRemaining);

  async function onSearch() {
    setBusy(true);
    setError("");
    try {
      const response = await searchPeople({ data: query });
      setResults(response.results);
      setMessage(response.message);
      setRemaining(response.searchesRemaining);
      await router.invalidate();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
      <form
        className="rounded-xl border border-line bg-surface p-4 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void onSearch();
        }}
      >
        <h2 className="font-display text-3xl leading-tight font-medium tracking-tight">Lookup</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          One person at a time, through {connection.label}. The key {connection.keyHint} stays on the server.
        </p>
        <div className="mt-5">
          <LookupFields query={query} onChange={setQuery} />
        </div>
        {error ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || remaining <= 0}>
            {busy ? "Looking up…" : "Run lookup"}
          </Button>
          <p className="text-sm text-muted">{remaining} lookups left this hour</p>
        </div>
      </form>

      <section className="min-w-0" aria-live="polite">
        {results === null ? (
          <SampleDossier />
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-6">
            <h2 className="font-display text-2xl font-medium tracking-tight">No mapped record</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{message || "The provider returned nothing this desk could map."}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {message ? <p className="text-sm text-muted">{message}</p> : null}
            {results.map((person, index) => (
              <RecordCard key={`${person.id}-${index}`} person={person} host={connection.host} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function SampleDossier() {
  return (
    <article className="rounded-xl border border-line bg-surface p-6">
      <p className="text-xs font-medium tracking-wide text-muted">Sample record</p>
      <h2 className="mt-3 font-display text-3xl leading-tight font-medium tracking-tight">Avery Quinn</h2>
      <p className="mt-2 text-sm text-muted">Records clerk · Northwind Archive</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="text-muted">Location</dt>
          <dd className="text-fg">Sample City</dd>
        </div>
        <div>
          <dt className="text-muted">Email</dt>
          <dd className="text-fg">avery.quinn@example.com</dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-relaxed text-muted">
        Not a live person. A real lookup replaces this card with fields your provider returns.
      </p>
    </article>
  );
}

function RecordCard({ person, host }: { person: PersonRecord; host: string }) {
  const profile = safeHttpUrl(person.linkedin);
  return (
    <article className="rounded-xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-2xl leading-tight font-medium tracking-tight">{person.name || "Unnamed record"}</h3>
        {person.note ? <p className="text-xs text-muted">{person.note}</p> : null}
      </div>
      <p className="mt-2 text-sm text-muted">{[person.title, person.company].filter(Boolean).join(" · ") || "No title returned"}</p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <Fact label="Location" value={person.location || "—"} />
        <Fact label="Record id" value={person.id || "—"} />
        <Fact label="Emails" value={person.emails.length ? person.emails.join(", ") : "—"} />
        <Fact label="Phones" value={person.phones.length ? person.phones.join(", ") : "—"} />
      </dl>
      {profile ? (
        <a className="mt-4 inline-flex h-11 items-center text-sm text-fg underline decoration-line underline-offset-4" href={profile} target="_blank" rel="noreferrer">
          Open profile link
        </a>
      ) : null}
      <p className="mt-4 text-xs text-faint">Returned by {host}</p>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words text-fg">{value}</dd>
    </div>
  );
}
