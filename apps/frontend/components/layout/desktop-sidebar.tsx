/**
 * Desktop Sidebar
 * Persistent narrow sidebar with icon + label navigation (YouTube-style)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/nav-config';

export function DesktopSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-20 bg-card shadow-sm z-40">
            {/* Navigation */}
            <nav className="flex-1 py-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href as any}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1.5 py-4 px-2 transition-colors',
                                isActive
                                    ? 'text-primary bg-secondary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            )}
                        >
                            <Icon className="h-6 w-6 shrink-0" />
                            <span className="text-[10px] font-medium text-center leading-tight">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
