/**
 * Sign In Button
 * Triggers Google OAuth flow
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function SignInButton() {
    const handleSignIn = async () => {
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <Button onClick={handleSignIn} variant="default" size="sm">
            <LogIn className="h-4 w-4" />
            Sign In
        </Button>
    );
}
