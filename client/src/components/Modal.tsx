import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export default function Modal({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  isLoading = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
            {onSubmit && (
              <Button
                onClick={onSubmit}
                disabled={isLoading}
                className="btn-primary-green flex-1"
              >
                {isLoading ? 'Processando...' : submitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
