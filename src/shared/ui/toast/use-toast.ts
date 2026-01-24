import { toast as sonnerToast } from 'sonner';

export const useToast = () => {
  return {
    toast: sonnerToast,
    error: (message: string) => sonnerToast.error(message),
    success: (message: string) => sonnerToast.success(message),
    warning: (message: string) => sonnerToast.warning(message),
    info: (message: string) => sonnerToast.info(message),
  };
};
