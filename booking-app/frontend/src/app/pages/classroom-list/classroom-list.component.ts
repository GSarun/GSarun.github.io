import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClassroomService, Classroom } from '../../services/classroom.service';

@Component({
  selector: 'app-classroom-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">จัดการห้องเรียน</h1>
        <a routerLink="/classrooms/new" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer inline-block">
          + เพิ่มห้องเรียน
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
                ชื่อห้อง
              </th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ความจุ
              </th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                รูปแบบผัง
              </th>
               <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let room of classrooms">
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 font-medium whitespace-no-wrap">{{ room.name }}</p>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                 <p class="text-gray-900 whitespace-no-wrap">{{ room.capacity }} ที่นั่ง</p>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div *ngIf="room.seat_layout?.type === 'grid'; else simpleLayout">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Grid ({{ room.seat_layout.rows }}x{{ room.seat_layout.cols }})
                    </span>
                  </div>
                  <ng-template #simpleLayout>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      ทั่วไป
                    </span>
                  </ng-template>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                <a [routerLink]="['/classrooms/edit', room.id]" class="text-blue-600 hover:text-blue-900 font-semibold mr-4">แก้ไข</a>
                <button (click)="deleteClassroom(room.id!)" class="text-red-600 hover:text-red-900 font-semibold">ลบ</button>
              </td>
            </tr>
            <tr *ngIf="classrooms.length === 0">
               <td colspan="3" class="px-5 py-5 text-center text-sm text-gray-500">ยังไม่มีข้อมูลห้องเรียน</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ClassroomListComponent implements OnInit {
  classroomService = inject(ClassroomService);
  cdr = inject(ChangeDetectorRef);
  classrooms: Classroom[] = [];
  loading = false;

  ngOnInit() {
    this.loadClassrooms();
  }

  async loadClassrooms() {
    try {
      this.loading = true;
      const { data, error } = await this.classroomService.getClassrooms();
      if (!error && data) {
        this.classrooms = data;
      }
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteClassroom(id: string) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนนี้?')) return;

    await this.classroomService.deleteClassroom(id);
    await this.loadClassrooms(); // Refresh list via GET
  }
}
