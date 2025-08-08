import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ ...toast, visible: false }), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
        {toast.visible && (
        <div
            className="toast-container position-fixed top-0 start-50 translate-middle-x p-3"
            style={{ zIndex: 9999 }}
        >
            <div className={`toast show text-white bg-${toast.type}`}>
            <div className="toast-body fw-bold text-center">
                {toast.message}
            </div>
            </div>
        </div>
        )}

    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
