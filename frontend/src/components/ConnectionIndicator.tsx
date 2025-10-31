interface ConnectionIndicatorProps {
  isConnected: boolean;
  lastUpdate: string | null;
}

export function ConnectionIndicator({ isConnected, lastUpdate }: ConnectionIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? 'bg-wf-accent-green animate-pulse'
              : 'bg-wf-accent-red'
          }`}
        />
        <span className="text-wf-dark-text">
          {isConnected ? 'Live' : 'Disconnected'}
        </span>
      </div>
      {lastUpdate && (
        <span className="text-wf-dark-text-dim">
          • Updated {new Date(lastUpdate).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

