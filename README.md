# Quran-SW

A modern Islamic application for Quran reading, prayer times, and daily Adkar reminders.

## Features

- 📖 Quran reading with Surah details
- 🕌 Prayer times display with current location
- 📿 Daily Adkar (remembrance of Allah)
- 🙏 Prayer tracking
- 👤 User profile and authentication
- 🌍 Multi-location support

## Color Palette

### Primary Colors

| Color | Hex Code | Tailwind Class | Usage |
|-------|----------|---|---|
| Teal (Primary) | `#0d766e` | `teal-700` | Active prayer cards, icons, text, navigation |
| White | `#ffffff` | `white` | Backgrounds, text on dark backgrounds |

### Secondary Colors

| Color | Hex Code | Tailwind Class | Usage |
|-------|----------|---|---|
| Light Gray | `#f3f4f6` | `gray-100` | Card backgrounds |
| Gray Border | `#e5e7eb` | `gray-200` | Card borders, dividers |
| Dark Gray | `#374151` | `gray-700` | Text on light backgrounds |
| Light Text | `#d1d5db` | `gray-300` | Secondary text |

### Component Color Usage

#### Prayer Time Cards

**Active Card (Current Prayer):**
```
Background: Teal (#0d766e)
Text: White (#ffffff)
Border: Teal (#0d766e)
Icon: White (#ffffff)
```

**Inactive Cards:**
```
Background: White (#ffffff)
Text: Teal (#0d766e)
Border: Light Gray (#e5e7eb)
Icon: Teal (#0d766e)
```

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
