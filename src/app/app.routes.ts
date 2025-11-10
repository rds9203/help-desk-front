import { Routes } from '@angular/router';
import { SimpleAppComponent } from './simple-app.component';
import { SimpleLoginComponent } from './simple-login.component';
import { SimpleDashboardComponent } from './simple-dashboard.component';
import { Credits } from './credits/credits';
import { UsersComponent } from './users/users.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: '',
        component: SimpleLoginComponent
    },
    {
        path: 'login',
        component: SimpleLoginComponent
    },
    {
        path: 'activate',
        component: SimpleAppComponent
    },
    {
        path: 'app',
        component: MainLayoutComponent,
        children: [
            {
                path: 'dashboard',
                component: SimpleDashboardComponent
            },
            {
                path: 'credits',
                component: Credits
            },
            {
                path: 'users',
                component: UsersComponent
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
