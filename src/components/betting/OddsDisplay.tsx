import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface OddsDisplayProps {
  odds: number;
  previousOdds?: number;
}

export function OddsDisplay({ odds, previousOdds }: OddsDisplayProps) {
  const [highlight, setHighlight] = useState(false);
  const isUp = previousOdds ? odds > previousOdds : false;

  useEffect(() => {
    if (previousOdds && odds !== previousOdds) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [odds, previousOdds]);

  return (
    <motion.div
      animate={highlight ? { boxShadow: ['0 0 0 0 rgba(79, 70, 229, 0.4)', '0 0 0 10px rgba(79, 70, 229, 0)'] } : {}}
      transition={{ duration: 1 }}
      className={`p-4 rounded-lg font-mono text-2xl font-bold transition-colors ${
        highlight ? (isUp ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400') : 'bg-slate-800 text-slate-100'
      }`}
    >
      {odds.toFixed(2)}
    </motion.div>
  );
}
