interface ProfitChipProps {
  profit: number;
  margin: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfitChip({ profit, margin, size = 'md' }: ProfitChipProps) {
  const isPositive = profit > 0;
  const isHighMargin = margin > 0.5;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const colorClasses = isPositive
    ? isHighMargin
      ? 'bg-gradient-to-r from-wf-accent-green to-emerald-500 text-white'
      : 'bg-gradient-to-r from-wf-primary to-wf-accent-blue text-white'
    : 'bg-gray-700 text-gray-300';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${colorClasses}`}
    >
      {isPositive && '+'}
      {profit.toFixed(0)}
      <span className="inline-flex items-center">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9z" />
        </svg>
      </span>
    </span>
  );
}

