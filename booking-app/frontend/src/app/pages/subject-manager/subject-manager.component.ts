import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectService, Subject } from '../../services/subject.service';
import { LoaderComponent } from '../../components/loader/loader.component';

@Component({
  selector: 'app-subject-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  template: `
    <div class="container mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">จัดการรายวิชา (Admin)</h1>

      <!-- Add/Edit Subject Form -->
      <div class="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 class="text-xl font-bold mb-4">{{ editingId ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่' }}</h2>
        <form (submit)="saveSubject()" class="flex gap-4 items-end flex-wrap">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-gray-700 text-sm font-bold mb-2">ชื่อวิชา</label>
            <input 
              type="text" 
              [(ngModel)]="formSubject.title" 
              name="title"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="ตัวอย่าง: คณิตศาสตร์ 101"
              required
            >
          </div>
          <div class="flex-1 min-w-[200px]">
             <label class="block text-gray-700 text-sm font-bold mb-2">รายละเอียด</label>
             <input 
              type="text" 
              [(ngModel)]="formSubject.description" 
              name="description"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            >
          </div>
          <div class="flex gap-2">
            <button 
                type="submit" 
                [disabled]="loading"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            >
                {{ loading ? 'กำลังบันทึก...' : (editingId ? 'บันทึกแก้ไข' : 'เพิ่ม') }}
            </button>
            <button 
                *ngIf="editingId"
                type="button" 
                (click)="cancelEdit()"
                class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
                ยกเลิก
            </button>
          </div>
        </form>
      </div>

      <app-loader *ngIf="dataLoading"></app-loader>

      <!-- Subject List -->
      <div *ngIf="!dataLoading" class="bg-white rounded-lg shadow-md overflow-hidden">
        <table class="min-w-full leading-normal">
          <thead>
            <tr>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ชื่อวิชา
              </th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                รายละเอียด
              </th>
               <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let subject of subjects">
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 font-medium whitespace-no-wrap">{{ subject.title }}</p>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                 <p class="text-gray-900 whitespace-no-wrap">{{ subject.description || '-' }}</p>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                <button (click)="startEdit(subject)" class="text-blue-600 hover:text-blue-900 mr-4 font-semibold">แก้ไข</button>
                <button (click)="deleteSubject(subject.id!)" class="text-red-600 hover:text-red-900 font-semibold">ลบ</button>
              </td>
            </tr>
            <tr *ngIf="subjects.length === 0">
               <td colspan="3" class="px-5 py-5 text-center text-sm text-gray-500">ยังไม่มีรายวิชา</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SubjectManagerComponent implements OnInit {
  subjectService = inject(SubjectService);
  cdr = inject(ChangeDetectorRef);
  subjects: Subject[] = [];

  formSubject: Subject = { title: '', description: '' };
  editingId: string | null = null;
  loading = false;
  dataLoading = true; // Start as true to avoid NG0100

  ngOnInit() {
    this.loadSubjects();
  }

  async loadSubjects() {
    try {
      this.dataLoading = true;
      const { data, error } = await this.subjectService.getSubjects();
      if (!error && data) {
        this.subjects = data;
      }
    } finally {
      this.dataLoading = false;
      this.cdr.detectChanges();
    }
  }

  async saveSubject() {
    if (!this.formSubject.title) return;

    try {
      this.loading = true;
      let error;

      if (this.editingId) {
        // Update
        const res = await this.subjectService.updateSubject(this.editingId, this.formSubject);
        error = res.error;
      } else {
        // Create
        const res = await this.subjectService.createSubject(this.formSubject);
        error = res.error;
      }

      if (error) throw error;

      this.cancelEdit(); // Reset form
      await this.loadSubjects(); // Reload list
    } catch (error: any) {
      alert(error.message);
    } finally {
      this.loading = false;
    }
  }

  startEdit(subject: Subject) {
    this.editingId = subject.id!;
    this.formSubject = { ...subject }; // Copy to avoid direct mutation
  }

  cancelEdit() {
    this.editingId = null;
    this.formSubject = { title: '', description: '' };
  }

  async deleteSubject(id: string) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวิชานี้?')) return;

    try {
      const { error } = await this.subjectService.deleteSubject(id);
      if (error) throw error;
      await this.loadSubjects();
    } catch (error: any) {
      alert(error.message);
    }
  }
}
