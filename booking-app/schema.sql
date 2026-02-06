-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT CHECK (role IN ('student', 'admin', 'instructor')) DEFAULT 'student',
  username TEXT UNIQUE,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, email, username)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    'student', 
    new.email,
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. CLASSROOMS
CREATE TABLE public.classrooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    seat_layout JSONB DEFAULT '[]'::jsonb, -- Stores grid layout e.g. [{row: 1, col: 1, label: 'A1'}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBJECTS
CREATE TABLE public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SCHEDULES
CREATE TABLE public.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    start_booking TIMESTAMPTZ,
    end_booking TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKINGS
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL, -- e.g. "A1"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(schedule_id, seat_number), -- Prevent double booking of same seat
    UNIQUE(schedule_id, user_id) -- Prevent multiple bookings by same user
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles: Public read, Self update
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classrooms/Subjects/Schedules: Read public, Write Admin only
-- (For simplicity, assuming 'admin' check or just allowing read for now. 
-- In real app, add check for profiles.role = 'admin' for mutations)
CREATE POLICY "Classrooms are viewable by everyone" ON public.classrooms FOR SELECT USING (true);
CREATE POLICY "Admins can insert classrooms" ON public.classrooms FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can update classrooms" ON public.classrooms FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can delete classrooms" ON public.classrooms FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Subjects are viewable by everyone" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can insert subjects" ON public.subjects FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can update subjects" ON public.subjects FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can delete subjects" ON public.subjects FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Schedules are viewable by everyone" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Admins can insert schedules" ON public.schedules FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can update schedules" ON public.schedules FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
CREATE POLICY "Admins can delete schedules" ON public.schedules FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- Bookings: 
-- Read: Viewable by everyone (to see taken seats)
CREATE POLICY "Bookings are viewable by everyone" ON public.bookings FOR SELECT USING (true);

-- Insert: Authenticated users can book for themselves
CREATE POLICY "Users can create their own bookings" ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Delete: Users can cancel their own bookings
CREATE POLICY "Users can delete their own bookings" ON public.bookings FOR DELETE 
USING (auth.uid() = user_id);


-- REALTIME REPLICATION
-- Run this in SQL Editor to enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
