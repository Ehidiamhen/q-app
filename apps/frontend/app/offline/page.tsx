/**
 * Offline Fallback Page
 * Shown when user is offline and page is not cached
 */

'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="bg-muted p-6 rounded-full">
                        <WifiOff className="h-16 w-16 text-muted-foreground" />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">You're Offline</h1>
                    <p className="text-muted-foreground">
                        This page isn't available offline. Check your internet connection and try again.
                    </p>
                </div>

                {/* Tips */}
                <div className="bg-muted/50 rounded-lg p-4 text-left">
                    <h2 className="font-semibold text-sm mb-2">Offline Features:</h2>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>Previously viewed pages are cached</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>Downloaded papers work offline</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>Search requires internet connection</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        onClick={() => window.location.reload()}
                        className="flex-1"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                    >
                        <Link href="/">
                            <Home className="h-4 w-4 mr-2" />
                            Go Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
