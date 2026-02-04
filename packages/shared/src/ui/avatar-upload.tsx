'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Upload, Image, X, Loader2, Users } from 'lucide-react';
import { cn } from '@magicborn/shared/lib/utils';

export interface AvatarUploadProps {
  value?: string | null; // Current image URL
  onChange?: (file: File) => Promise<void>; // Called when file is selected (before upload)
  onUpload?: (file: File) => Promise<string>; // Called to upload file, returns URL
  onRemove?: () => void; // Called when image is removed
  accept?: string; // File types to accept (default: 'image/*')
  maxSize?: number; // Max file size in bytes (default: 5MB)
  disabled?: boolean;
  size?: number; // Size of the avatar in pixels (default: 48)
  className?: string;
}

export function AvatarUpload({
  value,
  onChange,
  onUpload,
  onRemove,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  size = 48,
  className,
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value prop changes
  React.useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Create preview URL immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Call onChange if provided (for immediate preview)
    if (onChange) {
      try {
        await onChange(file);
      } catch (err) {
        console.error('Error in onChange:', err);
        setError('Failed to process file');
        setPreviewUrl(value || null);
        URL.revokeObjectURL(objectUrl);
        return;
      }
    }

    // Upload file if onUpload is provided
    if (onUpload) {
      setIsUploading(true);
      try {
        const uploadedUrl = await onUpload(file);
        setPreviewUrl(uploadedUrl);
        // Clean up object URL since we have the uploaded URL now
        URL.revokeObjectURL(objectUrl);
      } catch (err) {
        console.error('Error uploading file:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload file');
        setPreviewUrl(value || null);
        URL.revokeObjectURL(objectUrl);
      } finally {
        setIsUploading(false);
      }
    }
  }, [onChange, onUpload, value, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, onRemove]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative rounded-full overflow-hidden border-2 transition-all cursor-pointer group',
          isDragging && 'border-primary scale-105',
          !isDragging && 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-primary/50'
        )}
        style={{ width: size, height: size }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  const placeholder = document.createElement('div');
                  placeholder.className = 'w-full h-full flex items-center justify-center bg-muted';
                  placeholder.innerHTML = '<svg class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                  target.parentElement.appendChild(placeholder);
                }
              }}
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-white" />
                      {onRemove && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleRemove}
                          disabled={isUploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={cn(
            'w-full h-full flex flex-col items-center justify-center bg-muted',
            !disabled && 'group-hover:bg-muted/80'
          )}>
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            ) : (
              <Users className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1 absolute left-0 top-full whitespace-nowrap">{error}</p>
      )}
    </div>
  );
}
