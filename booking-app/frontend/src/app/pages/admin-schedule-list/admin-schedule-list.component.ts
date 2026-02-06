import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScheduleService, Schedule } from '../../services/schedule.service';

@Component({
  selector: 'app-admin-schedule-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">จัดการตารางเรียน (Admin Schedule Management)</h1>
        
        <a routerLink="/schedules/new" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer shadow-sm">
           + สร้างตารางเรียน
        </a>
      </div>
      
      <div *ngIf="loading" class="text-center py-10">
        <p class="text-gray-500">กำลังโหลด...</p>
      </div>

      <div *ngIf="!loading" class="bg-white rounded-lg shadow-md overflow-hidden">
        <table class="min-w-full leading-normal">
          <thead>
            <tr>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ช่วงเวลาจอง
              </th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                วิชา
              </th>
               <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ห้องเรียน
              </th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let schedule of schedules">
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                 <div class="flex flex-col">
                  <div class="flex flex-col">
                    <span class="text-gray-700 font-semibold">{{ schedule.start_booking | date:'d MMM y HH:mm' }}</span>
                    <span class="text-gray-500 text-xs">ถึง</span>
                    <span class="text-gray-700 font-semibold">{{ schedule.end_booking | date:'d MMM y HH:mm' }}</span>
                  </div>
                 </div>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 font-medium whitespace-no-wrap">{{ schedule.subjects?.title || '-' }}</p>
              </td>
               <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">{{ schedule.classrooms?.name || '-' }}</p>
                <p class="text-gray-500 text-xs" *ngIf="schedule.classrooms">ความจุ: {{ schedule.classrooms.capacity }}</p>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                <a [routerLink]="['/schedules', schedule.id, 'bookings']" class="text-indigo-600 hover:text-indigo-900 font-semibold mr-4 cursor-pointer">รายชื่อจอง</a>
                <a [routerLink]="['/schedules/edit', schedule.id]" class="text-blue-600 hover:text-blue-900 font-semibold mr-4 cursor-pointer">แก้ไข</a>
                <button (click)="deleteSchedule(schedule.id!)" class="text-red-600 hover:text-red-900 font-semibold cursor-pointer">ลบ</button>
              </td>
            </tr>
            <tr *ngIf="schedules.length === 0">
               <td colspan="4" class="px-5 py-5 text-center text-sm text-gray-500">ไม่มีตารางเรียนในขณะนี้</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminScheduleListComponent implements OnInit {
  scheduleService = inject(ScheduleService);
  cdr = inject(ChangeDetectorRef);

  schedules: Schedule[] = [];
  loading = false;

  ngOnInit() {
    this.loadSchedules();
  }

  async loadSchedules() {
    try {
      this.loading = true;
      const { data, error } = await this.scheduleService.getAvailableSchedules(); // Or maybe getAllSchedules if available
      if (!error && data) {
        this.schedules = data;
      }
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteSchedule(id: string) {
    if (!confirm('ยืนยันที่จะลบตารางเรียนนี้? การจองทั้งหมดในคาบนี้จะถูกยกเลิกด้วย')) return;

    try {
      this.loading = true;
      const { error } = await this.scheduleService.deleteSchedule(id);
      if (error) throw error;
      await this.loadSchedules(); // Refresh
    } catch (error: any) {
      alert('ลบไม่สำเร็จ: ' + error.message);
      this.loading = false;
    }
  }
}
