import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { FrameInfo, TradeSession, TradePart } from '@/lib/types';

interface TradeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingSession?: TradeSession; // If provided, we're editing
}

// Helper to format status display
const formatStatus = (status: string): string => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function TradeSessionModal({ isOpen, onClose, onSuccess, existingSession }: TradeSessionModalProps) {
  const [warframes, setWarframes] = useState<FrameInfo[]>([]);
  const [selectedWarframe, setSelectedWarframe] = useState<FrameInfo | null>(null);
  const [parts, setParts] = useState<{ name: string; price: number; existingId?: number; isEditing?: boolean }[]>([]);
  const [setSellPrice, setSetSellPrice] = useState<number>(0);
  const [status, setStatus] = useState<'in_progress' | 'completed'>('in_progress');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingWarframes, setLoadingWarframes] = useState(true);
  const isInitialized = useRef(false);

  const isEditing = !!existingSession;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      isInitialized.current = false;
      setSelectedWarframe(null);
      setParts([]);
      setSetSellPrice(0);
      setStatus('in_progress');
      setError('');
    }
  }, [isOpen]);

  // Load warframes list
  useEffect(() => {
    const fetchWarframes = async () => {
      if (!isOpen) return;
      
      setLoadingWarframes(true);
      try {
        const frames = await api.getFrames();
        // Filter only warframes (not weapons)
        const warframesOnly = frames.filter((f) => f.item_type === 'warframe');
        setWarframes(warframesOnly);
      } catch (err) {
        setError('Failed to load warframes list');
      } finally {
        setLoadingWarframes(false);
      }
    };

    fetchWarframes();
  }, [isOpen]);

  // Load existing session data - only run once when modal opens
  useEffect(() => {
    if (!isOpen || !existingSession || isInitialized.current || warframes.length === 0) return;

    isInitialized.current = true;

    // Find the warframe
    const warframe = warframes.find((w) => w.id === existingSession.item_id);
    if (warframe) {
      setSelectedWarframe(warframe);
    }

    // Load existing parts
    setParts(
      existingSession.parts.map((part) => ({
        name: part.part_name,
        price: Math.round(part.purchase_price), // Ensure integer
        existingId: part.id,
        isEditing: false,
      }))
    );

    // Load sell price and status
    setSetSellPrice(Math.round(existingSession.set_sell_price || 0));
    setStatus(existingSession.status as 'in_progress' | 'completed');
  }, [isOpen, existingSession, warframes]);

  // Initialize parts when warframe is selected (only for new sessions)
  useEffect(() => {
    if (selectedWarframe && !isEditing && !isInitialized.current) {
      setParts(
        selectedWarframe.parts.map((partName) => ({
          name: partName,
          price: 0,
          isEditing: false,
        }))
      );
    }
  }, [selectedWarframe, isEditing]);

  const handleWarframeSelect = (warframeId: string) => {
    const warframe = warframes.find((w) => w.id === warframeId);
    if (warframe) {
      setSelectedWarframe(warframe);
    }
  };

  const handlePartPriceChange = (index: number, value: string) => {
    const price = Math.max(0, parseInt(value) || 0); // Ensure positive integer
    const newParts = [...parts];
    newParts[index].price = price;
    setParts(newParts);
  };

  const togglePartEditing = (index: number) => {
    const newParts = [...parts];
    newParts[index].isEditing = !newParts[index].isEditing;
    setParts(newParts);
  };

  const handleAddPart = () => {
    if (selectedWarframe) {
      // Get parts that haven't been added yet
      const addedPartNames = parts.map(p => p.name);
      const availableParts = selectedWarframe.parts.filter(p => !addedPartNames.includes(p));
      
      if (availableParts.length > 0) {
        // Add the first available part
        setParts([...parts, { name: availableParts[0], price: 0, isEditing: false }]);
      }
    }
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartNameChange = (index: number, name: string) => {
    const newParts = [...parts];
    newParts[index].name = name;
    setParts(newParts);
  };

  const getAvailablePartsForDropdown = (currentPartName: string): string[] => {
    if (!selectedWarframe) return [];
    const addedPartNames = parts.map(p => p.name).filter(name => name !== currentPartName);
    return selectedWarframe.parts.filter(p => !addedPartNames.includes(p));
  };

  const handleSubmit = async () => {
    if (!selectedWarframe) {
      setError('Please select a warframe');
      return;
    }

    const filledParts = parts.filter((p) => p.name && p.price > 0);
    if (filledParts.length === 0) {
      setError('Please add at least one part with a price');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (isEditing && existingSession) {
        // Update existing session
        // First, add any new parts or update existing ones
        for (const part of filledParts) {
          if (!part.existingId) {
            // New part
            await api.addPartToSession(existingSession.id, {
              part_name: part.name,
              purchase_price: part.price,
            });
          }
          // Note: We can't update existing parts via API currently
          // This would require a PATCH endpoint for individual parts
        }

        // Update session with sell price and status
        await api.updateTradeSession(existingSession.id, {
          set_sell_price: setSellPrice > 0 ? setSellPrice : undefined,
          status,
        });
      } else {
        // Create new session
        const session = await api.createTradeSession({
          item_id: selectedWarframe.id,
          item_name: selectedWarframe.name,
          item_type: 'warframe',
        });

        // Add parts to session
        for (const part of filledParts) {
          await api.addPartToSession(session.id, {
            part_name: part.name,
            purchase_price: part.price,
          });
        }

        // Update with set sell price if provided
        if (setSellPrice > 0 || status === 'completed') {
          await api.updateTradeSession(session.id, {
            set_sell_price: setSellPrice > 0 ? setSellPrice : undefined,
            status,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trade session');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = parts.reduce((sum, part) => sum + part.price, 0);
  const estimatedProfit = setSellPrice > 0 ? setSellPrice - totalCost : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-wf-dark-bg border-2 border-wf-dark-border rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-wf-dark-bg-light border-b border-wf-dark-border p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-wf-text">
            {isEditing ? `Edit Trade: ${existingSession?.item_name}` : 'Create New Trade Session'}
          </h2>
          <button
            onClick={onClose}
            className="text-wf-text-dim hover:text-wf-text transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-wf-accent-red/20 border border-wf-accent-red rounded text-wf-accent-red text-sm">
              {error}
            </div>
          )}

          {/* Warframe Selection */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-wf-text mb-2">Select Warframe</label>
              {loadingWarframes ? (
                <div className="text-wf-text-dim text-sm">Loading warframes...</div>
              ) : (
                <select
                  value={selectedWarframe?.id || ''}
                  onChange={(e) => handleWarframeSelect(e.target.value)}
                  className="w-full px-4 py-3 bg-wf-dark-bg-light border border-wf-dark-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
                  disabled={isLoading}
                >
                  <option value="">-- Select a warframe --</option>
                  {warframes.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Parts Section */}
          {selectedWarframe && (
            <>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-wf-text">Parts Purchased</h3>
                  {isEditing && (
                    <button
                      onClick={handleAddPart}
                      disabled={isLoading || getAvailablePartsForDropdown('').length === 0}
                      className="px-3 py-1 bg-wf-accent-green/20 hover:bg-wf-accent-green/30 border border-wf-accent-green text-wf-accent-green text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + Add Part
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {parts.map((part, index) => (
                    <div key={index} className="p-4 bg-wf-dark-bg-light rounded border border-wf-dark-border">
                      {isEditing && !part.existingId ? (
                        // New part in edit mode - show dropdown
                        <div className="mb-2">
                          <label className="block text-xs font-medium text-wf-text-dim mb-1">Part Name</label>
                          <select
                            value={part.name}
                            onChange={(e) => handlePartNameChange(index, e.target.value)}
                            className="w-full px-3 py-2 bg-wf-dark-bg border border-wf-dark-border rounded text-wf-text text-sm focus:outline-none focus:ring-2 focus:ring-wf-primary"
                            disabled={isLoading}
                          >
                            {getAvailablePartsForDropdown(part.name).map((partName) => (
                              <option key={partName} value={partName}>
                                {partName}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-wf-text">{part.name}</label>
                          {part.existingId && (
                            <button
                              onClick={() => togglePartEditing(index)}
                              className="text-xs text-wf-accent-blue hover:text-wf-accent-blue/80"
                              disabled={isLoading}
                            >
                              {part.isEditing ? 'Cancel Edit' : 'Edit Price'}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={part.price || ''}
                            onChange={(e) => handlePartPriceChange(index, e.target.value)}
                            placeholder="Price in platinum"
                            className="w-full px-3 py-2 bg-wf-dark-bg border border-wf-dark-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
                            disabled={isLoading || (part.existingId && !part.isEditing)}
                          />
                          {part.existingId && !part.isEditing && (
                            <p className="text-xs text-wf-text-dim mt-1">
                              Click "Edit Price" to modify
                            </p>
                          )}
                        </div>
                        {isEditing && !part.existingId && (
                          <button
                            onClick={() => handleRemovePart(index)}
                            className="px-3 py-2 bg-wf-accent-red/20 hover:bg-wf-accent-red/30 border border-wf-accent-red text-wf-accent-red rounded transition-colors"
                            disabled={isLoading}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Set Sell Price */}
              <div>
                <label className="block text-sm font-medium text-wf-text mb-2">
                  Set Sell Price <span className="text-wf-text-dim">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={setSellPrice || ''}
                  onChange={(e) => setSetSellPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Price you sold the complete set for"
                  className="w-full px-4 py-3 bg-wf-dark-bg-light border border-wf-dark-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
                  disabled={isLoading}
                />
              </div>

              {/* Status */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-wf-text mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'in_progress' | 'completed')}
                    className="w-full px-4 py-3 bg-wf-dark-bg-light border border-wf-dark-border rounded text-wf-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
                    disabled={isLoading}
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              {/* Summary */}
              <div className="bg-wf-dark-bg-light rounded p-4 border border-wf-dark-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-wf-text-dim">Total Cost:</span>
                  <span className="text-wf-text font-semibold text-lg">{totalCost} plat</span>
                </div>
                {setSellPrice > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-wf-text-dim">Sell Price:</span>
                      <span className="text-wf-text font-semibold">{setSellPrice} plat</span>
                    </div>
                    <div className="border-t border-wf-dark-border pt-2 flex justify-between items-center">
                      <span className="text-wf-text-dim font-medium">Profit:</span>
                      <span
                        className={`font-bold text-xl ${
                          estimatedProfit !== null && estimatedProfit >= 0
                            ? 'text-wf-accent-green'
                            : 'text-wf-accent-red'
                        }`}
                      >
                        {estimatedProfit !== null ? (estimatedProfit >= 0 ? '+' : '') : ''}
                        {estimatedProfit !== null ? estimatedProfit : '0'} plat
                      </span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-wf-dark-bg-light border-t border-wf-dark-border p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-wf-dark-bg border border-wf-dark-border text-wf-text rounded-lg hover:bg-wf-dark-bg-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedWarframe || parts.filter((p) => p.name && p.price > 0).length === 0}
            className="flex-1 px-6 py-3 bg-wf-primary hover:bg-wf-primary/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Trade Session' : 'Create Trade Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
