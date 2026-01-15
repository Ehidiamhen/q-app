/**
 * PWA Update Hook
 * Detects when a new service worker is available
 */

'use client';

import { useEffect, useState } from 'react';

export function usePWAUpdate() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        // Check for updates on load
        navigator.serviceWorker.ready.then((reg) => {
            setRegistration(reg);

            // Check for updates every 60 seconds
            setInterval(() => {
                reg.update();
            }, 60000);
        });

        // Listen for controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            setUpdateAvailable(true);
        });

        // Listen for waiting SW
        const checkForUpdate = async () => {
            const reg = await navigator.serviceWorker.ready;
            if (reg.waiting) {
                setUpdateAvailable(true);
            }
        };

        checkForUpdate();
    }, []);

    const applyUpdate = () => {
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    };

    return {
        updateAvailable,
        applyUpdate,
    };
}
