import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '@/hooks/useMotionPreferences';

interface BetCardProps {
  eventName: string;
  odds: number;
  onPlaceBet: (amount: number) => void;
}

export function BetCard({ eventName, odds, onPlaceBet }: BetCardProps) {
  const [amount, setAmount] = useState('');
  const { prefersReducedMotion } = useMotionPreferences();
  const isValid = amount && parseFloat(amount) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-slate-800 rounded-lg shadow-lg"
    >
      <h3 className="text-xl font-bold text-white mb-4">{eventName}</h3>
      <div className="mb-4">
        <p className="text-amber-500 text-lg font-mono">{odds.toFixed(2)}</p>
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter stake"
        className="w-full px-4 py-2 bg-slate-700 text-white rounded mb-4"
      />
      {isValid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-emerald-500 text-sm mb-2"
        >
          ✓ Valid amount
        </motion.div>
      )}
      <motion.button
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        onClick={() => onPlaceBet(parseFloat(amount))}
        disabled={!isValid}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded font-bold disabled:opacity-50"
      >
        Place Bet
      </motion.button>
    </motion.div>
  );
}
