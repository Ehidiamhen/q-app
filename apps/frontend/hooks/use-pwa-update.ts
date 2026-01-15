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

        let isFirstLoad = true;

        // Check for updates on load
        navigator.serviceWorker.ready.then((reg) => {
            setRegistration(reg);

            // Don't show update on first load (it's not an update, it's initial install)
            setTimeout(() => {
                isFirstLoad = false;
            }, 3000);

            // Check for updates every 60 seconds
            setInterval(() => {
                reg.update();
            }, 60000);
        });

        // Listen for controller change (new SW activated)
        const handleControllerChange = () => {
            // Only show update if not first load
            if (!isFirstLoad) {
                setUpdateAvailable(true);
            }
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        // Listen for waiting SW (but only after first load)
        const checkForUpdate = async () => {
            // Wait a bit to avoid false positive on first load
            await new Promise(resolve => setTimeout(resolve, 3000));
            const reg = await navigator.serviceWorker.ready;
            // Only show if there's a waiting SW and controller exists (means it's an update, not first install)
            if (reg.waiting && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
            }
        };

        checkForUpdate();

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
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
