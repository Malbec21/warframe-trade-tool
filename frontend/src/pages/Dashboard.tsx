import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { DataTable } from '../components/DataTable';
import { FrameDetails } from '../components/FrameDetails';
import { PlatformSelector } from '../components/PlatformSelector';
import { ThresholdControls } from '../components/ThresholdControls';
import { TradeSessionModal } from '../components/TradeSessionModal';
import { useSettings } from '../hooks/useSettings';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';
import type { Platform } from '../lib/types';

export function Dashboard() {
  const { settings, updateSettings } = useSettings();
  const { opportunities, isConnected, lastUpdate, sendConfig } = useWebSocket();
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  // Filter opportunities based on thresholds
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(
      (opp) =>
        opp.profit_plat >= settings.minProfit &&
        opp.profit_margin >= settings.minMargin &&
        opp.platform === settings.platform
    );
  }, [opportunities, settings]);

  // Send config updates to WebSocket when settings change
  useEffect(() => {
    sendConfig({
      min_profit: settings.minProfit,
      min_margin: settings.minMargin,
      platform: settings.platform,
    });
  }, [settings, sendConfig]);

  const handlePlatformChange = (platform: Platform) => {
    updateSettings({ platform });
  };

  const handleMinProfitChange = (minProfit: number) => {
    updateSettings({ minProfit });
  };

  const handleMinMarginChange = (minMargin: number) => {
    updateSettings({ minMargin });
  };

  return (
    <div className="min-h-screen bg-wf-dark-bg overflow-x-hidden">
          {/* Header */}
          <header className="bg-gradient-to-r from-wf-primary via-wf-accent-blue to-wf-primary shadow-lg border-b border-wf-dark-border">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                  {/* Warframe Logo - Lotus Symbol */}
                  <svg className="w-10 h-10 md:w-14 md:h-14 text-white flex-shrink-0" viewBox="0 0 100 100" fill="currentColor">
                    {/* Lotus symbol inspired by Warframe */}
                    <path d="M50 10 L35 30 L25 25 L30 45 L20 50 L30 55 L25 75 L35 70 L50 90 L65 70 L75 75 L70 55 L80 50 L70 45 L75 25 L65 30 L50 10 Z" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fillOpacity="0.9"/>
                    <circle cx="50" cy="50" r="8" fill="currentColor"/>
                    <path d="M50 20 L45 40 L50 42 L55 40 Z" opacity="0.7"/>
                    <path d="M50 80 L45 60 L50 58 L55 60 Z" opacity="0.7"/>
                    <path d="M30 40 L40 48 L38 53 L28 48 Z" opacity="0.7"/>
                    <path d="M70 40 L60 48 L62 53 L72 48 Z" opacity="0.7"/>
                    <path d="M30 60 L40 52 L38 47 L28 52 Z" opacity="0.7"/>
                    <path d="M70 60 L60 52 L62 47 L72 52 Z" opacity="0.7"/>
                  </svg>
                  <div className="min-w-0">
                    <h1 className="text-xl md:text-3xl font-bold text-white truncate">Warframe Trade Helper</h1>
                    <p className="text-white text-xs md:text-base mt-1 hidden sm:block">Find profitable arbitrage opportunities</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <>
                      {/* Desktop Navigation */}
                      <div className="hidden md:flex items-center gap-4">
                        <span className="text-white text-sm mr-2">Welcome, {user?.username}</span>
                        <button
                          onClick={() => setIsTradeModalOpen(true)}
                          className="px-4 py-2 bg-wf-accent-green hover:bg-wf-accent-green/80 text-white font-semibold rounded-md transition-colors"
                        >
                          + New Trade
                        </button>
                        <Link
                          to="/trades"
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                        >
                          My Trades
                        </Link>
                        <button
                          onClick={logout}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                        >
                          Logout
                        </button>
                      </div>

                      {/* Mobile Menu Button */}
                      <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          )}
                        </svg>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      className="px-4 py-2 bg-white hover:bg-white/90 text-wf-primary font-semibold rounded-md transition-colors"
                    >
                      Login / Sign Up
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile Menu Dropdown */}
              {isAuthenticated && isMobileMenuOpen && (
                <div className="md:hidden mt-4 py-4 border-t border-white/20">
                  <div className="flex flex-col gap-3">
                    <span className="text-white text-sm px-2">Welcome, {user?.username}</span>
                    <button
                      onClick={() => {
                        setIsTradeModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-2 bg-wf-accent-green hover:bg-wf-accent-green/80 text-white font-semibold rounded-md transition-colors text-left"
                    >
                      + New Trade
                    </button>
                    <Link
                      to="/trades"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
                    >
                      My Trades
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-left"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-wf-dark-bg-light border-b border-wf-dark-border shadow-lg overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Platform Selector */}
            <PlatformSelector value={settings.platform} onChange={handlePlatformChange} />

            {/* Threshold Controls */}
            <ThresholdControls
              minProfit={settings.minProfit}
              minMargin={settings.minMargin}
              onMinProfitChange={handleMinProfitChange}
              onMinMarginChange={handleMinMarginChange}
            />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Connection Indicator */}
            <ConnectionIndicator isConnected={isConnected} lastUpdate={lastUpdate} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <DataTable
          opportunities={filteredOpportunities}
          onViewDetails={setSelectedFrameId}
          isLoading={false}
        />
      </main>

      {/* Frame Details Modal */}
      {selectedFrameId && (
        <FrameDetails frameId={selectedFrameId} onClose={() => setSelectedFrameId(null)} />
      )}

      {/* Trade Session Modal */}
      <TradeSessionModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh or show success message
          console.log('Trade session saved successfully');
        }}
      />
    </div>
  );
}

