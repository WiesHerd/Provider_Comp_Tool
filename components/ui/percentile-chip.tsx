import { cn } from "@/lib/utils/cn";

interface PercentileChipProps {
  percentile: number;
  label?: string;
  className?: string;
}

export function PercentileChip({ percentile, label, className }: PercentileChipProps) {
  const getColor = (p: number) => {
    if (p < 25) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    if (p < 75) return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    if (p < 90) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  };

  const getFMVSignal = (p: number) => {
    if (p < 0) return "Below Market Range";
    if (p >= 0 && p < 25) return "Below Standard Range";
    if (p >= 25 && p <= 75) return "Standard Range";
    if (p > 75 && p <= 90) return "Enhanced Scrutiny";
    if (p > 90 && p < 100) return "High Scrutiny / Document FMV";
    if (p >= 100) return "Above Market Range";
    return "Below Standard";
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "px-3 py-1.5 rounded-lg font-semibold text-sm",
          getColor(percentile)
        )}
      >
        {percentile < 0 
          ? '< 0th Percentile'
          : percentile > 100 
          ? '> 100th Percentile'
          : `${percentile.toFixed(1)}th Percentile`}
      </span>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}: {getFMVSignal(percentile)}
        </span>
      )}
    </div>
  );
}

