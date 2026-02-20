import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Crown, Target, Clock, Users, Settings } from 'lucide-react';
import { supabaseTradingService } from '@/services/supabaseTradingService';

export const TradeControlPanel = () => {
  const [windows, setWindows] = useState<any[]>([]);
  const [userOutcomes, setUserOutcomes] = useState<any[]>([]);
  const [newWindow, setNewWindow] = useState({
    outcome_type: 'random',
    win_rate: 60,
    start_time: '',
    end_time: '',
    description: ''
  });
  const [newUserOutcome, setNewUserOutcome] = useState({
    user_id: '',
    outcome_type: 'random',
    win_rate: 60,
    start_time: '',
    end_time: '',
    description: ''
  });
  const [activeTab, setActiveTab] = useState<'windows' | 'users'>('windows');

  useEffect(() => {
    loadWindows();
    loadUserOutcomes();
  }, []);

  const loadWindows = async () => {
    try {
      const windows = await supabaseTradingService.getActiveTradeWindows();
      setWindows(windows);
    } catch (error) {
      console.error('Error loading trade windows:', error);
    }
  };

  const loadUserOutcomes = async () => {
    try {
      // Load all user outcomes (not just active ones for admin view)
      const { data } = await supabase
        .from('trade_outcomes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setUserOutcomes(data || []);
    } catch (error) {
      console.error('Error loading user outcomes:', error);
    }
  };

  const createWindow = async () => {
    try {
      await supabaseTradingService.createTradeWindow(newWindow);
      setNewWindow({
        outcome_type: 'random',
        win_rate: 60,
        start_time: '',
        end_time: '',
        description: ''
      });
      loadWindows();
    } catch (error) {
      console.error('Error creating window:', error);
    }
  };

  const toggleWindow = async (id: string, isActive: boolean) => {
    try {
      await supabaseTradingService.toggleTradeWindow(id, !isActive);
      loadWindows();
    } catch (error) {
      console.error('Error toggling window:', error);
    }
  };

  const createUserOutcome = async () => {
    try {
      await supabaseTradingService.createUserOutcome(newUserOutcome.user_id, newUserOutcome);
      setNewUserOutcome({
        user_id: '',
        outcome_type: 'random',
        win_rate: 60,
        start_time: '',
        end_time: '',
        description: ''
      });
      loadUserOutcomes();
    } catch (error) {
      console.error('Error creating user outcome:', error);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getOutcomeIcon = (type: string) => {
    switch (type) {
      case 'win': return '🏆';
      case 'loss': return '❌';
      case 'random': return '🎲';
      default: return '❓';
    }
  };

  const getOutcomeColor = (type: string) => {
    switch (type) {
      case 'win': return 'text-green-400';
      case 'loss': return 'text-red-400';
      case 'random': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-[#1E2329] border-[#2B3139]">
        <h2 className="text-xl font-bold text-[#EAECEF] mb-6 flex items-center gap-2">
          <Crown className="text-[#F0B90B]" size={24} />
          Trade Control Panel
        </h2>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-[#0B0E11] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'windows'
                ? 'bg-[#F0B90B] text-[#0B0E11]'
                : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            <Target size={16} className="inline mr-2" />
            Trade Windows
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-[#F0B90B] text-[#0B0E11]'
                : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            User Outcomes
          </button>
        </div>

        {activeTab === 'windows' ? (
          <>
            {/* Create Trade Window */}
            <div className="space-y-4 mb-6 p-4 bg-[#0B0E11] rounded-lg border border-[#2B3139]">
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-4">Create Trade Window</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#848E9C] block mb-1">Outcome Type</label>
                  <select
                    value={newWindow.outcome_type}
                    onChange={(e) => setNewWindow({ ...newWindow, outcome_type: e.target.value })}
                    className="w-full bg-[#1E2329] border border-[#2B3139] rounded-lg p-2 text-[#EAECEF]"
                  >
                    <option value="win">Force Win</option>
                    <option value="loss">Force Loss</option>
                    <option value="random">Random (with win rate)</option>
                  </select>
                </div>

                {newWindow.outcome_type === 'random' && (
                  <div>
                    <label className="text-sm text-[#848E9C] block mb-1">Win Rate (%)</label>
                    <Input
                      type="number"
                      value={newWindow.win_rate}
                      onChange={(e) => setNewWindow({ ...newWindow, win_rate: parseInt(e.target.value) })}
                      className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                      min="0"
                      max="100"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm text-[#848E9C] block mb-1">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={newWindow.start_time}
                    onChange={(e) => setNewWindow({ ...newWindow, start_time: e.target.value })}
                    className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <label className="text-sm text-[#848E9C] block mb-1">End Time</label>
                  <Input
                    type="datetime-local"
                    value={newWindow.end_time}
                    onChange={(e) => setNewWindow({ ...newWindow, end_time: e.target.value })}
                    className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#848E9C] block mb-1">Description</label>
                <Input
                  value={newWindow.description}
                  onChange={(e) => setNewWindow({ ...newWindow, description: e.target.value })}
                  className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  placeholder="Optional description..."
                />
              </div>

              <Button
                onClick={createWindow}
                className="w-full bg-[#F0B90B] text-[#0B0E11] font-semibold"
                disabled={!newWindow.start_time || !newWindow.end_time}
              >
                Create Trade Window
              </Button>
            </div>

            {/* Active Windows */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-3">Trade Windows</h3>
              {windows.length === 0 ? (
                <div className="text-center py-8 text-[#848E9C]">
                  <Settings size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No active trade windows</p>
                </div>
              ) : (
                windows.map((window) => (
                  <div
                    key={window.id}
                    className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-lg border border-[#2B3139]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getOutcomeIcon(window.outcome_type)}</span>
                        <span className={`font-semibold ${getOutcomeColor(window.outcome_type)}`}>
                          {window.outcome_type.toUpperCase()}
                          {window.win_rate && ` (${window.win_rate}%)`}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          window.is_active 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {window.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#848E9C]">
                        <Clock size={14} />
                        <span>
                          {formatDateTime(window.start_time)} - {formatDateTime(window.end_time)}
                        </span>
                      </div>
                      {window.description && (
                        <p className="text-sm text-[#848E9C] mt-1">{window.description}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleWindow(window.id, window.is_active)}
                      className={`ml-4 ${
                        window.is_active 
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                          : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {window.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Create User Outcome */}
            <div className="space-y-4 mb-6 p-4 bg-[#0B0E11] rounded-lg border border-[#2B3139]">
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-4">Create User-Specific Outcome</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#848E9C] block mb-1">User ID</label>
                  <Input
                    value={newUserOutcome.user_id}
                    onChange={(e) => setNewUserOutcome({ ...newUserOutcome, user_id: e.target.value })}
                    className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                    placeholder="Enter user UUID..."
                  />
                </div>

                <div>
                  <label className="text-sm text-[#848E9C] block mb-1">Outcome Type</label>
                  <select
                    value={newUserOutcome.outcome_type}
                    onChange={(e) => setNewUserOutcome({ ...newUserOutcome, outcome_type: e.target.value })}
                    className="w-full bg-[#1E2329] border border-[#2B3139] rounded-lg p-2 text-[#EAECEF]"
                  >
                    <option value="win">Force Win</option>
                    <option value="loss">Force Loss</option>
                    <option value="random">Random (with win rate)</option>
                  </select>
                </div>

                {newUserOutcome.outcome_type === 'random' && (
                  <div>
                    <label className="text-sm text-[#848E9C] block mb-1">Win Rate (%)</label>
                    <Input
                      type="number"
                      value={newUserOutcome.win_rate}
                      onChange={(e) => setNewUserOutcome({ ...newUserOutcome, win_rate: parseInt(e.target.value) })}
                      className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                      min="0"
                      max="100"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm text-[#848E9C] block mb-1">Start Time</label>
                  <Input
                    type="datetime-local"
                    value={newUserOutcome.start_time}
                    onChange={(e) => setNewUserOutcome({ ...newUserOutcome, start_time: e.target.value })}
                    className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <label className="text-sm text-[#848E9C] block mb-1">End Time</label>
                  <Input
                    type="datetime-local"
                    value={newUserOutcome.end_time}
                    onChange={(e) => setNewUserOutcome({ ...newUserOutcome, end_time: e.target.value })}
                    className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#848E9C] block mb-1">Description</label>
                <Input
                  value={newUserOutcome.description}
                  onChange={(e) => setNewUserOutcome({ ...newUserOutcome, description: e.target.value })}
                  className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  placeholder="Optional description..."
                />
              </div>

              <Button
                onClick={createUserOutcome}
                className="w-full bg-[#F0B90B] text-[#0B0E11] font-semibold"
                disabled={!newUserOutcome.user_id || !newUserOutcome.start_time || !newUserOutcome.end_time}
              >
                Create User Outcome
              </Button>
            </div>

            {/* User Outcomes */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-3">User Outcomes</h3>
              {userOutcomes.length === 0 ? (
                <div className="text-center py-8 text-[#848E9C]">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No user outcomes configured</p>
                </div>
              ) : (
                userOutcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-lg border border-[#2B3139]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getOutcomeIcon(outcome.outcome_type)}</span>
                        <span className={`font-semibold ${getOutcomeColor(outcome.outcome_type)}`}>
                          {outcome.outcome_type.toUpperCase()}
                          {outcome.win_rate && ` (${outcome.win_rate}%)`}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          outcome.is_active 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {outcome.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div className="text-sm text-[#848E9C]">
                        <p>User ID: <code className="bg-[#1E2329] px-1 rounded">{outcome.user_id}</code></p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={14} />
                          <span>
                            {formatDateTime(outcome.start_time)} - {formatDateTime(outcome.end_time)}
                          </span>
                        </div>
                      </div>
                      {outcome.description && (
                        <p className="text-sm text-[#848E9C] mt-1">{outcome.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
