'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';

interface RelationshipLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLabel?: string;
  currentWhy?: string;
  onConfirm: (label: string, why?: string) => void;
}

export function RelationshipLabelDialog({
  open,
  onOpenChange,
  currentLabel = '',
  currentWhy = '',
  onConfirm,
}: RelationshipLabelDialogProps) {
  const [label, setLabel] = useState(currentLabel);
  const [why, setWhy] = useState(currentWhy);

  // Update fields when props change
  useEffect(() => {
    setLabel(currentLabel);
    setWhy(currentWhy);
  }, [currentLabel, currentWhy, open]);

  const handleConfirm = () => {
    onConfirm(label.trim(), why.trim() || undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLabel(currentLabel); // Reset to original value
    setWhy(currentWhy);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Relationship</DialogTitle>
          <DialogDescription>
            Enter a label and description for this relationship.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Trusts, Enemies, Allies"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleConfirm();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="why">Description</Label>
            <Textarea
              id="why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Explain why this relationship exists..."
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleConfirm();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
