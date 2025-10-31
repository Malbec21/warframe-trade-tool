import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatMargin, formatPlat } from '../lib/format';
import { copyTradeMessage, getWarframeMarketPartUrl } from '../lib/clipboard';
import type { FrameDetail } from '../lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ProfitChip } from './ProfitChip';
import { Sparkline } from './Sparkline';

interface FrameDetailsProps {
  frameId: string;
  onClose: () => void;
}

export function FrameDetails({ frameId, onClose }: FrameDetailsProps) {
  const [details, setDetails] = useState<FrameDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getFrameDetail(frameId);
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [frameId]);

  const handleCopyPart = async (partName: string, price: number, seller: string) => {
    try {
      await copyTradeMessage(partName, price, seller);
      setCopiedItem(partName);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-wf-dark-bg-light p-8 rounded-lg border border-wf-dark-border">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-wf-dark-bg-light p-8 rounded-lg border border-wf-dark-border max-w-md">
          <p className="text-wf-accent-red mb-4">{error || 'Failed to load details'}</p>
          <button onClick={onClose} className="w-full px-4 py-2 bg-wf-primary hover:bg-wf-primary-hover text-white rounded-md transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  const sparklineData = details.snapshots.map((s) => s.set_price);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-wf-dark-bg-light border border-wf-dark-border rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-wf-dark-text">{details.frame.name}</h2>
            <p className="text-sm text-wf-dark-text-dim mt-1">
              {details.frame.parts.length} parts • {details.frame.is_prime ? 'Prime' : 'Standard'} • {details.frame.item_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-wf-dark-bg rounded-lg transition-colors text-wf-dark-text-dim hover:text-wf-dark-text"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Opportunity */}
        {details.current_opportunity ? (
          <div className="mb-6 p-4 bg-wf-dark-bg-lighter border border-wf-dark-border rounded-lg">
            <h3 className="text-lg font-semibold text-wf-dark-text mb-3">Current Opportunity</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-wf-dark-text-dim">Parts Cost</p>
                <p className="text-xl font-bold text-wf-dark-text">
                  {formatPlat(
                    details.current_opportunity.parts.reduce((sum, p) => sum + p.price, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-wf-dark-text-dim">Set Price</p>
                <p className="text-xl font-bold text-wf-dark-text">
                  {formatPlat(details.current_opportunity.full_set_price)}
                </p>
              </div>
              <div>
                <p className="text-sm text-wf-dark-text-dim">Profit</p>
                <ProfitChip
                  profit={details.current_opportunity.profit_plat}
                  margin={details.current_opportunity.profit_margin}
                  size="lg"
                />
              </div>
              <div>
                <p className="text-sm text-wf-dark-text-dim">Margin</p>
                <p className="text-xl font-bold text-wf-primary">
                  {formatMargin(details.current_opportunity.profit_margin)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-wf-accent-gold bg-opacity-10 border border-wf-accent-gold rounded-lg">
            <p className="text-wf-accent-gold">No current pricing data available</p>
          </div>
        )}

        {/* Part Breakdown */}
        {details.current_opportunity && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-wf-dark-text mb-3">Part Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {details.current_opportunity.parts.map((part) => (
                <div key={part.name} className="p-3 bg-wf-dark-bg border border-wf-dark-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-wf-dark-text">{part.name}</span>
                    <span className="font-mono text-wf-primary">{formatPlat(part.price)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyPart(`${details.frame.name} ${part.name}`, part.price, part.seller)}
                      className={`flex-1 px-2 py-1 text-xs rounded-md transition-all ${
                        copiedItem === part.name
                          ? 'bg-wf-accent-green text-white'
                          : 'bg-wf-primary hover:bg-wf-primary-hover text-white'
                      }`}
                      title={`Seller: ${part.seller}`}
                    >
                      {copiedItem === part.name ? '✓ Copied!' : 'Buy'}
                    </button>
                    <a
                      href={getWarframeMarketPartUrl(frameId, part.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs bg-wf-dark-bg-lighter text-wf-dark-text hover:bg-wf-dark-bg rounded-md transition-colors"
                    >
                      Market
                    </a>
                  </div>
                  <span className="text-xs text-wf-dark-text-dim mt-1 inline-block">
                    {part.source}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price History */}
        {details.snapshots.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-wf-dark-text mb-3">Price History</h3>
            <div className="p-4 bg-wf-dark-bg border border-wf-dark-border rounded-lg">
              <Sparkline data={sparklineData} width={400} height={60} />
              <p className="text-sm text-wf-dark-text-dim mt-2">
                Last {details.snapshots.length} snapshots
              </p>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3">
          <a
            href={`https://warframe.market/items/${frameId}_set`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 bg-wf-primary hover:bg-wf-primary-hover text-white rounded-md transition-colors"
          >
            View Full Set on Market
          </a>
          <button onClick={onClose} className="px-4 py-2 bg-wf-dark-bg-lighter hover:bg-wf-dark-bg text-wf-dark-text rounded-md transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

