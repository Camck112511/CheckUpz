import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "@/components/studio/studio";
import { getConnection } from "@/lib/people/functions";

export const Route = createFileRoute("/")({
  loader: () => getConnection(),
  component: Home,
});

function Home() {
  const connection = Route.useLoaderData();
  return (
    <main>
      <Studio connection={connection} />
    </main>
  );
}
