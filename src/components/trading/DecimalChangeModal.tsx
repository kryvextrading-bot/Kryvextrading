import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface DecimalChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (decimal: number) => void;
  currentDecimal: number;
}

const DECIMAL_OPTIONS = [0.01, 0.1, 1, 10, 50, 100];

export const DecimalChangeModal: React.FC<DecimalChangeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentDecimal
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
                  <h3 className="text-lg font-semibold text-white">Decimal Change</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Change the number of decimal you would like
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="p-4 grid grid-cols-3 gap-3">
              {DECIMAL_OPTIONS.map((decimal) => (
                <button
                  key={decimal}
                  onClick={() => {
                    onSelect(decimal);
                    onClose();
                  }}
                  className={`p-4 rounded-lg text-center transition-colors ${
                    currentDecimal === decimal
                      ? 'bg-teal-400/20 border border-teal-400'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-white font-medium">{decimal}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
