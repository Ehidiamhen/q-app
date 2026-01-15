'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePicker } from './image-picker';
import { UploadProgress, UploadStep } from './upload-progress';
import { LEVELS, SEMESTERS, uploadQuestionFormSchema } from '@qapp/shared';
import { Loader2 } from 'lucide-react';

type UploadFormData = z.infer<typeof uploadQuestionFormSchema>;

interface PresignResponse {
    success: boolean;
    data: {
        urls: {
            presignedUrl: string;
            key: string;
            publicUrl: string;
        }[];
    };
}

export function UploadForm() {
    const router = useRouter();
    const [images, setImages] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState<UploadStep>('compressing');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentImage, setCurrentImage] = useState(0);

    const form = useForm<UploadFormData>({
        resolver: zodResolver(uploadQuestionFormSchema),
        defaultValues: {
            title: '',
            courseCode: '',
            courseName: '',
            level: 100,
            year: new Date().getFullYear(),
            semester: 'First',
            hashtags: '',
            images: [],
        },
    });

    console.log("form.formState.errors: ", form.formState.errors);
    // Update form when images change
    const handleImagesChange = (files: File[]) => {
        setImages(files);
        form.setValue('images', files);
        form.trigger('images');
    };

    const onSubmit = async (data: UploadFormData) => {
        setIsUploading(true);
        setUploadStep('compressing');
        setUploadProgress(0);

        try {
            // 1. Compress images
            setUploadProgress(10);
            const compressedFiles = await Promise.all(
                data.images.map((file) =>
                    imageCompression(file, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    })
                )
            );
            const totalSize = compressedFiles.reduce((acc, file) => acc + file.size, 0);
            console.log("compressedFiles: ", compressedFiles);
            console.log("totalSize: ", totalSize);

            // 2. Get presigned URLs
            setUploadStep('uploading');
            setUploadProgress(20);

            const presignRes: PresignResponse = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: compressedFiles.map((file) => ({
                        filename: file.name,
                        contentType: file.type,
                        size: file.size,
                    })),
                }),
            }).then(res => res.json());

            if (!presignRes.success) {
                throw new Error('Failed to get upload URLs');
            }

            const { urls } = presignRes.data;

            // 3. Upload to R2
            const uploadedUrls: string[] = [];
            const progressPerImage = 60 / compressedFiles.length;

            for (let i = 0; i < compressedFiles.length; i++) {
                setCurrentImage(i + 1);

                const uploadRes = await fetch(urls[i].presignedUrl, {
                    method: 'PUT',
                    body: compressedFiles[i],
                    headers: {
                        'Content-Type': compressedFiles[i].type,
                    },
                });

                if (!uploadRes.ok) {
                    throw new Error(`Failed to upload image ${i + 1}`);
                }

                uploadedUrls.push(urls[i].publicUrl);
                setUploadProgress(20 + progressPerImage * (i + 1));
            }

            // 4. Create question
            setUploadStep('creating');
            setUploadProgress(85);

            // Transform hashtags from comma-separated string to array
            const hashtags = data.hashtags
                ? data.hashtags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0)
                : [];

            const questionRes = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    courseCode: data.courseCode,
                    courseName: data.courseName,
                    level: data.level,
                    year: data.year,
                    semester: data.semester,
                    hashtags,
                    images: uploadedUrls,
                }),
            });

            if (!questionRes.ok) {
                const error = await questionRes.json();
                throw new Error(error.error || 'Failed to create question');
            }

            const { data: question } = await questionRes.json();

            // 5. Success!
            setUploadStep('complete');
            setUploadProgress(100);

            toast.success('Question paper uploaded successfully!');

            // Redirect to question detail page
            setTimeout(() => {
                router.push(`/questions/${question.id}`);
            }, 1000);
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(
                error instanceof Error ? error.message : 'Upload failed. Please try again.'
            );
            setIsUploading(false);
        }
    };

    // Generate year options
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) =>
        (currentYear - i).toString()
    );

    if (isUploading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <UploadProgress
                    step={uploadStep}
                    currentImage={currentImage}
                    totalImages={images.length}
                    progress={uploadProgress}
                />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Images */}
                <Card>
                    <CardHeader>
                        <CardTitle>Images *</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="images"
                            render={() => (
                                <FormItem>
                                    <FormControl>
                                        <ImagePicker
                                            images={images}
                                            onImagesChange={handleImagesChange}
                                            maxImages={10}
                                        />
                                    </FormControl>
                                    <FormMessage className='text-red-500' />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Question Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Question Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Title */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., CS101 Final Exam 2024"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        A descriptive title for the question paper
                                    </FormDescription>
                                    <FormMessage  />
                                </FormItem>
                            )}
                        />

                        {/* Course Code & Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="courseCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course Code *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., CS101" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="courseName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., Introduction to Programming"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Level, Year, Semester */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Level *</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            defaultValue={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {LEVELS.map((level) => (
                                                    <SelectItem
                                                        key={level}
                                                        value={level.toString()}
                                                    >
                                                        {level}L
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Year *</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            defaultValue={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select year" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className='overflow-y-scroll max-h-[500px]'>
                                                {years.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="semester"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Semester *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select semester" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SEMESTERS.map((semester) => (
                                                    <SelectItem key={semester} value={semester}>
                                                        {semester}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Hashtags */}
                        <FormField
                            control={form.control}
                            name="hashtags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hashtags (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., programming, java, final"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Separate multiple tags with commas (max 10)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isUploading || images.length === 0}
                        className='bg-blue-500 hover:bg-blue-600'
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload Question Paper'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
