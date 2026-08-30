import { RestaurantSettings, StoreStatusInfo } from '../types';

export const THAI_DAY_NAMES = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
];

export const THAI_DAY_SHORT_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const EN_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Parses "HH:mm" into minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Returns formatted time string e.g. "14:30"
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = (totalMinutes + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates current real-time store status based on:
 * 1. Master manual toggle (`settings.isOpen`)
 * 2. Auto schedule setting (`settings.autoScheduleEnabled`)
 * 3. Weekly closed days (`settings.weeklyClosedDays`)
 * 4. Special holiday calendar (`settings.specialHolidays`)
 * 5. Operating hours (`settings.openTime` - `settings.closeTime`)
 */
export function getStoreStatus(settings: RestaurantSettings, referenceDate = new Date()): StoreStatusInfo {
  const dayIndex = referenceDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  const todayDayName = THAI_DAY_NAMES[dayIndex];
  const todayISODate = formatDateISO(referenceDate);
  
  const currentHours = referenceDate.getHours();
  const currentMinutes = referenceDate.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

  const openMinutes = timeStringToMinutes(settings.openTime || '10:30');
  const closeMinutes = timeStringToMinutes(settings.closeTime || '22:00');

  // 1. Manual switch is forced closed
  if (!settings.isOpen) {
    return {
      isOpen: false,
      status: 'closed_manual',
      statusText: 'ร้านปิดชั่วคราว (Manual Closed)',
      statusDetail: settings.closedMessage || 'ทางร้านปิดรับออเดอร์ชั่วคราว กรุณาติดต่อทางร้านโดยตรง',
      nextOpenText: 'จะเปิดทำการเร็วๆ นี้',
      todayDayName,
      currentTimeStr,
    };
  }

  // If auto schedule is disabled, respect the manual isOpen = true
  if (!settings.autoScheduleEnabled) {
    return {
      isOpen: true,
      status: 'open',
      statusText: 'เปิดรับออเดอร์ตลอด 24 ชม. (โหมดกำหนดเอง)',
      statusDetail: `เปิดให้บริการ (เวลาเปิด-ปิด: ${settings.openTime || '10:30'} - ${settings.closeTime || '22:00'})`,
      nextOpenText: `เปิดอยู่ (ถึง ${settings.closeTime || '22:00'} น.)`,
      todayDayName,
      currentTimeStr,
    };
  }

  // 2. Check Special Holiday for today's date
  const matchedHoliday = settings.specialHolidays?.find((h) => h.date === todayISODate);
  if (matchedHoliday) {
    return {
      isOpen: false,
      status: 'closed_special_holiday',
      statusText: `ปิดทำการ: ${matchedHoliday.title}`,
      statusDetail: matchedHoliday.note ? `${matchedHoliday.title} (${matchedHoliday.note})` : matchedHoliday.title,
      nextOpenText: `เปิดทำการวันถัดไป เวลา ${settings.openTime || '10:30'} น.`,
      todayDayName,
      currentTimeStr,
    };
  }

  // 3. Check Weekly Closed Day (e.g. Closed every Monday)
  const isWeeklyHoliday = settings.weeklyClosedDays?.includes(dayIndex);
  if (isWeeklyHoliday) {
    return {
      isOpen: false,
      status: 'closed_weekly_holiday',
      statusText: `ร้านปิดประจำสัปดาห์ (${todayDayName})`,
      statusDetail: `ร้านหยุดประจำทุก${todayDayName} ขออภัยในความไม่สะดวก`,
      nextOpenText: `เปิดทำการวันถัดไป เวลา ${settings.openTime || '10:30'} น.`,
      todayDayName,
      currentTimeStr,
    };
  }

  // 4. Check Operating Hours (Normal open vs overnight)
  let isWithinHours = false;
  if (closeMinutes >= openMinutes) {
    // Normal same-day hours (e.g. 10:30 to 22:00)
    isWithinHours = currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;
  } else {
    // Overnight hours (e.g. 17:00 to 02:00 next day)
    isWithinHours = currentTotalMinutes >= openMinutes || currentTotalMinutes < closeMinutes;
  }

  if (!isWithinHours) {
    const isBeforeOpening = currentTotalMinutes < openMinutes;
    return {
      isOpen: false,
      status: 'closed_hours',
      statusText: `ร้านปิดอยู่นอกเวลาทำการ (${settings.openTime} - ${settings.closeTime})`,
      statusDetail: `เวลาให้บริการวันนี้คือ ${settings.openTime} - ${settings.closeTime} น. (ขณะนี้เวลา ${currentTimeStr} น.)`,
      nextOpenText: isBeforeOpening
        ? `เปิดวันนี้เวลา ${settings.openTime} น.`
        : `เปิดวันพรุ่งนี้เวลา ${settings.openTime} น.`,
      todayDayName,
      currentTimeStr,
    };
  }

  // 5. Open and within hours
  return {
    isOpen: true,
    status: 'open',
    statusText: `เปิดให้บริการ (${settings.openTime} - ${settings.closeTime} น.)`,
    statusDetail: `ยินดีต้อนรับ! เปิดรับออเดอร์จนถึง ${settings.closeTime} น.`,
    nextOpenText: `ปิดเวลา ${settings.closeTime} น.`,
    todayDayName,
    currentTimeStr,
  };
}
