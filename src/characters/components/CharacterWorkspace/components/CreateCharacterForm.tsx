'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export interface CreateCharacterFormValues {
  name: string;
  description: string;
  imageUrl: string;
}

const defaultValues: CreateCharacterFormValues = {
  name: '',
  description: '',
  imageUrl: '',
};

export interface CreateCharacterFormProps {
  initialValues?: Partial<CreateCharacterFormValues>;
  onSubmit: (data: CreateCharacterFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
}

/**
 * Reusable create-character form using react-hook-form.
 * Can be used inside a modal or any container.
 */
export function CreateCharacterForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Create Character',
  cancelLabel = 'Cancel',
  disabled = false,
}: CreateCharacterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCharacterFormValues>({
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const handleCancel = () => {
    reset(defaultValues);
    onCancel?.();
  };

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await onSubmit(data);
        reset(defaultValues);
      })}
      className="grid gap-4 py-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="create-character-name">Name *</Label>
        <Input
          id="create-character-name"
          placeholder="Character name"
          autoFocus
          disabled={disabled}
          {...register('name', { required: 'Name is required' })}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="create-character-description">Description</Label>
        <Input
          id="create-character-description"
          placeholder="Character description (optional)"
          disabled={disabled}
          {...register('description')}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="create-character-imageUrl">Image URL</Label>
        <Input
          id="create-character-imageUrl"
          placeholder="https://example.com/character.jpg (optional)"
          disabled={disabled}
          {...register('imageUrl')}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={disabled}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? 'Creating...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
