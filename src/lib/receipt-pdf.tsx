import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { CompanyProfile, FiscalDocumentType } from "@/types";

// Paleta monocromática para impressão laser
const C = {
  black: "#000000",
  dark: "#1a1a1a",
  mid: "#555555",
  light: "#888888",
  rule: "#bbbbbb",
  ruleLight: "#dddddd",
  bg: "#f4f4f4"
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: C.dark,
    backgroundColor: "#ffffff",
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 18
  },

  // ── Cabeçalho ────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10
  },
  headerLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  logo: { width: 52, height: 34, objectFit: "contain", marginRight: 10, marginTop: 1 },
  companyName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.black, marginBottom: 2 },
  companyMeta: { fontSize: 7, color: C.light, lineHeight: 1.5 },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.black, letterSpacing: 2 },
  docNumber: { fontSize: 7.5, color: C.mid, marginTop: 3, textAlign: "right" },
  docDate: { fontSize: 7.5, color: C.mid, marginTop: 1, textAlign: "right" },

  // ── Régua ────────────────────────────────────────────────────────
  rule: { borderTopWidth: 1, borderTopColor: C.black, marginBottom: 10 },
  ruleThin: { borderTopWidth: 0.5, borderTopColor: C.rule, marginBottom: 8 },

  // ── Seção genérica ───────────────────────────────────────────────
  sectionLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.light,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4
  },
  sectionRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  sectionBlock: { flex: 1 },

  // ── Recebemos de ─────────────────────────────────────────────────
  clientName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.black, marginBottom: 2 },
  clientMeta: { fontSize: 7.5, color: C.mid, lineHeight: 1.55 },

  // ── Referente a ──────────────────────────────────────────────────
  refLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 1 },
  refDesc: { fontSize: 7.5, color: C.mid, lineHeight: 1.5 },

  // ── Tabela de itens ──────────────────────────────────────────────
  tableLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.light,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4
  },
  thead: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: C.black,
    paddingBottom: 4,
    marginBottom: 2
  },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.mid, textTransform: "uppercase" },
  tr: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.ruleLight
  },
  td: { fontSize: 8, color: C.dark },
  colItem: { flex: 3.5 },
  colType: { flex: 1.5 },
  colQty: { flex: 0.7, textAlign: "right" },
  colUnit: { flex: 1.4, textAlign: "right" },
  colTotal: { flex: 1.4, textAlign: "right" },

  // ── Totais ───────────────────────────────────────────────────────
  totalsBlock: { alignItems: "flex-end", marginTop: 8, marginBottom: 10 },
  subRow: { flexDirection: "row", marginBottom: 3 },
  subLabel: { fontSize: 7.5, color: C.mid, width: 90, textAlign: "right", paddingRight: 10 },
  subValue: { fontSize: 7.5, color: C.dark, width: 75, textAlign: "right" },
  discountValue: { fontSize: 7.5, color: C.dark, width: 75, textAlign: "right" },
  totalRule: { borderTopWidth: 0.75, borderTopColor: C.black, width: 165, marginBottom: 4 },
  totalRow: { flexDirection: "row" },
  totalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.black, width: 90, textAlign: "right", paddingRight: 10 },
  totalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.black, width: 75, textAlign: "right" },

  // ── Pagamento ────────────────────────────────────────────────────
  paySection: { marginBottom: 10 },
  payTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 4 },
  payRow: { flexDirection: "row", gap: 16 },
  payField: { flex: 1 },
  payFieldWide: { flex: 2 },
  payFieldLabel: { fontSize: 6.5, color: C.light, marginBottom: 1 },
  payFieldValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.dark },

  // ── Cortesia ─────────────────────────────────────────────────────
  courtSection: { marginBottom: 10 },
  courtText: { fontSize: 8, color: C.mid, fontFamily: "Helvetica-Oblique" },

  // ── Observações ──────────────────────────────────────────────────
  notesSection: { marginBottom: 10 },
  notesText: { fontSize: 7.5, color: C.mid, lineHeight: 1.5 },

  // ── Assinatura ───────────────────────────────────────────────────
  sigBlock: { alignItems: "flex-end", marginTop: 6, marginBottom: 10 },
  sigImage: { width: 140, height: 52, objectFit: "contain", marginBottom: 4 },
  sigLine: { width: 170, borderTopWidth: 0.75, borderTopColor: C.dark, paddingTop: 4 },
  sigLabel: { fontSize: 7, color: C.mid, textAlign: "center" },

  // ── Rodapé ───────────────────────────────────────────────────────
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: C.rule,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footText: { fontSize: 6.5, color: C.light }
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
  deliveryFee?: number;
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
    data.company.city && data.company.state
      ? `${data.company.city} / ${data.company.state}`
      : (data.company.city ?? data.company.state),
    data.company.postalCode ? `CEP ${data.company.postalCode}` : undefined
  ].filter(Boolean);

  const clientMeta = [
    data.client.document ? `CPF/CNPJ: ${data.client.document}` : null,
    data.client.phone ? `Tel: ${data.client.phone}` : null,
    data.client.email ? data.client.email : null
  ].filter(Boolean).join("   ·   ");

  return (
    <Document>
      <Page size="A5" style={s.page}>

        {/* ── Cabeçalho ───────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={s.logo} /> : null}
            <View>
              <Text style={s.companyName}>{data.company.tradeName ?? data.company.legalName}</Text>
              <Text style={s.companyMeta}>CNPJ {data.company.document}</Text>
              {addressParts.length > 0 ? <Text style={s.companyMeta}>{addressParts.join("  ·  ")}</Text> : null}
              {data.company.phone || data.company.financialEmail ? (
                <Text style={s.companyMeta}>
                  {[data.company.phone, data.company.financialEmail].filter(Boolean).join("   ·   ")}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.docTitle}>{documentTypeLabel[data.documentType]}</Text>
            <Text style={s.docNumber}>Nº {data.receiptNumber}</Text>
            <Text style={s.docDate}>Emissão: {fmtDate(data.issueDate)}</Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* ── Recebemos de / Referência ────────────────── */}
        <View style={s.sectionRow}>
          <View style={[s.sectionBlock, { flex: 1.6 }]}>
            <Text style={s.sectionLabel}>Recebemos de</Text>
            <Text style={s.clientName}>{data.client.name}</Text>
            {clientMeta ? <Text style={s.clientMeta}>{clientMeta}</Text> : null}
          </View>

          {(data.referenceLabel || data.referenceDescription) ? (
            <View style={s.sectionBlock}>
              <Text style={s.sectionLabel}>Referente a</Text>
              {data.referenceLabel ? <Text style={s.refLabel}>{data.referenceLabel}</Text> : null}
              {data.referenceDescription ? <Text style={s.refDesc}>{data.referenceDescription}</Text> : null}
            </View>
          ) : null}
        </View>

        <View style={s.ruleThin} />

        {/* ── Itens ────────────────────────────────────── */}
        {data.items.length > 0 ? (
          <>
            <Text style={s.tableLabel}>Discriminação dos serviços</Text>
            <View style={s.thead}>
              <Text style={[s.th, s.colItem]}>Descrição</Text>
              {hasTypes ? <Text style={[s.th, s.colType]}>Tipo</Text> : null}
              <Text style={[s.th, s.colQty]}>Qtd.</Text>
              <Text style={[s.th, s.colUnit]}>Unit.</Text>
              <Text style={[s.th, s.colTotal]}>Total</Text>
            </View>
            {data.items.map((item, i) => (
              <View key={i} style={s.tr}>
                <Text style={[s.td, s.colItem]}>{item.description}</Text>
                {hasTypes ? <Text style={[s.td, s.colType, { color: C.mid }]}>{item.typeLabel ?? "—"}</Text> : null}
                <Text style={[s.td, s.colQty]}>{item.quantity}</Text>
                <Text style={[s.td, s.colUnit]}>{fmt(item.unitPrice)}</Text>
                <Text style={[s.td, s.colTotal, { fontFamily: "Helvetica-Bold" }]}>{fmt(item.totalPrice)}</Text>
              </View>
            ))}
          </>
        ) : null}

        {/* ── Totais ───────────────────────────────────── */}
        <View style={s.totalsBlock}>
          {(data.discountAmount > 0 || (data.deliveryFee ?? 0) > 0) ? (
            <>
              <View style={s.subRow}>
                <Text style={s.subLabel}>Subtotal</Text>
                <Text style={s.subValue}>{fmt(data.subtotalAmount)}</Text>
              </View>
              {(data.deliveryFee ?? 0) > 0 ? (
                <View style={s.subRow}>
                  <Text style={s.subLabel}>Taxa de entrega</Text>
                  <Text style={s.subValue}>{fmt(data.deliveryFee ?? 0)}</Text>
                </View>
              ) : null}
              {data.discountAmount > 0 ? (
                <View style={s.subRow}>
                  <Text style={s.subLabel}>Desconto</Text>
                  <Text style={s.discountValue}>- {fmt(data.discountAmount)}</Text>
                </View>
              ) : null}
            </>
          ) : null}
          <View style={s.totalRule} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{data.isCortesia ? "Valor cobrado" : "Total"}</Text>
            <Text style={s.totalValue}>{data.isCortesia ? "R$ 0,00" : fmt(data.totalAmount)}</Text>
          </View>
        </View>

        <View style={s.ruleThin} />

        {/* ── Pagamento / Cortesia ─────────────────────── */}
        {data.isCortesia ? (
          <View style={s.courtSection}>
            <Text style={s.courtText}>Serviço prestado em regime de cortesia — nenhum valor foi cobrado.</Text>
          </View>
        ) : data.paymentMethod ? (
          <View style={s.paySection}>
            <Text style={s.payTitle}>Pagamento confirmado</Text>
            <View style={s.payRow}>
              <View style={s.payField}>
                <Text style={s.payFieldLabel}>Forma de pagamento</Text>
                <Text style={s.payFieldValue}>{data.paymentMethod}</Text>
              </View>
              {data.paymentDate ? (
                <View style={s.payField}>
                  <Text style={s.payFieldLabel}>Data</Text>
                  <Text style={s.payFieldValue}>{fmtDate(data.paymentDate)}</Text>
                </View>
              ) : null}
              {data.paymentReference ? (
                <View style={s.payFieldWide}>
                  <Text style={s.payFieldLabel}>Referência / comprovante</Text>
                  <Text style={s.payFieldValue}>{data.paymentReference}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Observações ──────────────────────────────── */}
        {data.notes ? (
          <View style={s.notesSection}>
            <Text style={[s.sectionLabel, { marginBottom: 3 }]}>Observações</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {/* ── Assinatura ───────────────────────────────── */}
        {data.signatureDataUri ? (
          <View style={s.sigBlock}>
            <Image src={data.signatureDataUri} style={s.sigImage} />
            <View style={s.sigLine}>
              <Text style={s.sigLabel}>{data.company.tradeName ?? data.company.legalName}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Rodapé ───────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footText}>
            Documento gerado eletronicamente
            {data.company.website ? `  ·  ${data.company.website}` : ""}
          </Text>
          <Text style={s.footText}>Gerado em {new Date().toLocaleDateString("pt-BR")}</Text>
        </View>

      </Page>
    </Document>
  );
}
