-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name VARCHAR,
  bio TEXT,
  image BYTEA,
  location VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR DEFAULT 'light',
  language VARCHAR DEFAULT 'en',
  prayer_notification BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Memorization progress table
CREATE TABLE IF NOT EXISTS memorization_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah_number INT NOT NULL,
  ayah_start INT NOT NULL,
  ayah_end INT NOT NULL,
  percentage INT DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adkar table
CREATE TABLE IF NOT EXISTS adkar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  text_arabic TEXT NOT NULL,
  text_english TEXT NOT NULL,
  category VARCHAR NOT NULL CHECK (category IN ('morning', 'evening', 'before_sleep', 'after_prayer')),
  repetitions INT DEFAULT 1,
  source VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prayer times table
CREATE TABLE IF NOT EXISTS prayer_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  location VARCHAR NOT NULL,
  fajr VARCHAR NOT NULL,
  dhuhr VARCHAR NOT NULL,
  asr VARCHAR NOT NULL,
  maghrib VARCHAR NOT NULL,
  isha VARCHAR NOT NULL,
  sunrise VARCHAR,
  sunset VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, location)
);

-- Surahs table
CREATE TABLE IF NOT EXISTS surahs (
  id INT PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  name_arabic VARCHAR NOT NULL,
  translation VARCHAR NOT NULL,
  ayahs INT NOT NULL,
  revelation_type VARCHAR NOT NULL CHECK (revelation_type IN ('meccan', 'medinan')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ayahs table
CREATE TABLE IF NOT EXISTS ayahs (
  id VARCHAR PRIMARY KEY,
  surah_id INT NOT NULL REFERENCES surahs(id) ON DELETE CASCADE,
  ayah_number INT NOT NULL,
  text_arabic TEXT NOT NULL,
  text_english TEXT NOT NULL,
  translation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_memorization_user_id ON memorization_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_adkar_category ON adkar(category);
CREATE INDEX IF NOT EXISTS idx_prayer_times_location_date ON prayer_times(location, date);
CREATE INDEX IF NOT EXISTS idx_ayahs_surah_id ON ayahs(surah_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorization_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE adkar ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayahs ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their preferences" ON user_preferences
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their preferences" ON user_preferences
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their memorization" ON memorization_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Public read access to prayer times and Quran data
CREATE POLICY "Public read access" ON prayer_times
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON surahs
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON ayahs
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON adkar
  FOR SELECT USING (true);
