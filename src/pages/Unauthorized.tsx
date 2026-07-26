import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShieldAlert, Lock } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Central Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card className="p-8 sm:p-12 text-center space-y-6 border-rose-500/40 shadow-[0_0_35px_rgba(244,63,94,0.15)] bg-gradient-to-b from-[#162032] via-[#101726] to-[#162032] relative z-10">
          {/* Header Tag */}
          <div className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase flex items-center justify-center gap-1.5">
            <span>Security</span>
            <span>/</span>
            <span className="text-rose-400">403 Access Denied</span>
          </div>

          {/* Icon Badge */}
          <div className="relative py-4 flex items-center justify-center">
            <div className="w-28 h-28 rounded-3xl bg-[#101726] border-2 border-rose-500/40 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="w-12 h-12 text-rose-400" />
              <span className="text-[10px] font-extrabold text-rose-400 uppercase mt-2 tracking-widest">
                Restricted
              </span>
            </div>
          </div>

          {/* Title & Message */}
          <div className="space-y-1">
            <h1 className="text-6xl font-extrabold text-rose-400 tracking-tight drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              403
            </h1>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Access Restricted
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto leading-relaxed">
            You do not have permission to view or manage this module. If you believe this is an error, please contact your TPO Administrator.
          </p>

          {/* Action CTA */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Home className="w-5 h-5 text-[#0B0F17]" />}
              onClick={() => navigate('/dashboard')}
              className="px-8 font-extrabold text-sm shadow-[0_0_20px_rgba(163,230,53,0.3)]"
            >
              Return to TPO Portal
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
