export type CalculationMethod = 2 | 3 | 4 | 5; // ISNA | MWL | Umm Al-Qura | Egypt
export type School = 0 | 1; // 0: Shafi, 1: Hanafi

export interface HijriDate {
  hy: number;
  hm: number;
  hd: number;
}

export interface TimingsResponse {
  code: number;
  status: string;
  data: {
    timings: Record<string, string>;
    date: {
      readable: string;
      timestamp: string;
      hijri?: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
          ar: string;
        };
        month: {
          number: number;
          en: string;
          ar: string;
        };
        year: string;
      };
    };
    meta: {
      timezone: string;
      method: { name: string; id: number };
      latitude: number;
      longitude: number;
      school: number;
    };
  };
}

export interface PrayerTimesResult {
  timings: Record<string, string>;
  dateReadable: string;
  timezone: string;
  methodName: string;
  latitude: number;
  longitude: number;
  hijri?: HijriDate;
}

export async function getPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  options?: { method?: CalculationMethod; school?: School; date?: Date }
): Promise<PrayerTimesResult> {
  const method = options?.method ?? 3; // default MWL
  const school = options?.school ?? 0; // default Shafi

  // Aladhan API `timings` endpoint for today. It auto-detects timezone.
  const url = new URL('https://api.aladhan.com/v1/timings');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('method', String(method));
  url.searchParams.set('school', String(school));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch prayer times: ${res.status}`);
  }

  const json = (await res.json()) as TimingsResponse;
  if (json.code !== 200 || !json.data) {
    throw new Error('Unexpected response from prayer times API');
  }

  const { timings, date, meta } = json.data;
  
  // Extract Hijri date from API response
  let hijri: HijriDate | undefined
  if (date.hijri) {
    hijri = {
      hy: parseInt(date.hijri.year),
      hm: date.hijri.month.number,
      hd: parseInt(date.hijri.day)
    }
  }
  
  return {
    timings,
    dateReadable: date.readable,
    timezone: meta.timezone,
    methodName: json.data.meta.method?.name ?? 'Unknown',
    latitude: meta.latitude,
    longitude: meta.longitude,
    hijri,
  };
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 60_000,
    });
  });
}

export const METHOD_OPTIONS: Array<{ label: string; value: CalculationMethod }> = [
  { label: 'Muslim World League (MWL)', value: 3 },
  { label: 'ISNA (North America)', value: 2 },
  { label: 'Umm Al-Qura (Makkah)', value: 4 },
  { label: 'Egyptian General Authority', value: 5 },
];

export const SCHOOL_OPTIONS: Array<{ label: string; value: School }> = [
  { label: 'Shafi (Default)', value: 0 },
  { label: 'Hanafi', value: 1 },
];

export type NextPrayerInfo = {
  name: string;
  time: string; // HH:mm
  millisUntil: number;
};

// Given timings object and timezone, determine next upcoming prayer name/time.
export function computeNextPrayer(
  timings: Record<string, string>
): NextPrayerInfo | null {
  const order = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const now = new Date();

  // Helper to parse HH:mm in provided timezone.
  const toMillis = (hhmm: string): number => {
    const [hhStr, mmStr] = hhmm.split(':');
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    const d = new Date(now);
    d.setHours(hh, mm, 0, 0);
    return d.getTime();
  };

  const nowMillis = now.getTime();
  let candidate: NextPrayerInfo | null = null;
  for (const name of order) {
    const t = timings[name];
    if (!t) continue;
    const millis = toMillis(t);
    if (millis > nowMillis) {
      candidate = { name, time: t, millisUntil: millis - nowMillis };
      break;
    }
  }

  // If none left today, next is tomorrow's Fajr (approx): return Isha as last with negative
  if (!candidate && timings['Fajr']) {
    const millis = toMillis(timings['Fajr']);
    // Add a day to get tomorrow's Fajr approx
    const tomorrowMillis = millis + 24 * 60 * 60 * 1000;
    candidate = { name: 'Fajr', time: timings['Fajr'], millisUntil: tomorrowMillis - nowMillis };
  }
  return candidate;
}
