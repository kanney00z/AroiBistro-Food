import { Order, RestaurantSettings } from '../types';
import { uploadSlipToSupabase } from './supabaseService';

export interface LineSendResult {
  success: boolean;
  message: string;
  statusCode?: number;
  response?: any;
}

/**
 * Formats Thai currency
 */
function formatTHB(val: number): string {
  return `฿${Number(val || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Converts or uploads a base64 slip image to a publicly accessible HTTPS URL
 * so that LINE Messaging API can fetch and display it in LINE chats.
 */
export async function uploadSlipImageToPublicUrl(slipImage: string): Promise<string | null> {
  if (!slipImage || typeof slipImage !== 'string') return null;

  // 1. If it is already a public HTTPS URL, return directly
  if (slipImage.startsWith('https://') || slipImage.startsWith('http://')) {
    return slipImage;
  }

  if (!slipImage.includes('base64')) {
    return null;
  }

  const rawBase64 = slipImage.includes('base64,') ? slipImage.split('base64,')[1] : slipImage;
  const isPng = slipImage.includes('image/png');
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const fileExt = isPng ? 'png' : 'jpg';

  // Helper to convert base64 to Blob in browser or Node
  let imageBlob: Blob | null = null;
  try {
    const byteCharacters = atob(rawBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    imageBlob = new Blob([byteArray], { type: mimeType });
  } catch (err) {
    console.warn('Failed to parse base64 slip:', err);
  }

  // 2. Primary Provider: Litterbox (Temporary 72-hour fast public HTTPS direct image CDN)
  if (imageBlob) {
    try {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('time', '72h');
      formData.append('fileToUpload', imageBlob, `slip_${Date.now()}.${fileExt}`);

      const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const text = await res.text();
        if (text && (text.startsWith('https://') || text.startsWith('http://'))) {
          const directUrl = text.trim();
          return directUrl;
        }
      }
    } catch (err) {
      console.warn('Litterbox upload error, trying Uguu fallback:', err);
    }
  }

  // 3. Secondary Provider: Uguu.se (Fast public HTTPS direct image host)
  if (imageBlob) {
    try {
      const formData = new FormData();
      formData.append('files[]', imageBlob, `slip_${Date.now()}.${fileExt}`);

      const res = await fetch('https://uguu.se/upload.php', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.files?.[0]?.url) {
          return data.files[0].url;
        }
      }
    } catch (err) {
      console.warn('Uguu upload error, trying Supabase fallback:', err);
    }
  }

  // 4. Provider: Supabase Storage (if configured)
  try {
    const supabaseUrl = await uploadSlipToSupabase(slipImage);
    if (supabaseUrl) {
      return supabaseUrl;
    }
  } catch (err) {
    console.warn('Supabase storage fallback error:', err);
  }

  // 5. Provider: Local / Custom Domain backend /api/upload-slip
  try {
    const res = await fetch('/api/upload-slip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: slipImage }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Backend /api/upload-slip fallback error:', err);
  }

  return null;
}

/**
 * Builds a luxury restaurant LINE Flex Message for Orders
 */
export function buildOrderFlexMessage(
  order: Order,
  settings: RestaurantSettings,
  isRoundAdd?: boolean,
  slipPublicUrl?: string
): any {
  const isDineIn = order.orderType === 'dine_in';
  const tableText = isDineIn ? (order.tableNumber ? `โต๊ะ ${order.tableNumber}` : 'ทานที่ร้าน (โต๊ะไม่ระบุ)') : 'สั่งกลับบ้าน (Takeaway)';
  const roundText = order.roundsCount && order.roundsCount > 1 
    ? `🍳 สั่งเพิ่ม (รอบที่ ${order.roundsCount})` 
    : '🔔 ออเดอร์ใหม่';

  const orderTimeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const orderDateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Build items contents
  const itemRows: any[] = [];

  order.items.forEach((item, index) => {
    // Main item row
    itemRows.push({
      type: 'box',
      layout: 'horizontal',
      margin: index === 0 ? 'none' : 'md',
      contents: [
        {
          type: 'text',
          text: `${item.quantity}x`,
          size: 'sm',
          color: '#FF5C00',
          weight: 'bold',
          flex: 1,
        },
        {
          type: 'text',
          text: item.menuItem?.name || item.customDishDetails?.customName || 'รายการอาหาร',
          size: 'sm',
          color: '#FFFFFF',
          weight: 'bold',
          wrap: true,
          flex: 6,
        },
        {
          type: 'text',
          text: formatTHB(item.itemTotal),
          size: 'sm',
          color: '#FBBF24',
          weight: 'bold',
          align: 'end',
          flex: 3,
        },
      ],
    });

    // Options subtext
    const optionStrings: string[] = [];
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((opt) => {
        optionStrings.push(`${opt.choiceName}${opt.priceDelta > 0 ? ` (+${opt.priceDelta}฿)` : ''}`);
      });
    }

    if (item.packagingType === 'takeaway' && isDineIn) {
      optionStrings.push('📦 ห่อกลับบ้าน');
    }

    if (item.round && item.round > 1) {
      optionStrings.push(`⚡ รอบที่ ${item.round}`);
    }

    if (optionStrings.length > 0) {
      itemRows.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: ' ',
            flex: 1,
          },
          {
            type: 'text',
            text: `• ${optionStrings.join(', ')}`,
            size: 'xxs',
            color: '#A8A29E',
            wrap: true,
            flex: 9,
          },
        ],
      });
    }

    // Excluded ingredients / allergies
    if (item.excludedIngredients && item.excludedIngredients.length > 0) {
      itemRows.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: ' ',
            flex: 1,
          },
          {
            type: 'text',
            text: `🚫 ไม่ใส่: ${item.excludedIngredients.join(', ')}`,
            size: 'xxs',
            color: '#EF4444',
            weight: 'bold',
            wrap: true,
            flex: 9,
          },
        ],
      });
    }

    // Special instructions
    if (item.specialInstructions && item.specialInstructions.trim()) {
      itemRows.push({
        type: 'box',
        layout: 'horizontal',
        margin: 'xs',
        contents: [
          {
            type: 'text',
            text: ' ',
            flex: 1,
          },
          {
            type: 'text',
            text: `💬 โน้ต: ${item.specialInstructions}`,
            size: 'xxs',
            color: '#38BDF8',
            wrap: true,
            flex: 9,
          },
        ],
      });
    }
  });

  const paymentMethodTh =
    order.paymentMethod === 'promptpay'
      ? 'พร้อมเพย์ (PromptPay)'
      : order.paymentMethod === 'credit_card'
      ? 'บัตรเครดิต/เดบิต'
      : 'เงินสด (Cash)';

  const isPaid = order.paymentStatus === 'paid';
  const hasSlip = Boolean(order.slipImage || slipPublicUrl);

  const flexBubble = {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#161618',
      paddingAll: '16px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: (settings.name || 'AROI BISTRO').toUpperCase(),
              size: 'xxs',
              color: '#FF5C00',
              weight: 'bold',
              flex: 1,
            },
            {
              type: 'box',
              layout: 'horizontal',
              backgroundColor: isRoundAdd ? '#92400E' : '#065F46',
              cornerRadius: '8px',
              paddingStart: '8px',
              paddingEnd: '8px',
              paddingTop: '2px',
              paddingBottom: '2px',
              contents: [
                {
                  type: 'text',
                  text: roundText,
                  size: 'xxs',
                  color: isRoundAdd ? '#FDE68A' : '#A7F3D0',
                  weight: 'bold',
                },
              ],
            },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: `${isDineIn ? '🍽️' : '🛍️'} ${tableText}`,
              size: 'xl',
              color: '#FFFFFF',
              weight: 'bold',
              flex: 1,
            },
            {
              type: 'text',
              text: `#${order.orderNumber}`,
              size: 'lg',
              color: '#FF5C00',
              weight: 'bold',
              align: 'end',
            },
          ],
        },
        {
          type: 'text',
          text: `🕒 ${orderDateStr} • ${orderTimeStr} น.`,
          size: 'xs',
          color: '#78716C',
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#0D0D0E',
      paddingAll: '16px',
      contents: [
        // Customer info
        {
          type: 'box',
          layout: 'horizontal',
          backgroundColor: '#161618',
          cornerRadius: '10px',
          paddingAll: '10px',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              flex: 1,
              contents: [
                {
                  type: 'text',
                  text: `👤 ผู้สั่ง: ${order.customerName || 'ลูกค้าทั่วไป'}`,
                  size: 'xs',
                  color: '#FFFFFF',
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: `📞 เบอร์โทร: ${order.customerPhone || '-'}`,
                  size: 'xs',
                  color: '#A8A29E',
                  margin: 'xs',
                },
              ],
            },
            {
              type: 'box',
              layout: 'vertical',
              alignItems: 'flex-end',
              justifyContent: 'center',
              contents: [
                {
                  type: 'text',
                  text: isPaid ? '✓ จ่ายแล้ว' : '⏳ รอชำระ',
                  size: 'xxs',
                  color: isPaid ? '#10B981' : '#F59E0B',
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: paymentMethodTh,
                  size: 'xxs',
                  color: '#78716C',
                  margin: 'xs',
                },
                ...(hasSlip
                  ? [
                      {
                        type: 'text',
                        text: '🧾 แนบสลิปแล้ว ✓',
                        size: 'xxs',
                        color: '#34D399',
                        weight: 'bold',
                        margin: 'xs',
                      },
                    ]
                  : []),
              ],
            },
          ],
        },

        // Items Header
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: `📋 รายการอาหารทั้งหมด (${order.items.reduce((acc, i) => acc + i.quantity, 0)} ที่)`,
              size: 'xs',
              color: '#FF5C00',
              weight: 'bold',
            },
          ],
        },
        {
          type: 'separator',
          color: '#262626',
          margin: 'sm',
        },

        // Items List
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          contents: itemRows,
        },

        // General notes
        ...(order.notes
          ? [
              {
                type: 'box',
                layout: 'horizontal',
                backgroundColor: '#1E1B18',
                cornerRadius: '8px',
                paddingAll: '8px',
                margin: 'md' as const,
                contents: [
                  {
                    type: 'text',
                    text: `📝 หมายเหตุออเดอร์: ${order.notes}`,
                    size: 'xs',
                    color: '#F59E0B',
                    wrap: true,
                  },
                ],
              },
            ]
          : []),

        // Price Breakdown
        {
          type: 'separator',
          color: '#262626',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'ยอดรวมอาหาร (Subtotal)',
                  size: 'xs',
                  color: '#A8A29E',
                },
                {
                  type: 'text',
                  text: formatTHB(order.subtotal),
                  size: 'xs',
                  color: '#FFFFFF',
                  align: 'end',
                },
              ],
            },
            ...(order.discount > 0
              ? [
                  {
                    type: 'box',
                    layout: 'horizontal' as const,
                    contents: [
                      {
                        type: 'text',
                        text: `ส่วนลด (${order.promoCodeApplied || 'PROMO'})`,
                        size: 'xs',
                        color: '#10B981',
                      },
                      {
                        type: 'text',
                        text: `-${formatTHB(order.discount)}`,
                        size: 'xs',
                        color: '#10B981',
                        align: 'end',
                        weight: 'bold',
                      },
                    ],
                  },
                ]
              : []),
            ...(order.serviceCharge > 0
              ? [
                  {
                    type: 'box',
                    layout: 'horizontal' as const,
                    contents: [
                      {
                        type: 'text',
                        text: 'Service Charge (10%)',
                        size: 'xs',
                        color: '#A8A29E',
                      },
                      {
                        type: 'text',
                        text: formatTHB(order.serviceCharge),
                        size: 'xs',
                        color: '#FFFFFF',
                        align: 'end',
                      },
                    ],
                  },
                ]
              : []),
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'ยอดสุทธิ (Total)',
                  size: 'md',
                  color: '#FFFFFF',
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: formatTHB(order.total),
                  size: 'lg',
                  color: '#FF5C00',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
          ],
        },

        // Dedicated Slip Preview Section in Flex Message
        ...(hasSlip
          ? [
              {
                type: 'separator',
                color: '#262626',
                margin: 'lg' as const,
              },
              {
                type: 'box',
                layout: 'vertical' as const,
                backgroundColor: '#161618',
                cornerRadius: '12px',
                paddingAll: '12px',
                margin: 'md' as const,
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal' as const,
                    contents: [
                      {
                        type: 'text',
                        text: '🧾 รูปภาพสลิปโอนเงิน (PAYMENT SLIP)',
                        size: 'xs',
                        color: '#10B981',
                        weight: 'bold',
                        flex: 1,
                      },
                      {
                        type: 'text',
                        text: 'แนบแล้ว ✓',
                        size: 'xxs',
                        color: '#A7F3D0',
                        weight: 'bold',
                      },
                    ],
                  },
                  ...(slipPublicUrl
                    ? [
                        {
                          type: 'image',
                          url: slipPublicUrl,
                          size: 'full',
                          aspectRatio: '4:3',
                          aspectMode: 'cover',
                          margin: 'md',
                          action: {
                            type: 'uri',
                            uri: slipPublicUrl,
                          },
                        },
                        {
                          type: 'button',
                          style: 'secondary',
                          color: '#262626',
                          height: 'sm',
                          margin: 'sm',
                          action: {
                            type: 'uri',
                            label: '🔍 แตะเพื่อดูสลิปเต็มใบ (Full HD)',
                            uri: slipPublicUrl,
                          },
                        },
                      ]
                    : [
                        {
                          type: 'text',
                          text: '📌 ลูกค้าได้แนบรูปสลิปโอนเงินเข้าสู่ระบบแล้ว (ตรวจสอบภาพเต็มได้ที่หน้าจอ KDS/POS)',
                          size: 'xxs',
                          color: '#A8A29E',
                          margin: 'sm',
                          wrap: true,
                        },
                      ]),
                ],
              },
            ]
          : []),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#161618',
      paddingAll: '12px',
      contents: [
        {
          type: 'text',
          text: `⚡ แจ้งเตือนอัตโนมัติจากระบบครัว KDS • ${settings.name}`,
          size: 'xxs',
          color: '#78716C',
          align: 'center',
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `${roundText} #${order.orderNumber} ${tableText} (${formatTHB(order.total)})${hasSlip ? ' 🧾 มีสลิปแนบ' : ''}`,
    contents: flexBubble,
  };
}

/**
 * Builds a Test Flex Message for LINE
 */
export function buildTestFlexMessage(settings: RestaurantSettings, sampleSlipUrl?: string): any {
  const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const slipUrl = sampleSlipUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80';

  return {
    type: 'flex',
    altText: `🔔 ทดสอบการแจ้งเตือน LINE พร้อมสลิป จาก ${settings.name || 'AroiBistro'}`,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#161618',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: (settings.name || 'AROI BISTRO').toUpperCase(),
            size: 'xxs',
            color: '#10B981',
            weight: 'bold',
          },
          {
            type: 'text',
            text: '🔔 ทดสอบการแจ้งเตือนสำเร็จ!',
            size: 'lg',
            color: '#FFFFFF',
            weight: 'bold',
            margin: 'sm',
          },
          {
            type: 'text',
            text: `ส่งเมื่อเวลา ${now} น. • ระบบ LINE Messaging API & Flex Message พร้อมรูปสลิป`,
            size: 'xs',
            color: '#78716C',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0D0D0E',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'ระบบแจ้งเตือนออเดอร์พร้อมสลิปเข้า LINE ของร้านคุณทำงานได้สมบูรณ์แบบแล้ว 🎉',
            size: 'sm',
            color: '#D6D3D1',
            wrap: true,
          },
          {
            type: 'separator',
            color: '#262626',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'xs',
            contents: [
              {
                type: 'text',
                text: `📍 สาขา: ${settings.address || 'สาขาหลัก'}`,
                size: 'xs',
                color: '#A8A29E',
              },
              {
                type: 'text',
                text: `📞 ติดต่อ: ${settings.phone || '081-234-5678'}`,
                size: 'xs',
                color: '#A8A29E',
              },
            ],
          },
          {
            type: 'separator',
            color: '#262626',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#161618',
            cornerRadius: '12px',
            paddingAll: '12px',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: '🧾 ตัวอย่างสลิปโอนเงิน (PAYMENT SLIP)',
                    size: 'xs',
                    color: '#10B981',
                    weight: 'bold',
                    flex: 1,
                  },
                  {
                    type: 'text',
                    text: 'แนบแล้ว ✓',
                    size: 'xxs',
                    color: '#A7F3D0',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'image',
                url: slipUrl,
                size: 'full',
                aspectRatio: '4:3',
                aspectMode: 'cover',
                margin: 'md',
                action: {
                  type: 'uri',
                  uri: slipUrl,
                },
              },
              {
                type: 'button',
                style: 'secondary',
                color: '#262626',
                height: 'sm',
                margin: 'sm',
                action: {
                  type: 'uri',
                  label: '🔍 แตะเพื่อดูสลิปตัวอย่าง (Full HD)',
                  uri: slipUrl,
                },
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#161618',
        paddingAll: '12px',
        contents: [
          {
            type: 'text',
            text: 'AroiBistro Smart POS & KDS System 2026',
            size: 'xxs',
            color: '#78716C',
            align: 'center',
          },
        ],
      },
    },
  };
}

/**
 * Sends messages via server endpoint `/api/line/notify`, `/api/line-notify`, or CORS proxy fallback.
 * Supports sending single Flex Message or multiple messages (Flex + Image Message).
 */
export async function sendLineMessages(
  messagesPayload: any | any[],
  channelAccessToken?: string,
  targetId?: string
): Promise<LineSendResult> {
  const token =
    channelAccessToken?.trim() ||
    'XSOp1dJdNKEw9HGD7fRlN4VJX5fWYmS/EYXqWMMq5pHMtWXOizNLp5FEaNyDbmoalfFkqPBxbn/y9cEWse3hl5OEyUUkKZf9Ej/y2DO5+WLhuLDuIvlkx4LT+imCU+Ptl9kklN7nG1FRzPDemE73tgdB04t89/1O/w1cDnyilFU=';

  if (!token) {
    return {
      success: false,
      message: 'ไม่มี Channel Access Token สำหรับ LINE Messaging API',
    };
  }

  const messages = Array.isArray(messagesPayload) ? messagesPayload : [messagesPayload];

  const isPush = Boolean(targetId && targetId.trim());
  const lineEndpoint = isPush
    ? 'https://api.line.me/v2/bot/message/push'
    : 'https://api.line.me/v2/bot/message/broadcast';

  const linePayload = isPush
    ? { to: targetId!.trim(), messages }
    : { messages };

  // 1. Try sending via primary backend endpoint `/api/line/notify`
  try {
    const response = await fetch('/api/line/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        targetId: targetId?.trim() || undefined,
        messages,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || (isPush ? `ส่งแจ้งเตือนไปยัง (${targetId}) สำเร็จ!` : 'ส่งแจ้งเตือนเข้า LINE สำเร็จ!'),
        statusCode: response.status,
        response: data,
      };
    } else if (!response.ok && contentType.includes('application/json')) {
      const errData = await response.json();
      if (errData.message) {
        return {
          success: false,
          message: errData.message,
          statusCode: response.status,
        };
      }
    }
  } catch (err: any) {
    console.warn('Backend proxy /api/line/notify not reachable:', err);
  }

  // 2. Try secondary endpoint `/api/line-notify` (Vercel Serverless convention)
  try {
    const response2 = await fetch('/api/line-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        targetId: targetId?.trim() || undefined,
        messages,
      }),
    });

    const contentType2 = response2.headers.get('content-type') || '';
    if (response2.ok && contentType2.includes('application/json')) {
      const data = await response2.json();
      return {
        success: true,
        message: data.message || 'ส่งแจ้งเตือนเข้า LINE สำเร็จ!',
        statusCode: response2.status,
        response: data,
      };
    }
  } catch (err: any) {
    console.warn('Secondary /api/line-notify not reachable:', err);
  }

  // 3. Fallback for static hosts (using CORS Proxy to avoid browser CORS "Failed to fetch")
  const proxyEndpoints = [
    `https://corsproxy.io/?url=${encodeURIComponent(lineEndpoint)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(lineEndpoint)}`,
  ];

  for (const proxyUrl of proxyEndpoints) {
    try {
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(linePayload),
      });

      if (proxyRes.ok) {
        return {
          success: true,
          message: 'ส่งการแจ้งเตือนเข้า LINE เรียบร้อยแล้ว (ผ่าน Proxy)! 🔔',
          statusCode: proxyRes.status,
        };
      } else {
        const errText = await proxyRes.text();
        console.warn('Proxy response error:', proxyRes.status, errText);
      }
    } catch (e: any) {
      console.warn(`Proxy ${proxyUrl} failed:`, e);
    }
  }

  return {
    success: false,
    message: 'ไม่สามารถส่งข้อความเข้า LINE ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือ Channel Access Token',
  };
}

/**
 * Backward compatibility alias for sendLineMessages
 */
export const sendLineFlexMessage = sendLineMessages;

/**
 * High-level helper to send an order notification with attached slip image to LINE
 */
export async function sendOrderLineNotification(
  order: Order,
  settings: RestaurantSettings,
  isRoundAdd?: boolean
): Promise<LineSendResult> {
  if (settings.lineNotifyEnabled === false) {
    return {
      success: false,
      message: 'LINE Notify ปิดใช้งานอยู่ในการตั้งค่า',
    };
  }

  let slipPublicUrl: string | undefined = undefined;

  // If order has slip image, upload/convert to public HTTPS URL
  if (order.slipImage && typeof order.slipImage === 'string' && order.slipImage.trim().length > 0) {
    try {
      const uploadedUrl = await uploadSlipImageToPublicUrl(order.slipImage);
      if (uploadedUrl) {
        slipPublicUrl = uploadedUrl;
      }
    } catch (err) {
      console.warn('Failed to upload slip image for LINE notification:', err);
    }
  }

  const flexMessage = buildOrderFlexMessage(order, settings, isRoundAdd, slipPublicUrl);
  // Send single Flex Message containing the full receipt bill and embedded slip preview
  const messages: any[] = [flexMessage];

  return await sendLineMessages(messages, settings.lineChannelAccessToken, settings.lineTargetId);
}
