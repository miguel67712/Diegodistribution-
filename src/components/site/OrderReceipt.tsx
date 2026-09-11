import { forwardRef } from "react";
import logo from "@/assets/diego-logo.png";
import { ENTERPRISE, formatFcfa, numberToFrenchWords, type Brand } from "@/lib/diego";

export type ReceiptExtra = { label: string; amount: number };

export type ReceiptData = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  objet: string;
  eventPlace: string;
  eventDate: string;
  startTime: string;
  duration: string;
  transport: string;
  notes: string;
  lines: { brand: Brand; qty: number }[];
  totalKegs: number;
  total: number;
  extras: ReceiptExtra[];
  extrasTotal: number;
  grandTotal: number;
  reference: string;
  issuedAt: string;
};

const navy = "#0f2557";
const line = "#c9cfdb";
const label: React.CSSProperties = {
  fontStyle: "italic",
  textDecoration: "underline",
  color: navy,
};

const cell: React.CSSProperties = {
  padding: "6px 10px",
  border: `1px solid ${line}`,
};

export const OrderReceipt = forwardRef<HTMLDivElement, { data: ReceiptData | null }>(
  function OrderReceipt({ data }, ref) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: "-10000px",
          width: "760px",
          pointerEvents: "none",
        }}
      >
        <div
          ref={ref}
          style={{
            position: "relative",
            width: "760px",
            background: "#ffffff",
            color: "#101828",
            fontFamily: "Manrope, Arial, sans-serif",
            fontSize: "13px",
            lineHeight: 1.5,
            padding: "32px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* filigrane / watermark — kept as the only place the logo mark appears at scale */}
          <img
            src={logo}
            alt=""
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "560px",
              transform: "translate(-50%, -50%) rotate(-20deg)",
              opacity: 0.07,
              pointerEvents: "none",
            }}
          />

          {data && (
            <div style={{ position: "relative" }}>
              {/* En-tête / letterhead */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  borderBottom: `2px solid ${navy}`,
                  paddingBottom: "10px",
                }}
              >
                <div>
                  <img src={logo} alt="" style={{ height: "44px", width: "auto" }} />
                  <div style={{ marginTop: "6px", fontWeight: 800, fontSize: "11px" }}>
                    CODE FOURNISSEUR SABC : {ENTERPRISE.codeFournisseurSabc}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "18px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#475467",
                    textAlign: "center",
                    flex: 1,
                    justifyContent: "center",
                    marginTop: "4px",
                  }}
                >
                  <div>
                    + AGENCE CONSEIL
                    <br />+ MARKETING OPÉRATIONNEL
                  </div>
                  <div>
                    + DISTRIBUTION COMMERCIALE
                    <br />+ PRESTATION DE SERVICES
                  </div>
                </div>
                <div style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                  Yaoundé, le {data.issuedAt}
                </div>
              </div>

              {/* Titre facture + Doit */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  marginTop: "18px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: "16px" }}>FACTURE PROFORMA</div>
                  <div style={{ marginTop: "6px" }}>N° : {data.reference}</div>
                  <div>BL N° : </div>
                  <div>OA N° : </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, textDecoration: "underline" }}>Doit :</div>
                  <div style={{ marginTop: "6px" }}>{data.fullName}</div>
                  <div>{data.phone}</div>
                  <div>{data.address}</div>
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <span style={label}>Objet</span> : {data.objet}
                <div style={{ color: "#475467" }}>{data.eventPlace}</div>
              </div>

              {/* Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
                <thead>
                  <tr style={{ background: navy, color: "#ffffff" }}>
                    <th style={{ padding: "7px 10px", textAlign: "left" }}>Désignation</th>
                    <th style={{ padding: "7px 10px", textAlign: "center" }}>Qté</th>
                    <th style={{ padding: "7px 10px", textAlign: "right" }}>Prix unitaire</th>
                    <th style={{ padding: "7px 10px", textAlign: "right" }}>Prix total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map(({ brand, qty }) => (
                    <tr key={brand.id}>
                      <td style={cell}>
                        {String(qty).padStart(2, "0")} fût{qty > 1 ? "s" : ""} {brand.name} —{" "}
                        {brand.volume}
                      </td>
                      <td style={{ ...cell, textAlign: "center" }}>{qty}</td>
                      <td style={{ ...cell, textAlign: "right" }}>{formatFcfa(brand.price)}</td>
                      <td style={{ ...cell, textAlign: "right" }}>
                        {formatFcfa(brand.price * qty)}
                      </td>
                    </tr>
                  ))}
                  {data.extras.map((extra) => (
                    <tr key={extra.label}>
                      <td style={cell}>{extra.label}</td>
                      <td style={{ ...cell, textAlign: "center" }}>-</td>
                      <td style={{ ...cell, textAlign: "right" }}>-</td>
                      <td style={{ ...cell, textAlign: "right" }}>
                        {extra.amount > 0 ? formatFcfa(extra.amount) : "Gratuit"}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} style={{ ...cell, textAlign: "right", fontWeight: 800 }}>
                      Total HT
                    </td>
                    <td style={{ ...cell, textAlign: "right", fontWeight: 800 }}>
                      {formatFcfa(data.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "6px", color: "#475467", fontSize: "11px" }}>
                Total fûts : {data.totalKegs} — Gobelets offerts : {data.totalKegs * 50}
              </div>

              <div style={{ marginTop: "14px" }}>
                Arrêtée la présente facture à la somme de : {formatFcfa(data.grandTotal)} (
                {numberToFrenchWords(data.grandTotal)} francs CFA).
              </div>

              {/* Signature */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "26px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, textDecoration: "underline" }}>La Direction</div>
                  <div style={{ height: "48px" }} />
                </div>
              </div>

              {/* Numéros utiles */}
              <div style={{ marginTop: "18px" }}>
                <div style={{ fontWeight: 800, textDecoration: "underline" }}>Numéros utiles :</div>
                <div style={{ marginTop: "4px" }}>
                  • Pour le service après-vente, merci de contacter : {ENTERPRISE.sav}
                </div>
                <div>
                  • Pour toutes vos réclamations, merci de contacter : {ENTERPRISE.reclamations}
                </div>
              </div>

              {/* Détails prestation */}
              <div style={{ marginTop: "14px" }}>
                <div>
                  <span style={label}>Lieu de la prestation</span> : {data.eventPlace}
                </div>
                <div>
                  <span style={label}>Date de la prestation</span> : {data.eventDate}
                </div>
                <div>
                  <span style={label}>Heure de début</span> : {data.startTime}
                </div>
                <div>
                  <span style={label}>Heure de fin</span> : ({data.duration} après le début de la
                  prestation)
                </div>
                <div>
                  <span style={label}>Moyen de transport</span> : {data.transport}
                </div>
                <div>NB : chaque fût est accompagné de 50 gobelets.</div>
                {data.notes && (
                  <div>
                    <span style={label}>Informations complémentaires</span> : {data.notes}
                  </div>
                )}
              </div>

              {/* Pied de page */}
              <div
                style={{
                  marginTop: "22px",
                  borderTop: `1px solid ${line}`,
                  paddingTop: "10px",
                  fontSize: "11px",
                  textAlign: "center",
                  fontWeight: 700,
                  color: navy,
                }}
              >
                {ENTERPRISE.name}, {ENTERPRISE.slogan}
              </div>
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  color: "#667085",
                  fontSize: "10px",
                }}
              >
                <div>
                  RCCM : {ENTERPRISE.rccm}
                  <br />
                  NIU : {ENTERPRISE.niu}
                  <br />
                  RIB : {ENTERPRISE.rib}
                </div>
                <div style={{ textAlign: "right" }}>
                  {ENTERPRISE.bp}
                  <br />
                  Tél : {ENTERPRISE.whatsappDisplay}
                  <br />
                  {ENTERPRISE.email}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);
