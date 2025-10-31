import { useEffect, useMemo, useState } from 'react';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { DataTable } from '../components/DataTable';
import { FrameDetails } from '../components/FrameDetails';
import { PlatformSelector } from '../components/PlatformSelector';
import { StrategySelector } from '../components/StrategySelector';
import { ThresholdControls } from '../components/ThresholdControls';
import { useSettings } from '../hooks/useSettings';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Platform, Strategy } from '../lib/types';

export function Dashboard() {
  const { settings, updateSettings } = useSettings();
  const { opportunities, isConnected, lastUpdate, sendConfig } = useWebSocket();
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  // Filter opportunities based on thresholds
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(
      (opp) =>
        opp.profit_plat >= settings.minProfit &&
        opp.profit_margin >= settings.minMargin &&
        opp.platform === settings.platform &&
        opp.strategy === settings.strategy
    );
  }, [opportunities, settings]);

  // Send config updates to WebSocket when settings change
  useEffect(() => {
    sendConfig({
      strategy: settings.strategy,
      min_profit: settings.minProfit,
      min_margin: settings.minMargin,
      platform: settings.platform,
    });
  }, [settings, sendConfig]);

  const handleStrategyChange = (strategy: Strategy) => {
    updateSettings({ strategy });
  };

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
    <div className="min-h-screen bg-wf-dark-bg">
          {/* Header */}
          <header className="bg-gradient-to-r from-wf-primary via-wf-accent-blue to-wf-primary shadow-lg border-b border-wf-dark-border">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center gap-4">
                {/* Warframe Logo - Lotus Symbol */}
                <svg className="w-14 h-14 text-white" viewBox="0 0 100 100" fill="currentColor">
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
                <div>
                  <h1 className="text-3xl font-bold text-white">Warframe Trade Helper</h1>
                  <p className="text-white mt-1">Find profitable arbitrage opportunities</p>
                </div>
              </div>
            </div>
          </header>

      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-wf-dark-bg-light border-b border-wf-dark-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Platform Selector */}
            <PlatformSelector value={settings.platform} onChange={handlePlatformChange} />

            {/* Strategy Selector */}
            <StrategySelector value={settings.strategy} onChange={handleStrategyChange} />

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
    </div>
  );
}

