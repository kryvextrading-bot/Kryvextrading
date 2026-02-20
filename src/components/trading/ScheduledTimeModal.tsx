import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus } from 'lucide-react';

interface ScheduledTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (time: { hours: number; minutes: number; seconds: number }) => void;
}

export const ScheduledTimeModal: React.FC<ScheduledTimeModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [currentUTC, setCurrentUTC] = useState('');

  // Update current UTC time every second
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentUTC(now.toISOString().split('T')[1].split('.')[0]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSave = () => {
    // Validate minimum 5 seconds in future
    const now = new Date();
    const scheduledDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        hours,
        minutes,
        seconds
      )
    );

    const minExecutionTime = new Date(now.getTime() + 5000);
    if (scheduledDate <= minExecutionTime) {
      alert('Scheduled time must be at least 5 seconds in the future');
      return;
    }

    onSave({ hours, minutes, seconds });
  };

  const incrementHours = () => setHours(prev => Math.min(prev + 1, 23));
  const decrementHours = () => setHours(prev => Math.max(prev - 1, 0));

  const incrementMinutes = () => setMinutes(prev => (prev + 1) % 60);
  const decrementMinutes = () => setMinutes(prev => (prev - 1 + 60) % 60);

  const incrementSeconds = () => setSeconds(prev => (prev + 1) % 60);
  const decrementSeconds = () => setSeconds(prev => (prev - 1 + 60) % 60);

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
                  <h3 className="text-lg font-semibold text-white">Scheduled Time</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Customize the opening time (UTC+0) for your position. The order will 
                    initiate option delivery after the set time is reached.
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Time Display */}
            <div className="p-4 border-b border-gray-800">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">Current UTC Time</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {currentUTC}
                </div>
              </div>
            </div>

            {/* Time Input */}
            <div className="p-4">
              <div className="text-center mb-6">
                <div className="text-sm text-gray-400 mb-4">Set Time (UTC+0)</div>
                <div className="flex items-center justify-center gap-4">
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={decrementHours}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center mx-2">
                      <span className="text-2xl font-mono font-bold text-white">
                        {hours.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      onClick={incrementHours}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-2xl font-mono font-bold text-white mx-2">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={decrementMinutes}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center mx-2">
                      <span className="text-2xl font-mono font-bold text-white">
                        {minutes.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      onClick={incrementMinutes}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-2xl font-mono font-bold text-white mx-2">:</span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={decrementSeconds}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center mx-2">
                      <span className="text-2xl font-mono font-bold text-white">
                        {seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <button
                      onClick={incrementSeconds}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-teal-400 text-gray-900 py-3 rounded-lg font-medium hover:bg-teal-500 transition-colors"
                >
                  Set Time
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
