import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface Schedule {
    id?: string;
    subject_id: string;
    classroom_id?: string;
    start_booking?: string;
    end_booking?: string;
    // Joins
    subjects?: { title: string };
    classrooms?: { name: string, capacity: number, seat_layout: any };
}

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {
    private supabase: SupabaseClient;

    constructor(private supabaseService: SupabaseService) {
        this.supabase = this.supabaseService.supabase;
    }

    async getAvailableSchedules(): Promise<any> {
        const now = new Date().toISOString();
        return this.supabase
            .from('schedules')
            .select(`
        *,
        subjects (title),
        classrooms (name, capacity, seat_layout)
      `)
            .gt('end_booking', now) // Only future classes
            .order('start_booking', { ascending: true }) as any;
    }

    async getScheduleById(id: string): Promise<any> {
        return this.supabase
            .from('schedules')
            .select(`
        *,
        subjects (title),
        classrooms (name, capacity, seat_layout)
      `)
            .eq('id', id)
            .single();
    }

    async createSchedule(schedule: any): Promise<any> {
        return this.supabase
            .from('schedules')
            .insert(schedule)
            .select()
            .single();
    }
    async updateSchedule(id: string, schedule: any): Promise<any> {
        return this.supabase
            .from('schedules')
            .update(schedule)
            .eq('id', id)
            .select()
            .single();
    }

    async deleteSchedule(id: string): Promise<any> {
        return this.supabase
            .from('schedules')
            .delete()
            .eq('id', id);
    }
}
