import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { CompanyProfile, FiscalDocumentType } from "@/types";

const BRAND = "#1a3558";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: "#0f172a", backgroundColor: "#ffffff" },

  // ── Header band ──────────────────────────────────────────────────
  band: {
    backgroundColor: BRAND,
    paddingHorizontal: 40,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bandLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  logo: { width: 88, height: 44, objectFit: "contain", marginRight: 14 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 3 },
  companyMeta: { fontSize: 7.5, color: "#93c5fd", lineHeight: 1.55 },
  bandRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 3 },
  docNumber: { fontSize: 8, color: "#93c5fd", marginTop: 4 },
  docDate: { fontSize: 8, color: "#93c5fd", marginTop: 2 },

  // ── Body ─────────────────────────────────────────────────────────
  body: { paddingHorizontal: 40, paddingTop: 22, flex: 1 },

  // ── Info cards row ───────────────────────────────────────────────
  cardRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  card: { flex: 1, borderWidth: 0.75, borderColor: "#e2e8f0", borderRadius: 6, padding: 11 },
  cardTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8
  },
  cardField: { marginBottom: 6 },
  cardLabel: { fontSize: 6.5, color: "#94a3b8", marginBottom: 1 },
  cardValue: { fontSize: 9.5, color: "#0f172a", fontFamily: "Helvetica-Bold" },
  cardValueNormal: { fontSize: 9, color: "#334155" },

  // ── Table ────────────────────────────────────────────────────────
  tableTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6
  },
  table: { borderWidth: 0.75, borderColor: "#e2e8f0", borderRadius: 6, marginBottom: 4, overflow: "hidden" },
  thead: { flexDirection: "row", backgroundColor: BRAND, paddingVertical: 8, paddingHorizontal: 12 },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.4 },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 12, borderTopWidth: 0.5, borderTopColor: "#f1f5f9" },
  trAlt: { backgroundColor: "#f8fafc" },
  td: { fontSize: 8.5, color: "#0f172a" },
  tdSub: { fontSize: 7, color: "#94a3b8", marginTop: 1 },
  colItem: { flex: 3.5 },
  colType: { flex: 1.4 },
  colQty: { flex: 0.7, textAlign: "right" },
  colUnit: { flex: 1.3, textAlign: "right" },
  colTotal: { flex: 1.3, textAlign: "right" },

  // ── Subtotals ────────────────────────────────────────────────────
  subRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 3 },
  subLabel: { fontSize: 8, color: "#64748b", width: 100, textAlign: "right", paddingRight: 12 },
  subValue: { fontSize: 8, color: "#334155", width: 90, textAlign: "right" },
  discountValue: { fontSize: 8, color: "#dc2626", width: 90, textAlign: "right" },

  // ── Total bar ────────────────────────────────────────────────────
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BRAND,
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 18
  },
  totalBarLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#93c5fd", textTransform: "uppercase", letterSpacing: 1.5 },
  totalBarValue: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // ── Payment box ──────────────────────────────────────────────────
  payBox: {
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 6,
    backgroundColor: "#f0fdf4",
    padding: 12,
    marginBottom: 18
  },
  payHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  payCheck: { fontSize: 11, color: "#16a34a", marginRight: 6 },
  payTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#15803d" },
  payRow: { flexDirection: "row", gap: 20 },
  payField: { flex: 1 },
  payLabel: { fontSize: 6.5, color: "#16a34a", marginBottom: 1 },
  payValue: { fontSize: 9, color: "#14532d", fontFamily: "Helvetica-Bold" },

  // ── Courtesy box ─────────────────────────────────────────────────
  courtBox: {
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 6,
    backgroundColor: "#eff6ff",
    padding: 12,
    marginBottom: 18
  },
  courtTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1d4ed8", marginBottom: 4 },
  courtText: { fontSize: 8.5, color: "#1e40af" },

  // ── Notes ────────────────────────────────────────────────────────
  notesBox: { marginBottom: 18 },
  notesTitle: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  notesText: { fontSize: 8.5, color: "#334155", lineHeight: 1.5 },

  // ── Signature ────────────────────────────────────────────────────
  sigBlock: { alignItems: "flex-end", marginBottom: 22 },
  sigImage: { width: 180, height: 68, objectFit: "contain", marginBottom: 8 },
  sigLine: { width: 210, borderTopWidth: 0.75, borderTopColor: "#94a3b8", paddingTop: 5 },
  sigLabel: { fontSize: 7.5, color: "#64748b", textAlign: "center" },

  // ── Footer ───────────────────────────────────────────────────────
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footL: { fontSize: 7, color: "#94a3b8", flex: 1 },
  footR: { fontSize: 7, color: "#94a3b8" }
});

const documentTypeLabel: Record<FiscalDocumentType, string> = {
  RECIBO: "RECIBO",
  NFSE: "NFS-e",
  NFE: "NF-e",
  OUTRO: "DOCUMENTO"
};

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export interface ReceiptItem {
  description: string;
  typeLabel?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  documentType: FiscalDocumentType;
  receiptNumber: string;
  issueDate: string;
  company: CompanyProfile;
  logoDataUri?: string;
  signatureDataUri?: string;
  client: {
    name: string;
    document?: string;
    email?: string;
    phone?: string;
  };
  referenceLabel?: string;
  referenceDescription?: string;
  items: ReceiptItem[];
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  isCortesia?: boolean;
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  notes?: string;
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const hasTypes = data.items.some((i) => i.typeLabel);
  const addressParts = [
    data.company.addressLine1,
    data.company.addressLine2,
    data.company.city && data.company.state
      ? `${data.company.city} — ${data.company.state}`
      : (data.company.city ?? data.company.state),
    data.company.postalCode ? `CEP ${data.company.postalCode}` : undefined
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header band ─────────────────────────────── */}
        <View style={s.band}>
          <View style={s.bandLeft}>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={s.logo} /> : null}
            <View>
              <Text style={s.companyName}>{data.company.tradeName ?? data.company.legalName}</Text>
              <Text style={s.companyMeta}>CNPJ {data.company.document}</Text>
              {addressParts.length > 0 ? <Text style={s.companyMeta}>{addressParts.join(" · ")}</Text> : null}
              {data.company.phone ? <Text style={s.companyMeta}>{data.company.phone}</Text> : null}
              {data.company.financialEmail ? <Text style={s.companyMeta}>{data.company.financialEmail}</Text> : null}
            </View>
          </View>
          <View style={s.bandRight}>
            <Text style={s.docTitle}>{documentTypeLabel[data.documentType]}</Text>
            <Text style={s.docNumber}>Nº {data.receiptNumber}</Text>
            <Text style={s.docDate}>Emissão: {fmtDate(data.issueDate)}</Text>
          </View>
        </View>

        {/* ── Body ────────────────────────────────────── */}
        <View style={s.body}>

          {/* Info cards */}
          <View style={s.cardRow}>
            <View style={s.card}>
              <Text style={s.cardTitle}>Cliente</Text>
              <View style={s.cardField}>
                <Text style={s.cardLabel}>Nome / Razão social</Text>
                <Text style={s.cardValue}>{data.client.name}</Text>
              </View>
              {data.client.document ? (
                <View style={s.cardField}>
                  <Text style={s.cardLabel}>CPF / CNPJ</Text>
                  <Text style={s.cardValueNormal}>{data.client.document}</Text>
                </View>
              ) : null}
              {data.client.email ? (
                <View style={s.cardField}>
                  <Text style={s.cardLabel}>E-mail</Text>
                  <Text style={s.cardValueNormal}>{data.client.email}</Text>
                </View>
              ) : null}
              {data.client.phone ? (
                <View style={s.cardField}>
                  <Text style={s.cardLabel}>Telefone</Text>
                  <Text style={s.cardValueNormal}>{data.client.phone}</Text>
                </View>
              ) : null}
            </View>

            {(data.referenceLabel || data.referenceDescription) ? (
              <View style={[s.card, { flex: 0.9 }]}>
                <Text style={s.cardTitle}>Referência</Text>
                {data.referenceLabel ? (
                  <View style={s.cardField}>
                    <Text style={s.cardLabel}>Identificação</Text>
                    <Text style={s.cardValue}>{data.referenceLabel}</Text>
                  </View>
                ) : null}
                {data.referenceDescription ? (
                  <View style={s.cardField}>
                    <Text style={s.cardLabel}>Descrição</Text>
                    <Text style={s.cardValueNormal}>{data.referenceDescription}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Items table */}
          {data.items.length > 0 ? (
            <>
              <Text style={s.tableTitle}>Itens</Text>
              <View style={s.table}>
                <View style={s.thead}>
                  <Text style={[s.th, s.colItem]}>Descrição</Text>
                  {hasTypes ? <Text style={[s.th, s.colType]}>Tipo</Text> : null}
                  <Text style={[s.th, s.colQty]}>Qtd.</Text>
                  <Text style={[s.th, s.colUnit]}>Unit.</Text>
                  <Text style={[s.th, s.colTotal]}>Total</Text>
                </View>
                {data.items.map((item, i) => (
                  <View key={i} style={[s.tr, i % 2 === 1 ? s.trAlt : {}]}>
                    <Text style={[s.td, s.colItem]}>{item.description}</Text>
                    {hasTypes ? <Text style={[s.td, s.colType, { color: "#64748b" }]}>{item.typeLabel ?? "—"}</Text> : null}
                    <Text style={[s.td, s.colQty]}>{item.quantity}</Text>
                    <Text style={[s.td, s.colUnit]}>{fmt(item.unitPrice)}</Text>
                    <Text style={[s.td, s.colTotal, { fontFamily: "Helvetica-Bold" }]}>{fmt(item.totalPrice)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Subtotals */}
          {data.discountAmount > 0 ? (
            <>
              <View style={s.subRow}>
                <Text style={s.subLabel}>Subtotal</Text>
                <Text style={s.subValue}>{fmt(data.subtotalAmount)}</Text>
              </View>
              <View style={s.subRow}>
                <Text style={s.subLabel}>Desconto</Text>
                <Text style={s.discountValue}>- {fmt(data.discountAmount)}</Text>
              </View>
            </>
          ) : null}

          {/* Total bar */}
          <View style={s.totalBar}>
            <Text style={s.totalBarLabel}>{data.isCortesia ? "Valor cobrado" : "Total"}</Text>
            <Text style={s.totalBarValue}>{data.isCortesia ? "R$ 0,00" : fmt(data.totalAmount)}</Text>
          </View>

          {/* Payment / Courtesy */}
          {data.isCortesia ? (
            <View style={s.courtBox}>
              <Text style={s.courtTitle}>Serviço prestado em regime de cortesia</Text>
              <Text style={s.courtText}>Nenhum valor foi cobrado do cliente nesta operação.</Text>
            </View>
          ) : data.paymentMethod ? (
            <View style={s.payBox}>
              <View style={s.payHeader}>
                <Text style={s.payCheck}>✓</Text>
                <Text style={s.payTitle}>Pagamento confirmado</Text>
              </View>
              <View style={s.payRow}>
                <View style={s.payField}>
                  <Text style={s.payLabel}>Forma de pagamento</Text>
                  <Text style={s.payValue}>{data.paymentMethod}</Text>
                </View>
                {data.paymentDate ? (
                  <View style={s.payField}>
                    <Text style={s.payLabel}>Data do pagamento</Text>
                    <Text style={s.payValue}>{fmtDate(data.paymentDate)}</Text>
                  </View>
                ) : null}
                {data.paymentReference ? (
                  <View style={[s.payField, { flex: 2 }]}>
                    <Text style={s.payLabel}>Referência / comprovante</Text>
                    <Text style={s.payValue}>{data.paymentReference}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Notes */}
          {data.notes ? (
            <View style={s.notesBox}>
              <Text style={s.notesTitle}>Observações</Text>
              <Text style={s.notesText}>{data.notes}</Text>
            </View>
          ) : null}

          {/* Signature */}
          {data.signatureDataUri ? (
            <View style={s.sigBlock}>
              <Image src={data.signatureDataUri} style={s.sigImage} />
              <View style={s.sigLine}>
                <Text style={s.sigLabel}>{data.company.tradeName ?? data.company.legalName}</Text>
              </View>
            </View>
          ) : null}

        </View>

        {/* ── Footer ──────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footL}>
            Documento gerado eletronicamente · {data.company.tradeName ?? data.company.legalName}
            {data.company.website ? ` · ${data.company.website}` : ""}
          </Text>
          <Text style={s.footR}>Gerado em {new Date().toLocaleDateString("pt-BR")}</Text>
        </View>

      </Page>
    </Document>
  );
}
