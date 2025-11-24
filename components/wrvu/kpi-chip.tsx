import { cn } from '@/lib/utils/cn';

interface KPIChipProps {
  label: string;
  value: string | number;
  unit?: string;
  unitBelow?: string; // Unit to display below the value (Apple-style)
  className?: string;
}

export function KPIChip({ label, value, unit, unitBelow, className }: KPIChipProps) {
  const isNegative = typeof value === 'number' && value < 0;
  const formattedValue = typeof value === 'number' 
    ? Math.abs(value).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    : value;

  // For currency, place $ before the value
  const isCurrency = unit === '$';
  const displayValue = isCurrency 
    ? `${isNegative ? '-$' : '$'}${formattedValue}`
    : `${isNegative ? '-' : ''}${formattedValue}`;
  const displayUnit = isCurrency ? null : unit;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl border p-3 sm:p-4 md:p-6 shadow-sm",
      isNegative 
        ? "border-red-200 dark:border-red-800" 
        : "border-gray-100 dark:border-gray-700",
      className
    )}>
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 leading-tight">{label}</div>
      <div className="space-y-0.5">
        <div className={cn(
          "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words",
          isNegative 
            ? "text-red-600 dark:text-red-400" 
            : "text-gray-900 dark:text-white"
        )}>
          {displayValue}
          {displayUnit && <span className="text-base sm:text-lg text-gray-500 dark:text-gray-400 ml-1">{displayUnit}</span>}
        </div>
        {unitBelow && (
          <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
            {unitBelow}
          </div>
        )}
      </div>
    </div>
  );
}

