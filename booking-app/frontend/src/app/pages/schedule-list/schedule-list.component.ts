import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ScheduleService, Schedule } from '../../services/schedule.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">ตารางเรียน (Class Schedule)</h1>
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
                การจอง
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
                <a [routerLink]="['/booking', schedule.id]" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs cursor-pointer">
                    จองที่นั่ง
                </a>
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
export class ScheduleListComponent implements OnInit {
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
      const { data, error } = await this.scheduleService.getAvailableSchedules();
      if (!error && data) {
        this.schedules = data;
      }
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
