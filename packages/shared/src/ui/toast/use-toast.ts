import { toast as sonnerToast } from 'sonner';

export type ToastHandler = (message: string) => void;

export interface ToastController {
  (message: string): void;
  error: ToastHandler;
  success: ToastHandler;
  warning: ToastHandler;
  info: ToastHandler;
}

export interface ToastApi {
  toast: ToastController;
}

const toastController = ((message: string) => {
  sonnerToast(message);
}) as ToastController;

toastController.error = (message) => sonnerToast.error(message);
toastController.success = (message) => sonnerToast.success(message);
toastController.warning = (message) => sonnerToast.warning(message);
toastController.info = (message) => sonnerToast.info(message);

export const useToast = (): ToastApi => ({
  toast: toastController,
});
