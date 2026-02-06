import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ScheduleService } from '../../services/schedule.service';
import { SubjectService, Subject } from '../../services/subject.service';
import { ClassroomService, Classroom } from '../../services/classroom.service';

@Component({
  selector: 'app-schedule-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-6">
      <div class="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">{{ id ? 'แก้ไขตารางเรียน' : 'สร้างตารางเรียน' }}</h2>
        
        <form (submit)="onSubmit()">
          
          <!-- Subject Selection -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">วิชา</label>
            <select 
              [(ngModel)]="schedule.subject_id" 
              name="subject_id"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="" disabled>เลือกวิชา</option>
              <option *ngFor="let sub of subjects" [value]="sub.id">{{ sub.title }}</option>
            </select>
            <p *ngIf="subjects.length === 0" class="text-red-500 text-xs mt-1">
                ไม่พบข้อมูลวิชา <a href="/subjects" class="underline">สร้างวิชาใหม่ก่อน</a>
            </p>
          </div>

          <!-- Classroom Selection -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">ห้องเรียน</label>
            <select 
              [(ngModel)]="schedule.classroom_id" 
              name="classroom_id"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="" disabled>เลือกห้องเรียน</option>
              <option *ngFor="let room of classrooms" [value]="room.id">{{ room.name }} ({{ room.capacity }} ที่นั่ง)</option>
            </select>
          </div>



          <!-- Booking Window Selection -->
          <div class="flex gap-4 mb-6 bg-gray-50 p-4 rounded border">
             <div class="flex-1">
                <label class="block text-gray-700 text-sm font-bold mb-2">เวลาเริ่มต้นจอง (Start Booking)</label>
                <input 
                  type="datetime-local" 
                  [(ngModel)]="schedule.start_booking" 
                  name="start_booking"
                  class="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                >
                <p class="text-xs text-gray-500 mt-1">* หากไม่ระบุ จะเริ่มจองได้ทันที</p>
             </div>
             <div class="flex-1">
                <label class="block text-gray-700 text-sm font-bold mb-2">เวลาสิ้นสุดการจอง (End Booking)</label>
                <input 
                  type="datetime-local" 
                  [(ngModel)]="schedule.end_booking" 
                  name="end_booking"
                  class="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                >
                <p class="text-xs text-gray-500 mt-1">* หากไม่ระบุ จะสิ้นสุดเมื่อถึงเวลาเรียน</p>
             </div>
          </div>

          <button
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
            [disabled]="loading"
          >
            {{ loading ? 'กำลังบันทึก...' : (id ? 'บันทึกการแก้ไข' : 'สร้างตารางเรียน') }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ScheduleFormComponent implements OnInit {
  scheduleService = inject(ScheduleService);
  subjectService = inject(SubjectService);
  classroomService = inject(ClassroomService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);

  subjects: Subject[] = [];
  classrooms: Classroom[] = [];

  schedule = {
    subject_id: '',
    classroom_id: '',
    start_booking: '',
    end_booking: ''
  };

  id: string | null = null;
  loading = false;

  async ngOnInit() {
    // Load dependencies parallel
    const [subRes, classRes] = await Promise.all([
      this.subjectService.getSubjects(),
      this.classroomService.getClassrooms()
    ]);

    if (subRes.data) this.subjects = subRes.data;
    if (classRes.data) this.classrooms = classRes.data;

    // Check if Edit Mode
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      await this.loadSchedule(this.id);
    }

    this.cdr.detectChanges();
  }

  async loadSchedule(id: string) {
    try {
      this.loading = true;
      const { data, error } = await this.scheduleService.getScheduleById(id);
      if (error) throw error;

      this.schedule = {
        subject_id: data.subject_id,
        classroom_id: data.classroom_id,
        start_booking: this.toThaiDateTimeString(data.start_booking),
        end_booking: this.toThaiDateTimeString(data.end_booking)
      };
    } catch (error: any) {
      alert('Error loading schedule: ' + error.message);
      this.router.navigate(['/schedules']);
    } finally {
      this.loading = false;
    }
  }

  // Convert UTC string from DB to "YYYY-MM-DDTHH:mm" in UTC+7
  private toThaiDateTimeString(utcString: string | null): string {
    if (!utcString) return '';
    const date = new Date(utcString);
    // Add 7 hours to get Thai time
    const thaiDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    return thaiDate.toISOString().slice(0, 16);
  }

  // Convert Input string "YYYY-MM-DDTHH:mm" (Thai Time) to UTC ISO String
  private toUTCString(inputString: string): string {
    if (!inputString) return '';
    // Treat input as +07:00
    const date = new Date(`${inputString}:00+07:00`);
    return date.toISOString();
  }

  async onSubmit() {
    if (!this.schedule.subject_id || !this.schedule.classroom_id) return;

    try {
      this.loading = true;

      // Prepare payload with timezone conversion
      const payload = {
        ...this.schedule,
        start_booking: this.toUTCString(this.schedule.start_booking),
        end_booking: this.toUTCString(this.schedule.end_booking)
      };

      let error;
      if (this.id) {
        const { error: updateError } = await this.scheduleService.updateSchedule(this.id, payload);
        error = updateError;
      } else {
        const { error: createError } = await this.scheduleService.createSchedule(payload);
        error = createError;
      }

      if (error) throw error;

      alert(this.id ? 'แก้ไขข้อมูลสำเร็จ!' : 'สร้างตารางเรียนสำเร็จ!');
      this.router.navigate(['/schedules']);
    } catch (error: any) {
      alert(error.message);
    } finally {
      this.loading = false;
    }
  }
}
