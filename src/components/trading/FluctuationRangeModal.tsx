import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

export interface FluctuationOption {
  label: string;
  value: number;
  payout: number;
}

interface FluctuationRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: number) => void;
  currentValue: number;
  options: FluctuationOption[];
}

export const FluctuationRangeModal: React.FC<FluctuationRangeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentValue,
  options
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="bg-[#1E2329] border border-gray-800 rounded-t-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Fluctuation Range</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    When the market price at settlement aligns with your chosen 'Fluctuation Range', 
                    you will receive the corresponding rate of return.
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="p-4 space-y-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                    currentValue === option.value
                      ? 'bg-teal-400/20 border border-teal-400'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div>
                    <span className="text-white font-medium">{option.label}</span>
                    <span className="text-xs text-gray-400 block mt-1">
                      Payout: {option.payout.toFixed(3)}x
                    </span>
                  </div>
                  {currentValue === option.value && (
                    <CheckCircle className="w-5 h-5 text-teal-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
