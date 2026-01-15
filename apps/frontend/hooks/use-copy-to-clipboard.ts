import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for copying text to clipboard with toast feedback
 */
export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false);

    const copy = async (text: string) => {
        try {
            // Check if Clipboard API is available
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback method for browsers without Clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                } finally {
                    textArea.remove();
                }
            }
            
            setIsCopied(true);
            toast.success('Copied to clipboard!');

            // Reset after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
            console.error('Copy failed:', error);
        }
    };

    return { copy, isCopied };
}