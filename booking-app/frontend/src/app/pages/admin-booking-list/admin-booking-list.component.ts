import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { ScheduleService } from '../../services/schedule.service';

@Component({
  selector: 'app-admin-booking-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <a routerLink="/schedules" class="text-blue-600 hover:text-blue-800 mb-4 inline-block">&larr; กลับไปหน้ารายการตารางเรียน</a>
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">รายชื่อผู้จอง (Booking List)</h1>
                <p class="text-gray-600 mt-2" *ngIf="schedule">
                    วิชา: <span class="font-semibold">{{ schedule.subjects?.title }}</span> | 
                    ห้อง: <span class="font-semibold">{{ schedule.classrooms?.name }}</span>
                </p>
            </div>
            <div class="mt-4 md:mt-0 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg" *ngIf="bookings.length > 0">
                <span class="font-bold text-xl">{{ bookings.length }}</span> ที่นั่งถูกจองแล้ว
            </div>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-10">
        <p class="text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>

      <div *ngIf="!loading && schedule" class="flex flex-col lg:flex-row gap-8 mb-8">
        <!-- Visual Layout -->
        <div class="lg:w-1/2 bg-white p-6 rounded-lg shadow-md">
           <h2 class="text-xl font-bold text-gray-800 mb-4">ผังที่นั่ง (Seat Map)</h2>
           
           <div class="flex justify-center mb-6">
            <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + cols + ', minmax(0, 1fr))'">
              <div
                *ngFor="let seat of seats"
                [class]="getSeatClass(seat)"
                class="h-10 w-10 flex items-center justify-center rounded border font-bold text-xs relative group cursor-default"
              >
                {{ seat.label }}
                
                <!-- Tooltip -->
                <div *ngIf="seat.booking" class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {{ seat.booking.profiles?.display_name }} ({{ seat.booking.status }})
                </div>
              </div>
            </div>
           </div>

           <div class="flex justify-center gap-4 text-xs">
            <div class="flex items-center gap-1">
              <div class="h-3 w-3 rounded bg-green-100 border border-green-500"></div> ว่าง
            </div>
            <div class="flex items-center gap-1">
              <div class="h-3 w-3 rounded bg-red-100 border border-red-500"></div> จองแล้ว (Confirmed)
            </div>
            <div class="flex items-center gap-1">
              <div class="h-3 w-3 rounded bg-yellow-100 border border-yellow-500"></div> รออนุมัติ (Pending)
            </div>
          </div>
        </div>

        <!-- Booking List Table -->
        <div class="lg:w-1/2 bg-white rounded-lg shadow-md overflow-hidden">
             <div *ngIf="bookings.length === 0" class="p-8 text-center text-gray-500 border-l-4 border-gray-300">
                ยังไม่มีการจองสำหรับวิชานี้
             </div>
             
             <table *ngIf="bookings.length > 0" class="min-w-full leading-normal">
              <thead>
                <tr>
                  <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ที่นั่ง
                  </th>
                  <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ผู้จอง
                  </th>
                  <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th class="px-4 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let booking of bookings">
                  <td class="px-4 py-4 border-b border-gray-200 bg-white text-sm font-bold text-blue-600">
                    {{ booking.seat_number }}
                  </td>
                  <td class="px-4 py-4 border-b border-gray-200 bg-white text-sm">
                     <div class="flex flex-col">
                        <span class="font-medium text-gray-900">{{ booking.profiles?.display_name || '-' }}</span>
                        <span class="text-xs text-gray-500">{{ booking.profiles?.phone }}</span>
                     </div>
                  </td>
                  <td class="px-4 py-4 border-b border-gray-200 bg-white text-sm">
                    <span [class]="getStatusClass(booking.status)">
                        {{ booking.status === 'confirmed' ? 'อนุมัติ' : 'รอ' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 border-b border-gray-200 bg-white text-sm text-right">
                    <button 
                        *ngIf="booking.status !== 'confirmed'"
                        (click)="confirmBooking(booking.id)" 
                        class="text-green-600 hover:text-green-900 font-semibold mr-2"
                        title="อนุมัติ"
                    >
                        &#10003;
                    </button>
                    <button 
                        (click)="cancelBooking(booking.id)" 
                        class="text-red-600 hover:text-red-900 font-semibold"
                        title="ยกเลิก"
                    >
                        &#10005;
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
      </div>
    </div>
  `
})
export class AdminBookingListComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  bookingService = inject(BookingService);
  scheduleService = inject(ScheduleService);
  cdr = inject(ChangeDetectorRef);

  scheduleId: string | null = null;
  schedule: any = null;
  bookings: any[] = [];
  loading = true;
  subscription: any;

  ngOnInit() {
    this.scheduleId = this.route.snapshot.paramMap.get('id');
    if (this.scheduleId) {
      this.loadData();
      this.subscribeToBookings();
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  subscribeToBookings() {
    if (!this.scheduleId) return;

    this.subscription = this.bookingService.subscribeToSchedule(this.scheduleId, () => {
      // Reload data when any change happens (new booking, cancel, status change)
      this.loadData();
    });
  }

  cols = 4;
  seats: any[] = [];

  async loadData() {
    try {
      this.loading = true;
      if (!this.scheduleId) return;

      // 1. Get Schedule details for header
      const { data: scheduleData } = await this.scheduleService.getScheduleById(this.scheduleId);
      this.schedule = scheduleData;

      // 2. Get Bookings with profiles
      const { data: bookingData, error } = await this.bookingService.getBookingsBySchedule(this.scheduleId);
      if (error) throw error;

      this.bookings = bookingData || [];

      // Sort by seat number
      this.bookings.sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }));

      // 3. Generate Layout Visuals
      const layout = this.schedule?.classrooms?.seat_layout;

      // Create a Map for O(1) booking lookup based on seat label
      const bookingMap = new Map();
      this.bookings.forEach(b => bookingMap.set(b.seat_number, b));

      if (layout?.type === 'grid') {
        this.generateGridLayout(layout, bookingMap);
      } else {
        this.generateSimpleLayout(this.schedule?.classrooms?.capacity || 20, bookingMap);
      }

    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  generateGridLayout(layout: any, bookingMap: Map<string, any>) {
    this.seats = [];
    this.cols = layout.cols;

    const unavailableSet = new Set(layout.unavailable_seats || []);
    const totalCells = layout.rows * layout.cols;

    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      const label = `${String.fromCharCode(65 + row)}${col + 1}`; // A1, A2...

      let status = 'available';
      let booking = null;

      if (unavailableSet.has(label)) {
        status = 'unavailable';
      } else if (bookingMap.has(label)) {
        booking = bookingMap.get(label);
        status = booking.status === 'confirmed' ? 'confirmed' : 'pending';
      }

      this.seats.push({ label, status, booking });
    }
  }

  generateSimpleLayout(capacity: number, bookingMap: Map<string, any>) {
    this.seats = [];
    this.cols = 4; // Default

    for (let i = 0; i < capacity; i++) {
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      const label = `${String.fromCharCode(65 + row)}${col + 1}`;

      let status = 'available';
      let booking = null;

      if (bookingMap.has(label)) {
        booking = bookingMap.get(label);
        status = booking.status === 'confirmed' ? 'confirmed' : 'pending';
      }

      this.seats.push({ label, status, booking });
    }
  }

  getSeatClass(seat: any) {
    if (seat.status === 'unavailable') return 'bg-gray-200 text-gray-400 invisible'; // Hide unavailable or just gray out? Let's hide to match grid shape

    if (seat.status === 'confirmed') return 'bg-red-100 text-red-600 border-red-300';
    if (seat.status === 'pending') return 'bg-yellow-100 text-yellow-600 border-yellow-300';

    return 'bg-green-50 text-green-600 border-green-200';
  }

  async cancelBooking(id: string) {
    if (!confirm('ต้องการยกเลิกการจองนี้ใช่หรือไม่? (Admin Action)')) return;

    try {
      this.loading = true;
      const { error } = await this.bookingService.cancelBooking(id);
      if (error) throw error;
      await this.loadData();
    } catch (err: any) {
      alert('ยกเลิกไม่สำเร็จ: ' + err.message);
      this.loading = false;
    }
  }

  async confirmBooking(id: string) {
    if (!confirm('ยืนยันอนุมัติการจองนี้?')) return;
    try {
      this.loading = true;
      const { error } = await this.bookingService.updateBookingStatus(id, 'confirmed');
      if (error) throw error;
      await this.loadData();
    } catch (err: any) {
      alert('อนุมัติไม่สำเร็จ: ' + err.message);
      this.loading = false;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded';
      case 'rejected': return 'px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded';
      default: return 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded';
    }
  }
}
