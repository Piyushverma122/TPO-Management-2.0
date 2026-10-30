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
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4 select-none">
      
      {/* Background Ambient Glows */}

      {/* Central Glass Card strictly matching Loading page.jpg */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 sm:p-10 text-center space-y-6 bg-card relative z-10">
          
          {/* Rotating Orbital Ring Star Graphic */}
          <div className="relative py-4 flex items-center justify-center">
            
            {/* Outer Spinning Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="w-36 h-36 rounded-full border-2 border-dashed border-primary/40 absolute"
            />

            {/* Inner Pulsing Star Box */}
            <div className="w-24 h-24 rounded-3xl bg-muted border-2 border-primary flex items-center justify-center z-10">
              <span className="text-2xl font-semibold text-primary tracking-wide">
                TPO
              </span>
            </div>

          </div>

          {/* Titles */}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground tracking-wide">{title}</h2>
            <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
          </div>

          {/* Progress Bar Container matching Loading page.jpg */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold text-primary px-1">
              <span>Loading Data</span>
              <span>{progress}%</span>
            </div>
            
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

        </Card>
      </motion.div>

    </div>
  );
};
