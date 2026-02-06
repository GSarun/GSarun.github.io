import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
    { path: 'classrooms', loadComponent: () => import('./pages/classroom-list/classroom-list.component').then(m => m.ClassroomListComponent) },
    { path: 'classrooms/new', loadComponent: () => import('./pages/classroom-form/classroom-form.component').then(m => m.ClassroomFormComponent) },
    { path: 'classrooms/edit/:id', loadComponent: () => import('./pages/classroom-form/classroom-form.component').then(m => m.ClassroomFormComponent) },
    // Route to schedule list (Home for Student)
    { path: 'schedules', loadComponent: () => import('./pages/schedule-list/schedule-list.component').then(m => m.ScheduleListComponent) },

    // Admin Schedule Management
    {
        path: 'admin/schedules',
        loadComponent: () => import('./pages/admin-schedule-list/admin-schedule-list.component').then(m => m.AdminScheduleListComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },

    {
        path: 'schedules/new',
        loadComponent: () => import('./pages/schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },
    {
        path: 'schedules/edit/:id',
        loadComponent: () => import('./pages/schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },
    {
        path: 'schedules/:id/bookings',
        loadComponent: () => import('./pages/admin-booking-list/admin-booking-list.component').then(m => m.AdminBookingListComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },
    {
        path: 'subjects',
        loadComponent: () => import('./pages/subject-manager/subject-manager.component').then(m => m.SubjectManagerComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },
    // User Management (Admin)
    {
        path: 'users',
        loadComponent: () => import('./pages/user-list/user-list.component').then(m => m.UserListComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },
    {
        path: 'users/new',
        loadComponent: () => import('./pages/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },
    {
        path: 'users/edit/:id',
        loadComponent: () => import('./pages/user-form/user-form.component').then(m => m.UserFormComponent),
        canActivate: [() => import('./guards/admin.guard').then(m => m.adminGuard)]
    },

    { path: 'booking/:id', loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent) },
    { path: 'my-bookings', loadComponent: () => import('./pages/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent) },

    { path: '', redirectTo: '/schedules', pathMatch: 'full' }
];
