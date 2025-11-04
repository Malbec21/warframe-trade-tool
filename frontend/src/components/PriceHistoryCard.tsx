import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { PriceHistorySummary } from '@/lib/types';

interface PriceHistoryCardProps {
  itemId: string;
  platform: string;
}

export function PriceHistoryCard({ itemId, platform }: PriceHistoryCardProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await api.getPriceHistory(itemId, platform, 48);
        setPriceHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load price history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [itemId, platform]);

  if (isLoading) {
    return (
      <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4">
        <div className="text-wf-text-dim text-sm">Loading price history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4">
        <div className="text-wf-accent-red text-sm">{error}</div>
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-4">
        <div className="text-wf-text-dim text-sm">No price history available yet.</div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-wf-accent-red';
    if (trend === 'down') return 'text-wf-accent-green';
    return 'text-wf-text-dim';
  };

  return (
    <div className="bg-wf-bg-lighter border border-wf-border rounded-lg">
      <div 
        className="p-4 cursor-pointer hover:bg-wf-bg transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-wf-text">48-Hour Price History</h3>
          <span className="text-wf-text-dim">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {priceHistory.map((part) => (
            <div key={part.part_name} className="bg-wf-bg rounded-lg p-3 border border-wf-border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-wf-text">{part.part_name}</h4>
                <span className={`text-sm ${getTrendColor(part.price_trend)}`}>
                  {getTrendIcon(part.price_trend)} {part.price_trend}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-wf-text-dim">Current:</span>
                  <span className="ml-2 font-semibold text-wf-text">{part.current_price} plat</span>
                </div>
                <div>
                  <span className="text-wf-text-dim">48h Low:</span>
                  <span className={`ml-2 font-semibold ${part.current_price === part.lowest_48h ? 'text-wf-accent-green' : 'text-wf-text'}`}>
                    {part.lowest_48h} plat
                  </span>
                </div>
                <div>
                  <span className="text-wf-text-dim">48h High:</span>
                  <span className="ml-2 font-semibold text-wf-text">{part.highest_48h} plat</span>
                </div>
                <div>
                  <span className="text-wf-text-dim">Average:</span>
                  <span className="ml-2 font-semibold text-wf-text">{part.average_48h} plat</span>
                </div>
              </div>

              {/* Price Comparison Indicator */}
              {part.current_price === part.lowest_48h && (
                <div className="mt-2 text-xs text-wf-accent-green font-semibold">
                  🎯 BEST PRICE! Current price matches 48h low
                </div>
              )}
              {part.current_price > part.lowest_48h && part.current_price <= part.lowest_48h * 1.1 && (
                <div className="mt-2 text-xs text-wf-accent-blue">
                  ✅ Good price - Within 10% of 48h low
                </div>
              )}
              {part.current_price > part.lowest_48h * 1.2 && (
                <div className="mt-2 text-xs text-wf-accent-gold">
                  ⚠️ Price is {(((part.current_price - part.lowest_48h) / part.lowest_48h) * 100).toFixed(0)}% above 48h low
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

