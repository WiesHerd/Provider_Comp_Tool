import { cn } from '@/lib/utils/cn';

interface KPIChipProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function KPIChip({ label, value, unit, className }: KPIChipProps) {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    : value;

  // For currency, place $ before the value
  const isCurrency = unit === '$';
  const displayValue = isCurrency ? `$${formattedValue}` : formattedValue;
  const displayUnit = isCurrency ? null : unit;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 md:p-6 shadow-sm",
      className
    )}>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</div>
      <div className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
        {displayValue}
        {displayUnit && <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">{displayUnit}</span>}
      </div>
    </div>
  );
}

