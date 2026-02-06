import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex flex-col h-full bg-white border-r border-gray-200">
      <!-- Branding -->
      <div class="flex items-center justify-center h-16 border-b border-gray-200 px-4">
        <a routerLink="/" class="text-xl font-bold text-gray-800 flex items-center gap-2">
          📅 Booking App
        </a>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        
        <!-- General Links -->
        <a routerLink="/schedules" routerLinkActive="bg-blue-50 text-blue-600" class="group flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
          <span class="mr-3">📚</span>
          ตารางเรียนที่จองได้
        </a>
        
        <a *ngIf="auth.isLoggedIn()" routerLink="/my-bookings" routerLinkActive="bg-blue-50 text-blue-600" class="group flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
          <span class="mr-3">🎟️</span>
          การจองของฉัน
        </a>

        <!-- Admin Section -->
        <div *ngIf="auth.profile()?.role === 'admin'" class="mt-8">
            <h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ผู้ดูแลระบบ (Admin)
            </h3>
            <div class="mt-1 space-y-1">
                <a routerLink="/users" routerLinkActive="bg-blue-50 text-blue-600" class="group flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                    <span class="mr-3">👥</span>
                    จัดการผู้ใช้งาน
                </a>
                <a routerLink="/subjects" routerLinkActive="bg-blue-50 text-blue-600" class="group flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                    <span class="mr-3">📖</span>
                    จัดการวิชา
                </a>
                <a routerLink="/classrooms" routerLinkActive="bg-blue-50 text-blue-600" class="group flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                    <span class="mr-3">🏫</span>
                    จัดการห้องเรียน
                </a>
                <a routerLink="/admin/schedules" routerLinkActive="bg-blue-50 text-blue-600" [routerLinkActiveOptions]="{exact: true}" class="group flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900">
                    <span class="mr-3">📅</span>
                    จัดการตารางเรียน
                </a>
            </div>
        </div>
      </nav>

      <!-- User Profile & Logout -->
      <div class="border-t border-gray-200 p-4">
        <div *ngIf="auth.isLoggedIn(); else loginBtn">
          <div class="flex items-center mb-3">
             <div class="flex-shrink-0">
                <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {{ auth.profile()?.display_name?.charAt(0) || auth.profile()?.username?.charAt(0) || 'U' }}
                </div>
             </div>
             <div class="ml-3">
                <p class="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                    {{ auth.profile()?.display_name || auth.profile()?.username }}
                </p>
                <p class="text-xs text-gray-500 capitalize">
                    {{ auth.profile()?.role }}
                </p>
             </div>
          </div>
          <button (click)="auth.signOut()" class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            ออกจากระบบ
          </button>
        </div>
        <ng-template #loginBtn>
            <a routerLink="/login" class="w-full flex justify-center items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                เข้าสู่ระบบ
            </a>
        </ng-template>
      </div>
    </div>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);
}
