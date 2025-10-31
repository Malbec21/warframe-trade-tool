interface ThresholdControlsProps {
  minProfit: number;
  minMargin: number;
  onMinProfitChange: (value: number) => void;
  onMinMarginChange: (value: number) => void;
}

export function ThresholdControls({
  minProfit,
  minMargin,
  onMinProfitChange,
  onMinMarginChange,
}: ThresholdControlsProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-wf-dark-text">
          Min Profit (
          <span className="inline-flex items-center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9z" />
            </svg>
          </span>
          )
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={minProfit}
          onChange={(e) => onMinProfitChange(Number(e.target.value))}
          className="px-3 py-2 bg-wf-dark-bg-lighter border border-wf-dark-border rounded-md text-wf-dark-text w-24 focus:outline-none focus:ring-2 focus:ring-wf-primary"
          placeholder="0"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-wf-dark-text">Min Margin (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={minMargin * 100}
          onChange={(e) => onMinMarginChange(Number(e.target.value) / 100)}
          className="px-3 py-2 bg-wf-dark-bg-lighter border border-wf-dark-border rounded-md text-wf-dark-text w-24 focus:outline-none focus:ring-2 focus:ring-wf-primary"
          placeholder="0"
        />
      </div>
    </div>
  );
}

