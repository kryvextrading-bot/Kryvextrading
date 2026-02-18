import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

const EVALUATION_DATE = '15 Jul 2025';

export default function CreditScore() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editScore, setEditScore] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiService.getCreditScore(user.id).then(s => {
      setScore(s);
      setEditScore(s.toString());
      setLoading(false);
    }).catch(error => {
      console.error('Failed to fetch credit score:', error);
      setScore(700); // Set default score on error
      setEditScore('700');
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiService.setCreditScore(user.id, Number(editScore));
      setScore(Number(editScore));
    } catch (error) {
      console.error('Failed to save credit score:', error);
      // Optionally show an error message to the user
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181A20] text-white flex flex-col">
      <div className="flex items-center p-4 border-b border-[#23262F]">
        <button onClick={() => navigate(-1)} className="mr-2 text-2xl">←</button>
        <h2 className="flex-1 text-center font-bold text-lg">Credit Score</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-[#23262F] rounded-2xl shadow-xl mx-auto p-8 flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">
            <span className="text-white">Your </span>
            <span className="text-[#F0B90B]">Credit Score</span>
          </div>
          <div className="w-full flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold mb-4 mt-4 text-white">Credit Score</h3>
            {loading ? (
              <div className="text-[#F0B90B] text-lg font-bold my-8">Loading...</div>
            ) : (
              <>
                {/* Semi-circular gauge */}
                <svg width="300" height="150" viewBox="0 0 300 150" className="mb-2">
                  <path d="M20,150 A130,130 0 0,1 280,150" fill="none" stroke="#F0B90B" strokeWidth="24" />
                  <text x="150" y="120" textAnchor="middle" fontSize="40" fill="#F0B90B" fontWeight="bold">{score}</text>
                </svg>
                <div className="text-lg font-bold mt-2 text-white">Your Credit Score</div>
                <div className="text-gray-400 text-sm">Evaluation Time {EVALUATION_DATE}</div>
                {isAdmin && (
                  <div className="mt-6 flex flex-col items-center">
                    <input
                      type="number"
                      value={editScore}
                      onChange={e => setEditScore(e.target.value)}
                      className="bg-[#181A20] border border-[#F0B90B] rounded-lg px-4 py-2 text-white text-lg mb-2 w-40 text-center"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-[#F0B90B] text-black font-bold px-6 py-2 rounded-lg hover:bg-yellow-400 transition"
                    >
                      {saving ? 'Saving...' : 'Save Score'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 