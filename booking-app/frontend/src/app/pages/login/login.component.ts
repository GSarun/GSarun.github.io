import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100">
      <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 class="mb-6 text-center text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h2>
        
        <form (submit)="handleLogin()">
            <div class="mb-4">
              <label class="mb-2 block text-sm font-bold text-gray-700" for="username">
                ชื่อผู้ใช้งาน
              </label>
              <input
                class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                id="username"
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="กรอกชื่อผู้ใช้งาน"
                required
              />
            </div>

            <div class="mb-6">
              <label class="mb-2 block text-sm font-bold text-gray-700" for="password">
                รหัสผ่าน
              </label>
              <input
                class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="******************"
                required
              />
            </div>
            
            <div class="flex items-center justify-between flex-col gap-4">
              <button
                class="focus:shadow-outline w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                type="submit"
                [disabled]="loading"
              >
                {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
              </button>
              
              <a routerLink="/register" class="text-blue-500 hover:text-blue-800 text-sm">
                ยังไม่มีบัญชี? สมัครสมาชิก
              </a>
            </div>
        </form>

      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  username = '';
  password = '';
  loading = false;

  async handleLogin() {
    if (!this.username || !this.password) return;

    try {
      this.loading = true;
      const { error } = await this.authService.login(this.username, this.password);
      if (error) throw error;
      this.router.navigate(['/']); // Navigate to home/dashboard
    } catch (error: any) {
      alert(error.message);
    } finally {
      this.loading = false;
    }
  }
}
