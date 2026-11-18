import Image from "next/image";
import Link from "next/link";
import { getEvent } from "@/lib/data";
import { formatCOP } from "@/lib/format";
import { Badge, Eyebrow } from "@/components/ui";
import { BrandLockup, SiteFooter } from "@/components/brand";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Llega y entra",
    body: "Al entrar al evento, toca Entrada compartida.",
  },
  {
    title: "Escoge una entrada para dos",
    body: "Selecciona una entrada del menú y compártela con la persona que esté contigo. Cuando ambos la confirman, el sistema la divide automáticamente.",
  },
  {
    title: "Arma tu plato y bebida",
    body: "Después, elige tu plato fuerte y tu bebida directamente del menú de Bombay Rooftop.",
  },
  {
    title: "Todo cuadra en tu menú",
    body: "El sistema suma la mitad de la entrada con tu plato y tu bebida. Si el total supera lo asignado a tu consumo, te avisa antes de confirmar.",
  },
];

export default async function Home() {
  const event = await getEvent();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fondo: terraza nocturna con degradado índigo → negro */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/brand/hero.jpg"
          alt="Terraza de Bombay Rooftop de noche"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night-950/75 via-night-950/88 to-night-950" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_10%,rgba(11,15,26,0.92))]" />
        <div className="lights-bokeh absolute inset-0 opacity-50" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <BrandLockup href="/" subtitle="Cena del evento" />
          <Link
            href="/admin"
            className="text-[11px] uppercase tracking-[0.28em] text-pearl/70 transition-colors hover:text-ivory"
          >
            Administración
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center py-14">
          <div className="max-w-3xl">
            <Eyebrow>Bogotá · Terraza nocturna</Eyebrow>
            <h1 className="mt-4 font-display text-5xl leading-[1.04] tracking-tight text-ivory sm:text-6xl lg:text-7xl">
              {event?.name ?? "La cena del evento"}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pearl">
              {event?.description ||
                "Una noche bajo las estrellas. Cada comensal arma su experiencia —entrada compartida, plato fuerte y bebida— dentro de su límite de gasto."}
            </p>

            {event ? (
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Badge tone={event.status === "OPEN" ? "green" : "red"}>
                  {event.status === "OPEN" ? "Evento abierto" : "Evento cerrado"}
                </Badge>
                <Badge tone="gold">
                  Límite por persona: {formatCOP(event.defaultLimit)}
                </Badge>
              </div>
            ) : (
              <p className="mt-7 text-sm text-bombay-400">
                No hay evento configurado. Ejecuta el seed o revisa el panel de
                administración.
              </p>
            )}
          </div>

          {/* Contenedor de la dinámica: explica cómo se arma la noche y da paso al evento */}
          <section className="mt-12 rounded-3xl border border-gold-500/25 bg-night-900/55 p-8 backdrop-blur-sm transition-colors duration-500 hover:border-gold-500/40 sm:p-10 lg:max-w-5xl">
            <div>
              <Eyebrow>Cómo funciona la noche</Eyebrow>
              <h2 className="mt-3 font-display text-3xl text-ivory">
                Pasos
              </h2>
            </div>

            <ol className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="group relative flex h-full flex-col rounded-2xl border border-gold-500/25 bg-[linear-gradient(0deg,rgba(232,163,61,0.16),rgba(16,26,43,0.5)_46%,rgba(11,15,26,0.82))] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-[0_34px_80px_-52px_rgba(232,163,61,0.9)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-500/45 font-display text-lg text-gold-400 transition-colors duration-500 group-hover:border-gold-500/85 group-hover:text-gold-300">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg leading-snug text-ivory">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-pearl">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col items-center gap-5 border-t border-ivory/10 pt-8 text-center">
              <Link
                href="/comensal"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-9 py-4 font-display text-base tracking-wide text-night-950 shadow-[0_20px_50px_-18px_rgba(232,163,61,0.75)] transition-all duration-500 hover:from-gold-300 hover:to-gold-400 hover:shadow-[0_28px_64px_-16px_rgba(232,163,61,0.95)]"
              >
                Entrar al evento
                <span className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <p className="max-w-xl text-sm leading-relaxed text-pearl">
                Al ingresar eliges quién eres y armas tu pedido. Podrás editarlo
                hasta que el evento se cierre.
              </p>
            </div>
          </section>
        </div>

        <SiteFooter className="mt-8" />
      </div>
    </main>
  );
}
