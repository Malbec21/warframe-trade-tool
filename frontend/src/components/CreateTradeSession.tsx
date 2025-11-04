import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { Opportunity, TradePart } from '@/lib/types';

interface CreateTradeSessionProps {
  opportunity: Opportunity;
  onCreated: (sessionId: number) => void;
  onCancel: () => void;
}

export function CreateTradeSession({ opportunity, onCreated, onCancel }: CreateTradeSessionProps) {
  const [parts, setParts] = useState<{ name: string; price: number; notes: string }[]>(
    opportunity.parts.map((p) => ({ name: p.name, price: 0, notes: '' }))
  );
  const [setSellPrice, setSetSellPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePartPriceChange = (index: number, price: number) => {
    const newParts = [...parts];
    newParts[index].price = price;
    setParts(newParts);
  };

  const handlePartNotesChange = (index: number, notes: string) => {
    const newParts = [...parts];
    newParts[index].notes = notes;
    setParts(newParts);
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Create trade session
      const session = await api.createTradeSession({
        item_id: opportunity.frame_id,
        item_name: opportunity.frame_name,
        item_type: opportunity.item_type,
      });

      // Add parts to session
      for (const part of parts) {
        if (part.price > 0) {
          await api.addPartToSession(session.id, {
            part_name: part.name,
            purchase_price: part.price,
            notes: part.notes || undefined,
          });
        }
      }

      // Update with set sell price if provided
      if (setSellPrice > 0) {
        await api.updateTradeSession(session.id, {
          set_sell_price: setSellPrice,
          status: 'completed',
        });
      }

      onCreated(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trade session');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = parts.reduce((sum, part) => sum + part.price, 0);
  const estimatedProfit = setSellPrice > 0 ? setSellPrice - totalCost : null;

  return (
    <div className="bg-wf-bg-lighter border border-wf-border rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-wf-text mb-4">
        Create Trade Session: {opportunity.frame_name}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-wf-accent-red/20 border border-wf-accent-red rounded text-wf-accent-red text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-wf-text mb-2">Parts Purchased</h3>
          {parts.map((part, index) => (
            <div key={index} className="mb-3 p-3 bg-wf-bg rounded border border-wf-border">
              <label className="block text-sm font-medium text-wf-text-dim mb-1">
                {part.name}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={part.price || ''}
                  onChange={(e) => handlePartPriceChange(index, parseFloat(e.target.value) || 0)}
                  placeholder="Price in platinum"
                  className="flex-1 px-3 py-2 bg-wf-bg-light border border-wf-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={part.notes}
                  onChange={(e) => handlePartNotesChange(index, e.target.value)}
                  placeholder="Notes (optional)"
                  className="flex-1 px-3 py-2 bg-wf-bg-light border border-wf-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
                  disabled={isLoading}
                />
              </div>
              <div className="mt-1 text-xs text-wf-text-dim">
                Market price: {opportunity.parts[index].price} plat
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-wf-text-dim mb-1">
            Set Sell Price (optional)
          </label>
          <input
            type="number"
            value={setSellPrice || ''}
            onChange={(e) => setSetSellPrice(parseFloat(e.target.value) || 0)}
            placeholder="Price you sold the set for"
            className="w-full px-3 py-2 bg-wf-bg border border-wf-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
            disabled={isLoading}
          />
          <div className="mt-1 text-xs text-wf-text-dim">
            Market price: {opportunity.full_set_price} plat
          </div>
        </div>

        <div className="bg-wf-bg rounded p-4 border border-wf-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-wf-text-dim">Total Cost:</span>
            <span className="text-wf-text font-semibold">{totalCost.toFixed(2)} plat</span>
          </div>
          {estimatedProfit !== null && (
            <div className="flex justify-between items-center">
              <span className="text-wf-text-dim">Estimated Profit:</span>
              <span className={`font-semibold ${estimatedProfit >= 0 ? 'text-wf-accent-green' : 'text-wf-accent-red'}`}>
                {estimatedProfit >= 0 ? '+' : ''}{estimatedProfit.toFixed(2)} plat
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isLoading || totalCost === 0}
          className="flex-1 py-2 px-4 bg-wf-primary hover:bg-wf-primary/80 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Trade Session'}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-wf-bg-light border border-wf-border text-wf-text rounded hover:bg-wf-bg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

