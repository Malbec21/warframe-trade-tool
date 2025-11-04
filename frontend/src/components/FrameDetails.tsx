import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatMargin, formatPlat } from '../lib/format';
import { copyTradeMessage, getWarframeMarketPartUrl } from '../lib/clipboard';
import type { FrameDetail, PriceHistorySummary } from '../lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ProfitChip } from './ProfitChip';
import { useSettings } from '../hooks/useSettings';

interface FrameDetailsProps {
  frameId: string;
  onClose: () => void;
}

// Helper function to format platform names
const formatPlatform = (platform: string): string => {
  const platformMap: Record<string, string> = {
    'pc': 'PC',
    'ps4': 'PlayStation',
    'xbox': 'Xbox',
    'switch': 'Switch',
  };
  return platformMap[platform] || platform.toUpperCase();
};

export function FrameDetails({ frameId, onClose }: FrameDetailsProps) {
  const [details, setDetails] = useState<FrameDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [priceHistory, setPriceHistory] = useState<PriceHistorySummary[]>([]);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await api.getFrameDetails(frameId);
        setDetails(data);
        
        // Fetch price history
        try {
          const history = await api.getPriceHistory(frameId, settings.platform, 48);
          setPriceHistory(history);
        } catch (err) {
          console.error('Failed to fetch price history:', err);
        }
      } catch (error) {
        console.error('Failed to fetch frame details:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [frameId, settings.platform]);

  const handleCopyPart = async (partName: string, fullItemName: string, price: number, seller: string) => {
    try {
      await copyTradeMessage(fullItemName, price, seller);
      setCopiedItem(partName);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopySet = async (itemName: string, price: number, seller: string) => {
    try {
      await copyTradeMessage(itemName, price, seller);
      setCopiedItem('set');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getPriceRecommendation = (partName: string, currentPrice: number) => {
    const partHistory = priceHistory.find((p) => p.part_name === partName);
    if (!partHistory) return null;

    const diffFromLow = currentPrice - partHistory.lowest_48h;
    const percentAboveLow = (diffFromLow / partHistory.lowest_48h) * 100;

    if (currentPrice === partHistory.lowest_48h) {
      return { text: '🎯 Best Price!', color: 'text-wf-accent-green' };
    } else if (percentAboveLow <= 10) {
      return { text: '✅ Good Deal', color: 'text-wf-accent-blue' };
    } else if (percentAboveLow > 20) {
      return { text: `⚠️ ${Math.round(percentAboveLow)}% above lowest`, color: 'text-wf-accent-gold' };
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
        <div className="bg-wf-dark-bg-light rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-wf-dark-bg rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-wf-primary to-wf-accent-blue p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">{details.frame.name}</h2>
            <p className="text-white text-sm mt-1">
              Platform: {formatPlatform(settings.platform)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Opportunity Summary */}
          {details.current_opportunity && (
            <div className="bg-wf-dark-bg-lighter border border-wf-dark-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-wf-dark-text">Current Opportunity</h3>
                <ProfitChip
                  profit={details.current_opportunity.profit_plat}
                  margin={details.current_opportunity.profit_margin}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-wf-text-dim text-sm mb-1">Parts Cost</div>
                  <div className="text-2xl font-bold text-wf-dark-text">
                    {Math.round(details.current_opportunity.parts.reduce((sum, p) => sum + p.price, 0))} plat
                  </div>
                </div>
                <div>
                  <div className="text-wf-text-dim text-sm mb-1">Set Price</div>
                  <div className="text-2xl font-bold text-wf-primary">
                    {Math.round(details.current_opportunity.full_set_price)} plat
                  </div>
                </div>
                <div>
                  <div className="text-wf-text-dim text-sm mb-1">Profit</div>
                  <div className="text-2xl font-bold text-wf-accent-green">
                    +{Math.round(details.current_opportunity.profit_plat)} plat
                  </div>
                </div>
                <div>
                  <div className="text-wf-text-dim text-sm mb-1">Margin</div>
                  <div className="text-2xl font-bold text-wf-accent-blue">
                    {formatMargin(details.current_opportunity.profit_margin)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Part Breakdown */}
          {details.current_opportunity && (
            <div>
              <h3 className="text-lg font-semibold text-wf-dark-text mb-3">Part Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {details.current_opportunity.parts.map((part) => {
                  const partHistory = priceHistory.find((p) => p.part_name === part.name);
                  const recommendation = getPriceRecommendation(part.name, part.price);

                  return (
                    <div key={part.name} className="p-4 bg-wf-dark-bg-lighter border border-wf-dark-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-wf-dark-text text-lg">{part.name}</span>
                        <span className="font-mono text-wf-primary text-xl font-bold">{Math.round(part.price)} plat</span>
                      </div>

                      {/* Price History Inline */}
                      {partHistory && (
                        <div className="mb-3 p-2 bg-wf-dark-bg rounded text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-wf-text-dim">48h Low:</span>
                            <span className="text-wf-text font-semibold">{Math.round(partHistory.lowest_48h)} plat</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-wf-text-dim">48h High:</span>
                            <span className="text-wf-text font-semibold">{Math.round(partHistory.highest_48h)} plat</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-wf-text-dim">Average:</span>
                            <span className="text-wf-text font-semibold">{Math.round(partHistory.average_48h)} plat</span>
                          </div>
                          {recommendation && (
                            <div className={`mt-2 pt-2 border-t border-wf-dark-border font-semibold ${recommendation.color}`}>
                              {recommendation.text}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Seller info */}
                      <div className="text-xs text-wf-text-dim mb-3">
                        Seller: <span className="text-wf-accent-blue font-medium">{part.seller}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyPart(part.name, `${details.frame.name} ${part.name}`, part.price, part.seller)}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                            copiedItem === part.name
                              ? 'bg-wf-accent-green text-white'
                              : 'bg-wf-primary hover:bg-wf-primary-hover text-white'
                          }`}
                        >
                          {copiedItem === part.name ? (
                            <span className="flex items-center justify-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied!
                            </span>
                          ) : (
                            'Buy'
                          )}
                        </button>
                        <a
                          href={getWarframeMarketPartUrl(frameId, part.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-sm bg-wf-dark-bg-light text-wf-dark-text rounded-md hover:bg-wf-dark-bg transition-colors border border-wf-dark-border"
                        >
                          Market
                        </a>
                      </div>
                    </div>
                  );
                })}

                {/* Full Set Card */}
                {details.current_opportunity && (
                  <div className="p-4 bg-gradient-to-br from-wf-primary/20 to-wf-accent-blue/20 border-2 border-wf-primary rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-wf-dark-text text-lg">Full Set</span>
                      <span className="font-mono text-wf-primary text-xl font-bold">
                        {Math.round(details.current_opportunity.full_set_price)} plat
                      </span>
                    </div>

                    {/* Set Price History */}
                    {(() => {
                      const setHistory = priceHistory.find((p) => p.part_name === 'Full Set');
                      return setHistory ? (
                        <div className="mb-3 p-2 bg-wf-dark-bg/50 rounded text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-wf-text-dim">48h Low:</span>
                            <span className="text-wf-text font-semibold">
                              {Math.round(setHistory.lowest_48h)} plat
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-wf-text-dim">48h High:</span>
                            <span className="text-wf-text font-semibold">
                              {Math.round(setHistory.highest_48h)} plat
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-wf-text-dim">Average:</span>
                            <span className="text-wf-text font-semibold">
                              {Math.round(setHistory.average_48h)} plat
                            </span>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Seller info */}
                    <div className="text-xs text-wf-text-dim mb-3">
                      Seller: <span className="text-wf-accent-blue font-medium">{details.current_opportunity.seller}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleCopySet(
                            `${details.frame.name} Set`,
                            details.current_opportunity!.full_set_price,
                            details.current_opportunity!.seller
                          )
                        }
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                          copiedItem === 'set'
                            ? 'bg-wf-accent-green text-white'
                            : 'bg-wf-primary hover:bg-wf-primary-hover text-white'
                        }`}
                      >
                        {copiedItem === 'set' ? (
                          <span className="flex items-center justify-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </span>
                        ) : (
                          'Buy'
                        )}
                      </button>
                      <a
                        href={getWarframeMarketPartUrl(frameId, 'Set')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm bg-wf-dark-bg-light text-wf-dark-text rounded-md hover:bg-wf-dark-bg transition-colors border border-wf-dark-border"
                      >
                        Market
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
