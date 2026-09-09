import { Beer, GlassWater, Truck, PartyPopper, Store, Headphones } from "lucide-react";
import { BRANDS, SERVICES, NEW_BRANDS, formatFcfa } from "@/lib/diego";
import { BeerKegGlyph } from "./BeerArt";

const ICONS = [Beer, GlassWater, Truck, PartyPopper, Store, Headphones];

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Nos services</p>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl">
          Tout pour rendre vos événements inoubliables
        </h2>
        <p className="mt-3 text-muted-foreground">
          Bière pression en fût, matériel de tirage, transport, livraison et service pendant toute
          votre prestation.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => {
          const Icon = ICONS[i % ICONS.length] ?? Beer;
          return (
            <article key={service.title} className="card-elevated p-6">
              <div className="brand-surface inline-flex size-11 items-center justify-center rounded-xl text-brand-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-black">Marques disponibles</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tarifs par fût de 50L, gobelets inclus.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRANDS.map((b) => (
            <div key={b.id} className="card-elevated flex items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <BeerKegGlyph className="size-9 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">
                    {b.name} <span className="text-muted-foreground">({b.volume})</span>
                  </p>
                  {NEW_BRANDS.includes(b.id) && (
                    <span className="mt-1 inline-block rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-foreground">
                      Nouveau
                    </span>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-right text-base font-black text-brand">
                {formatFcfa(b.price)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
