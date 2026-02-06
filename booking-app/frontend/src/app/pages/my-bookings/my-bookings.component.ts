import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">การจองของฉัน (My Bookings)</h1>

      <div *ngIf="loading" class="text-center py-10">
        <p class="text-gray-500">กำลังโหลด...</p>
      </div>

      <div *ngIf="!loading && bookings.length === 0" class="bg-white p-8 rounded-lg shadow text-center">
        <p class="text-gray-500 text-lg mb-4">คุณยังไม่มีการจองในขณะนี้</p>
      </div>

      <div *ngIf="!loading && bookings.length > 0" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let booking of bookings" class="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-500">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-800">{{ booking.schedules?.subjects?.title || 'Unknown Subject' }}</h3>
                <p class="text-gray-600">{{ booking.schedules?.classrooms?.name }}</p>
              </div>
              <div class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                ที่นั่ง {{ booking.seat_number }}
              </div>
            </div>
            
            <div class="mb-4">
               <span [class]="booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" class="px-2.5 py-0.5 rounded text-xs font-semibold">
                  {{ booking.status === 'confirmed' ? 'อนุมัติแล้ว' : 'รออนุมัติ' }}
               </span>
            </div>
            
            <div class="mb-4 text-sm text-gray-500">
              <p>ช่วงเวลาจอง:</p>
              <p class="font-semibold">{{ booking.schedules?.start_booking | date:'d MMM y HH:mm' }} - {{ booking.schedules?.end_booking | date:'d MMM y HH:mm' }}</p>
            </div>

            <button 
              [disabled]="booking.status === 'confirmed'"
              (click)="cancelBooking(booking)" 
              [class]="booking.status === 'confirmed' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'"
              class="w-full font-semibold py-2 px-4 rounded transition duration-200"
            >
              {{ booking.status === 'confirmed' ? 'ไม่สามารถยกเลิกได้' : 'ยกเลิกการจอง' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  bookingService = inject(BookingService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  bookings: any[] = [];
  loading = true;
  subscription: any;

  ngOnInit() {
    this.loadBookings();
    this.subscribeToBookings();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  subscribeToBookings() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.subscription = this.bookingService.subscribeToMyBookings(user.id, () => {
      // Refresh when any change occurs (approved, rejected, or deleted)
      this.loadBookings();
    });
  }

  async loadBookings() {
    try {
      this.loading = true;
      const { data, error } = await this.bookingService.getMyBookings();
      if (error) throw error;
      this.bookings = data || [];
    } catch (error: any) {
      console.error(error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async cancelBooking(booking: any) {
    if (booking.status === 'confirmed') {
      alert('การจองนี้ได้รับการอนุมัติแล้ว ไม่สามารถยกเลิกได้ กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?')) return;

    try {
      const { error } = await this.bookingService.cancelBooking(booking.id);
      if (error) throw error;

      // No need to reload here manually if subscription works, but safe to keep or rely on realtime
      // await this.loadBookings(); 
    } catch (error: any) {
      alert(error.message);
    }
  }
}
