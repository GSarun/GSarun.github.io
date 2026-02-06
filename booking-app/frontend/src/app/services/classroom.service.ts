import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Classroom {
    id?: string;
    name: string;
    capacity: number;
    seat_layout?: any; // JSONB
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClassroomService {
    private supabase: SupabaseClient;

    constructor(private supabaseService: SupabaseService) {
        this.supabase = this.supabaseService.supabase;
    }

    async getClassrooms(): Promise<any> {
        return this.supabase
            .from('classrooms')
            .select('*')
            .order('created_at', { ascending: false }) as any;
    }

    async getClassroomById(id: string): Promise<any> {
        return this.supabase
            .from('classrooms')
            .select('*')
            .eq('id', id)
            .single() as any;
    }

    async createClassroom(classroom: Classroom): Promise<any> {
        return this.supabase
            .from('classrooms')
            .insert(classroom)
            .select()
            .single() as any;
    }

    async updateClassroom(id: string, updates: Partial<Classroom>): Promise<any> {
        return this.supabase
            .from('classrooms')
            .update(updates)
            .eq('id', id)
            .select()
            .single() as any;
    }

    async deleteClassroom(id: string): Promise<any> {
        return this.supabase
            .from('classrooms')
            .delete()
            .eq('id', id) as any;
    }
}
