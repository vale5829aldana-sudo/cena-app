import Link from "next/link";
import { getEvent } from "@/lib/data";
import { formatCOP } from "@/lib/format";
import { Badge, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const event = await getEvent();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
          Cena App
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          {event?.name ?? "Cena del evento"}
        </h1>
        <p className="mt-3 max-w-xl text-zinc-500 dark:text-zinc-400">
          Distribuye de forma equitativa el costo de la cena. Cada comensal elige
          una entrada compartida, un plato fuerte y una bebida dentro de su límite.
        </p>
        {event ? (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Badge tone={event.status === "OPEN" ? "green" : "red"}>
              {event.status === "OPEN" ? "Evento abierto" : "Evento cerrado"}
            </Badge>
            <Badge tone="amber">Límite por persona: {formatCOP(event.defaultLimit)}</Badge>
          </div>
        ) : (
          <p className="mt-4 text-sm text-red-500">
            No hay evento configurado. Ejecuta el seed o revisa el panel de administración.
          </p>
        )}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link href="/comensal" className="group">
          <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
            <div className="text-3xl">🍽️</div>
            <h2 className="mt-3 text-xl font-semibold">Soy comensal</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Elige tu entrada, compártela con alguien, y selecciona tu plato fuerte
              y bebida.
            </p>
          </Card>
        </Link>
        <Link href="/admin" className="group">
          <Card className="h-full transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
            <div className="text-3xl">⚙️</div>
            <h2 className="mt-3 text-xl font-semibold">Administrador</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Configura límites, asistentes, menú y consulta el reporte para la
              cocina.
            </p>
          </Card>
        </Link>
      </div>
    </main>
  );
}
