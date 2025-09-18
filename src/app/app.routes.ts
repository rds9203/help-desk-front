import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Credits } from './credits/credits';

export const routes: Routes = [
    {
        path: '',
        component: Layout,
        children: [
            {
                path: 'credits',
                component: Credits
            }
        ]
    }
];
