import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after 1 second
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Cookie className="w-6 h-6 text-orange-400 flex-shrink-0" />
                  </motion.div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">
                      🍪 Çerez Politikası
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Deneyiminizi iyileştirmek için çerezler kullanıyoruz. 
                      Siteyi kullanmaya devam ederek çerez kullanımını kabul etmiş olursunuz.
                      <span className="block mt-1 text-gray-400 text-xs">
                        KVKK ve GDPR uyumlu veri koruma politikamız geçerlidir.
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      className="rounded-full border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white bg-transparent hover:bg-gray-800/50"
                    >
                      Reddet
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleAccept}
                      className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30"
                    >
                      ✓ Kabul Et
                    </Button>
                  </motion.div>
                  <motion.button
                    onClick={handleDecline}
                    className="ml-2 text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
