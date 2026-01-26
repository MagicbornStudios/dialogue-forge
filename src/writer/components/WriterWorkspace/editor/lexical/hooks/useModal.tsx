import { useState, useCallback } from 'react';
import * as ReactDOM from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

type ModalContent = (onClose: () => void) => React.ReactNode;

export default function useModal(): [React.ReactNode, (title: string, getContent: ModalContent) => void] {
  const [modalContent, setModalContent] = useState<{
    title: string;
    content: ModalContent;
  } | null>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const showModal = useCallback((title: string, getContent: ModalContent) => {
    setModalContent({ title, content: getContent });
  }, []);

  const modal = modalContent
    ? ReactDOM.createPortal(
        <Dialog open={true} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{modalContent.title}</DialogTitle>
            </DialogHeader>
            {modalContent.content(onClose)}
          </DialogContent>
        </Dialog>,
        document.body
      )
    : null;

  return [modal, showModal];
}
