/**
 * App Logo Component
 * Reusable logo with icon and text
 */

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppLogoProps {
    showIcon?: boolean;
    showText?: boolean;
    iconSize?: number;
    className?: string;
    textClassName?: string;
}

export function AppLogo({
    showIcon = true,
    showText = true,
    iconSize = 32,
    className,
    textClassName,
}: AppLogoProps) {
    return (
        <Link
            href="/"
            className={cn('flex items-center gap-2', className)}
        >
            {showIcon && (
                <Image
                    src="/apple-touch-icon.png"
                    alt="QApp Logo"
                    width={iconSize}
                    height={iconSize}
                    className="shrink-0 hidden md:block"
                    priority
                />
            )}
            {showText && (
                <span className={cn('font-bold text-xl', textClassName)}>
                    QApp
                </span>
            )}
        </Link>
    );
}
