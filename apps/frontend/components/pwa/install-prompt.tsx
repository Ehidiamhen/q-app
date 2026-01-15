/**
 * PWA Install Prompt
 * Smart prompting with desktop banner and mobile bottom sheet
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { shouldShowInstallPrompt, dismissInstallPrompt, resetInstallPrompt, isPWA } from '@/lib/pwa-utils';

export function InstallPrompt() {
    const { isInstallable, isInstalled, install } = usePWAInstall();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // Don't show if already installed or running as PWA
        if (isInstalled || isPWA()) {
            console.log('[Install Prompt] Not showing - app already installed');
            setShowPrompt(false);
            return;
        }

        // Check if should show based on engagement
        const shouldShow = shouldShowInstallPrompt();
        console.log('[Install Prompt] Installable:', isInstallable, 'Should show:', shouldShow);
        
        if (isInstallable && shouldShow) {
            console.log('[Install Prompt] Showing prompt in 2 seconds...');
            // Small delay for better UX
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isInstallable, isInstalled]);

    const handleInstall = async () => {
        setIsInstalling(true);
        const success = await install();
        
        if (success) {
            resetInstallPrompt();
            setShowPrompt(false);
        }
        setIsInstalling(false);
    };

    const handleDismiss = () => {
        dismissInstallPrompt();
        setShowPrompt(false);
    };

    if (!showPrompt || !isInstallable) return null;

    return (
        <>
            {/* Desktop Banner */}
            <div className="hidden md:block fixed top-16 left-0 right-0 z-40 animate-in slide-in-from-top duration-500">
                <div className="bg-linear-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Download className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">Install QApp</p>
                                    <p className="text-sm opacity-90">
                                        Access past papers faster with offline support
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleInstall}
                                    disabled={isInstalling}
                                    variant="secondary"
                                    size="sm"
                                    className="font-semibold"
                                >
                                    {isInstalling ? 'Installing...' : 'Install'}
                                </Button>
                                <Button
                                    onClick={handleDismiss}
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary-foreground hover:bg-white/10"
                                >
                                    Not now
                                </Button>
                                <Button
                                    onClick={handleDismiss}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary-foreground hover:bg-white/10"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Sheet */}
            <div className="md:hidden fixed inset-x-0 bottom-16 z-40 animate-in slide-in-from-bottom duration-500">
                <div className="mx-4 mb-4 bg-card border rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-3 rounded-xl">
                                    <Smartphone className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Install QApp</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Get the full experience
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleDismiss}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mt-1"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Benefits */}
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>Works offline for saved papers</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>Instant loading, no waiting</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>Easy access from home screen</span>
                            </li>
                        </ul>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleInstall}
                                disabled={isInstalling}
                                className="flex-1"
                                size="lg"
                            >
                                {isInstalling ? 'Installing...' : 'Install Now'}
                            </Button>
                            <Button
                                onClick={handleDismiss}
                                variant="outline"
                                size="lg"
                            >
                                Not now
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
