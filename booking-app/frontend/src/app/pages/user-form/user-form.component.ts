import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="container mx-auto p-6">
      <div class="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">{{ id ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้งานใหม่' }}</h2>
        
        <div *ngIf="!id" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
           <p class="font-bold">คำเตือน</p>
           <p>การเพิ่มผู้ใช้ใหม่จะเป็นการสมัครสมาชิกเข้าระบบ ซึ่งจะทำให้ <b>ออกจากระบบบัญชี Admin ปัจจุบันทันที</b> เพื่อเข้าสู่ระบบบัญชีใหม่</p>
        </div>

        <form (submit)="onSubmit()">
          
          <!-- Username (Readonly on Edit) -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input 
              type="text" 
              [(ngModel)]="user.username" 
              name="username"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              [readonly]="!!id"
              [class.bg-gray-100]="!!id"
              required
            >
          </div>

          <!-- Name -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">ชื่อ-นามสกุล</label>
            <input 
              type="text" 
              [(ngModel)]="user.display_name" 
              name="display_name"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
          </div>

          <!-- Mobile -->
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">เบอร์โทรศัพท์</label>
            <input 
              type="tel" 
              [(ngModel)]="user.phone" 
              name="phone"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
          </div>

          <!-- Role (Only Edit Mode) -->
          <div class="mb-4" *ngIf="id">
            <label class="block text-gray-700 text-sm font-bold mb-2">Role</label>
            <select 
              [(ngModel)]="user.role" 
              name="role"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <!-- Password (Create Mode) -->
          <div class="mb-6" *ngIf="!id">
            <label class="block text-gray-700 text-sm font-bold mb-2">รหัสผ่าน</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              required
              minlength="6"
            >
          </div>

          <!-- Reset Password (Edit Mode) -->
          <div class="mb-6 bg-gray-50 p-4 rounded border" *ngIf="id">
             <label class="block text-gray-700 text-sm font-bold mb-2">เปลี่ยนรหัสผ่าน (Reset Password)</label>
             <div class="flex gap-2">
                <input 
                  type="password" 
                  [(ngModel)]="newPassword" 
                  name="newPassword"
                  placeholder="กรอกรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)"
                  class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  minlength="6"
                >
                <button 
                    type="button" 
                    (click)="resetPassword()"
                    [disabled]="!newPassword || newPassword.length < 6"
                    class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                >
                    เปลี่ยนรหัส
                </button>
             </div>
             <p class="text-xs text-gray-500 mt-1">* ให้กรอกเฉพาะเมื่อต้องการ Reset รหัสผ่านเท่านั้น</p>
          </div>

          <button
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
            type="submit"
            [disabled]="loading"
          >
            {{ loading ? 'กำลังบันทึก...' : (id ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้') }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class UserFormComponent implements OnInit {
    userService = inject(UserService);
    authService = inject(AuthService);
    router = inject(Router);
    route = inject(ActivatedRoute);
    cdr = inject(ChangeDetectorRef);

    id: string | null = null;
    loading = false;

    // Model
    user: any = {
        username: '',
        display_name: '',
        phone: '',
        role: 'student'
    };
    password = '';
    newPassword = '';

    async ngOnInit() {
        this.id = this.route.snapshot.paramMap.get('id');
        if (this.id) {
            await this.loadUser(this.id);
        }
    }

    async loadUser(id: string) {
        try {
            this.loading = true;
            const { data, error } = await this.userService.getUserById(id);
            if (error) throw error;
            this.user = data;
        } catch (error: any) {
            alert('Error: ' + error.message);
            this.router.navigate(['/users']);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async onSubmit() {
        try {
            this.loading = true;

            if (this.id) {
                // Update
                const { error } = await this.userService.updateUser(this.id, {
                    display_name: this.user.display_name,
                    phone: this.user.phone,
                    role: this.user.role
                });
                if (error) throw error;
                alert('แก้ไขข้อมูลสำเร็จ');
                this.router.navigate(['/users']);
            } else {
                // Create (Register)
                if (!confirm('ยืนยันสร้างผู้ใช้? ระบบจะออกจากระบบ Admin ปัจจุบัน')) return;

                const { error } = await this.authService.register(
                    this.user.username,
                    this.user.phone,
                    this.user.display_name,
                    this.password
                );
                if (error) throw error;
                alert('สร้างผู้ใช้สำเร็จ ระบบเข้าสู่ระบบบัญชีใหม่');
                this.router.navigate(['/']);
            }

        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            this.loading = false;
        }
    }

    async resetPassword() {
        if (!this.id || !this.newPassword) return;
        if (!confirm('ยืนยันที่จะเปลี่ยนรหัสผ่านให้ผู้ใช้รายนี้?')) return;

        try {
            this.loading = true;
            const { error } = await this.userService.adminResetPassword(this.id, this.newPassword);
            if (error) throw error;

            alert('เปลี่ยนรหัสผ่านสำเร็จ');
            this.newPassword = ''; // Clear
        } catch (error: any) {
            alert('เปลี่ยนรหัสไม่สำเร็จ: ' + error.message);
        } finally {
            this.loading = false;
        }
    }
}
