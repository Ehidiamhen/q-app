/**
 * Question Card
 * Display question in feed/search with author attribution
 */

'use client';

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import type { QuestionCard as QuestionCardType } from '@qapp/shared';
import { FileText, BookOpen } from 'lucide-react';

interface QuestionCardProps {
    question: QuestionCardType;
}

export function QuestionCard({ question }: QuestionCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow border-0 w-sm">


            {/* Header */}
            <CardHeader className="p-3 pb-2">
                <div className="flex items-center gap-2 mb-2">
                    <Link href={`/users/${question.author.id}`}>
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={question.author.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px]">
                                {getInitials(question.author.displayName)}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link
                            href={`/users/${question.author.id}`}
                            className="text-xs font-medium hover:underline truncate block"
                        >
                            {question.author.displayName}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(question.createdAt)}
                        </p>
                    </div>
                </div>

                {/* <Link href={`/questions/${question.id}`}>
                    <h3 className="text-sm font-semibold line-clamp-2 hover:underline">
                        {question.title}
                    </h3>
                </Link> */}
            </CardHeader>

            {/* Image */}
            <Link href={`/questions/${question.id}`}>
                <div className="relative aspect-3/4 w-full bg-muted">
                    <Image
                        src={question.thumbnail}
                        alt={question.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                    />
                    {question.imageCount > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {question.imageCount}
                        </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {question.courseCode}
                    </div>
                </div>
            </Link>

            <CardContent className="p-3 pb-2">
                <Link href={`/questions/${question.id}`}>
                    <h3 className="text-sm font-semibold line-clamp-2 hover:underline">
                        {question.title}
                    </h3>
                </Link>
            </CardContent>

            {/* Content */}
            <CardContent className="p-3  pt-0">
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    <span className="font-mono font-semibold">
                        {question.courseCode}
                    </span>
                    <span>•</span>
                    <span>{question.level}L</span>
                    <span>•</span>
                    <span>{question.semester} Sem</span>
                    <span>•</span>
                    <span>{question.year}</span>
                </div>
            </CardContent>

            {/* Footer */}
            {question.hashtags && question.hashtags.length > 0 && (
                <CardFooter className="p-3  pt-0">
                    <div className="flex flex-wrap gap-1">
                        {question.hashtags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                #{tag}
                            </Badge>
                        ))}
                        {question.hashtags.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{question.hashtags.length - 3}
                            </Badge>
                        )}
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
