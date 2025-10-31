import { STRATEGIES } from '../lib/constants';
import type { Strategy } from '../lib/types';

interface StrategySelectorProps {
  value: Strategy;
  onChange: (strategy: Strategy) => void;
}

export function StrategySelector({ value, onChange }: StrategySelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-wf-dark-text">Strategy</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Strategy)}
        className="px-3 py-2 bg-wf-dark-bg-lighter border border-wf-dark-border rounded-md text-wf-dark-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
        title={STRATEGIES.find((s) => s.value === value)?.description}
      >
        {STRATEGIES.map((strategy) => (
          <option key={strategy.value} value={strategy.value} title={strategy.description}>
            {strategy.label}
          </option>
        ))}
      </select>
    </div>
  );
}

