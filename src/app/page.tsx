import Image from "next/image";
import Link from "next/link";
import { getEvent } from "@/lib/data";
import { formatCOP } from "@/lib/format";
import { Badge, Eyebrow } from "@/components/ui";
import { BrandLockup, SiteFooter } from "@/components/brand";

export const dynamic = "force-dynamic";

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
        <header className="flex items-center justify-between">
          <BrandLockup href="/" subtitle="Cena del evento" />
          <Link
            href="/admin"
            className="hidden text-[11px] uppercase tracking-[0.28em] text-pearl transition-colors hover:text-ivory sm:block"
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
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pearl">
              Una noche bajo las estrellas. Cada comensal arma su experiencia
              —entrada compartida, plato fuerte y bebida— dentro de su límite de
              gasto.
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

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            <Link href="/comensal" className="group">
              <div className="h-full rounded-2xl border border-gold-500/25 bg-night-900/55 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold-500/60 hover:bg-night-900/80 hover:shadow-[0_36px_90px_-46px_rgba(232,163,61,0.7)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/40 text-gold-500">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden
                  >
                    <path
                      d="M7 3v8a2.5 2.5 0 0 0 5 0V3M9.5 3v18M17 3c-1.4 1.6-1.4 5.4 0 7v11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h2 className="mt-4 font-display text-2xl text-ivory">
                  Soy comensal
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-pearl">
                  Elige tu entrada, compártela con alguien y selecciona tu plato
                  fuerte y bebida.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm text-gold-400 transition-transform duration-500 group-hover:translate-x-1">
                  Armar mi pedido →
                </span>
              </div>
            </Link>

            <Link href="/admin" className="group">
              <div className="h-full rounded-2xl border border-ivory/12 bg-night-900/40 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-ivory/30 hover:bg-night-900/70 hover:shadow-[0_36px_90px_-46px_rgba(46,74,125,0.9)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/25 text-pearl">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden
                  >
                    <path
                      d="M4 6h16M4 12h16M4 18h16"
                      strokeLinecap="round"
                    />
                    <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <h2 className="mt-4 font-display text-2xl text-ivory">
                  Administrador
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-pearl">
                  Configura límites, asistentes y menú; consulta el reporte para la
                  cocina.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm text-pearl transition-transform duration-500 group-hover:translate-x-1">
                  Abrir el panel →
                </span>
              </div>
            </Link>
          </div>
        </div>

        <SiteFooter className="mt-8" />
      </div>
    </main>
  );
}
