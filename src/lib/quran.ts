// Quran API helper functions

export interface QuranVerse {
  surahNumber: number;
  surahName: string;
  englishName: string;
  ayahNumber: number; // Ayah number within the surah
  absoluteAyahNumber: number; // Absolute ayah number in entire Quran (for audio)
  text: string;
  translation: string;
}

export interface QuranResponse {
  code: string;
  status: string;
  data: {
    number: number;
    name: string;
    englishName: string;
    numberOfAyahs: number;
    revelationType: string;
    ayahs: Array<{
      number: number;
      text: string;
      numberInSurah: number;
      juz: number;
      manzil: number;
      page: number;
      ruku: number;
      hizbQuarter: number;
      sajdah: boolean;
    }>;
  };
}

// Get a daily verse based on the day of the year
export async function getDailyVerse(): Promise<QuranVerse> {
  try {
    // Calculate verse number based on day of year (to ensure different verse each day)
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Total Quran verses is approximately 6236
    const verseNumber = (dayOfYear % 6236) + 1;

    // Fetch verse from Al-Quran Cloud API
    const response = await fetch(
      `https://api.alquran.cloud/v1/ayah/${verseNumber}?offset=0&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch verse');
    }

    const data: any = await response.json();
    
    if (data.code !== 200 || !data.data) {
      throw new Error('Invalid response from Quran API');
    }

    const ayah = data.data;
    
    // Fetch English translation
    const translationResponse = await fetch(
      `https://api.alquran.cloud/v1/ayah/${verseNumber}/en.asad?offset=0&limit=1`
    );
    
    const translationData: any = await translationResponse.json();
    const translation = translationData.data?.text || 'Translation not available';

    return {
      surahNumber: ayah.surah.number,
      surahName: ayah.surah.englishName,
      englishName: ayah.surah.englishNameTranslation,
      ayahNumber: ayah.numberInSurah,
      absoluteAyahNumber: verseNumber, // Use the verseNumber we calculated, which is the absolute position
      text: ayah.text,
      translation: translation
    };
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    // Fallback verse
    return {
      surahNumber: 94,
      surahName: 'Ash-Sharh',
      englishName: 'The Opening Up',
      ayahNumber: 5,
      absoluteAyahNumber: 6185,
      text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
      translation: 'For indeed, with hardship [will be] ease.'
    };
  }
}

// Get Islamic holidays for the current Hijri year
export const ISLAMIC_HOLIDAYS_DATA = [
  { name: 'Islamic New Year', arabicName: 'رأس السنة الهجرية', hijri: { month: 1, day: 1 }, type: 'Major' },
  { name: 'Prophet\'s Birthday', arabicName: 'مولد النبي', hijri: { month: 3, day: 12 }, type: 'Major' },
  { name: 'Ramadan Begins', arabicName: 'بداية رمضان', hijri: { month: 9, day: 1 }, type: 'Major' },
  { name: 'Eid al-Fitr', arabicName: 'عيد الفطر', hijri: { month: 10, day: 1 }, type: 'Major' },
  { name: 'Arafat Day', arabicName: 'يوم عرفة', hijri: { month: 12, day: 9 }, type: 'Major' },
  { name: 'Eid al-Adha', arabicName: 'عيد الأضحى', hijri: { month: 12, day: 10 }, type: 'Major' },
];

// Get audio URL for a specific ayah using backend proxy
export async function getAyahAudio(ayahNumber: number): Promise<string | null> {
  try {
    // Use local backend proxy to bypass CORS
    return `/api/quran/audio/${ayahNumber}`;
  } catch (error) {
    console.error('Error preparing Quran audio:', error);
    return null;
  }
}

// Get Adhan audio URL
export function getAdhanAudio(): string {
  // Using a free high-quality Adhan audio
  // This is a popular Adhan from Islamic Network
  return 'https://cdn.islamic.network/quran/recitations/azan_ar_abdulbasitmubarakpuri/ar_abdulbasitmubarakpuri.mp3';
}

// Check if current time matches a prayer time (within 1 minute window)
export function isPrayerTime(prayerTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = prayerTime.split(':').map(Number);
  
  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0);
  
  // Check if current time is within 1 minute of prayer time
  const timeDiff = Math.abs(now.getTime() - prayerDate.getTime());
  const minutesDiff = timeDiff / (1000 * 60);
  
  return minutesDiff < 1;
}

// Get the next prayer time
export function getNextPrayerTime(timings: Record<string, string>): { name: string; time: string } | null {
  const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  for (const prayer of prayerOrder) {
    if (timings[prayer] && timings[prayer] > currentTime) {
      return { name: prayer, time: timings[prayer] };
    }
  }
  
  // If no prayer found today, next is Fajr tomorrow
  return { name: 'Fajr', time: timings['Fajr'] };
}

// Filter holidays that haven't passed yet in the current Hijri year
export const getUpcomingHolidays = (currentMonth: number, currentDay: number, limit: number = 4) => {
  // First, get all holidays that haven't passed in the current year
  const upcoming = ISLAMIC_HOLIDAYS_DATA.filter(h => {
    if (h.hijri.month > currentMonth) return true;
    if (h.hijri.month === currentMonth && h.hijri.day >= currentDay) return true;
    return false;
  }).sort((a, b) => {
    if (a.hijri.month !== b.hijri.month) return a.hijri.month - b.hijri.month;
    return a.hijri.day - b.hijri.day;
  });

  // If not enough upcoming holidays in current year, add from next year
  if (upcoming.length < limit) {
    const remaining = ISLAMIC_HOLIDAYS_DATA
      .sort((a, b) => {
        if (a.hijri.month !== b.hijri.month) return a.hijri.month - b.hijri.month;
        return a.hijri.day - b.hijri.day;
      })
      .slice(0, limit - upcoming.length);
    return [...upcoming, ...remaining];
  }

  return upcoming.slice(0, limit);
};

// Request notification permission from user
export async function requestNotificationPermission(): Promise<void> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }
  
  if (Notification.permission === 'granted') {
    return;
  }
  
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }
}

// Show a prayer notification
export async function showPrayerNotification(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: '/logo/trans_logo_1.png',
        badge: '/logo/trans_logo_1.png',
        tag: 'prayer-notification',
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

