/**
 * Main Layout
 * Wrapper for authenticated pages with navigation
 */

import { MobileNav } from '@/components/layout/mobile-nav';
import { DesktopSidebar } from '@/components/layout/desktop-sidebar';
import { UserMenu } from '@/components/auth/user-menu';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <DesktopSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-56">
                {/* Header (Desktop only - mobile has bottom nav) */}
                <header className="hidden md:flex h-14 items-center justify-between px-6 border-b bg-background sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold">QApp</h1>
                    </div>
                    <UserMenu />
                </header>

                {/* Page Content */}
                <main className="flex-1 pb-20 md:pb-0">
                    {children}
                </main>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    );
}
