import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShieldAlert, Lock } from 'lucide-react';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient Glows */}

      {/* Central Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card className="p-8 sm:p-12 text-center space-y-6 border-rose-500/40 relative z-10">
          {/* Header Tag */}
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-center gap-1.5">
            <span>Security</span>
            <span>/</span>
            <span className="text-rose-400">403 Access Denied</span>
          </div>

          {/* Icon Badge */}
          <div className="relative py-4 flex items-center justify-center">
            <div className="w-28 h-28 rounded-3xl bg-muted border-2 border-rose-500/40 flex flex-col items-center justify-center">
              <ShieldAlert className="w-12 h-12 text-rose-400" />
              <span className="text-[10px] font-semibold text-rose-400 uppercase mt-2 tracking-widest">
                Restricted
              </span>
            </div>
          </div>

          {/* Title & Message */}
          <div className="space-y-1">
            <h1 className="text-6xl font-semibold text-rose-400 tracking-tight">
              403
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Access Restricted
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            You do not have permission to view or manage this module. If you believe this is an error, please contact your TPO Administrator.
          </p>

          {/* Action CTA */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Home className="w-5 h-5 text-primary-foreground" />}
              onClick={() => navigate('/dashboard')}
              className="px-8 font-semibold text-sm"
            >
              Return to TPO Portal
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
