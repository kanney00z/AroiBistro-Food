import { Order, RestaurantSettings } from '../types';

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
 * Builds a luxury restaurant LINE Flex Message for Orders
 */
export function buildOrderFlexMessage(
  order: Order,
  settings: RestaurantSettings,
  isRoundAdd?: boolean
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

    // Special Instructions
    if (item.specialInstructions) {
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
    altText: `${roundText} #${order.orderNumber} ${tableText} (${formatTHB(order.total)})`,
    contents: flexBubble,
  };
}

/**
 * Builds a Test Flex Message for LINE
 */
export function buildTestFlexMessage(settings: RestaurantSettings): any {
  const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return {
    type: 'flex',
    altText: `🔔 ทดสอบการแจ้งเตือน LINE จาก ${settings.name || 'AroiBistro'}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#161618',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: 'LINE NOTIFICATION CONNECTED',
            size: 'xxs',
            color: '#10B981',
            weight: 'bold',
          },
          {
            type: 'text',
            text: '✨ ระบบแจ้งเตือนพร้อมใช้งาน',
            size: 'lg',
            color: '#FFFFFF',
            weight: 'bold',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0D0D0E',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: `การเชื่อมต่อ LINE Messaging API กับร้าน "${settings.name}" สำเร็จสมบูรณ์แล้ว!`,
            size: 'xs',
            color: '#E7E5E4',
            wrap: true,
          },
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#161618',
            cornerRadius: '10px',
            paddingAll: '12px',
            spacing: 'xs',
            contents: [
              {
                type: 'text',
                text: `🏪 ร้านค้า: ${settings.name}`,
                size: 'xs',
                color: '#FF5C00',
                weight: 'bold',
              },
              {
                type: 'text',
                text: `🕒 เวลาทดสอบ: ${now} น.`,
                size: 'xs',
                color: '#A8A29E',
              },
              {
                type: 'text',
                text: '🚀 เมื่อมีลูกค้าสั่งอาหารหรือสั่งเพิ่ม ระบบจะส่งการ์ดสรุปรายการอาหารเข้า LINE นี้โดยอัตโนมัติ',
                size: 'xxs',
                color: '#78716C',
                wrap: true,
                margin: 'xs',
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
            text: 'AroiBistro Food Ordering System',
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
 * Sends a message via server endpoint `/api/line/notify` or direct LINE API fallback
 */
export async function sendLineFlexMessage(
  flexMessage: any,
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

  // 1. Try sending via backend server API route first
  try {
    const response = await fetch('/api/line/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        targetId: targetId?.trim() || undefined,
        messages: [flexMessage],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'ส่งการแจ้งเตือนเข้า LINE สำเร็จ!',
        statusCode: response.status,
        response: data,
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn('Backend /api/line/notify failed with status:', response.status, errData);
    }
  } catch (err: any) {
    console.warn('Backend proxy /api/line/notify not reachable, attempting direct fallback...', err);
  }

  // 2. Direct fallback (e.g. if running in standalone static environment)
  try {
    const isPush = Boolean(targetId && targetId.trim());
    const lineEndpoint = isPush
      ? 'https://api.line.me/v2/bot/message/push'
      : 'https://api.line.me/v2/bot/message/broadcast';

    const payload = isPush
      ? { to: targetId!.trim(), messages: [flexMessage] }
      : { messages: [flexMessage] };

    const directRes = await fetch(lineEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (directRes.ok) {
      return {
        success: true,
        message: 'ส่งการแจ้งเตือนเข้า LINE เรียบร้อยแล้ว (Direct API)!',
        statusCode: directRes.status,
      };
    } else {
      const errText = await directRes.text();
      return {
        success: false,
        message: `LINE API Error (${directRes.status}): ${errText}`,
        statusCode: directRes.status,
      };
    }
  } catch (e: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${e.message || e}`,
    };
  }
}
