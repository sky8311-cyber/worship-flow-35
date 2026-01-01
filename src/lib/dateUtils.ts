// Timezone utilities for user-specific date/time formatting

/**
 * Parse a date string (YYYY-MM-DD) as a local date without UTC conversion.
 * This prevents timezone offset issues where dates appear as the previous day.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const COMMON_TIMEZONES = [
  { value: 'Asia/Seoul', label: '서울 (UTC+9)', labelEn: 'Seoul (UTC+9)' },
  { value: 'Asia/Tokyo', label: '도쿄 (UTC+9)', labelEn: 'Tokyo (UTC+9)' },
  { value: 'Asia/Shanghai', label: '상하이 (UTC+8)', labelEn: 'Shanghai (UTC+8)' },
  { value: 'Asia/Singapore', label: '싱가포르 (UTC+8)', labelEn: 'Singapore (UTC+8)' },
  { value: 'America/Los_Angeles', label: 'LA (UTC-7/-8)', labelEn: 'Los Angeles (UTC-7/-8)' },
  { value: 'America/New_York', label: '뉴욕 (UTC-4/-5)', labelEn: 'New York (UTC-4/-5)' },
  { value: 'America/Chicago', label: '시카고 (UTC-5/-6)', labelEn: 'Chicago (UTC-5/-6)' },
  { value: 'Europe/London', label: '런던 (UTC+0/+1)', labelEn: 'London (UTC+0/+1)' },
  { value: 'Europe/Paris', label: '파리 (UTC+1/+2)', labelEn: 'Paris (UTC+1/+2)' },
  { value: 'Australia/Sydney', label: '시드니 (UTC+10/+11)', labelEn: 'Sydney (UTC+10/+11)' },
  { value: 'Pacific/Auckland', label: '오클랜드 (UTC+12/+13)', labelEn: 'Auckland (UTC+12/+13)' },
  { value: 'UTC', label: 'UTC', labelEn: 'UTC' },
];

export function formatInUserTimezone(
  date: Date | string,
  timezone: string = 'Asia/Seoul',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Intl.DateTimeFormat('ko-KR', defaultOptions).format(dateObj);
}

export function getTimezoneOffset(timezone: string): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value || timezone;
  } catch {
    return timezone;
  }
}

export function getSystemTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getTimezoneDisplayName(timezone: string, language: 'ko' | 'en' = 'ko'): string {
  const tz = COMMON_TIMEZONES.find((t) => t.value === timezone);
  if (tz) {
    return language === 'ko' ? tz.label : tz.labelEn;
  }
  // Return timezone value with offset if not in common list
  const offset = getTimezoneOffset(timezone);
  return `${timezone} (${offset})`;
}
