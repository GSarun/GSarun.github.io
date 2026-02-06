import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ScheduleService } from '../../services/schedule.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6" *ngIf="schedule">
      <div class="mb-8 rounded-lg bg-white p-6 shadow-md">
        <h1 class="text-3xl font-bold text-gray-800">{{ schedule.subjects?.title }}</h1>
        <p class="text-gray-600">ห้อง: {{ schedule.classrooms?.name }}</p>
        <p class="text-gray-600">
            เวลาจอง: 
            <span class="font-semibold">{{ schedule.start_booking | date:'d MMM y HH:mm' }}</span> 
            ถึง 
            <span class="font-semibold">{{ schedule.end_booking | date:'d MMM y HH:mm' }}</span>
        </p>
      </div>

      <!-- Time Validation Alerts -->
      <div *ngIf="bookingStatus === 'not_started'" class="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
        <p class="font-bold">ยังไม่เปิดให้จอง</p>
        <p>ระบบจะเปิดให้จองในวันที่ {{ schedule.start_booking | date:'medium' }}</p>
      </div>

      <div *ngIf="bookingStatus === 'closed'" class="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p class="font-bold">ปิดรับจองแล้ว</p>
        <p>หมดเวลาการจองสำหรับวิชานี้</p>
      </div>

      <div class="flex flex-col gap-8 lg:flex-row">
        <!-- Seat Layout -->
        <div class="flex-1 rounded-lg bg-white p-6 shadow-md">
          <h2 class="mb-4 text-xl font-bold text-gray-800">เลือกที่นั่ง</h2>
          
          <div class="flex justify-center">
            <div class="grid gap-4" [style.grid-template-columns]="'repeat(' + cols + ', minmax(0, 1fr))'">
              <button
                *ngFor="let seat of seats"
                (click)="selectSeat(seat)"
                [disabled]="seat.status === 'taken'"
                [class]="getSeatClass(seat)"
                class="h-12 w-12 rounded border font-bold transition duration-200 focus:outline-none"
              >
                {{ seat.label }}
              </button>
            </div>
          </div>

          <div class="mt-8 flex justify-center gap-6">
            <div class="flex items-center gap-2">
              <div class="h-4 w-4 rounded bg-green-100 border border-green-500"></div> ว่าง
            </div>
            <div class="flex items-center gap-2">
              <div class="h-4 w-4 rounded bg-red-100 border border-red-500"></div> ไม่ว่าง
            </div>
             <div class="flex items-center gap-2">
              <div class="h-4 w-4 rounded bg-blue-500 border border-blue-600"></div> เลือก
            </div>
          </div>
        </div>

        <!-- Booking Summary -->
        <div class="w-full lg:w-1/3">
          <div class="sticky top-6 rounded-lg bg-white p-6 shadow-md">
            <h2 class="mb-4 text-xl font-bold text-gray-800">สรุปการจอง</h2>
            
            <div *ngIf="selectedSeat; else noSeat">
              <div class="mb-4 border-b pb-4">
                <p class="text-sm text-gray-500">หมายเลขที่นั่ง</p>
                <p class="text-2xl font-bold text-blue-600">{{ selectedSeat.label }}</p>
              </div>
              
              <button
                (click)="confirmBooking()"
                class="w-full rounded bg-blue-600 py-3 font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                [disabled]="loading"
              >
                {{ loading ? 'กำลังจอง...' : 'ยืนยันการจอง' }}
              </button>
            </div>
            
            <ng-template #noSeat>
              <p class="text-gray-500">กรุณาเลือกที่นั่งจากผังเพื่อทำรายการต่อ</p>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  scheduleService = inject(ScheduleService);
  bookingService = inject(BookingService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  scheduleId: string | null = null;
  schedule: any = null;

  // Seat Management
  seats: any[] = []; // { label: 'A1', status: 'available' | 'taken' | 'selected' }
  selectedSeat: any = null;
  cols = 4; // Default columns

  loading = false;

  // Realtime Subscription
  subscription: any;

  ngOnInit() {
    this.scheduleId = this.route.snapshot.paramMap.get('id');
    if (this.scheduleId) {
      this.loadScheduleData();
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
      // Reload data when any change happens
      this.loadScheduleData();
    });
  }

  async loadScheduleData() {
    if (!this.scheduleId) return;

    try {
      this.loading = true; // Optional: show loading state during refresh

      // 1. Get Schedule Info
      const { data: scheduleData } = await this.scheduleService.getScheduleById(this.scheduleId);
      this.schedule = scheduleData;

      // 2. Get Taken Seats
      const { data: bookings } = await this.bookingService.getBookingsBySchedule(this.scheduleId);
      const takenSeats = new Set<string>(bookings?.map((b: any) => b.seat_number));

      // Check if I already booked
      const myId = this.authService.currentUser()?.id;
      const myBooking = bookings?.find((b: any) => b.user_id === myId);
      if (myBooking) {
        // Optional: Block booking or show message
        // We use setTimeout to avoid NG0100 if this happens during init
        setTimeout(() => {
          alert(`คุณจองวิชานี้ไปแล้ว (ที่นั่ง ${myBooking.seat_number})`);
          this.router.navigate(['/my-bookings']);
        });
        return;
      }

      // 3. Generate Layout
      const layout = this.schedule.classrooms?.seat_layout;
      if (layout?.type === 'grid') {
        this.generateGridLayout(layout, takenSeats);
      } else {
        this.generateSimpleLayout(this.schedule.classrooms?.capacity || 20, takenSeats);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // Force update
    }
  }

  generateGridLayout(layout: any, takenSeats: Set<string>) {
    this.seats = [];
    this.cols = layout.cols; // Use saved columns

    const unavailableSet = new Set(layout.unavailable_seats || []);
    const totalCells = layout.rows * layout.cols;

    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      const label = `${String.fromCharCode(65 + row)}${col + 1}`; // A1, A2...

      let status = 'available';

      if (unavailableSet.has(label)) {
        status = 'unavailable';
      } else if (takenSeats.has(label)) {
        status = 'taken';
      }

      this.seats.push({ label, status });
    }
  }

  generateSimpleLayout(capacity: number, takenSeats: Set<string>) {
    this.seats = [];
    // Default fallback columns
    this.cols = 4;

    for (let i = 0; i < capacity; i++) {
      const row = Math.floor(i / this.cols);
      const col = i % this.cols;
      const label = `${String.fromCharCode(65 + row)}${col + 1}`; // A1, A2...

      this.seats.push({
        label,
        status: takenSeats.has(label) ? 'taken' : 'available'
      });
    }
  }

  // Time Validation
  get bookingStatus(): 'open' | 'not_started' | 'closed' {
    if (!this.schedule) return 'closed';

    const now = new Date();
    const start = this.schedule.start_booking ? new Date(this.schedule.start_booking) : null;
    const end = this.schedule.end_booking ? new Date(this.schedule.end_booking) : null;

    if (start && now < start) return 'not_started';
    if (end && now > end) return 'closed';
    return 'open';
  }

  get canBook(): boolean {
    return this.bookingStatus === 'open';
  }

  selectSeat(seat: any) {
    if (!this.canBook) return; // Prevent selection if not open
    if (seat.status === 'taken' || seat.status === 'unavailable') return;

    // Deselect previous
    if (this.selectedSeat) {
      this.selectedSeat.status = 'available';
    }

    // Toggle if clicking same
    if (this.selectedSeat === seat) {
      this.selectedSeat = null;
      seat.status = 'available';
      return;
    }

    // Select new
    this.selectedSeat = seat;
    seat.status = 'selected';
  }

  getSeatClass(seat: any) {
    if (seat.status === 'unavailable') return 'invisible';
    if (seat.status === 'taken') return 'bg-red-100 text-red-400 cursor-not-allowed border border-red-200';

    // Disable styling if booking is closed
    if (!this.canBook) return 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200';

    if (seat.status === 'selected') return 'bg-blue-500 text-white border border-blue-600 shadow-md transform scale-105';
    return 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 cursor-pointer';
  }

  async confirmBooking() {
    if (!this.selectedSeat || !this.scheduleId) return;
    if (!this.canBook) {
      alert('ไม่อยู่ในช่วงเวลาที่เปิดให้จอง');
      return;
    }

    try {
      this.loading = true;
      // Check Auth using signal
      if (!this.authService.isLoggedIn()) {
        alert('กรุณาเข้าสู่ระบบก่อนทำการจอง');
        this.router.navigate(['/login']);
        return;
      }

      const { error } = await this.bookingService.createBooking(this.scheduleId, this.selectedSeat.label);
      if (error) throw error;

      alert('จองที่นั่งสำเร็จ!');
      this.router.navigate(['/my-bookings']);
    } catch (error: any) {
      alert(error.message);
    } finally {
      this.loading = false;
    }
  }
}
