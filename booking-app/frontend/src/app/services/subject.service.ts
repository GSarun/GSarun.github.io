import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface Subject {
    id?: string;
    title: string;
    description?: string;
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    private supabase: SupabaseClient;

    constructor(private supabaseService: SupabaseService) {
        this.supabase = this.supabaseService.supabase;
    }

    async getSubjects(): Promise<any> {
        return this.supabase
            .from('subjects')
            .select('*')
            .order('title') as any;
    }

    async createSubject(subject: Subject): Promise<any> {
        return this.supabase
            .from('subjects')
            .insert(subject)
            .select()
            .single() as any;
    }

    async updateSubject(id: string, subject: Partial<Subject>): Promise<any> {
        return this.supabase
            .from('subjects')
            .update(subject)
            .eq('id', id)
            .select()
            .single() as any;
    }

    async deleteSubject(id: string): Promise<any> {
        return this.supabase
            .from('subjects')
            .delete()
            .eq('id', id) as any;
    }
}
