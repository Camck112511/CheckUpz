import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Desk, SampleDossier } from "@/components/studio/desk";
import { Wizard } from "@/components/studio/wizard";
import { disconnect } from "@/lib/people/functions";
import type { PublicConnection } from "@/lib/people/model";

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Could not update the sealed key.";
}

export function Studio({ connection }: { connection: PublicConnection }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wipeError, setWipeError] = useState("");
  const [wiping, setWiping] = useState(false);
  const showDesk = connection.connected && !editing;

  async function wipe() {
    setWiping(true);
    setWipeError("");
    try {
      await disconnect();
      setConfirmWipe(false);
      setEditing(false);
      await router.invalidate();
    } catch (error) {
      setWipeError(errorText(error));
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-sm border border-line bg-surface font-display text-sm text-fg">
            PS
          </span>
          <div>
            <p className="text-sm text-muted">Lawful lookup</p>
            <h1 className="font-display text-2xl leading-tight font-medium tracking-tight sm:text-3xl">PeopleSearch Studio</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-muted">
            {connection.connected ? `Sealed · ${connection.label} · ${connection.host}` : "Provider site not set"}
          </p>
          {connection.connected ? (
            <button
              type="button"
              className="h-11 rounded-sm border border-line-strong bg-surface px-4 text-sm font-medium text-fg"
              onClick={() => {
                setConfirmWipe(false);
                setEditing((value) => !value);
              }}
            >
              {editing ? "Close setup" : "Integration"}
            </button>
          ) : null}
          {connection.connected ? (
            <button
              type="button"
              className="h-11 rounded-sm px-3 text-sm text-muted"
              onClick={() => {
                setWipeError("");
                setConfirmWipe((value) => !value);
              }}
            >
              Disconnect
            </button>
          ) : null}
        </div>
      </header>

      {confirmWipe ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface p-4">
          <p className="text-sm text-fg">Wipe the sealed key from this browser?</p>
          <button
            type="button"
            className="h-11 rounded-sm bg-fg px-4 text-sm font-medium text-bg disabled:opacity-40"
            disabled={wiping}
            onClick={() => void wipe()}
          >
            {wiping ? "Wiping…" : "Wipe key"}
          </button>
          <button type="button" className="h-11 px-3 text-sm text-muted" onClick={() => setConfirmWipe(false)}>
            Cancel
          </button>
          {wipeError ? <p className="text-sm text-danger">{wipeError}</p> : null}
        </div>
      ) : null}

      <div className="mt-8">
        {showDesk && connection.connected ? (
          <Desk connection={connection} />
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <Wizard
              key={connection.connected ? connection.host : "new"}
              connection={connection}
              onSealed={() => setEditing(false)}
              onCancel={connection.connected ? () => setEditing(false) : undefined}
            />
            <div className="hidden xl:block">
              <SampleDossier />
            </div>
          </div>
        )}
      </div>

      <footer className="mt-10 max-w-3xl text-sm leading-relaxed text-muted">
        PeopleSearch Studio calls only the API you authorize with your own key. It is not a consumer reporting agency
        and it does not search the open web. Do not use it for credit, employment, housing, insurance, or any purpose
        that needs a permissible purpose under the FCRA unless your provider contract says you may. A sealed key stays
        in an encrypted cookie on this browser for 12 hours. Disconnect wipes it.
      </footer>
    </div>
  );
}
