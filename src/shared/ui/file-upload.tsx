'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Upload, Image, X, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface FileUploadProps {
  value?: string | null; // Current image URL
  onChange?: (file: File) => Promise<void>; // Called when file is selected (before upload)
  onUpload?: (file: File) => Promise<string>; // Called to upload file, returns URL
  onRemove?: () => void; // Called when image is removed
  accept?: string; // File types to accept (default: 'image/*')
  maxSize?: number; // Max file size in bytes (default: 5MB)
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  value,
  onChange,
  onUpload,
  onRemove,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  className,
}: FileUploadProps) {
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

  const handleRemove = useCallback(() => {
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
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-border',
          disabled && 'opacity-50 cursor-not-allowed',
          previewUrl && 'border-solid'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {previewUrl ? (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleClick}
                    disabled={isUploading}
                    className="h-8"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1.5" />
                        Replace
                      </>
                    )}
                  </Button>
                  {onRemove && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemove}
                      disabled={isUploading}
                      className="h-8"
                    >
                      <X className="h-3 w-3 mr-1.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center p-8 cursor-pointer',
              disabled && 'cursor-not-allowed'
            )}
            onClick={handleClick}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-muted p-4 mb-3">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP up to {Math.round(maxSize / 1024 / 1024)}MB
                </p>
              </>
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
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
