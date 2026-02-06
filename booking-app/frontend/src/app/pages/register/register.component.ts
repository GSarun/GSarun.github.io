import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100">
      <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 class="mb-6 text-center text-2xl font-bold text-gray-800">สร้างบัญชีผู้ใช้</h2>
        
        <form (submit)="handleRegister()">
          <!-- Username -->
          <div class="mb-4">
            <label class="mb-2 block text-sm font-bold text-gray-700" for="username">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <input
              class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
              id="username"
              type="text"
              [(ngModel)]="username"
              name="username"
              placeholder="Display Name / User ID"
              required
            />
          </div>

          <!-- Full Name -->
          <div class="mb-4">
            <label class="mb-2 block text-sm font-bold text-gray-700" for="fullname">
              ชื่อ-นามสกุล
            </label>
            <input
              class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
              id="fullname"
              type="text"
              [(ngModel)]="fullName"
              name="fullname"
              placeholder="กรอกชื่อ-นามสกุล"
              required
            />
          </div>

          <!-- Mobile -->
          <div class="mb-4">
              <label class="mb-2 block text-sm font-bold text-gray-700" for="phone">
              เบอร์โทรศัพท์
            </label>
            <input
              class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
              id="phone"
              type="tel"
              [(ngModel)]="phone"
              name="phone"
              placeholder="081XXXXXXX"
              required
            />
          </div>

          <!-- Password -->
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
              class="focus:shadow-outline w-full rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700 focus:outline-none disabled:opacity-50"
              type="submit"
              [disabled]="loading"
            >
              {{ loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก' }}
            </button>
            <a routerLink="/login" class="text-blue-500 hover:text-blue-800 text-sm">
                มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
            </a>
          </div>
        </form>

      </div>
    </div>
  `
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  username = '';
  fullName = '';
  phone = '';
  password = '';
  loading = false;

  async handleRegister() {
    if (!this.username || !this.password || !this.fullName) return;

    // Validate Username format (Alphanumeric, dot, underscore, hyphen only)
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(this.username)) {
      alert('ชื่อผู้ใช้งานต้องประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข จุด ขีดล่าง หรือขีดกลาง เท่านั้น ห้ามเว้นวรรค');
      return;
    }

    if (this.password.length < 6) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      this.loading = true;
      console.log('Attempting register for:', this.username);

      const { data, error } = await this.authService.register(
        this.username,
        this.phone,
        this.fullName,
        this.password
      );

      if (error) {
        console.error('Registration Error:', error);
        throw error;
      }

      console.log('Registration Success:', data);
      alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Catch Error:', error);
      // Supabase often returns an object structure for error
      const msg = error.message || error.error_description || JSON.stringify(error);
      alert('การสมัครสมาชิกไม่สำเร็จ: ' + msg);
    } finally {
      this.loading = false;
    }
  }
}
