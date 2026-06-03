import "server-only";
import QRCode from "qrcode";

/**
 * QR rendering for badge printing. Defaults tuned for the BNI NatCon spec:
 * dark ink on white card, ~25mm print area, error-correction Q (handles smudges
 * and physical wear without scanner regressions).
 */

export interface RenderOptions {
  /** Pixel width of the output. */
  width?: number;
  /** Margin in modules. */
  margin?: number;
  /** Hex color for dark modules. */
  dark?: string;
  /** Hex color for light modules. */
  light?: string;
}

const defaultOpts = {
  width: 512,
  margin: 2,
  dark: "#050505",
  light: "#FFFFFF",
} satisfies Required<RenderOptions>;

function merge(opts: RenderOptions | undefined) {
  return { ...defaultOpts, ...(opts ?? {}) };
}

/**
 * Render a QR token as an inline SVG string (no `<?xml?>` header). Good for
 * embedding in React server components or PDF generation pipelines.
 */
export async function renderQrSvg(token: string, opts?: RenderOptions): Promise<string> {
  const o = merge(opts);
  return QRCode.toString(token, {
    type: "svg",
    errorCorrectionLevel: "Q",
    width: o.width,
    margin: o.margin,
    color: { dark: o.dark, light: o.light },
  });
}

/**
 * Render a QR token as a PNG buffer. Suitable for `Content-Type: image/png`
 * responses in `/api/qr/[participant_code]/route.ts`.
 */
export async function renderQrPng(token: string, opts?: RenderOptions): Promise<Buffer> {
  const o = merge(opts);
  return QRCode.toBuffer(token, {
    type: "png",
    errorCorrectionLevel: "Q",
    width: o.width,
    margin: o.margin,
    color: { dark: o.dark, light: o.light },
  });
}

/**
 * Render as a data URL for direct `<img src=...>` use in client components.
 */
export async function renderQrDataUrl(token: string, opts?: RenderOptions): Promise<string> {
  const o = merge(opts);
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "Q",
    width: o.width,
    margin: o.margin,
    color: { dark: o.dark, light: o.light },
  });
}
