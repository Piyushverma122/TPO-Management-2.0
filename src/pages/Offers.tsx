import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck,
  Award,
  Download,
  Printer,
  Eye,
  Check,
  X,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Ban,
  Send,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, SearchInput } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { getApplications, updateApplication } from '../api/application.api';

export interface OfferItem {
  id: string;
  applicationId: string;
  companyName: string;
  companyLogo: string;
  roleTitle: string;
  ctc: string;
  offerDate: string;
  joiningDate: string;
  location: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Offer Released';
  pdfUrl?: string;
  remarks?: string;
}

export const Offers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, warning, error: toastError, info } = useToast();

  // API Data State
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Latest Offer');

  // Modals
  const [previewPdfOffer, setPreviewPdfOffer] = useState<OfferItem | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  // Fetch Live Logged-In Student Offer Letters from Supabase Backend API
  const fetchOfferData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const appRes = await getApplications();
      const rawApps = appRes.data?.applications || [];

      // Filter applications that have reached Offer / Selected / Placed / Accepted / Rejected state
      const offerApps = rawApps.filter((a: any) => {
        const s = (a.status || '').toLowerCase();
        return (
          s.includes('offer') ||
          s.includes('selected') ||
          s.includes('placed') ||
          s.includes('accepted') ||
          s.includes('rejected')
        );
      });

      const formattedOffers: OfferItem[] = offerApps.map((a: any) => {
        const driveObj = a.placement_drives || a.drives;
        const compObj = driveObj?.companies;
        const offerDateStr = a.updated_at || a.created_at || new Date().toISOString();

        let formattedStatus: 'Pending' | 'Accepted' | 'Rejected' | 'Offer Released' = 'Pending';
        const st = (a.status || '').toLowerCase();
        if (st.includes('accepted')) formattedStatus = 'Accepted';
        else if (st.includes('rejected') || st.includes('declined')) formattedStatus = 'Rejected';
        else if (st.includes('offer')) formattedStatus = 'Offer Released';
        else formattedStatus = 'Pending';

        return {
          id: a.id,
          applicationId: a.id,
          companyName: compObj?.name || 'Corporate Partner',
          companyLogo: compObj?.logo_url || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=120',
          roleTitle: driveObj?.role_title || 'Software Development Engineer',
          ctc: driveObj?.ctc ? `₹${driveObj.ctc} LPA` : '₹14 LPA',
          offerDate: new Date(offerDateStr).toLocaleDateString([], { dateStyle: 'medium' }),
          joiningDate: new Date(Date.now() + 60 * 86400000).toLocaleDateString([], { dateStyle: 'medium' }),
          location: driveObj?.location || 'Bengaluru / Hybrid',
          status: formattedStatus,
          pdfUrl: a.offer_letter_url || a.resumes?.file_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          remarks: a.remarks || 'Official recruitment offer letter issued by campus placement office.',
        };
      });

      setOffers(formattedOffers);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to fetch offer letters from server.';
      setErrorMsg(msg);
      toastError('Error Loading Offers', msg);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchOfferData();
  }, [fetchOfferData]);

  // Filtered & Sorted Offers
  const processedOffers = useMemo(() => {
    let result = offers.filter((item) => {
      const matchesSearch =
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ctc.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (selectedSort === 'Highest Package') {
        const ctcA = parseFloat(a.ctc.replace(/[^0-9.]/g, '')) || 0;
        const ctcB = parseFloat(b.ctc.replace(/[^0-9.]/g, '')) || 0;
        return ctcB - ctcA;
      }
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [offers, searchQuery, selectedStatus, selectedSort]);

  // Handle Accept Offer
  const handleAcceptOffer = async (offer: OfferItem) => {
    setRespondingId(offer.id);
    try {
      await updateApplication(offer.applicationId, {
        status: 'Accepted',
        remarks: 'Candidate formally accepted employment offer.',
      });

      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: 'Accepted' } : o))
      );
      success('Offer Accepted!', `Congratulations! You accepted the offer from ${offer.companyName}.`);
    } catch (err: any) {
      toastError('Action Failed', err.response?.data?.message || 'Failed to accept offer.');
    } finally {
      setRespondingId(null);
    }
  };

  // Handle Reject Offer
  const handleRejectOfferConfirm = async () => {
    if (!confirmRejectId) return;
    setRespondingId(confirmRejectId);
    try {
      await updateApplication(confirmRejectId, {
        status: 'Rejected',
        remarks: 'Candidate declined employment offer.',
      });

      setOffers((prev) =>
        prev.map((o) => (o.id === confirmRejectId ? { ...o, status: 'Rejected' } : o))
      );
      warning('Offer Declined', 'You have declined the employment offer.');
      setConfirmRejectId(null);
    } catch (err: any) {
      toastError('Action Failed', err.response?.data?.message || 'Failed to decline offer.');
    } finally {
      setRespondingId(null);
    }
  };

  // Download PDF Handler
  const handleDownloadPdf = (companyName: string, url?: string) => {
    success('Download Started', `Saved ${companyName.replace(/\s+/g, '_')}_Offer_Letter.pdf`);
    if (url) window.open(url, '_blank');
  };

  // Print PDF Handler
  const handlePrintPdf = () => {
    window.print();
  };

  // Status Badge Helper
  const renderOfferBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Accepted</span>;
      case 'Rejected':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1"><X className="w-3.5 h-3.5" /> Declined</span>;
      case 'Offer Released':
      case 'Pending':
        return <span className="bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Offer Released</span>;
      default:
        return <span className="bg-[#162032] text-[#94A3B8] border border-[#202D42] px-3 py-1 rounded-full text-xs font-extrabold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Offer Letters' }]} />
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 mt-1">
            Student Offer Letters
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
              {offers.length} Offers Released
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Review official corporate job offers, inspect PDF documents, and record your formal decision.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchOfferData}
          disabled={loading}
        >
          Refresh Offers
        </Button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="p-3 relative z-30 bg-[#101726] border-[#202D42] shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              placeholder="Search by company, job role, or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <Dropdown
              className="w-full sm:w-44 shrink-0"
              options={[
                { label: 'All Statuses', value: 'All' },
                { label: 'Offer Released', value: 'Offer Released' },
                { label: 'Accepted', value: 'Accepted' },
                { label: 'Rejected', value: 'Rejected' },
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />

            <Dropdown
              className="w-full sm:w-40 shrink-0"
              options={[
                { label: 'Latest Offer', value: 'Latest Offer' },
                { label: 'Highest Package', value: 'Highest Package' },
              ]}
              value={selectedSort}
              onChange={setSelectedSort}
            />

            {(selectedStatus !== 'All' || selectedSort !== 'Latest Offer' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('All');
                  setSelectedSort('Latest Offer');
                }}
                className="h-10 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 px-3 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ERROR STATE */}
      {errorMsg ? (
        <Card className="p-8 text-center space-y-4 border-rose-500/30 bg-rose-500/5">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Loading Offer Letters</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{errorMsg}</p>
          <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchOfferData}>
            Retry Loading Offers
          </Button>
        </Card>
      ) : loading ? (
        /* LOADING SKELETON STATE */
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 border-[#202D42] animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#162032] rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-5 bg-[#162032] rounded w-48" />
                    <div className="h-3 bg-[#162032] rounded w-32" />
                  </div>
                </div>
                <div className="h-8 bg-[#162032] rounded-xl w-28" />
              </div>
            </Card>
          ))}
        </div>
      ) : processedOffers.length === 0 ? (
        /* EMPTY STATE */
        <Card className="p-12 text-center space-y-4 border-[#202D42] bg-[#101726]">
          <Award className="w-12 h-12 text-[#94A3B8] mx-auto opacity-40" />
          <h3 className="text-xl font-extrabold text-white">No offer letters available.</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            You do not currently have any official job offer letters issued by recruitment partners.
          </p>
          <Button variant="primary" size="md" leftIcon={<Send className="w-4 h-4" />} onClick={() => navigate('/drives')}>
            Browse Available Drives
          </Button>
        </Card>
      ) : (
        /* LIVE OFFER CARDS GRID */
        <div className="space-y-6">
          {processedOffers.map((offer) => {
            const isDecisionPending = offer.status === 'Pending' || offer.status === 'Offer Released';

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 border-[#202D42] space-y-5 hover:border-[#A3E635]/40 transition-colors relative overflow-hidden">
                  
                  {/* Header: Company Info + Package + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202D42] pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar src={offer.companyLogo} name={offer.companyName} size="lg" className="border-2 border-[#202D42]" />
                      <div className="space-y-1">
                        <h2 className="text-2xl font-extrabold text-white leading-tight flex items-center gap-3">
                          {offer.companyName}
                          <span className="text-xs text-[#A3E635] font-extrabold px-2.5 py-0.5 rounded-md bg-[#A3E635]/15 border border-[#A3E635]/30">
                            {offer.ctc}
                          </span>
                        </h2>
                        <p className="text-xs text-sky-400 font-semibold">{offer.roleTitle}</p>
                        <p className="text-[11px] text-[#94A3B8] flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#64748B]" /> Offer Issued: {offer.offerDate}
                          <span className="text-[#64748B]">•</span>
                          <MapPin className="w-3.5 h-3.5 text-[#64748B]" /> Joining: {offer.joiningDate} ({offer.location})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      {renderOfferBadge(offer.status)}
                    </div>
                  </div>

                  {/* OFFER TIMELINE JOURNEY STEPS */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">Offer Progression Timeline</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-white font-bold">1. Applied</div>
                      <div className="p-2 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-white font-bold">2. Interview Cleared</div>
                      <div className="p-2 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-white font-bold">3. Candidate Selected</div>
                      <div className="p-2 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-white font-bold">4. Offer Released</div>
                      <div className={`p-2 rounded-xl border font-bold ${offer.status === 'Accepted' ? 'bg-emerald-500/20 border-emerald-500/40 text-white' : offer.status === 'Rejected' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-[#101726] border-[#202D42] text-[#64748B]'}`}>
                        {offer.status === 'Accepted' ? '5. Accepted' : offer.status === 'Rejected' ? '5. Declined' : '5. Action Pending'}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS ROW */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#202D42] text-xs">
                    
                    {/* Document View / Print / Download Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5 text-sky-400" />}
                        onClick={() => setPreviewPdfOffer(offer)}
                      >
                        Preview PDF
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5 text-[#A3E635]" />}
                        onClick={() => handleDownloadPdf(offer.companyName, offer.pdfUrl)}
                      >
                        Download PDF
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Printer className="w-3.5 h-3.5 text-[#94A3B8]" />}
                        onClick={handlePrintPdf}
                      >
                        Print Offer
                      </Button>
                    </div>

                    {/* Candidate Decision Controls */}
                    <div className="flex items-center gap-2">
                      {isDecisionPending ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            isLoading={respondingId === offer.id}
                            leftIcon={<X className="w-3.5 h-3.5 text-rose-400" />}
                            onClick={() => setConfirmRejectId(offer.id)}
                            className="hover:border-rose-500/40 hover:text-rose-400"
                          >
                            Decline Offer
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={respondingId === offer.id}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleAcceptOffer(offer)}
                            className="font-extrabold px-5 shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                          >
                            Accept Offer
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs font-extrabold text-[#94A3B8] italic">
                          Formal decision recorded: {offer.status}
                        </span>
                      )}
                    </div>

                  </div>

                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* PREVIEW PDF MODAL */}
      <AnimatePresence>
        {previewPdfOffer && (
          <Modal
            isOpen={!!previewPdfOffer}
            onClose={() => setPreviewPdfOffer(null)}
            title={`Offer Letter PDF — ${previewPdfOffer.companyName}`}
            subtitle={`Role: ${previewPdfOffer.roleTitle} • CTC: ${previewPdfOffer.ctc}`}
            maxWidth="xl"
          >
            <div className="space-y-5 bg-[#101726] border border-[#202D42] p-6 rounded-2xl text-xs">
              
              {/* Document Header */}
              <div className="border-b border-[#202D42] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">{previewPdfOffer.companyName}</h2>
                  <p className="text-xs text-[#A3E635] font-semibold">Official Employment Letter</p>
                </div>
                <div>{renderOfferBadge(previewPdfOffer.status)}</div>
              </div>

              {/* Letter Preview Container */}
              <div className="p-6 bg-white text-slate-900 rounded-xl space-y-4 font-serif leading-relaxed shadow-inner">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{previewPdfOffer.companyName}</h3>
                    <p className="text-xs text-slate-600">Corporate Human Resources</p>
                  </div>
                  <p className="text-xs font-sans text-slate-500">Date: {previewPdfOffer.offerDate}</p>
                </div>

                <div className="space-y-2 text-xs font-sans">
                  <p><strong>Dear {user?.name || 'Candidate'},</strong></p>
                  <p>We are pleased to offer you the position of <strong>{previewPdfOffer.roleTitle}</strong> at <strong>{previewPdfOffer.companyName}</strong>. Your annual Cost to Company (CTC) will be <strong>{previewPdfOffer.ctc}</strong>.</p>
                  <p>Your expected joining date is scheduled for <strong>{previewPdfOffer.joiningDate}</strong> at our <strong>{previewPdfOffer.location}</strong> campus.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#202D42] flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setPreviewPdfOffer(null)}>
                  Close Preview
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => handleDownloadPdf(previewPdfOffer.companyName, previewPdfOffer.pdfUrl)}
                >
                  Download PDF
                </Button>
              </div>

            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* CONFIRM REJECT MODAL */}
      <AnimatePresence>
        {confirmRejectId && (
          <Modal
            isOpen={!!confirmRejectId}
            onClose={() => setConfirmRejectId(null)}
            title="Confirm Offer Rejection"
            subtitle="Are you sure you wish to decline this offer?"
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <p className="text-[#94A3B8] leading-relaxed">
                Declining this employment offer is irreversible. Your decision will be communicated to the corporate recruiting team.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#202D42]">
                <Button variant="secondary" size="md" onClick={() => setConfirmRejectId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={!!respondingId}
                  onClick={handleRejectOfferConfirm}
                  className="bg-rose-500 hover:bg-rose-600 border-none text-white font-extrabold"
                >
                  Confirm Decline
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};
