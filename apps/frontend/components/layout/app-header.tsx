/**
 * App Header
 * Top navigation bar with logo and user menu
 */

'use client';

import { AppLogo } from './app-logo';
import { UserMenu } from '@/components/auth/user-menu';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
    className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 h-14 bg-card shadow-sm z-50',
                'flex items-center justify-between px-4 md:px-6',
                className
            )}
        >
            {/* Logo - responsive sizing */}
            <AppLogo
                showIcon={true}
                iconSize={28}
                className="md:ml-0"
                textClassName="text-lg md:text-xl"
            />

            {/* User Menu */}
            <UserMenu />
        </header>
    );
}
