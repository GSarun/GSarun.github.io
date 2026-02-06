import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, UserProfile } from '../../services/user.service';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">จัดการผู้ใช้งาน (User Management)</h1>
        
        <a routerLink="/users/new" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer shadow-sm">
           + เพิ่มผู้ใช้งาน
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
                ชื่อผู้ใช้ (Username)
              </th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                ชื่อ-นามสกุล
              </th>
               <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                เบอร์โทร
              </th>
               <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                 <span class="text-gray-900 font-medium">{{ user.username }}</span>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">{{ user.display_name }}</p>
              </td>
               <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <p class="text-gray-900 whitespace-no-wrap">{{ user.phone || '-' }}</p>
              </td>
               <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      [ngClass]="{'bg-green-100 text-green-800': user.role === 'admin', 'bg-gray-100 text-gray-800': user.role !== 'admin'}">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                <a [routerLink]="['/users/edit', user.id]" class="text-blue-600 hover:text-blue-900 font-semibold mr-4 cursor-pointer">แก้ไข</a>
                <button (click)="deleteUser(user.id)" class="text-red-600 hover:text-red-900 font-semibold cursor-pointer">ลบ</button>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
               <td colspan="5" class="px-5 py-5 text-center text-sm text-gray-500">ไม่มีข้อมูลผู้ใช้งาน</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
    userService = inject(UserService);
    cdr = inject(ChangeDetectorRef);

    users: UserProfile[] = [];
    loading = false;

    ngOnInit() {
        this.loadUsers();
    }

    async loadUsers() {
        try {
            this.loading = true;
            const { data, error } = await this.userService.getUsers();
            if (!error && data) {
                this.users = data;
            }
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async deleteUser(id: string) {
        if (!confirm('ยืนยันที่จะลบผู้ใช้งานนี้?')) return;

        try {
            this.loading = true;
            const { error } = await this.userService.deleteUser(id);
            if (error) throw error;
            await this.loadUsers(); // Refresh
        } catch (error: any) {
            alert('ลบไม่สำเร็จ: ' + error.message);
            this.loading = false;
        }
    }
}
