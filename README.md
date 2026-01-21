# Quran SW - Islamic Learning Platform

A comprehensive Islamic learning application built with React, TypeScript, and Vite. Features Quranic recitations, prayer times, Islamic calendar, Qibla finder, radio streams, and more.

## 🌟 Features

- **📖 Quran Reading**: Full Quran text with multiple Qira'at (recitation styles)
  - Hafs (عن عاصم) - Most common recitation
  - Warsh (عن نافع) - Popular in North & West Africa
  
- **🎵 Audio Playback**: 10 professional Quranic reciters
  1. Abdul Basit (Mujawwad)
  2. Abdul Basit (Murattal)
  3. Abdullah Al Juhany
  4. Abu Bakr Al Shatri
  5. Abu Bakr Al Shatri 2
  6. Ali Al Hudhaifi
  7. Mishari Rashid Al Afasy
  8. Maher Al Meaqli
  9. Muhammad Ayyub
  10. Yasser Ad Dussary

- **🕌 Prayer Times**: Accurate Islamic prayer times based on location
- **📅 Islamic Calendar**: Track Islamic holidays and events
- **🧭 Qibla Finder**: Real-time Qibla direction using device location
- **📻 Quran Radio**: Live Islamic radio streams
- **🌙 Adkar**: Islamic supplications and remembrances
- **👤 Profile**: User preferences and settings
- **📱 Responsive Design**: Mobile-friendly interface

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Router** - Client-side routing

### Backend
- **Express.js** - Node.js web server
- **Node-fetch** - ES module HTTP client
- **CORS** - Cross-Origin Resource Sharing

### Database
- **Supabase** - PostgreSQL backend (for authentication)

## 📡 APIs & Data Sources

### Quranic Text & Metadata
- **Al-Quran Cloud API** (`https://api.alquran.cloud`)
  - Quranic text in multiple recitations (Warsh, Hafs)
  - Surah metadata and information
  - Ayah details and numbering

- **Quran.com API** (`https://api.quran.com`)
  - Uthmani script text
  - Verses with translations
  - Alternative recitation sources

### Audio Sources

#### 1. **EveryAyah.com** (`https://everyayah.com/data/`)
   Used for 8 reciters:
   - `Abdul_Basit_Mujawwad_128kbps/`
   - `Abdul_Basit_Murattal_192kbps/`
   - `Abdurrahmaan_As-Sudais_192kbps/`
   - `Abu_Bakr_Ash-Shaatree_128kbps/`
   - `Hudhaify_128kbps/`
   - `Alafasy_128kbps/`
   - `MaherAlMuaiqly128kbps/`
   - `Yasser_Ad-Dussary_128kbps/`
   
   Format: `https://everyayah.com/data/{folder}/{chapter}{verse}.mp3`

#### 2. **Islamic Network CDN** (`https://cdn.islamic.network`)
   Used for:
   - Muhammad Ayyub: `https://cdn.islamic.network/quran/audio/128/ar.muhammadayyoub/{ayahNumber}.mp3`
   - Default (Alafasy): `https://cdn.islamic.network/quran/audio/128/ar.alafasy/{ayahNumber}.mp3`

### Prayer Times
- **PrayerTimes.js Library** - Calculation library for accurate prayer times
- Device location (via Geolocation API) for timezone-aware calculations

### Other Services
- **Radio Streams** - Islamic radio live streams from various providers

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Quran-SW
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with Supabase credentials (if using authentication):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

### Running the Project

#### Development Mode (Frontend + Audio Proxy)
```bash
npm run dev:full
```
This starts both:
- Frontend Vite server: `http://localhost:5173`
- Audio proxy server: `http://localhost:3001`

#### Frontend Only
```bash
npm run dev
```

#### Audio Proxy Server Only
```bash
npm run server
```

#### Production Build
```bash
npm run build
```

#### Preview Build
```bash
npm run preview
```

## 📁 Project Structure

```
Quran-SW/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navigation.tsx
│   │   ├── LiveMiniPlayer.tsx
│   │   ├── RadioMiniPlayer.tsx
│   │   └── QiblaFinder.tsx
│   ├── contexts/            # React Context for state management
│   │   └── LiveContext.ts
│   ├── hooks/               # Custom React hooks
│   │   └── useLive.ts
│   ├── lib/                 # Utility functions
│   │   ├── quran.ts        # Quran API helpers
│   │   ├── prayerTimes.ts  # Prayer times calculations
│   │   └── supabase.ts     # Supabase client
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Quran.tsx
│   │   ├── SurahDetail.tsx
│   │   ├── Prayers.tsx
│   │   ├── Calendar.tsx
│   │   ├── QiblaMap.tsx
│   │   ├── Radio.tsx
│   │   ├── Live.tsx
│   │   ├── Adkar.tsx
│   │   └── Profile.tsx
│   ├── providers/           # Context providers
│   │   ├── AuthProvider.tsx
│   │   ├── LiveProvider.tsx
│   │   └── RadioProvider.tsx
│   ├── store/              # State management (Zustand)
│   │   └── auth.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server.js               # Express audio proxy server
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔄 Audio Proxy Server

The Express.js proxy server (`server.js`) handles:
- **CORS bypassing** - Allows audio fetching from third-party CDNs
- **Caching headers** - Sets appropriate cache-control for performance
- **Audio streaming** - Proxies audio from various CDN sources

### Endpoint
```
GET /api/quran/audio/:ayahNumber?reciter={reciter_param}
```

**Parameters:**
- `ayahNumber` - Absolute ayah number (1-6236)
- `reciter` - Optional reciter identifier:
  - `muhammadayyoub` - Routes to Islamic Network CDN

**Response:**
- Returns audio/mpeg stream with CORS headers set to `*`

## 🎨 Customization

### Reciter Audio Sources
To add a new reciter:

1. **If using EveryAyah.com folder:**
   - Add reciter to `RECITERS` array in `SurahDetail.tsx`
   - Add folder mapping in `reciterFoldersRef`
   - Ensure folder exists at `https://everyayah.com/data/{folder_name}/`

2. **If using custom CDN:**
   - Add logic in `server.js` for proxy routing
   - Update `SurahDetail.tsx` to construct correct URLs

### Prayer Times Calculation
Prayer times are calculated in `src/lib/prayerTimes.ts` based on:
- User's geolocation (latitude/longitude)
- Current date
- Islamic calculation methods

### Color Palette

#### Primary Colors

| Color | Hex Code | Tailwind Class | Usage |
|-------|----------|---|---|
| Teal (Primary) | `#0d766e` | `teal-700` | Active prayer cards, icons, text, navigation |
| White | `#ffffff` | `white` | Backgrounds, text on dark backgrounds |

#### Secondary Colors

| Color | Hex Code | Tailwind Class | Usage |
|-------|----------|---|---|
| Light Gray | `#f3f4f6` | `gray-100` | Card backgrounds |
| Gray Border | `#e5e7eb` | `gray-200` | Card borders, dividers |
| Dark Gray | `#374151` | `gray-700` | Text on light backgrounds |
| Light Text | `#d1d5db` | `gray-300` | Secondary text |

## 🔐 Authentication

Uses **Supabase** for:
- User registration and login
- Profile data storage
- User preferences persistence

## 📊 Performance Optimizations

- **Audio pre-loading** - Next verse loads while current plays
- **Seamless playback** - Eliminates ~0.5s gap between verses
- **Cached reciter folders** - Reduces iterations and improves speed
- **Dual audio elements** - Enables smooth transitions
- **Inline error handling** - Skips errors gracefully

## 🐛 Known Issues & Solutions

### Issue: 404 errors on Yasser Ad Dussary audio
- **Solution**: Use correct folder name `Yasser_Ad-Dussary_128kbps` (hyphen, not underscore)

### Issue: CORS errors on Quran.com API
- **Solution**: Route through audio proxy server for CORS handling

## 📝 Development Notes

### Key Implementation Details

1. **Absolute vs Relative Ayah Numbers**
   - Al-Quran Cloud API returns ayah numbers within surah
   - Quran.com API returns absolute ayah numbers
   - Audio CDNs use absolute numbers for file naming

2. **Reciter-Specific Handling**
   - ID 9 (Muhammad Ayyub): Proxied from Islamic Network CDN
   - IDs 1-8, 10: Direct from EveryAyah.com
   - Proper fallback for missing/unavailable audio

3. **State Management**
   - React hooks for component-level state
   - Context API for shared state (Auth, Live, Radio)
   - Ref objects for non-rendering state (audio elements, refs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

[Add your license information here]

## 📞 Contact & Support

[Add contact information here]

## 🙏 Acknowledgments

- Al-Quran Cloud for Quranic text data
- Quran.com for recitation metadata
- EveryAyah.com for audio hosting
- Islamic Network for CDN hosting
- All Quranic reciters and their families

---

**Last Updated**: January 21, 2026
**Version**: 1.0.0

#### Navigation
- Primary Color: Teal (#0d766e)
- Text: White on teal background

#### Hero Section
- Background: Gradient with dark overlay
- Text: White

## Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Font**: Amiri Quran (for Arabic text in Uthmani script)
- **Backend**: Supabase
- **State Management**: Custom Auth Provider

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── lib/                # Utility libraries (prayer times, Supabase)
├── providers/          # Context providers (Auth)
├── store/              # State management (Auth store)
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Font Guidelines

### Arabic Text
- Use **Amiri Quran** font for Quranic verses
- Apply right-to-left text direction with `text-right` class
- Example: `style={{ fontFamily: "'Amiri Quran', serif" }}`

### English Text
- Use serif font for prayer times and numbers
- Use sans-serif for labels and UI text

## License

MIT
