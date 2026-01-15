'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';
import type { PublicUserProfile } from '@qapp/shared';

interface UserProfileHeaderProps {
    user: PublicUserProfile;
    isOwnProfile: boolean;
    onEditName?: () => void;
}

export function UserProfileHeader({
    user,
    isOwnProfile,
    onEditName,
}: UserProfileHeaderProps) {
    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar */}
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>
                            {user.displayName ? (
                                getInitials(user.displayName)
                            ) : (
                                <UserIcon className="h-12 w-12" />
                            )}
                        </AvatarFallback>
                    </Avatar>

                    {/* Display Name */}
                    <div>
                        <h1 className="text-2xl font-bold">{user.displayName}</h1>
                        {isOwnProfile && onEditName && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onEditName}
                                className="mt-2"
                            >
                                Edit Display Name
                            </Button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-muted-foreground">
                        <div>
                            <span className="font-semibold text-foreground">
                                {user.uploadCount || 0}
                            </span>{' '}
                            {user.uploadCount === 1
                                ? 'question paper'
                                : 'question papers'}{' '}
                            shared
                        </div>
                        <div>Member since {joinDate}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
