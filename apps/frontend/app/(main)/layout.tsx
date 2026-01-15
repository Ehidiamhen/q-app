/**
 * Main Layout
 * Wrapper for authenticated pages with navigation
 */

import { MobileNav } from '@/components/layout/mobile-nav';
import { DesktopSidebar } from '@/components/layout/desktop-sidebar';
import { AppHeader } from '@/components/layout/app-header';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            {/* App Header - Fixed at top for both mobile and desktop */}
            <AppHeader />

            {/* Desktop Sidebar - Fixed on left, starts below header */}
            <DesktopSidebar />

            {/* Main Content - Offset by header and sidebar */}
            <main className="pt-14 pb-20 md:pb-6 md:pl-20">
                {children}
            </main>

            {/* Mobile Navigation - Fixed at bottom */}
            <MobileNav />
        </div>
    );
}
