import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

interface SettlementPanelProps {
  isOpen: boolean;
  won: boolean;
  payout: number;
  result: string;
}

export function SettlementPanel({ isOpen, won, payout, result }: SettlementPanelProps) {
  const [progress, setProgress] = useState(0);
  const { prefersReducedMotion } = useMotionPreferences();

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      const timer = setInterval(() => {
        setProgress((p) => (p < 100 ? p + 10 : 100));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={`p-8 rounded-lg w-96 ${won ? 'bg-emerald-900' : 'bg-slate-800'}`}
      >
        <div className="w-full bg-slate-700 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            className={`h-full ${won ? 'bg-emerald-500' : 'bg-amber-500'}`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className={`text-2xl font-bold mb-4 ${won ? 'text-emerald-400' : 'text-slate-100'}`}>
              {won ? '🎉 Won!' : 'Lost'}
            </h2>
            <p className="text-white mb-2">{result}</p>
            <p className={`text-3xl font-bold ${won ? 'text-emerald-400' : 'text-slate-400'}`}>
              ${payout.toFixed(2)}
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
