/**
 * Desktop Sidebar
 * Toggleable left sidebar for desktop
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const navItems = [
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
    {
        href: '/profile',
        label: 'Profile',
        icon: User,
    },
];

export function DesktopSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) {
            setIsCollapsed(saved === 'true');
        }
    }, []);

    // Save collapsed state to localStorage
    const toggleCollapsed = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-background border-r transition-all duration-300 z-40',
                isCollapsed ? 'w-16' : 'w-56'
            )}
        >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b">
                {!isCollapsed && (
                    <Link href="/" className="font-bold text-lg">
                        QApp
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapsed}
                    className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    // For profile, use user's actual profile link if authenticated
                    const href: string =
                        item.href === '/profile' && user
                            ? `/users/${user.id}`
                            : item.href === '/profile'
                                ? '/upload'
                                : item.href;

                    return (
                        <Link
                            key={item.href}
                            href={href as any}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground',
                                isCollapsed && 'justify-center'
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            {!isCollapsed && (
                                <span className="font-medium">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
