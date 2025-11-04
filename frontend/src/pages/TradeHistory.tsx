import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { TradeSessionModal } from '@/components/TradeSessionModal';
import type { TradeSession } from '@/lib/types';

// Helper to format status display
const formatStatus = (status: string): string => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function TradeHistory() {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<TradeSession[]>([]);
  const [stats, setStats] = useState({
    total_sessions: 0,
    total_profit: 0,
    completed_sessions: 0,
    in_progress_sessions: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [daysFilter, setDaysFilter] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TradeSession | undefined>(undefined);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);

  const fetchSessions = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await api.listTradeSessions({
        status_filter: statusFilter,
        days: daysFilter,
      });
      setSessions(data.sessions);
      setStats({
        total_sessions: data.total_sessions,
        total_profit: data.total_profit,
        completed_sessions: data.completed_sessions,
        in_progress_sessions: data.in_progress_sessions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isAuthenticated, statusFilter, daysFilter]);

  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('Are you sure you want to delete this trade session? This action cannot be undone.')) {
      return;
    }

    setDeletingSessionId(sessionId);
    setError('');

    try {
      await api.deleteTradeSession(sessionId);
      await fetchSessions(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trade session');
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-wf-dark-bg p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-wf-text mb-4">Trade History</h1>
          <p className="text-wf-text-dim">Please login to view your trade history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wf-dark-bg p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 bg-wf-dark-bg-light hover:bg-wf-dark-border border border-wf-dark-border text-wf-text rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-wf-text">Trade History</h1>
          </div>
          <button
            onClick={() => {
              setEditingSession(undefined);
              setIsTradeModalOpen(true);
            }}
            className="px-6 py-3 bg-wf-primary hover:bg-wf-primary/80 text-white font-semibold rounded-lg transition-colors w-full sm:w-auto"
          >
            + New Trade
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4">
            <div className="text-wf-text-dim text-sm mb-1">Total Sessions</div>
            <div className="text-2xl font-bold text-wf-text">{stats.total_sessions}</div>
          </div>
          <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4">
            <div className="text-wf-text-dim text-sm mb-1">Total Profit</div>
            <div className={`text-2xl font-bold ${stats.total_profit >= 0 ? 'text-wf-accent-green' : 'text-wf-accent-red'}`}>
              {stats.total_profit >= 0 ? '+' : ''}{Math.round(stats.total_profit)} plat
            </div>
          </div>
          <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4">
            <div className="text-wf-text-dim text-sm mb-1">Completed</div>
            <div className="text-2xl font-bold text-wf-accent-green">{stats.completed_sessions}</div>
          </div>
          <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4">
            <div className="text-wf-text-dim text-sm mb-1">In Progress</div>
            <div className="text-2xl font-bold text-wf-accent-blue">{stats.in_progress_sessions}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-wf-text-dim mb-1">Status</label>
              <select
                value={statusFilter || 'all'}
                onChange={(e) => setStatusFilter(e.target.value === 'all' ? undefined : e.target.value)}
                className="px-3 py-2 bg-wf-bg border border-wf-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
              >
                <option value="all">All</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-wf-text-dim mb-1">Time Period</label>
              <select
                value={daysFilter || 'all'}
                onChange={(e) => setDaysFilter(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
                className="px-3 py-2 bg-wf-bg border border-wf-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
              >
                <option value="all">All Time</option>
                <option value="1">Last 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {error && (
          <div className="mb-4 p-3 bg-wf-accent-red/20 border border-wf-accent-red rounded text-wf-accent-red text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-wf-text-dim">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-wf-text-dim">
            No trade sessions found. Start tracking your trades from the opportunities page!
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-wf-bg-lighter border border-wf-border rounded-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-wf-text">{session.item_name}</h3>
                      <button
                        onClick={() => {
                          setEditingSession(session);
                          setIsTradeModalOpen(true);
                        }}
                        disabled={deletingSessionId === session.id}
                        className="px-3 py-1 bg-wf-accent-blue/20 hover:bg-wf-accent-blue/30 border border-wf-accent-blue text-wf-accent-blue text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deletingSessionId === session.id}
                        className="px-3 py-1 bg-wf-accent-red/20 hover:bg-wf-accent-red/30 border border-wf-accent-red text-wf-accent-red text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingSessionId === session.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                    <p className="text-sm text-wf-text-dim">
                      {new Date(session.created_at).toLocaleDateString()} - {' '}
                      <span className={`${session.status === 'completed' ? 'text-wf-accent-green' : 'text-wf-accent-blue'} whitespace-nowrap`}>
                        {formatStatus(session.status)}
                      </span>
                    </p>
                  </div>
                  {session.profit !== undefined && session.profit !== null && (
                    <div className={`text-2xl font-bold ${session.profit >= 0 ? 'text-wf-accent-green' : 'text-wf-accent-red'} whitespace-nowrap`}>
                      {session.profit >= 0 ? '+' : ''}{Math.round(session.profit)} plat
                    </div>
                  )}
                </div>

                {/* Parts */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-semibold text-wf-text-dim">Parts:</h4>
                  {session.parts.map((part) => (
                    <div key={part.id} className="flex justify-between items-center text-sm bg-wf-bg p-2 rounded">
                      <span className="text-wf-text">{part.part_name}</span>
                      <span className="text-wf-text-dim">{part.purchase_price} plat</span>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="border-t border-wf-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-wf-text-dim">Total Cost:</span>
                    <span className="text-wf-text font-semibold">{session.total_cost} plat</span>
                  </div>
                  {session.set_sell_price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-wf-text-dim">Sell Price:</span>
                      <span className="text-wf-text font-semibold">{session.set_sell_price} plat</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trade Session Modal */}
      <TradeSessionModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setEditingSession(undefined);
        }}
        onSuccess={() => {
          fetchSessions(); // Refresh the sessions list
        }}
        existingSession={editingSession}
      />
    </div>
  );
}

