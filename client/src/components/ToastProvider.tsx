import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Alert, Snackbar, type AlertColor } from '@mui/material';

interface Toast {
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = useCallback((message: string, severity: AlertColor = 'success', duration = 5000) => {
    setToast({ message, severity, duration });
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={toast?.duration ?? 5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={toast?.severity ?? 'info'} sx={{ width: '100%' }}>
          {toast?.message ?? ''}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
