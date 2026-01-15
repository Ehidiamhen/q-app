/**
 * PWA Update Prompt
 * Notifies users when a new version is available
 */

'use client';

import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks/use-pwa-update';
import { useState } from 'react';

export function UpdatePrompt() {
    const { updateAvailable, applyUpdate } = usePWAUpdate();
    const [dismissed, setDismissed] = useState(false);

    if (!updateAvailable || dismissed) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-card border rounded-lg shadow-lg max-w-sm">
                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <RefreshCw className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Update Available</h4>
                                <p className="text-sm text-muted-foreground">
                                    A new version of QApp is ready
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setDismissed(true)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-1"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            onClick={applyUpdate}
                            size="sm"
                            className="flex-1"
                        >
                            Update Now
                        </Button>
                        <Button
                            onClick={() => setDismissed(true)}
                            variant="outline"
                            size="sm"
                        >
                            Later
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
