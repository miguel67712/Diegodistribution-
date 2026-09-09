import { ArrowRight, MessageCircle, Truck, GlassWater } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ENTERPRISE, WHATSAPP_CONTACTS } from "@/lib/diego";
import cartPhoto from "@/assets/diego-cart-33export-street.jpg";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <img
        src={cartPhoto}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full object-cover brightness-[0.65]"
        loading="lazy"
      />
      <div className="hero-surface absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="fade-up relative max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
            {ENTERPRISE.name} — Yaoundé
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
            La Vraie Bière Pression des Boissons du Cameroun
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
            Remplissez votre demande de prestation directement sur le site : marques, quantités,
            lieu, date et heure. En un clic, tout est envoyé à notre équipe sur WhatsApp — plus
            besoin de capture d'écran.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="brand-surface gap-2 text-brand-foreground hover:opacity-90"
            >
              <a href="#commande">
                Remplir le formulaire
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
              Discuter sur WhatsApp
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {WHATSAPP_CONTACTS.map((c) => (
                <Button
                  key={c.number}
                  asChild
                  size="lg"
                  variant="outline"
                  className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <a href={`https://wa.me/${c.number}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    {c.label} — {c.display}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: GlassWater, k: "50 gobelets", v: "offerts par fût acheté" },
              { icon: Truck, k: "Transport gratuit", v: "dans la ville de Yaoundé" },
              { icon: MessageCircle, k: "Réponse rapide", v: ENTERPRISE.whatsappDisplay },
            ].map(({ icon: Icon, k, v }) => (
              <div
                key={k}
                className="flex items-start gap-3 rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-4"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-gold" />
                <div className="min-w-0">
                  <dt className="text-sm font-bold text-primary-foreground">{k}</dt>
                  <dd className="text-sm text-primary-foreground/70">{v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
