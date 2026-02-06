import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if profile is loaded and role is admin
    // Since profile loading is async, we might need to rely on session or wait.
    // For simplicity, we check the current internal state. 
    // Ideally, this should wait for profile to be loaded if it's null.

    const profile = authService.profile();

    if (profile && profile.role === 'admin') {
        return true;
    }

    // If not admin, redirect to home
    console.log('Access Denied: Admin only');
    router.navigate(['/']);
    return false;
};
