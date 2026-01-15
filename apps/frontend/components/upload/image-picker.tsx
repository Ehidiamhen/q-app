'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImagePlus, X } from 'lucide-react';

interface ImagePickerProps {
    images: File[];
    onImagesChange: (files: File[]) => void;
    maxImages?: number;
}

export function ImagePicker({
    images,
    onImagesChange,
    maxImages = 10,
}: ImagePickerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remainingSlots = maxImages - images.length;

        if (files.length > remainingSlots) {
            alert(`You can only upload ${maxImages} images maximum`);
            return;
        }

        // Validate file types
        const validFiles = files.filter((file) => {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image file`);
                return false;
            }
            return true;
        });

        onImagesChange([...images, ...validFiles]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={images.length >= maxImages}
            />

            {/* Image count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {images.length} / {maxImages} images selected
                </p>
                {images.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onImagesChange([])}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {/* Existing images */}
                {images.map((file, index) => (
                    <Card key={index} className="relative aspect-square overflow-hidden">
                        <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemove(index)}
                            className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Card>
                ))}

                {/* Add more button */}
                {images.length < maxImages && (
                    <button
                        type="button"
                        onClick={handleClick}
                        className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">Add Images</span>
                    </button>
                )}
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
                Select 1-{maxImages} images of the question paper. Images will be
                compressed before upload.
            </p>
        </div>
    );
}
