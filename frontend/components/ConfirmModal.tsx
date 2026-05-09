import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isDanger ? 'bg-rose-100' : 'bg-blue-100'}`}>
            {isDanger ? (
              <Trash2 className="h-8 w-8 text-rose-500" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            )}
          </div>

          <h3 className="mb-2 text-xl font-bold text-slate-800">
            {title}
          </h3>
          
          <p className="mb-6 text-sm text-slate-500">
            {message}
          </p>

          <div className="flex w-full flex-row gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md ${
                isDanger 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                  : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
              }`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
