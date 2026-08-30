import QRCode from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generates a PNG Data URL string for the given text/URL
 */
export async function generateQrDataUrl(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const {
    width = 300,
    margin = 2,
    darkColor = '#000000',
    lightColor = '#ffffff',
  } = options;

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'H',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

/**
 * Builds the direct customer ordering URL with table parameter
 */
export function buildTableOrderUrl(tableNumber: string): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const cleanTable = encodeURIComponent(tableNumber);
  return `${origin}${pathname}?table=${cleanTable}`;
}

/**
 * Builds the direct general storefront menu ordering URL
 */
export function buildStorefrontOrderUrl(): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?mode=order`;
}

/**
 * Triggers a download of a base64 data URL
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
