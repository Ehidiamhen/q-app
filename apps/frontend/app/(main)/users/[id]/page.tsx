/**
 * User Profile Page
 * View user's profile and their uploads
 * SSR for profile data, CSR for uploads pagination
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UserProfileContent } from '@/components/users/user-profile-content';
import type { PublicUserProfile } from '@qapp/shared';

async function getUserProfile(userId: string): Promise<PublicUserProfile | null> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/users/${userId}`,
            {
                cache: 'no-store',
            }
        );

        if (!res.ok) {
            return null;
        }

        const response = await res.json();
        // API returns { success: true, data: { user: profile } }
        return response.data?.user || response.user || null;
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return null;
    }
}

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Fetch user profile on server
    const user = await getUserProfile(id);

    if (!user) {
        notFound();
    }

    // Check if viewing own profile
    const supabase = await createClient();


    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    const isOwnProfile = currentUser?.id === id;

    return <UserProfileContent user={user} isOwnProfile={isOwnProfile} />;
}
