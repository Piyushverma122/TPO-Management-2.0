import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles, Compass, AlertCircle } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Central Glass Card strictly matching 404 erro page.jpg */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card className="p-8 sm:p-12 text-center space-y-6 border-[#A3E635]/50 shadow-[0_0_35px_rgba(163,230,53,0.2)] bg-gradient-to-b from-[#162032] via-[#101726] to-[#162032] relative z-10">
          
          {/* Breadcrumb Header */}
          <div className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase flex items-center justify-center gap-1.5">
            <span>Home</span>
            <span>/</span>
            <span className="text-[#A3E635]">404 Error</span>
          </div>

          {/* Graphical Fork Illustration Container */}
          <div className="relative py-4 flex items-center justify-center">
            <div className="w-32 h-32 rounded-3xl bg-[#101726] border-2 border-[#A3E635]/40 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.25)]">
              <div className="w-12 h-12 rounded-2xl bg-[#A3E635] text-[#0B0F17] flex items-center justify-center font-extrabold text-xl shadow-md">
                TPO
              </div>
              <span className="text-[10px] font-extrabold text-[#A3E635] uppercase mt-2 tracking-widest">
                Career Path
              </span>
            </div>
          </div>

          {/* Giant Glowing 404 Title */}
          <div className="space-y-1">
            <h1 className="text-7xl font-extrabold text-[#A3E635] tracking-tight drop-shadow-[0_0_20px_rgba(163,230,53,0.4)]">
              404
            </h1>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Whoops! This career path is under construction.
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto leading-relaxed">
            It seems the page you were looking for has graduated to a different URL or does not exist on the TPO console.
          </p>

          {/* CTA Button matching 404 erro page.jpg */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Home className="w-5 h-5 text-[#0B0F17]" />}
              onClick={() => navigate('/dashboard')}
              className="px-8 font-extrabold text-sm shadow-[0_0_20px_rgba(163,230,53,0.4)]"
            >
              Go back to TPO Console Dashboard
            </Button>
          </div>

        </Card>
      </motion.div>

    </div>
  );
};
