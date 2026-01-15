'use client';

import { useState } from 'react';
import { UserProfileHeader } from './user-profile-header';
import { EditDisplayNameDialog } from './edit-display-name-dialog';
import { UserUploadsList } from './user-uploads-list';
import { Separator } from '@/components/ui/separator';
import type { PublicUserProfile } from '@qapp/shared';

interface UserProfileContentProps {
    user: PublicUserProfile;
    isOwnProfile: boolean;
}

export function UserProfileContent({ user, isOwnProfile }: UserProfileContentProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-8">
            {/* Profile Header */}
            <UserProfileHeader
                user={user}
                isOwnProfile={isOwnProfile}
                onEditName={isOwnProfile ? () => setEditDialogOpen(true) : undefined}
            />

            {/* Edit Display Name Dialog */}
            {isOwnProfile && (
                <EditDisplayNameDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    currentName={user.displayName}
                    userId={user.id}
                />
            )}

            {/* Divider */}
            <div>
                <h2 className="text-xl font-semibold mb-4">
                    {isOwnProfile ? 'My Uploads' : 'Uploads'}
                </h2>
                <Separator />
            </div>

            {/* User's Uploads */}
            <UserUploadsList userId={user.id} displayName={user.displayName} />
        </div>
    );
}
