'use client';

import { useState } from 'react';
import Image from 'next/image';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionImageGalleryProps {
    images: string[];
    title: string;
}

export function QuestionImageGallery({ images, title }: QuestionImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Defensive check: ensure images is an array
    const imageArray = Array.isArray(images) ? images : [];

    if (imageArray.length === 0) {
        return (
            <div className="aspect-3/4 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
            </div>
        );
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? imageArray.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === imageArray.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-3/4 bg-muted rounded-lg overflow-hidden">
                {/* <Zoom> */}
                    <Image
                        src={imageArray[currentIndex]}
                        alt={`${title} - Page ${currentIndex + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 896px"
                        priority={currentIndex === 0}
                    />
                {/* </Zoom> */}

                {/* Navigation Arrows (only show if multiple images) */}
                {imageArray.length > 1 && (
                    <>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </>
                )}
            </div>

            {/* Image Counter */}
            <div className="text-center text-sm text-muted-foreground">
                Page {currentIndex + 1} of {imageArray.length}
            </div>

            {/* Thumbnail Navigation (only show if multiple images) */}
            {imageArray.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                    {imageArray.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`relative shrink-0 w-16 h-20 rounded border-2 transition-colors ${i === currentIndex
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-muted hover:border-primary/50'
                                }`}
                        >
                            <Image
                                src={img}
                                alt={`Thumbnail ${i + 1}`}
                                fill
                                className="object-cover rounded"
                                sizes="64px"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-center text-muted-foreground">
                {imageArray.length > 1 && 'Use arrows or thumbnails to navigate'}
            </p>
        </div>
    );
}
