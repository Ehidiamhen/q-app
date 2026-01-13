/**
 * User Menu
 * Avatar with dropdown for authenticated users
 */

'use client';

import { useAuth } from '@/hooks/use-auth';
import { SignInButton } from './sign-in-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { LogOut, User } from 'lucide-react';

export function UserMenu() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    if (loading) {
        return (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        );
    }

    if (!user) {
        return <SignInButton />;
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User';

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/users/${user.id}`)}
                className="relative"
            >
                <Avatar className="h-8 w-8">
                    <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={displayName}
                    />
                    <AvatarFallback className="text-xs">
                        {getInitials(displayName)}
                    </AvatarFallback>
                </Avatar>
            </Button>

            <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign Out</span>
            </Button>
        </div>
    );
}
