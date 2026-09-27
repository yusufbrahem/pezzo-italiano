import "server-only";
import ExcelJS from "exceljs";
import type { OrderRow } from "@/lib/data/orders";
import { menuCategories } from "@/data/menu";
import {
  RANGE_LABELS,
  STATUS_LABELS,
  hasActiveFilters,
  resolveDateRange,
  type OrderFilters,
} from "@/lib/orders-filters";

// Builds the /admin/clients Excel export (app/api/admin/orders/export).
//
// A real .xlsx rather than CSV: CSV's separator depends on the computer's
// language settings (";" vs ","), so it opened as one crammed column on an
// English-locale Excel. One workbook, three sheets: Résumé, Commandes
// (one row per order) and Articles (one row per item sold).
//
// Customer text is always written as plain string cells, which Excel never
// evaluates — so a name like "=HYPERLINK(…)" can't become a live formula.

const GREEN = "FF0D3B2E";
const GOLD = "FFC9A84C";
const CREAM = "FFF9F5EC";
const DATE_FMT = "dd/mm/yyyy hh:mm";
const MONEY_FMT = '#,##0.00 "DT";-#,##0.00 "DT";"-"';

/** Excel has no timezones: hand it the Tunis wall-clock time as if it were UTC. */
function tunisWallClock(iso: string | null): Date | null {
  if (!iso) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Tunis",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second));
}

function formatPhone(phone: string) {
  const m = phone.match(/^216(\d{2})(\d{3})(\d{3})$/);
  return m ? `+216 ${m[1]} ${m[2]} ${m[3]}` : `+${phone}`;
}

const categoryLabel = (id: string | undefined) => menuCategories.find((c) => c.id === id)?.labelFr ?? "";
const typeLabel = (o: OrderRow) => (o.orderType === "livraison" ? "Livraison" : "À emporter");
const orderRef = (o: OrderRow) => o.id.slice(0, 8).toUpperCase();

interface Col {
  header: string;
  key: string;
  width: number;
  fmt?: string;
  wrap?: boolean;
  center?: boolean;
}

/** Styled table sheet: green header, frozen header row, filters, SUBTOTAL row. */
function addTableSheet(
  wb: ExcelJS.Workbook,
  name: string,
  cols: Col[],
  rows: Record<string, unknown>[],
  totals: Record<string, "sum" | "count">
) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  const header = ws.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  rows.forEach((r) => ws.addRow(r));
  const lastDataRow = rows.length + 1;

  cols.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    for (let r = 2; r <= lastDataRow; r++) {
      const cell = ws.getCell(r, i + 1);
      if (c.fmt) cell.numFmt = c.fmt;
      cell.alignment = {
        vertical: "top",
        wrapText: c.wrap ?? false,
        horizontal: c.center ? "center" : undefined,
      };
    }
    col.width = c.width;
  });

  if (rows.length > 0) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: lastDataRow, column: cols.length } };

    // SUBTOTAL (109 = sum, 103 = count) only counts rows left visible by the
    // filter — so the totals follow whatever the owner filters in Excel.
    const totalRow = ws.getRow(lastDataRow + 1);
    totalRow.getCell(1).value = "Total (lignes visibles)";
    cols.forEach((c, i) => {
      const kind = totals[c.key];
      if (!kind) return;
      const letter = ws.getColumn(i + 1).letter;
      const fn = kind === "sum" ? 109 : 103;
      totalRow.getCell(i + 1).value = { formula: `SUBTOTAL(${fn},${letter}2:${letter}${lastDataRow})` };
      if (c.fmt) totalRow.getCell(i + 1).numFmt = c.fmt;
    });
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, color: { argb: GREEN } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
      cell.border = { top: { style: "thin", color: { argb: GOLD } } };
    });
  }
  return ws;
}

function describeFilters(f: OrderFilters | null): string {
  if (!f || !hasActiveFilters(f)) return "Toutes les commandes";
  const parts: string[] = [];
  if (f.status !== "all") parts.push(STATUS_LABELS[f.status]);
  if (f.type !== "all") parts.push(f.type === "livraison" ? "Livraison" : "À emporter");
  if (f.range !== "all") {
    const { from, to } = resolveDateRange(f);
    parts.push(f.range === "custom" ? `du ${from ?? "…"} au ${to ?? "…"}` : `${RANGE_LABELS[f.range]} (${from} → ${to})`);
  }
  if (f.q) parts.push(`recherche « ${f.q} »`);
  return parts.join(" · ");
}

function addSummarySheet(wb: ExcelJS.Workbook, orders: OrderRow[], f: OrderFilters | null) {
  const ws = wb.addWorksheet("Résumé");
  ws.getColumn(1).width = 34;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 16;

  const confirmed = orders.filter((o) => o.isConfirmed);
  const priced = orders.filter((o) => o.total > 0);
  const sum = (list: OrderRow[]) => list.reduce((s, o) => s + o.total, 0);

  ws.mergeCells("A1:D1");
  ws.getCell("A1").value = "Pezzo Italiano — Commandes du site";
  ws.getCell("A1").font = { bold: true, size: 16, color: { argb: GREEN } };
  ws.getRow(1).height = 26;
  ws.getCell("A2").value = `Exporté le ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Tunis", dateStyle: "long", timeStyle: "short" }).format(new Date())}`;
  ws.getCell("A3").value = `Sélection : ${describeFilters(f)}`;
  ws.getCell("A2").font = ws.getCell("A3").font = { italic: true, color: { argb: "FF6B6B6B" } };

  const figures: [string, number, string?][] = [
    ["Commandes", orders.length],
    ["Commandes confirmées", confirmed.length],
    ["Chiffre d'affaires confirmé", sum(confirmed), MONEY_FMT],
    ["Chiffre d'affaires total (y compris non confirmées)", sum(orders), MONEY_FMT],
    ["Panier moyen", priced.length ? sum(priced) / priced.length : 0, MONEY_FMT],
    ["Clients différents", new Set(orders.map((o) => o.phone)).size],
    ["Livraisons", orders.filter((o) => o.orderType === "livraison").length],
    ["À emporter", orders.filter((o) => o.orderType === "emporter").length],
    ["Avis Google demandés", orders.filter((o) => o.reviewRequestedAt).length],
  ];
  let r = 5;
  for (const [label, value, fmt] of figures) {
    ws.getCell(r, 1).value = label;
    ws.getCell(r, 2).value = value;
    if (fmt) ws.getCell(r, 2).numFmt = fmt;
    ws.getCell(r, 2).font = { bold: true };
    ws.getCell(r, 2).alignment = { horizontal: "right" };
    r++;
  }
  ws.getCell(r, 1).value = "Les plateaux variés à prix à confirmer ne sont pas inclus dans les montants.";
  ws.getCell(r, 1).font = { italic: true, size: 9, color: { argb: "FF8A8A8A" } };

  // Best sellers by quantity
  r += 2;
  const stats = new Map<string, { name: string; cat: string; qty: number; revenue: number }>();
  for (const o of orders)
    for (const i of o.items) {
      const key = `${i.category ?? ""}|${i.name}`;
      const s = stats.get(key) ?? { name: i.name, cat: categoryLabel(i.category), qty: 0, revenue: 0 };
      s.qty += i.quantity;
      s.revenue += i.unitPrice * i.quantity;
      stats.set(key, s);
    }
  const top = [...stats.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 15);

  ws.getCell(r, 1).value = "Articles les plus vendus";
  ws.getCell(r, 1).font = { bold: true, size: 12, color: { argb: GREEN } };
  r++;
  ["Article", "Catégorie", "Quantité", "Montant"].forEach((h, i) => {
    const c = ws.getCell(r, i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
  });
  for (const t of top) {
    r++;
    ws.getCell(r, 1).value = t.name;
    ws.getCell(r, 2).value = t.cat;
    ws.getCell(r, 3).value = t.qty;
    ws.getCell(r, 4).value = t.revenue;
    ws.getCell(r, 4).numFmt = MONEY_FMT;
  }
}

export async function buildOrdersWorkbook(orders: OrderRow[], f: OrderFilters | null): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Pezzo Italiano";
  wb.created = new Date();

  addSummarySheet(wb, orders, f);

  addTableSheet(
    wb,
    "Commandes",
    [
      { header: "Date", key: "date", width: 17, fmt: DATE_FMT },
      { header: "N°", key: "ref", width: 11 },
      { header: "Client", key: "client", width: 24 },
      { header: "Téléphone", key: "phone", width: 17 },
      { header: "Type", key: "type", width: 12 },
      { header: "Articles", key: "items", width: 46, wrap: true },
      { header: "Nb articles", key: "qty", width: 11, center: true },
      { header: "Total", key: "total", width: 13, fmt: MONEY_FMT },
      { header: "Prix à confirmer", key: "custom", width: 11, center: true },
      { header: "Adresse", key: "address", width: 28, wrap: true },
      { header: "Zone", key: "zone", width: 16 },
      { header: "Point de repère", key: "landmark", width: 22, wrap: true },
      { header: "Notes", key: "notes", width: 28, wrap: true },
      { header: "Confirmée", key: "confirmed", width: 11, center: true },
      { header: "Avis demandé le", key: "reviewAt", width: 17, fmt: DATE_FMT },
      { header: "Avis demandé par", key: "reviewBy", width: 16 },
      { header: "Commandes du client", key: "customerOrders", width: 12, center: true },
    ],
    orders.map((o) => ({
      date: tunisWallClock(o.createdAt),
      ref: orderRef(o),
      client: o.customerName,
      phone: formatPhone(o.phone),
      type: typeLabel(o),
      items: o.items
        .map((i) =>
          i.customNote
            ? `${i.name} : ${i.customNote}`
            : `${i.quantity} × ${i.name}${i.sizeLabel ? ` (${i.sizeLabel})` : ""}`
        )
        .join("\n"),
      qty: o.items.reduce((s, i) => s + i.quantity, 0),
      total: o.total,
      custom: o.hasCustomItems ? "Oui" : "",
      address: o.address ?? "",
      zone: o.zone ?? "",
      landmark: o.landmark ?? "",
      notes: o.notes ?? "",
      confirmed: o.isConfirmed ? "Oui" : "Non",
      reviewAt: tunisWallClock(o.reviewRequestedAt),
      reviewBy: o.reviewRequestedByName ?? "",
      customerOrders: o.customerOrderCount,
    })),
    { ref: "count", qty: "sum", total: "sum" }
  );

  addTableSheet(
    wb,
    "Articles",
    [
      { header: "Date", key: "date", width: 17, fmt: DATE_FMT },
      { header: "N° commande", key: "ref", width: 12 },
      { header: "Client", key: "client", width: 24 },
      { header: "Téléphone", key: "phone", width: 17 },
      { header: "Type", key: "type", width: 12 },
      { header: "Article", key: "item", width: 26 },
      { header: "Catégorie", key: "category", width: 16 },
      { header: "Taille", key: "size", width: 11 },
      { header: "Quantité", key: "qty", width: 10, center: true },
      { header: "Prix unitaire", key: "unit", width: 13, fmt: MONEY_FMT },
      { header: "Sous-total", key: "subtotal", width: 13, fmt: MONEY_FMT },
      { header: "Détail", key: "detail", width: 34, wrap: true },
      { header: "Confirmée", key: "confirmed", width: 11, center: true },
    ],
    orders.flatMap((o) =>
      o.items.map((i) => ({
        date: tunisWallClock(o.createdAt),
        ref: orderRef(o),
        client: o.customerName,
        phone: formatPhone(o.phone),
        type: typeLabel(o),
        item: i.name,
        category: categoryLabel(i.category),
        size: i.sizeLabel ?? "",
        qty: i.quantity,
        unit: i.unitPrice,
        subtotal: i.unitPrice * i.quantity,
        detail: i.customNote ? `${i.customNote} (prix à confirmer)` : "",
        confirmed: o.isConfirmed ? "Oui" : "Non",
      }))
    ),
    { qty: "sum", subtotal: "sum" }
  );

  return Buffer.from(await wb.xlsx.writeBuffer());
}
