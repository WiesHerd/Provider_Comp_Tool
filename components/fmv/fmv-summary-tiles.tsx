import { PercentileChip } from '@/components/ui/percentile-chip';
import { Card } from '@/components/ui/card';

interface FMVSummaryTilesProps {
  normalizedTcc: number;
  normalizedWrvus: number;
  effectiveCF: number;
  tccPercentile: number;
  wrvuPercentile: number;
  cfPercentile: number;
}

export function FMVSummaryTiles({
  normalizedTcc,
  normalizedWrvus,
  effectiveCF,
  tccPercentile,
  wrvuPercentile,
  cfPercentile,
}: FMVSummaryTilesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 md:p-6">
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Normalized TCC</div>
          <div className="text-3xl font-light tracking-tight text-gray-900 dark:text-white">
            ${normalizedTcc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <PercentileChip percentile={tccPercentile} />
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Normalized wRVUs</div>
          <div className="text-3xl font-light tracking-tight text-gray-900 dark:text-white">
            {normalizedWrvus.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
          <PercentileChip percentile={wrvuPercentile} />
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Effective CF</div>
          <div className="text-3xl font-light tracking-tight text-gray-900 dark:text-white">
            ${effectiveCF.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/wRVU</span>
          </div>
          <PercentileChip percentile={cfPercentile} />
        </div>
      </Card>
    </div>
  );
}

