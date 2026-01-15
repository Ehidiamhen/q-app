'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, Upload, FileCheck } from 'lucide-react';

export type UploadStep = 'compressing' | 'uploading' | 'creating' | 'complete';

interface UploadProgressProps {
    step: UploadStep;
    currentImage?: number;
    totalImages?: number;
    progress: number;
}

export function UploadProgress({
    step,
    currentImage = 0,
    totalImages = 0,
    progress,
}: UploadProgressProps) {
    const getStepInfo = () => {
        switch (step) {
            case 'compressing':
                return {
                    icon: <Loader2 className="h-5 w-5 animate-spin" />,
                    title: 'Compressing images...',
                    description: 'Optimizing images for faster upload',
                };
            case 'uploading':
                return {
                    icon: <Upload className="h-5 w-5 animate-pulse" />,
                    title: `Uploading images... (${currentImage}/${totalImages})`,
                    description: 'Uploading directly to cloud storage',
                };
            case 'creating':
                return {
                    icon: <FileCheck className="h-5 w-5 animate-pulse" />,
                    title: 'Creating question paper...',
                    description: 'Saving your question paper details',
                };
            case 'complete':
                return {
                    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                    title: 'Upload complete!',
                    description: 'Redirecting to your question paper...',
                };
        }
    };

    const stepInfo = getStepInfo();

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        {stepInfo.icon}
                        <div className="flex-1">
                            <p className="font-medium">{stepInfo.title}</p>
                            <p className="text-sm text-muted-foreground">
                                {stepInfo.description}
                            </p>
                        </div>
                    </div>

                    <Progress value={progress} className="h-2" />

                    <p className="text-xs text-muted-foreground text-center">
                        {progress}% complete
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
