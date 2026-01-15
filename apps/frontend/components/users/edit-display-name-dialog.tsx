'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const displayNameSchema = z.object({
    displayName: z
        .string()
        .min(2, 'Display name must be at least 2 characters')
        .max(50, 'Display name must be at most 50 characters')
        .trim(),
});

type DisplayNameFormData = z.infer<typeof displayNameSchema>;

interface EditDisplayNameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentName: string;
    userId: string;
}

export function EditDisplayNameDialog({
    open,
    onOpenChange,
    currentName,
    userId,
}: EditDisplayNameDialogProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<DisplayNameFormData>({
        resolver: zodResolver(displayNameSchema),
        defaultValues: {
            displayName: currentName,
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: DisplayNameFormData) => {
            const res = await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update display name');
            }

            return res.json();
        },
        onSuccess: () => {
            // Invalidate queries to refetch user data
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
            queryClient.invalidateQueries({ queryKey: ['auth'] });

            toast.success('Display name updated successfully!');
            onOpenChange(false);
            router.refresh();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const onSubmit = async (data: DisplayNameFormData) => {
        setIsSubmitting(true);
        try {
            await mutation.mutateAsync(data);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] w-5/6 rounded-lg">
                <DialogHeader>
                    <DialogTitle>Edit Display Name</DialogTitle>
                    <DialogDescription>
                        Update your display name. This will be visible to all users.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter your display name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className='flex flex-col space-y-4 sm:flex-row sm:space-x-2 sm:space-y-0'>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
