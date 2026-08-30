import QRCode from 'qrcode';
import { QrOptions } from './qrCode';

/**
 * Calculates standard CRC16-CCITT checksum for EMVCo QR Code standard.
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
export function calculateCrc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Pads a string or number length to 2 digits for EMVCo TLV format.
 */
function pad2(val: number | string): string {
  return String(val).padStart(2, '0');
}

/**
 * Formats a single EMVCo Tag-Length-Value chunk.
 */
function formatTlv(tag: string, value: string): string {
  return `${tag}${pad2(value.length)}${value}`;
}

/**
 * Formats Thai PromptPay ID into proper standard format:
 * - Mobile Phone (10 digits starting with 0): converts to 0066XXXXXXXXX (13 digits)
 * - National ID / Tax ID (13 digits): sanitized 13 digits
 * - E-Wallet ID (15 digits): sanitized 15 digits
 */
export function sanitizePromptPayTarget(target: string): { type: 'phone' | 'citizenId' | 'eWallet'; formatted: string } {
  const digitsOnly = (target || '').replace(/\D/g, '');

  if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
    // 0821062891 -> 0066821062891
    return {
      type: 'phone',
      formatted: `0066${digitsOnly.substring(1)}`,
    };
  }

  if (digitsOnly.length === 9 && !digitsOnly.startsWith('0')) {
    // 821062891 -> 0066821062891
    return {
      type: 'phone',
      formatted: `0066${digitsOnly}`,
    };
  }

  if (digitsOnly.length === 13) {
    return {
      type: 'citizenId',
      formatted: digitsOnly,
    };
  }

  if (digitsOnly.length === 15) {
    return {
      type: 'eWallet',
      formatted: digitsOnly,
    };
  }

  // Fallback: If 10 digits or whatever, treat as mobile phone
  if (digitsOnly.length >= 9) {
    const cleanPhone = digitsOnly.startsWith('0') ? digitsOnly.substring(1) : digitsOnly;
    return {
      type: 'phone',
      formatted: `0066${cleanPhone}`,
    };
  }

  return {
    type: 'phone',
    formatted: `0066${digitsOnly.padEnd(9, '0')}`,
  };
}

/**
 * Generates an official EMVCo Thai PromptPay QR string payload.
 * Fully compatible with all Thai mobile banking apps (K PLUS, SCB Easy, Krungthai NEXT, KMA, Bangkok Bank, etc.).
 *
 * @param target PromptPay ID (e.g. "082-106-2891" or National ID)
 * @param amount Optional transfer amount in THB (e.g. 250.00)
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const { type, formatted } = sanitizePromptPayTarget(target);

  // 1. Format Indicator
  let payload = formatTlv('00', '01');

  // 2. Point of Initiation Method: 11 = Static (no amount), 12 = Dynamic (with amount)
  const isDynamic = typeof amount === 'number' && amount > 0;
  payload += formatTlv('01', isDynamic ? '12' : '11');

  // 3. Merchant Account Info (Tag 29 for PromptPay)
  // AID: A000000677010111
  let subTag = '';
  if (type === 'phone') {
    subTag = formatTlv('01', formatted); // 01 = Mobile
  } else if (type === 'citizenId') {
    subTag = formatTlv('02', formatted); // 02 = Citizen/Tax ID
  } else {
    subTag = formatTlv('03', formatted); // 03 = E-Wallet
  }

  const tag29Value = formatTlv('00', 'A000000677010111') + subTag;
  payload += formatTlv('29', tag29Value);

  // 4. Country Code: TH
  payload += formatTlv('58', 'TH');

  // 5. Currency: 764 (THB)
  payload += formatTlv('53', '764');

  // 6. Transaction Amount (if provided)
  if (isDynamic && amount) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTlv('54', formattedAmount);
  }

  // 7. Checksum (Tag 63)
  const toCalculate = `${payload}6304`;
  const checksum = calculateCrc16(toCalculate);

  return `${toCalculate}${checksum}`;
}

/**
 * Generates a PNG Data URL for a scannable PromptPay QR Code.
 */
export async function generatePromptPayQrDataUrl(
  target: string,
  amount?: number,
  options: QrOptions = {}
): Promise<string> {
  const payload = generatePromptPayPayload(target, amount);

  const {
    width = 360,
    margin = 1,
    darkColor = '#000000',
    lightColor = '#ffffff',
  } = options;

  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate PromptPay QR:', err);
    return '';
  }
}
