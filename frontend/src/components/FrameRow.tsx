import { useState } from 'react';
import { formatMargin, formatPlat } from '../lib/format';
import { isWatched, toggleWatchlist } from '../lib/storage';
import { copyTradeMessage } from '../lib/clipboard';
import type { Opportunity } from '../lib/types';
import { ProfitChip } from './ProfitChip';

interface FrameRowProps {
  opportunity: Opportunity;
  onViewDetails: (frameId: string) => void;
}

export function FrameRow({ opportunity, onViewDetails }: FrameRowProps) {
  const [watched, setWatched] = useState(isWatched(opportunity.frame_id));
  const [copied, setCopied] = useState(false);

  const handleToggleWatch = () => {
    toggleWatchlist(opportunity.frame_id);
    setWatched(!watched);
  };

  const handleCopyTrade = async () => {
    try {
      await copyTradeMessage(`${opportunity.frame_name} Set`, opportunity.full_set_price, opportunity.seller);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const partsSum = opportunity.parts.reduce((sum, part) => sum + part.price, 0);

  return (
    <tr className="hover:bg-wf-dark-bg-lighter transition-colors">
      {/* Item Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleWatch}
            className={`p-1 rounded hover:bg-wf-dark-bg transition-colors ${
              watched ? 'text-wf-accent-gold' : 'text-wf-dark-text-dim'
            }`}
            title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <svg className="w-5 h-5" fill={watched ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          <div className="flex flex-col">
            <span className="font-medium text-wf-dark-text">{opportunity.frame_name}</span>
            <span className="text-xs text-wf-dark-text-dim capitalize">{opportunity.item_type}</span>
          </div>
        </div>
      </td>

      {/* Parts Sum */}
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          <span className="font-mono text-wf-dark-text">{formatPlat(partsSum)}</span>
          <span className="text-xs text-wf-dark-text-dim">{opportunity.parts.length} parts</span>
        </div>
      </td>

      {/* Set Price */}
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-wf-dark-text">{formatPlat(opportunity.full_set_price)}</span>
      </td>

      {/* Profit */}
      <td className="px-4 py-3 text-right">
        <ProfitChip profit={opportunity.profit_plat} margin={opportunity.profit_margin} />
      </td>

      {/* Margin */}
      <td className="px-4 py-3 text-right">
        <span
          className={`font-medium ${
            opportunity.profit_margin > 0.3
              ? 'text-wf-accent-green'
              : opportunity.profit_margin > 0.1
              ? 'text-wf-primary'
              : 'text-wf-dark-text-dim'
          }`}
        >
          {formatMargin(opportunity.profit_margin)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={handleCopyTrade}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all ${
              copied
                ? 'bg-wf-accent-green text-white'
                : 'bg-wf-primary hover:bg-wf-primary-hover text-white'
            }`}
            title="Copy trade message"
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              'Buy'
            )}
          </button>
          <button
            onClick={() => onViewDetails(opportunity.frame_id)}
            className="px-3 py-1.5 text-sm bg-wf-dark-bg-lighter text-wf-dark-text rounded-md hover:bg-wf-dark-bg transition-colors"
          >
            Details
          </button>
        </div>
      </td>
    </tr>
  );
}

