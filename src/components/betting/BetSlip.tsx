import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bet {
  id: string;
  eventName: string;
  stake: number;
  odds: number;
}

interface BetSlipProps {
  bets: Bet[];
  onRemove: (id: string) => void;
  onPlaceAll: () => void;
}

export function BetSlip({ bets, onRemove, onPlaceAll }: BetSlipProps) {
  const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      className="fixed right-0 bottom-0 w-80 bg-slate-800 rounded-t-lg p-6 shadow-2xl border-t border-indigo-600"
    >
      <h2 className="text-xl font-bold text-white mb-4">Bet Slip</h2>
      <AnimatePresence>
        {bets.map((bet, idx) => (
          <motion.div
            key={bet.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-3 p-3 bg-slate-700 rounded flex justify-between items-center"
          >
            <div className="flex-1">
              <p className="text-white text-sm">{bet.eventName}</p>
              <p className="text-slate-400 text-xs">${bet.stake} @ {bet.odds}</p>
            </div>
            <button
              onClick={() => onRemove(bet.id)}
              className="text-red-500 hover:text-red-400"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="border-t border-slate-600 pt-3 mt-3 mb-4">
        <p className="text-white font-bold">Total: ${totalStake.toFixed(2)}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPlaceAll}
        disabled={bets.length === 0}
        className="w-full py-2 bg-indigo-600 text-white rounded font-bold disabled:opacity-50"
      >
        Place All
      </motion.button>
    </motion.div>
  );
}
