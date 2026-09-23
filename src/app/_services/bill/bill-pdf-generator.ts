import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../../../public/fonts/Roboto-Regular-normal.js';
import '../../../../public/fonts/Roboto-Bold-normal.js';
import '../../../../public/fonts/Roboto-Italic-normal.js';

function toDate(dt?: number[] | string | Date | null): Date | null {
  if (!dt) return null;
  if (Array.isArray(dt)) {
    const [y, m, d, h = 0, min = 0, sec = 0, ns = 0] = dt;
    return new Date(y, m - 1, d, h, min, sec, Math.floor(ns / 1e6));
  }
  if (dt instanceof Date) return dt;
  const parsed = new Date(dt);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function generateBillPdf(item: any, s: any, download = false): { blob: Blob; filename: string } {

    const PLN = new Intl.NumberFormat('pl-PL', {
      style: 'currency', currency: 'PLN', minimumFractionDigits: 2
    });

    const dt = toDate(item.datetime);
    const dateStr = dt
      ? new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt)
      : '';

    const billNo = (item.billFullNumber ?? '').toString().trim();
    const cash = Number(item?.billTotalValueCash) || 0;
    const transfer = Number(item?.billTotalValueTransfer) || 0;
    const fallbackTotal = cash + transfer;
    const paymentMethod = (item.paymentMethod ?? '').toString().trim();
    const nipPurchaser = (item.nip ?? '').toString().trim();
    const comment = (item.comment ?? '').toString().trim();
    const suffixPdfName = (item.suffixPdfName ?? '').toString().trim();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('Roboto-Regular', 'normal');
    doc.setTextColor(0);
    doc.setCharSpace(0);
    doc.setFontSize(10);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const midline = pageH / 2;
    const margin = 9;//15;
    const left = margin;
    const right = pageW - margin;
    const boxW = right - left;
    const frameH = 130;
    const padR = 2;

    function printRightLabelValue(
      doc: jsPDF, label: string, value: string, xRight: number, y: number, gap = 2
    ) {
      const valueText = value ?? '';
      const labelText = `${label}:`;
      doc.setFont('Roboto-Bold', 'normal');
      const valueW = doc.getTextWidth(valueText);
      const labelRight = xRight - valueW - gap;
      doc.setFont('Roboto-Regular', 'normal');
      doc.text(labelText, labelRight, y, { align: 'right' });
      doc.setFont('Roboto-Bold', 'normal');
      doc.text(valueText, xRight, y, { align: 'right' });
      doc.setFont('Roboto-Regular', 'normal');
    }

    function printLeftLabelValue(
      doc: jsPDF, label: string, value: string, xLeft: number, y: number, gap = 2
    ) {
      const valueText = value ?? '';
      const labelText = `${label}:`;
      doc.setFont('Roboto-Regular', 'normal');
      const labelW = doc.getTextWidth(labelText);
      doc.text(labelText, xLeft, y, { align: 'left' });
      doc.setFont('Roboto-Bold', 'normal');
      doc.text(valueText, xLeft + labelW + gap, y, { align: 'left' });
      doc.setFont('Roboto-Regular', 'normal');
    }
    /*
        function bardzoMalyOdstep_printStackedLabelValue(
          doc: jsPDF,
          label: string,
          value: string | string[],
          xLeft: number,
          yTop: number,
          options?: { gap?: number; labelFontSize?: number; valueFontSize?: number; maxWidth?: number; }
        ): number {
          // Tighter defaults
          const mmPerPt = 0.3528;
          const leading = 1.05;                 // was ~1.15
          const tightGap = options?.gap ?? 0.6;  // was 2
    
          const labelFS = options?.labelFontSize ?? doc.getFontSize();
          const valueFS = options?.valueFontSize ?? labelFS;
          const maxW = options?.maxWidth;
    
          // --- Label ---
          doc.setFont('Roboto-Regular', 'normal');
          doc.setFontSize(labelFS);
          const labelText = `${label}:`;
    
          if (maxW && maxW > 0) {
            const lines = doc.splitTextToSize(labelText, maxW);
            doc.text(lines, xLeft, yTop, { align: 'left' });
            const lineH = labelFS * mmPerPt * leading;
            yTop += lines.length * lineH + tightGap;   // smaller gap before value
          } else {
            doc.text(labelText, xLeft, yTop);
            const lineH = labelFS * mmPerPt * leading;
            yTop += lineH * 0.95;                      // slightly tighter than full line height
          }
    
          // --- Value ---
          doc.setFont('Roboto-Bold', 'normal');
          doc.setFontSize(valueFS);
          const vText = Array.isArray(value) ? value.join('\n') : (value ?? '');
    
          if (maxW && maxW > 0) {
            const vLines = doc.splitTextToSize(vText, maxW);
            doc.text(vLines, xLeft, yTop, { align: 'left' });
            const vLineH = valueFS * mmPerPt * leading;
            yTop += vLines.length * vLineH;
          } else {
            doc.text(vText, xLeft, yTop);
            const vLineH = valueFS * mmPerPt * leading;
            yTop += vLineH;
          }
    
          doc.setFont('Roboto-Regular', 'normal');
          return yTop;
        }
    */

    function printStackedLabelValue(
      doc: jsPDF, label: string, value: string | string[], xLeft: number, yTop: number,
      options?: { gap?: number; labelFontSize?: number; valueFontSize?: number; maxWidth?: number; }
    ): number {
      const gap = options?.gap ?? 2;
      const labelFS = options?.labelFontSize ?? doc.getFontSize();
      const valueFS = options?.valueFontSize ?? labelFS;
      const maxW = options?.maxWidth;

      doc.setFont('Roboto-Regular', 'normal');
      doc.setFontSize(labelFS);
      const labelText = `${label}:`;
      if (maxW && maxW > 0) {
        const lines = doc.splitTextToSize(labelText, maxW);
        doc.text(lines, xLeft, yTop, { align: 'left' });
        const lineH = labelFS * 0.3528 * 1.15;
        yTop += lines.length * lineH + gap;
      } else {
        doc.text(labelText, xLeft, yTop);
        yTop += gap + labelFS * 0.3528;
      }

      doc.setFont('Roboto-Bold', 'normal');
      doc.setFontSize(valueFS);
      const vText = Array.isArray(value) ? value.join('\n') : (value ?? '');
      if (maxW && maxW > 0) {
        const vLines = doc.splitTextToSize(vText, maxW);
        doc.text(vLines, xLeft, yTop, { align: 'left' });
        const vLineH = valueFS * 0.3528 * 1.15;
        yTop += vLines.length * vLineH;
      } else {
        doc.text(vText, xLeft, yTop);
        yTop += valueFS * 0.3528;
      }
      doc.setFont('Roboto-Regular', 'normal');
      return yTop;
    }

    function convertPaymentMethod(code: string): string {
      switch (code) {
        case 'CASH': return 'Gotówka';
        case 'TRANSFER_14': return 'Przelew 14 dni';
        case 'TRANSFER_30': return 'Przelew 30 dni';
        default: return '';
      }
    }

    function wordsBelowThousandPL(n: number): string {
      const u = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
      const teen = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
      const tns = ['', '', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
      const hnd = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];

      const parts: string[] = [];
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const r = n % 10;

      if (h) parts.push(hnd[h]);
      if (t === 1) {
        parts.push(teen[r]);
      } else {
        if (t) parts.push(tns[t]);
        if (r) parts.push(u[r]);
        if (!t && !r && !h) parts.push(u[0]);
      }
      return parts.join(' ').trim();
    }

    function pluralFormPL(n: number, forms: [string, string, string]): string {
      const n2 = n % 100;
      if (n2 >= 12 && n2 <= 14) return forms[2];
      const last = n % 10;
      if (last === 1) return forms[0];
      if (last >= 2 && last <= 4) return forms[1];
      return forms[2];
    }

    function amountInWordsIntPL(n: number): string {
      n = Math.trunc(Math.abs(n));
      if (n === 0) return 'Zero';

      const parts: string[] = [];
      const millions = Math.floor(n / 1_000_000);
      const thousands = Math.floor((n % 1_000_000) / 1_000);
      const rest = n % 1_000;

      if (millions) {
        const w = millions === 1 ? 'jeden' : wordsBelowThousandPL(millions);
        parts.push(`${w} ${pluralFormPL(millions, ['milion', 'miliony', 'milionów'])}`);
      }

      if (thousands) {
        const w = thousands === 1 ? 'tysiąc' : `${wordsBelowThousandPL(thousands)} ${pluralFormPL(thousands, ['tysiąc', 'tysiące', 'tysięcy'])}`;
        parts.push(w);
      }

      if (rest) parts.push(wordsBelowThousandPL(rest));

      const s2 = parts.join(' ').replace(/\s+/g, ' ').trim();
      return s2 ? s2[0].toUpperCase() + s2.slice(1) : 'Zero';
    }

    function slowniePL(val: number): string {
      let totalGr = Math.round((Number(val) || 0) * 100);
      let zl = Math.floor(totalGr / 100);
      let gr = totalGr % 100;
      if (gr === 100) { zl += 1; gr = 0; }
      const words = amountInWordsIntPL(zl);
      return gr ? `${words} zł ${String(gr).padStart(2, '0')}/100` : `${words} zł`;
    }

    const renderSection = (yStart: number, copyLabel: '- Oryginał -' | '- Kopia -') => {
      doc.setLineWidth(0.4);
      ///?doc.rect(left, yStart, boxW, frameH);

      const stampH = 28;
      const marginTop = 4;
      doc.rect(left + 4, yStart + marginTop, 60, stampH);
      doc.setFont('Roboto-Bold', 'normal');
      const ownerLine1 = s?.bill_owner_line_1 ?? '';
      doc.text(ownerLine1, left + 6, yStart + marginTop + 5);
      doc.setFont('Roboto-Regular', 'normal');
      doc.text(s?.bill_owner_line_2 ?? '', left + 6, yStart + marginTop + 10);
      doc.text(s?.bill_owner_line_3 ?? '', left + 6, yStart + marginTop + 15);
      doc.text(s?.bill_owner_line_4 ?? '', left + 6, yStart + marginTop + 20);
      doc.text(s?.bill_owner_line_5 ?? '', left + 6, yStart + marginTop + 25);

      const rowY = yStart + 7;//10;
      printLeftLabelValue(doc, 'RACHUNEK nr', billNo, left + 75, rowY);
      printRightLabelValue(doc, 'Data', dateStr, right - padR, rowY);

      doc.setFontSize(9);
      doc.text(copyLabel, left + 98, rowY + 7, { align: 'right' });
      doc.setFontSize(10);

      printRightLabelValue(doc, 'Forma płatności', convertPaymentMethod(paymentMethod), right - padR, yStart + 27);
      printRightLabelValue(doc, 'Numer konta', s?.bill_account_number ?? '', right - padR, yStart + 32);

      const metaY = yStart + 40;//45;
      const innerX = left + 4;
      const innerW = boxW - 8;
      const purchaserText = (item.purchaser ?? '').toString();
      const wrappedPurchaser = doc.splitTextToSize(purchaserText, innerW - 6);
      printStackedLabelValue(doc, 'Nabywca', wrappedPurchaser, left + 4, metaY);
      ///printLeftLabelValue(doc, 'NIP nabywcy', nipPurchaser, left + 4, metaY + 10);
      const asNum = (v: any) => typeof v === 'string' ? Number(v.replace(',', '.')) || 0 : (Number(v) || 0);
      ////const line1 = (s?.bill_default_payment_desc_line_1 ?? '').trim();
      ////const line2 = (s?.bill_default_payment_desc_line_2 ?? '').trim();
      ////const line3 = (s?.bill_default_payment_desc_line_3 ?? '').trim();
      const line1 = item?.billPaymentDescLine1;
      const line2 = item?.billPaymentDescLine2;
      const line3 = item?.billPaymentDescLine3;

      const value1 = asNum(item?.billPaymentValueLine1);
      const value2 = asNum(item?.billPaymentValueLine2);
      const value3 = asNum(item?.billPaymentValueLine3);

      const bodyRows: [string, string][] = [
        [line1 || ' ', value1 ? PLN.format(value1) : ''],
        [line2 || ' ', value2 ? PLN.format(value2) : ''],
        [line3 || ' ', value3 ? PLN.format(value3) : ''],
      ];

      const anyValueProvided = [value1, value2, value3].some(v => v > 0);
      const linesTotal = anyValueProvided ? (value1 + value2 + value3) : fallbackTotal;

      autoTable(doc, {
        startY: metaY + 10,//15,
        margin: { left: innerX, right: pageW - (innerX + innerW) },
        tableWidth: innerW,
        head: [[
          { content: 'Nazwa', styles: { halign: 'left' } },
          { content: 'Wartość', styles: { halign: 'right' } },
        ]],
        body: bodyRows,
        foot: [[
          { content: 'Suma:', styles: { halign: 'right' } },
          { content: PLN.format(linesTotal), styles: { halign: 'right' } },
        ]],
        theme: 'grid',
        styles: { font: 'Roboto-Regular', fontSize: 10, textColor: 0, cellPadding: 2, lineWidth: 0.2, lineColor: [120, 120, 120] },
        headStyles: { font: 'Roboto-Bold', fontStyle: 'normal', fillColor: [235, 235, 235], textColor: 0 },
        footStyles: { font: 'Roboto-Bold', fontStyle: 'normal', fillColor: [245, 245, 245], textColor: 0 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: { 0: { cellWidth: innerW - 38 }, 1: { cellWidth: 38, halign: 'right' } },
      });

      const afterTable = (doc as any).lastAutoTable.finalY + 4;
      printLeftLabelValue(doc, 'Słownie', slowniePL(linesTotal), left + 4, afterTable);
      if (comment) doc.text(comment, left + 4, afterTable + 10);
      printRightLabelValue(doc, '....................................', '', right - padR, afterTable + 30);
      doc.setFontSize(9);
      doc.text('(podpis)', right - 15, afterTable + 33, { align: 'right' });
      doc.setFontSize(10);

      doc.setLineWidth(0.4);
      doc.rect(left, yStart, boxW, frameH); //main frame
      doc.setLineWidth(0.2);
    };

    renderSection(margin, '- Oryginał -');

    doc.setDrawColor(160);
    doc.setLineWidth(0.2);
    (doc as any).setLineDash?.([2, 2], 0);
    doc.line(margin, midline, pageW - margin, midline);
    (doc as any).setLineDash?.([] as any, 0);

    renderSection(midline + margin, '- Kopia -');

    const filenameBase = `rachunek-${billNo || 'dokument'}`;
    const filename = suffixPdfName ? `${filenameBase}_${suffixPdfName}.pdf` : `${filenameBase}.pdf`;
    if (download) {
      doc.save(filename);
    }
    return { blob: doc.output('blob'), filename };
}
