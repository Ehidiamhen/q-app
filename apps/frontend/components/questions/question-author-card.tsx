'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { User as UserIcon, ExternalLink } from 'lucide-react';

interface QuestionAuthorCardProps {
    author: {
        id: string;
        displayName: string;
        avatarUrl: string | null;
    };
    uploadedAt: Date;
}

export function QuestionAuthorCard({ author, uploadedAt }: QuestionAuthorCardProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Link href={`/users/${author.id}`}>
                        <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 ring-primary transition-all">
                            <AvatarImage src={author.avatarUrl || undefined} />
                            <AvatarFallback>
                                {author.displayName ? (
                                    getInitials(author.displayName)
                                ) : (
                                    <UserIcon className="h-6 w-6" />
                                )}
                            </AvatarFallback>
                        </Avatar>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">Uploaded by</p>
                        <Link
                            href={`/users/${author.id}`}
                            className="font-semibold hover:underline truncate block"
                        >
                            {author.displayName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(uploadedAt)}
                        </p>
                    </div>

                    {/* View Profile Button */}
                    <Link href={`/users/${author.id}`}>
                        <Button variant="outline" size="sm">
                            <span className="hidden sm:inline">View Profile</span>
                            <ExternalLink className="h-4 w-4 sm:ml-2" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
