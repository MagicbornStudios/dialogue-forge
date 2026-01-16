'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { CopilotSidebar } from '@copilotkit/react-ui';
import { Bot } from 'lucide-react';

interface CopilotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructions?: string;
}

/**
 * CopilotChatModal - A modal dialog for CopilotKit chat
 * Can be launched from workspace menu bar or graph editor toolbars
 * Uses CopilotSidebar in a modal container for full chat functionality
 */
export function CopilotChatModal({
  isOpen,
  onClose,
  instructions = 'You are an AI assistant for the Forge workspace. Help users create and edit dialogue graphs, manage flags, and build interactive narratives. You have access to chapters, acts, pages, and graphs for context.',
}: CopilotChatModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 m-4">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-primary" />
            <DialogTitle>AI Assistant</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
          <div className="absolute inset-0">
            <CopilotSidebar
              instructions={instructions}
              defaultOpen={true}
              labels={{
                title: 'AI Assistant',
                initial: 'Ask about your dialogue graphs, flags, chapters, acts, and pages',
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
