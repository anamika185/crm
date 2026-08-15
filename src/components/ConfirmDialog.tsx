import { TriangleAlert } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-body">
        <div className="confirm-icon">
          <TriangleAlert size={20} />
        </div>
        <p style={{ margin: 0, color: 'var(--gray-700)' }}>{message}</p>
      </div>
    </Modal>
  );
}