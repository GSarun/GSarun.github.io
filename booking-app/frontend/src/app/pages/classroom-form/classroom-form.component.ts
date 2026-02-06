import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ClassroomService, Classroom } from '../../services/classroom.service';

@Component({
  selector: 'app-classroom-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">{{ id ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่' }}</h2>
        
        <form>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">
              ชื่อห้องเรียน
            </label>
            <input
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              [(ngModel)]="classroom.name"
              name="name"
              placeholder="เช่น ห้องปฏิบัติการวิทยาศาสตร์ A"
              required
            />
          </div>

          <div class="flex gap-4 mb-4">
             <div class="flex-1">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="rows">
                  จำนวนแถว (Rows)
                </label>
                <input
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="rows"
                  type="number"
                  [(ngModel)]="rows"
                  (ngModelChange)="updateCapacity()"
                  name="rows"
                  name="rows"
                  min="0"
                />
             </div>
             <div class="flex-1">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="cols">
                  จำนวนคอลัมน์ (Columns)
                </label>
                <input
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="cols"
                  type="number"
                  [(ngModel)]="cols"
                   (ngModelChange)="updateCapacity()"
                  name="cols"
                  name="cols"
                  min="0"
                />
             </div>
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="capacity">
              ความจุรวม (ที่นั่ง) - คำนวณอัตโนมัติ
            </label>
            <input
              class="bg-gray-100 shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 leading-tight focus:outline-none focus:shadow-outline"
              id="capacity"
              type="number"
              [ngModel]="classroom.capacity"
              name="capacity"
              min="0"
              required
            />
          </div>

          <!-- Preview -->
          <div class="mb-6" *ngIf="rows > 0 && cols > 0">
             <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-gray-700">ตัวอย่างการจัดวาง (Preview):</h3>
                <span class="text-xs text-gray-500">คลิกที่ที่นั่งเพื่อ เปิด/ปิด การใช้งาน</span>
             </div>
             <div class="bg-gray-50 p-4 rounded border overflow-x-auto">
                <div class="grid gap-2 justify-center" [style.grid-template-columns]="'repeat(' + cols + ', minmax(0, 1fr))'" style="min-width: max-content;">
                   <div 
                      *ngFor="let i of getSeatArray()" 
                      (click)="toggleSeat(i)"
                      [class.bg-red-100]="isSeatUnavailable(i)"
                      [class.text-red-400]="isSeatUnavailable(i)"
                      [class.border-red-200]="isSeatUnavailable(i)"
                      [class.bg-green-50]="!isSeatUnavailable(i)"
                      [class.text-green-600]="!isSeatUnavailable(i)"
                      [class.border-green-200]="!isSeatUnavailable(i)"
                      class="w-10 h-10 border rounded flex items-center justify-center text-xs shadow-sm cursor-pointer hover:opacity-80 transition-colors select-none"
                      [title]="isSeatUnavailable(i) ? 'ไม่ใช้งาน' : 'ใช้งานได้'"
                   >
                      {{ getSeatLabel(i) }}
                   </div>
                </div>
             </div>
          </div>

          <div class="flex items-center justify-between">
            <button
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              type="button"
              (click)="onSubmit()"
              [disabled]="loading"
            >
              {{ loading ? 'กำลังบันทึก...' : (id ? 'บันทึกการแก้ไข' : 'เพิ่มห้องเรียนใหม่') }}
            </button>
            <a routerLink="/classrooms" class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
              ยกเลิก
            </a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ClassroomFormComponent implements OnInit {
  classroomService = inject(ClassroomService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  classroom: Classroom = {
    name: '',
    capacity: 0
  };

  rows: number = 0;
  cols: number = 0;
  unavailableSeats: Set<string> = new Set();
  id: string | null = null;

  loading = false;

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.loadClassroom(this.id);
    }
  }

  async loadClassroom(id: string) {
    try {
      this.loading = true;
      const { data, error } = await this.classroomService.getClassroomById(id);
      if (error) throw error;

      this.classroom = data;

      this.classroom = data;

      // Load saved layout
      if (this.classroom.seat_layout && this.classroom.seat_layout.type === 'grid') {
        this.rows = this.classroom.seat_layout.rows;
        this.cols = this.classroom.seat_layout.cols;
        this.unavailableSeats = new Set(this.classroom.seat_layout.unavailable_seats || []);
      }

      // Manually detect changes to update the form view and prevent NG0100
      this.cdr.detectChanges();
    } catch (error: any) {
      alert(error.message);
      this.router.navigate(['/classrooms']);
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // Ensure loading state is reflected
    }
  }

  updateCapacity() {
    if (this.rows > 0 && this.cols > 0) {
      const maxSeats = this.rows * this.cols;
      const validUnavailable = Array.from(this.unavailableSeats).filter(label => true);
      this.classroom.capacity = maxSeats - validUnavailable.length;
    }
  }

  getSeatArray() {
    // Generate array for grid rendering based on geometry, not capacity
    const totalCells = this.rows * this.cols;
    return Array(totalCells).fill(0).map((x, i) => i);
  }

  getSeatLabel(index: number): string {
    const row = Math.floor(index / this.cols);
    const col = index % this.cols;
    return `${String.fromCharCode(65 + row)}${col + 1}`;
  }

  toggleSeat(index: number) {
    const label = this.getSeatLabel(index);
    if (this.unavailableSeats.has(label)) {
      this.unavailableSeats.delete(label);
    } else {
      this.unavailableSeats.add(label);
    }
    this.updateCapacity();
  }

  isSeatUnavailable(index: number): boolean {
    return this.unavailableSeats.has(this.getSeatLabel(index));
  }

  async onSubmit() {
    if (!this.classroom.name) {
      alert('กรุณาระบุชื่อห้องเรียน');
      return;
    }

    // Auto-calculate capacity if rows/cols are present but capacity is 0 (edge case)
    if (this.rows > 0 && this.cols > 0 && this.classroom.capacity === 0) {
      this.updateCapacity();
    }

    if (!this.classroom.capacity || this.classroom.capacity <= 0) {
      alert('กรุณาระบุความจุห้องเรียน หรือกำหนดจำนวนแถว/คอลัมน์');
      return;
    }

    try {
      this.loading = true;

      // Save Grid Layout info
      if (this.rows > 0 && this.cols > 0) {
        this.classroom.seat_layout = {
          type: 'grid',
          rows: this.rows,
          cols: this.cols,
          unavailable_seats: Array.from(this.unavailableSeats)
        };
      }

      let error;
      if (this.id) {
        const { error: updateError } = await this.classroomService.updateClassroom(this.id, this.classroom);
        error = updateError;
      } else {
        const { error: createError } = await this.classroomService.createClassroom(this.classroom);
        error = createError;
      }

      if (error) throw error;
      this.router.navigate(['/classrooms']);
    } catch (error: any) {
      alert(error.message);
    } finally {
      this.loading = false;
    }
  }
}
