'use client';

import React, { useEffect, useRef } from 'react';
import { useCopilotSidebar } from '@magicborn/ai/copilotkit/providers/CopilotKitProvider';

interface CopilotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructions?: string;
}

/**
 * CopilotChatModal - Controls CopilotSidebar visibility via context
 * The sidebar is already rendered in CopilotKitProvider, we just control its open state
 * When sidebar closes (user clicks X), we sync back to close the modal state
 */
export function CopilotChatModal({
  isOpen,
  onClose,
  instructions,
}: CopilotChatModalProps) {
  const { isOpen: sidebarIsOpen, setIsOpen } = useCopilotSidebar();
  const prevSidebarOpenRef = useRef(sidebarIsOpen);

  // Sync modal state with sidebar state
  useEffect(() => {
    if (isOpen !== sidebarIsOpen) {
      setIsOpen(isOpen);
    }
  }, [isOpen, setIsOpen, sidebarIsOpen]);

  // Detect when sidebar closes (user clicked X) and sync back to modal state
  useEffect(() => {
    if (prevSidebarOpenRef.current && !sidebarIsOpen && isOpen) {
      // Sidebar was closed by user, sync modal state
      onClose();
    }
    prevSidebarOpenRef.current = sidebarIsOpen;
  }, [sidebarIsOpen, isOpen, onClose]);

  // This component doesn't render anything - it just controls the sidebar
  return null;
}
