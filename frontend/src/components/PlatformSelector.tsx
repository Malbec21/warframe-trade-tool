import { PLATFORMS } from '../lib/constants';
import type { Platform } from '../lib/types';

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
}

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-wf-dark-text">Platform</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Platform)}
        className="px-3 py-2 bg-wf-dark-bg-lighter border border-wf-dark-border rounded-md text-wf-dark-text focus:outline-none focus:ring-2 focus:ring-wf-primary"
      >
        {PLATFORMS.map((platform) => (
          <option key={platform.value} value={platform.value}>
            {platform.label}
          </option>
        ))}
      </select>
    </div>
  );
}

