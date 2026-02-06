# Booking App Development Plan

## 1. Project Overview & Architecture
- **Goal**: ระบบจองที่นั่งเรียน (Course & Seat Booking)
- **Stack**: 
  - **Frontend**: Angular/Vue (hosting on GitHub Pages)
  - **Backend**: No Backend (Serverless via Supabase)
  - **Database**: Supabase (PostgreSQL)
  - **Auth & Realtime**: Supabase

## 2. Phase 1: Database & Backend Setup (Supabase)
- [ ] **Create Supabase Project**
- [ ] **Design Database Schema**
    - [ ] **`classrooms`** (ห้องเรียน)
        - `id` (uuid, pk)
        - `name` (text) : ชื่อห้อง (e.g., Lab 1)
        - `capacity` (int) : ความจุ
        - `seat_layout` (jsonb) : เก็บพิกัด/ผังที่นั่ง (Row/Col)
    - [ ] **`subjects`** (วิชาเรียน)
        - `id` (uuid, pk)
        - `title` (text) : ชื่อวิชา (e.g., Physics)
    - [ ] **`schedules`** (ตารางสอน - เชื่อม วิชา+ห้อง+เวลา)
        - `id` (uuid, pk)
        - `subject_id` (fk -> subjects)
        - `classroom_id` (fk -> classrooms)
        - `start_time` / `end_time` (timestamptz) : เวลาเรียน
        - `start_booking` / `end_booking` (timestamptz) : เวลาเปิดจอง
    - [ ] **`bookings`** (ประวัติการจอง)
        - `id` (uuid, pk)
        - `schedule_id` (fk -> schedules)
        - `user_id` (fk -> auth.users)
        - `seat_number` (text) : เลขที่นั่ง (e.g., A1)
        - `created_at` (timestamptz)
    - [ ] **`profiles`** (ข้อมูลผู้ใช้)
        - `id` (uuid, pk, references auth.users)
        - `role` (text) : 'student' | 'admin'
        - `display_name` (text)
        - `phone` (text)

- [ ] **Configure Security (RLS Policies)**
    - [ ] `schedules`: Enable `SELECT` for public (anon).
    - [ ] `bookings`: Enable `INSERT` only for authenticated users (`auth.uid() = user_id`).

- [ ] **Setup Real-time Updates**
    - [ ] Enable Replication for `bookings` and `schedules` tables (allows live seat updates).

## 3. Phase 2: Frontend Foundation
- [ ] **Initialize Project** (Angular or Vue)
- [ ] **Setup Dependencies**
    - Install `supabase-js` client
- [ ] **Setup Deployment**
    - Create GitHub Actions workflow (`.github/workflows/deploy.yml`) for auto-deploy to GitHub Pages.

## 4. Phase 3: Core Features Implementation
### 3.1 Authentication
- [ ] **Login System**: Google Login or Magic Link via Supabase Auth.
- [ ] **Role Management**: Handle Admin vs Student views.

### 3.2 Admin Features (Back-office)
- [ ] **Classroom Management**
    - [ ] List views & Add/Edit forms (Name, Capacity).
    - [ ] *Optional*: Visual layout builder.
- [ ] **Schedule Management**
    - [ ] Create class schedules (Assign Subject to Room & Time).
    - [ ] Dashboard for overview.

### 3.3 Student Features (Booking Flow)
- [ ] **Course List / Calendar**: View available subjects.
- [ ] **Seat Selection (The "Advance" Feature)**
    - [ ] Render Interactive Layout using **CSS Grid**.
    - [ ] **Real-time Status**: Show Red (Taken) / Green (Available) instantly.
    - [ ] **Booking Action**: Select seat -> Insert into `bookings`.

### 3.4 Instructor Dashboard
- [ ] **Class Overview**: View student list per class.

## 5. Phase 4: Extras & Polish
- [ ] **Notifications**: Email or Line Notify confirmation.
- [ ] **UI/UX**: Responsive design ensuring mobile usage.