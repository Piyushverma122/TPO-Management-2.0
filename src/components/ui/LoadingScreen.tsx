import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';

export interface LoadingScreenProps {
  progress?: number;
  title?: string;
  subtitle?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress = 65,
  title = 'TPO Portal',
  subtitle = 'Initialising Systems...',
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F17] flex items-center justify-center p-4 select-none">
      
      {/* Background Ambient Glows */}
      <div className="absolute w-96 h-96 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Central Glass Card strictly matching Loading page.jpg */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 sm:p-10 text-center space-y-6 border-[#A3E635]/50 shadow-[0_0_35px_rgba(163,230,53,0.25)] bg-gradient-to-b from-[#162032] via-[#101726] to-[#162032] relative z-10">
          
          {/* Rotating Orbital Ring Star Graphic */}
          <div className="relative py-4 flex items-center justify-center">
            
            {/* Outer Spinning Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="w-36 h-36 rounded-full border-2 border-dashed border-[#A3E635]/40 absolute"
            />

            {/* Inner Pulsing Star Box */}
            <div className="w-24 h-24 rounded-3xl bg-[#101726] border-2 border-[#A3E635] flex items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.4)] z-10">
              <span className="text-2xl font-extrabold text-[#A3E635] tracking-wide">
                TPO
              </span>
            </div>

          </div>

          {/* Titles */}
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white tracking-wide">{title}</h2>
            <p className="text-xs text-[#94A3B8] font-medium">{subtitle}</p>
          </div>

          {/* Progress Bar Container matching Loading page.jpg */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold text-[#A3E635] px-1">
              <span>Loading Data</span>
              <span>{progress}%</span>
            </div>
            
            <div className="h-2.5 w-full bg-[#101726] rounded-full overflow-hidden border border-[#202D42]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-[#A3E635] rounded-full shadow-[0_0_12px_rgba(163,230,53,0.8)]"
              />
            </div>
          </div>

        </Card>
      </motion.div>

    </div>
  );
};
