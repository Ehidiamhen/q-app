/**
 * Unified Navigation Configuration
 * Shared navigation items for mobile and desktop
 */

import { Home, Search, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    requiresAuth?: boolean;
}

export const navItems: NavItem[] = [
    {
        href: '/',
        label: 'Home',
        icon: Home,
    },
    {
        href: '/search',
        label: 'Search',
        icon: Search,
    },
    {
        href: '/upload',
        label: 'Upload',
        icon: Plus,
        requiresAuth: true,
    },
];
