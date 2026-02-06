import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    phone: string;
    role: 'admin' | 'student';
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private supabase: SupabaseClient;

    constructor(private supabaseService: SupabaseService) {
        this.supabase = this.supabaseService.supabase;
    }

    async getUsers(): Promise<any> {
        return this.supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
    }

    async getUserById(id: string): Promise<any> {
        return this.supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
    }

    async updateUser(id: string, updates: Partial<UserProfile>): Promise<any> {
        console.log('Update User Payload:', updates); // DEBUG
        const result = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (result.error) {
            console.error('Update User Error:', result.error);

            // Check for "0 rows" error which usually means RLS blocked the update
            if (result.error.code === 'PGRST116') {
                throw new Error('Access Denied: You do not have permission to update this user. Check Database RLS Policies.');
            }

            console.error('Update User Details:', result.error.details, result.error.hint, result.error.message);
        }
        return result;
    }

    async deleteUser(id: string): Promise<any> {
        return this.supabase
            .from('profiles')
            .delete()
            .eq('id', id);
    }

    async adminResetPassword(userId: string, newPassword: string): Promise<any> {
        return this.supabase.rpc('admin_reset_password', {
            target_user_id: userId,
            new_password: newPassword
        });
    }
}
