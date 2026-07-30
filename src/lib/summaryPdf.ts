import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export type SummaryRow = { label: string; value: string };

/**
 * A clean, clinical A4 layout for the recovery summary — the printable/shareable
 * PDF a member can hand to a GP. Deliberately plain and honest: an explicit
 * reporting period, plain counts, and a clear self-report caveat. Uses only
 * system fonts so it renders identically wherever it's opened. The screening
 * questionnaire (e.g. AUDIT-C) can be appended to `rows` later with no change
 * to this layout.
 */
export function buildSummaryHtml(opts: {
  name: string;
  rangeLabel: string;
  periodLabel: string;
  generatedOn: string;
  rows: SummaryRow[];
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const rowsHtml = opts.rows
    .map(
      (r) => `
      <tr>
        <td class="label">${esc(r.label)}</td>
        <td class="value">${esc(r.value)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    color: #1c1a22;
    margin: 0;
    padding: 40px 44px;
    -webkit-print-color-adjust: exact;
  }
  .eyebrow {
    font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    color: #8a83a0; font-weight: 700;
  }
  h1 { font-size: 26px; margin: 4px 0 2px; letter-spacing: -0.01em; }
  .meta { color: #5c5670; font-size: 13px; margin-top: 2px; }
  .rule { height: 3px; background: #B9A4EC; border-radius: 2px; margin: 16px 0 22px; width: 56px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 11px 0; font-size: 14px; border-bottom: 1px solid #ece9f1; vertical-align: top; }
  td.label { color: #3d3850; }
  td.value { text-align: right; font-weight: 700; white-space: nowrap; padding-left: 18px; }
  tr:last-child td { border-bottom: none; }
  .caveat {
    margin-top: 26px; padding-top: 16px; border-top: 1px solid #ece9f1;
    color: #6a6480; font-size: 11.5px; line-height: 1.6;
  }
</style>
</head>
<body>
  <div class="eyebrow">Alchono · Recovery summary</div>
  <h1>${esc(opts.name)}</h1>
  <div class="meta">Reporting period: ${esc(opts.rangeLabel)} (${esc(opts.periodLabel)})</div>
  <div class="meta">Generated: ${esc(opts.generatedOn)}</div>
  <div class="rule"></div>

  <table>
    ${rowsHtml}
  </table>

  <div class="caveat">
    Figures are self-reported by the member from the Alchono app and reflect what
    was logged during the reporting period. Personal journals and private
    conversations are not included. This summary is intended to support a
    conversation with a healthcare professional, not to replace clinical assessment.
  </div>
</body>
</html>`;
}

/**
 * Render the HTML to a PDF file and open the share sheet (print, save to Files,
 * email, etc.). Returns silently if sharing isn't available on the device.
 */
export async function exportSummaryPdf(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Your recovery summary',
    });
  }
}
