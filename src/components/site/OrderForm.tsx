import { useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Loader2,
  CheckCircle2,
  Minus,
  Plus,
  ImageDown,
  Printer,
} from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import {
  BRANDS,
  CAUTIONS,
  ENTERPRISE,
  HOTESSE_OPTIONS,
  OCCASIONS,
  SERVICE_FEE_OPTIONS,
  SIROP_OPTIONS,
  TRANSPORT,
  formatFcfa,
} from "@/lib/diego";
import { OrderReceipt, type ReceiptData, type ReceiptExtra } from "./OrderReceipt";

interface Errors {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  occasion?: string;
  occasionOther?: string;
  eventPlace?: string;
  eventDate?: string;
  startTime?: string;
  duration?: string;
  transport?: string;
  notes?: string;
  quantities?: string;
}

const inputClass =
  "w-full rounded-lg border border-input bg-card px-3 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25";

const toAmount = (raw: string) => {
  const n = Number(raw.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function Field({
  label,
  required,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  hint?: string;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function OrderForm() {
  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    occasion: "",
    occasionOther: "",
    eventPlace: "",
    eventDate: "",
    startTime: "",
    duration: "5h",
    transport: TRANSPORT[0] ?? "Par nos soins (DIEGO)",
    notes: "",
    caution: CAUTIONS[0]?.label ?? "",
    hotesse: HOTESSE_OPTIONS[0]?.label ?? "",
    sirop: SIROP_OPTIONS[0]?.label ?? "",
    serviceFee: SERVICE_FEE_OPTIONS[0]?.label ?? "",
    machinesFee: "",
    extraCupsFee: "",
    transportFee: "",
  });
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(BRANDS.map((b) => [b.id, 0])),
  );
  const [needsBossConfirmation, setNeedsBossConfirmation] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | "shared" | "downloaded">(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const makeClientCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    let sequence = 1;
    try {
      const key = "diego-receipt-counter";
      const stored = window.localStorage.getItem(key);
      sequence = stored ? Number.parseInt(stored, 10) + 1 : 1;
      window.localStorage.setItem(key, String(sequence));
    } catch {
      // localStorage unavailable (private browsing, etc.) — fall back to 1
    }
    return `BAP${year}${month}/${sequence}`;
  };

  const set = (key: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const { [key as keyof Errors]: _drop, ...rest } = e;
      return rest;
    });
  };

  const changeQty = (id: string, delta: number) => {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));
    setErrors((e) => {
      const { quantities: _drop, ...rest } = e;
      return rest;
    });
  };

  const selected = useMemo(() => BRANDS.filter((b) => (quantities[b.id] ?? 0) > 0), [quantities]);
  const totalKegs = selected.reduce((s, b) => s + (quantities[b.id] ?? 0), 0);
  const total = selected.reduce((s, b) => s + (quantities[b.id] ?? 0) * b.price, 0);

  const extras: ReceiptExtra[] = useMemo(() => {
    const list: ReceiptExtra[] = [];
    const pick = (options: { label: string; amount: number }[], label: string) =>
      options.find((o) => o.label === label);

    const caution = pick(CAUTIONS, values.caution);
    if (caution) list.push({ label: caution.label, amount: caution.amount });

    const hotesse = pick(HOTESSE_OPTIONS, values.hotesse);
    if (hotesse && hotesse.amount > 0) list.push({ label: "Hôtesse", amount: hotesse.amount });

    const sirop = pick(SIROP_OPTIONS, values.sirop);
    if (sirop && sirop.amount > 0) list.push({ label: "Sirop", amount: sirop.amount });

    const fee = pick(SERVICE_FEE_OPTIONS, values.serviceFee);
    if (fee && fee.amount > 0)
      list.push({ label: "Frais de service supplémentaire", amount: fee.amount });

    const machines = toAmount(values.machinesFee);
    if (machines > 0) list.push({ label: "Mise à disposition des machines", amount: machines });

    const cups = toAmount(values.extraCupsFee);
    if (cups > 0) list.push({ label: "Gobelets supplémentaires", amount: cups });

    const transportFee = toAmount(values.transportFee);
    list.push({
      label: "Transport, livraison et service",
      amount: transportFee > 0 ? transportFee : 0,
    });

    return list;
  }, [values]);

  const extrasTotal = extras.reduce((s, e) => s + e.amount, 0);
  const grandTotal = total + extrasTotal;
  const targetWhatsapp = needsBossConfirmation ? ENTERPRISE.bossWhatsapp : ENTERPRISE.whatsapp;
  const targetWhatsappDisplay = needsBossConfirmation
    ? ENTERPRISE.bossWhatsappDisplay
    : ENTERPRISE.whatsappDisplay;

  const validate = () => {
    const e: Errors = {};
    if (!values.fullName.trim()) e.fullName = "Veuillez indiquer votre nom complet.";
    if (!/^[\d\s+()-]{8,20}$/.test(values.phone.trim()))
      e.phone = "Numéro de téléphone invalide (ex. 6 40 73 73 73).";
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
      e.email = "Adresse e-mail invalide.";
    if (!values.address.trim()) e.address = "Veuillez indiquer votre adresse / ville.";
    if (!values.occasion) e.occasion = "Veuillez sélectionner la nature de prestation.";
    if (values.occasion === "Autre" && !values.occasionOther.trim())
      e.occasionOther = "Veuillez préciser la nature de prestation.";
    if (!values.eventPlace.trim()) e.eventPlace = "Veuillez indiquer le lieu de la prestation.";
    if (!values.eventDate) e.eventDate = "Veuillez choisir la date de la prestation.";
    if (!values.startTime) e.startTime = "Veuillez indiquer l'heure de début.";
    if (totalKegs === 0) e.quantities = "Sélectionnez au moins un fût.";
    setErrors(e);
    return e;
  };

  const buildMessage = () => {
    const objet = values.occasion === "Autre" ? values.occasionOther.trim() : values.occasion;
    const lines: string[] = [
      "📋 *NOUVELLE DEMANDE DE PRESTATION*",
      `_${ENTERPRISE.name}_`,
      "",
      "*👤 CLIENT*",
      `• Nom : ${values.fullName.trim()}`,
      `• Téléphone : ${values.phone.trim()}`,
    ];
    if (values.email.trim()) lines.push(`• E-mail : ${values.email.trim()}`);
    lines.push(`• Adresse : ${values.address.trim()}`);
    lines.push("", "*🍺 COMMANDE (fûts 50L)*");
    selected.forEach((b) => {
      const qty = quantities[b.id] ?? 0;
      lines.push(
        `• ${b.name} (${b.volume}) — ${qty} x ${formatFcfa(b.price)} = ${formatFcfa(qty * b.price)}`,
      );
    });
    lines.push(
      `• Total fûts : ${totalKegs}`,
      `• Gobelets offerts : ${totalKegs * 50}`,
      `• Sous-total boissons : ${formatFcfa(total)}`,
    );
    if (extras.length > 0) {
      lines.push("", "*➕ PRESTATIONS & CAUTION*");
      extras.forEach((x) => lines.push(`• ${x.label} : ${formatFcfa(x.amount)}`));
    }
    lines.push(`• *MONTANT TOTAL : ${formatFcfa(grandTotal)}*`);
    if (needsBossConfirmation) {
      lines.push("• ⚠️ *Accord du responsable requis avant validation (grosse commande).*");
    }
    lines.push(
      "",
      "*📅 PRESTATION*",
      `• Nature de prestation : ${objet}`,
      `• Lieu : ${values.eventPlace.trim()}`,
      `• Date : ${values.eventDate}`,
      `• Heure de début : ${values.startTime}`,
      `• Durée : ${values.duration}`,
      `• Moyen de transport : ${values.transport}`,
      "• Transport gratuit dans la ville de Yaoundé.",
    );
    if (values.notes.trim()) {
      lines.push("", "*📝 Informations complémentaires :*", values.notes.trim());
    }
    lines.push("", "Merci de traiter cette demande.");
    return lines.join("\n");
  };

  const buildReceipt = (): ReceiptData => ({
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    objet: values.occasion === "Autre" ? values.occasionOther.trim() : values.occasion,
    eventPlace: values.eventPlace.trim(),
    eventDate: values.eventDate,
    startTime: values.startTime,
    duration: values.duration,
    transport: values.transport,
    notes: values.notes.trim(),
    lines: selected.map((brand) => ({ brand, qty: quantities[brand.id] ?? 0 })),
    totalKegs,
    total,
    extras,
    extrasTotal,
    grandTotal,
    issuedAt: new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    reference: makeClientCode(),
  });

  const handlePrint = () => {
    if (!imageUrl) return;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(
      `<!doctype html><html><head><title>Facture proforma — ${ENTERPRISE.name}</title>` +
        `<style>` +
        `@page{size:A4;margin:8mm}` +
        `html,body{margin:0;height:100%}` +
        `body{display:flex;align-items:flex-start;justify-content:center}` +
        `img{max-width:100%;max-height:100vh;width:auto;height:auto;object-fit:contain;` +
        `page-break-inside:avoid;break-inside:avoid}` +
        `</style></head>` +
        `<body><img src="${imageUrl}" onload="window.focus();window.print();" /></body></html>`,
    );
    win.document.close();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      document
        .querySelector("[data-error='true']")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSending(true);
    setSent(null);
    setReceipt(buildReceipt());
    const waUrl = `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(buildMessage())}`;

    try {
      // let the hidden receipt render before capturing it
      await new Promise((r) => window.setTimeout(r, 160));
      const node = receiptRef.current;
      if (!node) throw new Error("receipt-unavailable");

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      setImageUrl(dataUrl);

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "facture-diego-distribution.png", {
        type: "image/png",
      });

      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        await navigator.share({
          files: [file],
          text: buildMessage(),
          title: "Demande de prestation — DIEGO Distribution",
        });
        setSent("shared");
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "facture-diego-distribution.png";
        link.click();
        window.open(waUrl, "_blank", "noopener,noreferrer");
        setSent("downloaded");
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      if (!aborted) {
        window.open(waUrl, "_blank", "noopener,noreferrer");
        setSent("downloaded");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="commande" className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Formulaire en ligne
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Votre demande de prestation</h2>
          <p className="mt-3 text-muted-foreground">
            Les champs marqués <span className="font-bold text-brand">*</span> sont obligatoires.
            Vos informations sont envoyées directement sur notre WhatsApp {targetWhatsappDisplay}.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
          <fieldset className="card-elevated space-y-5 p-5 sm:p-7">
            <legend className="px-1 text-sm font-black uppercase tracking-wide text-primary">
              1. Vos coordonnées
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div data-error={Boolean(errors.fullName)}>
                <Field label="Nom et prénom" required htmlFor="fullName" error={errors.fullName}>
                  <input
                    id="fullName"
                    className={inputClass}
                    value={values.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="M. AKAMBA Robert"
                    autoComplete="name"
                  />
                </Field>
              </div>
              <div data-error={Boolean(errors.phone)}>
                <Field label="Téléphone" required htmlFor="phone" error={errors.phone}>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    className={inputClass}
                    value={values.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="694 24 55 97"
                    autoComplete="tel"
                  />
                </Field>
              </div>
              <div data-error={Boolean(errors.email)}>
                <Field label="E-mail" htmlFor="email" error={errors.email}>
                  <input
                    id="email"
                    type="email"
                    className={inputClass}
                    value={values.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2" data-error={Boolean(errors.address)}>
                <Field label="Adresse / Ville" required htmlFor="address" error={errors.address}>
                  <input
                    id="address"
                    className={inputClass}
                    value={values.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Yaoundé"
                  />
                </Field>
              </div>
            </div>
          </fieldset>

          <fieldset
            className="card-elevated space-y-5 p-5 sm:p-7"
            data-error={Boolean(errors.quantities)}
          >
            <legend className="px-1 text-sm font-black uppercase tracking-wide text-primary">
              2. Votre commande (fûts 50L)
            </legend>
            <div className="space-y-3">
              {BRANDS.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold sm:text-base">
                      {b.name} ({b.volume})
                    </p>
                    <p className="text-xs text-muted-foreground">{formatFcfa(b.price)} / fût</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Retirer un fût ${b.name}`}
                      onClick={() => changeQty(b.id, -1)}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary"
                    >
                      <Minus className="size-4" />
                    </button>
                    <input
                      aria-label={`Quantité ${b.name}`}
                      inputMode="numeric"
                      className="w-14 rounded-lg border border-input bg-card py-2 text-center text-base font-bold"
                      value={quantities[b.id]}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/\D/g, ""));
                        setQuantities((q) => ({ ...q, [b.id]: Number.isFinite(n) ? n : 0 }));
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`Ajouter un fût ${b.name}`}
                      onClick={() => changeQty(b.id, 1)}
                      className="brand-surface inline-flex size-9 items-center justify-center rounded-lg text-brand-foreground transition-opacity hover:opacity-90"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.quantities && (
              <p role="alert" className="text-xs font-semibold text-destructive">
                {errors.quantities}
              </p>
            )}
          </fieldset>

          <fieldset className="card-elevated space-y-5 p-5 sm:p-7">
            <legend className="px-1 text-sm font-black uppercase tracking-wide text-primary">
              3. Caution, options et suppléments
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Caution matériel"
                required
                htmlFor="caution"
                hint="Caution remboursable après retour du matériel."
              >
                <select
                  id="caution"
                  className={inputClass}
                  value={values.caution}
                  onChange={(e) => set("caution", e.target.value)}
                >
                  {CAUTIONS.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label} — {formatFcfa(c.amount)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hôtesse (optionnel)" htmlFor="hotesse">
                <select
                  id="hotesse"
                  className={inputClass}
                  value={values.hotesse}
                  onChange={(e) => set("hotesse", e.target.value)}
                >
                  {HOTESSE_OPTIONS.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sirop (optionnel)" htmlFor="sirop">
                <select
                  id="sirop"
                  className={inputClass}
                  value={values.sirop}
                  onChange={(e) => set("sirop", e.target.value)}
                >
                  {SIROP_OPTIONS.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Frais de service supplémentaire" htmlFor="serviceFee">
                <select
                  id="serviceFee"
                  className={inputClass}
                  value={values.serviceFee}
                  onChange={(e) => set("serviceFee", e.target.value)}
                >
                  {SERVICE_FEE_OPTIONS.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Mise à disposition des machines (FCFA)"
                htmlFor="machinesFee"
                hint="Montant à saisir manuellement."
              >
                <input
                  id="machinesFee"
                  inputMode="numeric"
                  className={inputClass}
                  value={values.machinesFee}
                  onChange={(e) => set("machinesFee", e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                />
              </Field>
              <Field
                label="Gobelets supplémentaires (FCFA)"
                htmlFor="extraCupsFee"
                hint="Montant à saisir manuellement."
              >
                <input
                  id="extraCupsFee"
                  inputMode="numeric"
                  className={inputClass}
                  value={values.extraCupsFee}
                  onChange={(e) => set("extraCupsFee", e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                />
              </Field>
              <Field
                label="Forfait transport (FCFA)"
                htmlFor="transportFee"
                hint="Transport gratuit dans la ville de Yaoundé."
              >
                <input
                  id="transportFee"
                  inputMode="numeric"
                  className={inputClass}
                  value={values.transportFee}
                  onChange={(e) => set("transportFee", e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-border bg-secondary/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-muted-foreground">Total fûts</span>
                <span className="text-sm font-bold">{totalKegs}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Gobelets offerts
                </span>
                <span className="text-sm font-bold">{totalKegs * 50}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Sous-total boissons
                </span>
                <span className="text-sm font-bold">{formatFcfa(total)}</span>
              </div>
              {extras.map((x) => (
                <div key={x.label} className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-muted-foreground">{x.label}</span>
                  <span className="text-sm font-bold">{formatFcfa(x.amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
                <span className="text-sm font-bold">Montant total</span>
                <span className="text-lg font-black text-brand">{formatFcfa(grandTotal)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Transport gratuit dans la ville de Yaoundé.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/60 p-4">
              <input
                type="checkbox"
                checked={needsBossConfirmation}
                onChange={(e) => setNeedsBossConfirmation(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-brand"
              />
              <span className="text-sm">
                <span className="font-semibold">
                  Grosse commande — nécessite l'accord du responsable
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Pour les prestations importantes, la demande sera envoyée directement au
                  responsable ({ENTERPRISE.bossWhatsappDisplay}) pour validation avant confirmation.
                </span>
              </span>
            </label>
          </fieldset>

          <fieldset className="card-elevated space-y-5 p-5 sm:p-7">
            <legend className="px-1 text-sm font-black uppercase tracking-wide text-primary">
              4. Détails de la prestation
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div data-error={Boolean(errors.occasion)}>
                <Field
                  label="Nature de prestation"
                  required
                  htmlFor="occasion"
                  error={errors.occasion}
                >
                  <select
                    id="occasion"
                    className={inputClass}
                    value={values.occasion}
                    onChange={(e) => set("occasion", e.target.value)}
                  >
                    <option value="">Sélectionnez…</option>
                    {OCCASIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {values.occasion === "Autre" && (
                <div data-error={Boolean(errors.occasionOther)}>
                  <Field
                    label="Précisez la nature de prestation"
                    required
                    htmlFor="occasionOther"
                    error={errors.occasionOther}
                  >
                    <input
                      id="occasionOther"
                      className={inputClass}
                      value={values.occasionOther}
                      onChange={(e) => set("occasionOther", e.target.value)}
                    />
                  </Field>
                </div>
              )}
              <div data-error={Boolean(errors.eventPlace)}>
                <Field
                  label="Lieu de la prestation"
                  required
                  htmlFor="eventPlace"
                  error={errors.eventPlace}
                >
                  <input
                    id="eventPlace"
                    className={inputClass}
                    value={values.eventPlace}
                    onChange={(e) => set("eventPlace", e.target.value)}
                    placeholder="Yaoundé – Nkolndom"
                  />
                </Field>
              </div>
              <div data-error={Boolean(errors.eventDate)}>
                <Field
                  label="Date de la prestation"
                  required
                  htmlFor="eventDate"
                  error={errors.eventDate}
                >
                  <input
                    id="eventDate"
                    type="date"
                    className={inputClass}
                    value={values.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                  />
                </Field>
              </div>
              <div data-error={Boolean(errors.startTime)}>
                <Field label="Heure de début" required htmlFor="startTime" error={errors.startTime}>
                  <input
                    id="startTime"
                    type="time"
                    className={inputClass}
                    value={values.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="Durée de la prestation"
                htmlFor="duration"
                hint="Durée standard : 5h après le début."
              >
                <select
                  id="duration"
                  className={inputClass}
                  value={values.duration}
                  onChange={(e) => set("duration", e.target.value)}
                >
                  {["3h", "4h", "5h", "6h", "7h", "8h"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-sm font-semibold">
                  Moyen de transport <span className="text-brand">*</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TRANSPORT.map((t) => (
                    <label
                      key={t}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-semibold transition-colors has-checked:border-brand has-checked:bg-brand/5"
                    >
                      <input
                        type="radio"
                        name="transport"
                        value={t}
                        checked={values.transport === t}
                        onChange={(e) => set("transport", e.target.value)}
                        className="size-4 accent-[var(--brand)]"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Field label="Informations complémentaires" htmlFor="notes">
                  <textarea
                    id="notes"
                    rows={4}
                    className={inputClass}
                    value={values.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Précisions sur le lieu, l'installation, les horaires…"
                  />
                </Field>
              </div>
            </div>
          </fieldset>

          <div className="card-elevated p-5 sm:p-7">
            <Button
              type="submit"
              size="lg"
              disabled={sending}
              className="brand-surface w-full gap-2 py-6 text-base font-bold text-brand-foreground hover:opacity-90"
            >
              {sending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Préparation du message…
                </>
              ) : (
                <>
                  <MessageCircle className="size-5" />
                  Envoyer via WhatsApp
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Aucune capture d'écran nécessaire : votre facture proforma est générée en image et
              mise en forme automatiquement.
            </p>

            {sent && (
              <div className="fade-up mt-5 space-y-3 rounded-xl border border-success/40 bg-success/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                  <div className="min-w-0 text-sm">
                    <p className="font-bold">
                      Votre facture proforma a été préparée pour WhatsApp.
                    </p>
                    {sent === "shared" ? (
                      <p className="mt-1 text-muted-foreground">
                        Choisissez WhatsApp dans le partage puis le contact {targetWhatsappDisplay},
                        et appuyez sur <strong>Envoyer</strong> pour finaliser votre demande.
                      </p>
                    ) : (
                      <p className="mt-1 text-muted-foreground">
                        L'image de votre facture a été téléchargée et WhatsApp s'est ouvert avec
                        votre message. Appuyez sur <strong>Envoyer</strong> dans WhatsApp, puis
                        joignez l'image téléchargée si besoin. Si WhatsApp ne s'est pas ouvert,{" "}
                        <a
                          className="font-semibold text-brand underline"
                          href={`https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(buildMessage())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          cliquez ici
                        </a>
                        .
                      </p>
                    )}
                  </div>
                </div>
                {imageUrl && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={handlePrint}
                      className="brand-surface gap-2 text-brand-foreground hover:opacity-90"
                    >
                      <Printer className="size-4" />
                      Imprimer une copie pour le client
                    </Button>
                    <a
                      href={imageUrl}
                      download="facture-diego-distribution.png"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
                    >
                      <ImageDown className="size-4" />
                      Télécharger à nouveau la facture
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <OrderReceipt ref={receiptRef} data={receipt} />
      </div>
    </section>
  );
}
