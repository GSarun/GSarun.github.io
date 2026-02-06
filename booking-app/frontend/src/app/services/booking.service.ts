import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Booking {
    id?: string;
    schedule_id: string;
    user_id: string;
    seat_number: string;
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private supabase: SupabaseClient;

    constructor(
        private supabaseService: SupabaseService,
        private authService: AuthService
    ) {
        this.supabase = this.supabaseService.supabase;
    }

    async getBookingsBySchedule(scheduleId: string): Promise<any> {
        return this.supabase
            .from('bookings')
            .select(`
                *,
                profiles (
                    display_name,
                    username,
                    phone
                )
            `)
            .eq('schedule_id', scheduleId)
            .neq('status', 'rejected') as any;
    }

    async getMyBookings(): Promise<any> {
        const user = this.authService.currentUser();
        if (!user) return { data: [], error: 'Not logged in' };

        return this.supabase
            .from('bookings')
            .select(`
        *,
        schedules (
          start_booking,
          end_booking,
          subjects (title),
          classrooms (name)
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }) as any;
    }

    async createBooking(scheduleId: string, seatNumber: string): Promise<any> {
        const user = this.authService.currentUser();
        if (!user) throw new Error('You must be logged in to book.');

        return this.supabase
            .from('bookings')
            .insert({
                schedule_id: scheduleId,
                user_id: user.id,
                seat_number: seatNumber
            })
            .select()
            .single() as any;
    }

    async cancelBooking(bookingId: string): Promise<any> {
        return this.supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId) as any;
    }

    async updateBookingStatus(bookingId: string, status: 'confirmed' | 'rejected'): Promise<any> {
        return this.supabase
            .from('bookings')
            .update({ status })
            .eq('id', bookingId) as any;
    }

    subscribeToSchedule(scheduleId: string, callback: () => void) {
        return this.supabase
            .channel(`public:bookings:schedule_id=eq.${scheduleId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `schedule_id=eq.${scheduleId}`
                },
                (payload) => {
                    console.log('Realtime Update:', payload);
                    callback();
                }
            )
            .subscribe();
    }

    subscribeToMyBookings(userId: string, callback: () => void) {
        return this.supabase
            .channel(`my-bookings-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings'
                },
                (payload: any) => {
                    // Check if the change relates to this user
                    const isMyBooking =
                        (payload.new && payload.new.user_id === userId) ||
                        (payload.old && payload.old.user_id === userId);

                    if (isMyBooking) {
                        console.log('My Bookings Update:', payload);
                        callback();
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to realtime stats for user:', userId);
                }
            });
    }
}
