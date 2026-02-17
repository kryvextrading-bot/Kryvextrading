import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface TimeRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (duration: number) => void;
  currentDuration: number;
}

const DURATION_OPTIONS = [
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 240, label: '4 min' },
  { value: 360, label: '6 min' },
  { value: 600, label: '10 min' }
];

export const TimeRangeModal: React.FC<TimeRangeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentDuration
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
                  <h3 className="text-lg font-semibold text-white">Time Range</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Choose the duration for your option trade
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="p-4 space-y-2">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                    currentDuration === option.value
                      ? 'bg-teal-400/20 border border-teal-400'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div>
                    <span className="text-white font-medium">{option.label}</span>
                    <span className="text-xs text-gray-400 block mt-1">
                      {option.value} seconds
                    </span>
                  </div>
                  {currentDuration === option.value && (
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
