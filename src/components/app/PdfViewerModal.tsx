import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Skeleton } from './Skeleton';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Link to the PDF. */
  url: string | null;
  /** Shown instead of the viewer when the link could not be created. */
  error?: string | null;
  fileName?: string;
}

/** Shows a PDF inside the app, with fallbacks to open it in a new tab or download it. */
export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, title, subtitle, url, error, fileName }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} maxWidth="4xl">
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive py-10 text-center">{error}</p>
      ) : url ? (
        <iframe title={title} src={url} className="w-full h-[65vh] rounded-2xl border border-border bg-muted" />
      ) : (
        <Skeleton variant="rectangular" className="w-full h-[65vh]" />
      )}
      <div className="flex justify-end gap-2">
        {url && (
          <>
            <Button variant="secondary" leftIcon={<ExternalLink className="w-4 h-4" />} onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
              Open in new tab
            </Button>
            <a href={url} download={fileName || 'document.pdf'} className="inline-flex">
              <Button leftIcon={<Download className="w-4 h-4" />}>Download</Button>
            </a>
          </>
        )}
        <Button variant="tertiary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  </Modal>
);
