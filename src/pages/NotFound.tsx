import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles, Compass, AlertCircle } from 'lucide-react';

import { Card } from '../components/app/Card';
import { Button } from '../components/app/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Background Decorative Ambient Glows */}

      {/* Central Glass Card strictly matching 404 erro page.jpg */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card className="p-8 sm:p-12 text-center space-y-6 border-primary/50 relative z-10">
          
          {/* Breadcrumb Header */}
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-center gap-1.5">
            <span>Home</span>
            <span>/</span>
            <span className="text-primary">404 Error</span>
          </div>

          {/* Graphical Fork Illustration Container */}
          <div className="relative py-4 flex items-center justify-center">
            <div className="w-32 h-32 rounded-3xl bg-muted border-2 border-primary/40 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xl shadow-md">
                TPO
              </div>
              <span className="text-[10px] font-semibold text-primary uppercase mt-2 tracking-widest">
                Career Path
              </span>
            </div>
          </div>

          {/* Giant Glowing 404 Title */}
          <div className="space-y-1">
            <h1 className="text-7xl font-semibold text-primary tracking-tight">
              404
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Whoops! This career path is under construction.
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            It seems the page you were looking for has graduated to a different URL or does not exist on the TPO console.
          </p>

          {/* CTA Button matching 404 erro page.jpg */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Home className="w-5 h-5 text-primary-foreground" />}
              onClick={() => navigate('/dashboard')}
              className="px-8 font-semibold text-sm"
            >
              Go back to TPO Console Dashboard
            </Button>
          </div>

        </Card>
      </motion.div>

    </div>
  );
};
