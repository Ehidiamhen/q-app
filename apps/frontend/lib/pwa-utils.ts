/**
 * PWA Utility Functions
 */

const INSTALL_PROMPT_KEY = 'pwa-install-prompt';
const PAGE_VIEWS_KEY = 'pwa-page-views';
const VISIT_COUNT_KEY = 'pwa-visit-count';
const LAST_VISIT_KEY = 'pwa-last-visit';

interface InstallPromptData {
    dismissed: boolean;
    dismissedAt?: number;
    dismissCount: number;
}

/**
 * Check if user should see install prompt based on engagement
 * Triggers after: 2+ visits OR 3+ pages viewed
 */
export function shouldShowInstallPrompt(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        // Check if previously dismissed
        const promptData = getInstallPromptData();
        if (promptData.dismissed) {
            // Re-prompt after 7 days if dismissed more than twice
            const daysSinceDismiss = promptData.dismissedAt
                ? (Date.now() - promptData.dismissedAt) / (1000 * 60 * 60 * 24)
                : 0;
            
            if (promptData.dismissCount >= 2 && daysSinceDismiss < 7) {
                return false;
            }
        }

        // Track page views
        const pageViews = incrementPageViews();
        
        // Track visits (new session if >30 mins since last visit)
        const visitCount = trackVisit();

        // Show if: 2+ visits OR 3+ pages
        return visitCount >= 2 || pageViews >= 3;
    } catch {
        return false;
    }
}

/**
 * Mark install prompt as dismissed
 */
export function dismissInstallPrompt(): void {
    try {
        const data = getInstallPromptData();
        const newData: InstallPromptData = {
            dismissed: true,
            dismissedAt: Date.now(),
            dismissCount: data.dismissCount + 1,
        };
        localStorage.setItem(INSTALL_PROMPT_KEY, JSON.stringify(newData));
    } catch {
        // Ignore localStorage errors
    }
}

/**
 * Reset install prompt state (after successful install)
 */
export function resetInstallPrompt(): void {
    try {
        localStorage.removeItem(INSTALL_PROMPT_KEY);
    } catch {
        // Ignore
    }
}

/**
 * Get install prompt data
 */
function getInstallPromptData(): InstallPromptData {
    try {
        const data = localStorage.getItem(INSTALL_PROMPT_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch {
        // Ignore
    }
    return { dismissed: false, dismissCount: 0 };
}

/**
 * Increment page views counter
 */
function incrementPageViews(): number {
    try {
        const current = parseInt(localStorage.getItem(PAGE_VIEWS_KEY) || '0', 10);
        const newCount = current + 1;
        localStorage.setItem(PAGE_VIEWS_KEY, newCount.toString());
        return newCount;
    } catch {
        return 0;
    }
}

/**
 * Track visits (session-based)
 */
function trackVisit(): number {
    try {
        const lastVisit = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0', 10);
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;

        // New session if >30 mins since last visit
        if (now - lastVisit > thirtyMinutes) {
            const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
            localStorage.setItem(VISIT_COUNT_KEY, visitCount.toString());
            localStorage.setItem(LAST_VISIT_KEY, now.toString());
            return visitCount;
        }

        // Update last visit time but don't increment count
        localStorage.setItem(LAST_VISIT_KEY, now.toString());
        return parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
    } catch {
        return 0;
    }
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
    if (typeof window === 'undefined') return false;
    
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    );
}
