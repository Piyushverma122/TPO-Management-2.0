import React, { useEffect, useState } from 'react';
import { PdfViewerModal } from '../app/PdfViewerModal';
import { getOfferFileUrl } from '../../api/offer.api';
import type { Offer } from '../../types';
import { formatPackage, getErrorMessage } from './offerUtils';

interface OfferLetterViewerProps {
  offer: Offer | null;
  onClose: () => void;
}

/** Shows an offer letter inside the app. The link is a short-lived signed URL, fetched when opened. */
export const OfferLetterViewer: React.FC<OfferLetterViewerProps> = ({ offer, onClose }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    setError(null);
    if (!offer) return;

    let cancelled = false;
    getOfferFileUrl(offer.id)
      .then((file) => !cancelled && setUrl(file.url))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not open the offer letter.')));
    return () => {
      cancelled = true;
    };
  }, [offer]);

  const subtitle = offer
    ? [offer.students?.users?.full_name, offer.companies?.name, formatPackage(offer.package)].filter((v) => v && v !== '-').join(' \u00B7 ')
    : undefined;

  return <PdfViewerModal isOpen={Boolean(offer)} onClose={onClose} title="Offer letter" subtitle={subtitle} url={url} error={error} fileName={offer?.file_name || undefined} />;
};
