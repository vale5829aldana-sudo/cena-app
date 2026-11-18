import Image from "next/image";
import Link from "next/link";
import { getEvent } from "@/lib/data";
import { formatCOP } from "@/lib/format";
import { Badge, Eyebrow } from "@/components/ui";
import { BrandLockup, SiteFooter } from "@/components/brand";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Entrada compartida",
    body: "Eliges una entrada y la compartes con otro comensal. Ambos confirman y el costo se divide entre dos.",
  },
  {
    title: "Plato fuerte y bebida",
    body: "Después armas tu plato fuerte y tu bebida directamente del menú de Bombay Rooftop.",
  },
  {
    title: "Dentro de tu límite",
    body: "La mitad de la entrada, más tu plato y tu bebida, deben caber en tu límite de gasto.",
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
          <section className="mt-12 rounded-3xl border border-gold-500/25 bg-night-900/55 p-8 backdrop-blur-sm transition-colors duration-500 hover:border-gold-500/40 sm:p-10 lg:max-w-4xl">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <Eyebrow>Cómo funciona la noche</Eyebrow>
                <h2 className="mt-3 font-display text-3xl text-ivory">
                  La dinámica
                </h2>
              </div>
              <Link
                href="/comensal"
                className="group inline-flex items-center gap-2 rounded-full border border-gold-500/45 bg-gold-500/10 px-6 py-3 text-sm text-gold-300 transition-all duration-500 hover:border-gold-500/80 hover:bg-gold-500/20 hover:text-ivory"
              >
                Entrar al evento
                <span className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <ol className="mt-9 grid gap-7 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="font-display text-2xl text-gold-500/80">
                    0{index + 1}
                  </span>
                  <h3 className="mt-2 font-display text-xl text-ivory">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-pearl">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-9 border-t border-ivory/10 pt-6 text-sm leading-relaxed text-pearl">
              Al ingresar eliges quién eres y armas tu pedido. Podrás editarlo
              hasta que el evento se cierre.
            </p>
          </section>
        </div>

        <SiteFooter className="mt-8" />
      </div>
    </main>
  );
}
