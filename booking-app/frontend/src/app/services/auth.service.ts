import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase: SupabaseClient;

    // Signals for reactive state
    currentUser = signal<User | null>(null);
    session = signal<Session | null>(null);
    profile = signal<any>(null);

    constructor(private supabaseService: SupabaseService, private router: Router) {
        this.supabase = this.supabaseService.supabase;
        this.initializeAuth();
    }

    private async initializeAuth() {
        // Check initial session
        const { data } = await this.supabase.auth.getSession();
        this.handleAuthChange(data.session);

        // Listen for changes
        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.handleAuthChange(session);
        });
    }

    private async handleAuthChange(session: Session | null) {
        console.log('Auth Change:', session); // DEBUG
        this.session.set(session);
        this.currentUser.set(session?.user ?? null);

        if (session?.user) {
            this.fetchProfile(session.user.id);
        } else {
            this.profile.set(null);
        }
    }

    async fetchProfile(userId: string) {
        console.log('Fetching Profile for:', userId); // DEBUG
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single() as any;

        if (error) {
            console.error('Profile Fetch Error:', error); // DEBUG
        }
        if (data) {
            console.log('Profile Data:', data); // DEBUG
            this.profile.set(data);
        }
    }

    async register(username: string, phone: string, fullName: string, password: string) {
        // Generate dummy email
        const email = `${username}@local.temp`;

        return this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    full_name: fullName,
                    phone // phone number
                }
            }
        });
    }

    async login(username: string, password: string) {
        const email = `${username}@local.temp`;
        return this.supabase.auth.signInWithPassword({
            email,
            password
        });
    }

    // Deprecated/Removed Magic Link
    // async signInWithEmail(email: string) { ... }

    async signOut() {
        await this.supabase.auth.signOut();
        this.router.navigate(['/']);
    }

    isLoggedIn() {
        return !!this.session();
    }
}
