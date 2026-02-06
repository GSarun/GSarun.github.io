import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white shadow">
      <div class="container mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <a routerLink="/" class="text-xl font-bold text-gray-800 hover:text-blue-600">
              📅 Booking App
            </a>
          </div>
          
          <div class="hidden md:flex items-center space-x-6">
            <!-- Student Links -->
            <a routerLink="/schedules" routerLinkActive="text-blue-600 font-bold" class="text-gray-600 hover:text-gray-900">Courses</a>
            <a routerLink="/my-bookings" routerLinkActive="text-blue-600 font-bold" class="text-gray-600 hover:text-gray-900" *ngIf="auth.isLoggedIn()">My Bookings</a>
            
            <!-- Admin Links (Should link to role, showing for all now for demo) -->
            <div class="relative group">
                <button class="text-gray-600 hover:text-gray-900 focus:outline-none">Admin ▼</button>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 hidden group-hover:block z-50">
                    <a routerLink="/subjects" class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white">Subjects</a>
                    <a routerLink="/classrooms" class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white">Classrooms</a>
                    <a routerLink="/schedules/new" class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white">Create Schedule</a>
                </div>
            </div>

            <!-- Auth -->
            <div *ngIf="auth.isLoggedIn()" class="flex items-center gap-4">
                <span class="text-sm text-gray-600">
                    {{ auth.currentUser()?.email }} 
                    <span class="font-bold text-blue-600">({{ auth.profile()?.role }})</span>
                </span>
                <button (click)="auth.signOut()" class="text-red-500 hover:text-red-700">Logout</button>
            </div>
            <a *ngIf="!auth.isLoggedIn()" routerLink="/login" class="text-blue-500 hover:text-blue-700 font-bold">Login</a>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
}
