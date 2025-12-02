'use client';

import { AlignmentStatus } from '@/types/physician-scenarios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface RecommendationPanelProps {
  alignmentStatus: AlignmentStatus;
}

export function RecommendationPanel({ alignmentStatus }: RecommendationPanelProps) {
  const getAlignmentBadge = (status: AlignmentStatus) => {
    switch (status) {
      case 'Aligned':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Aligned
          </Badge>
        );
      case 'Mild Drift':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Mild Drift
          </Badge>
        );
      case 'Risk Zone':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Risk Zone
          </Badge>
        );
    }
  };

  const getRecommendationText = (status: AlignmentStatus) => {
    switch (status) {
      case 'Aligned':
        return 'Proposed CF maintains alignment with productivity levels. The model shows consistent alignment across all benchmark scenarios, indicating that compensation remains appropriately tied to productivity within fair market value expectations.';
      case 'Mild Drift':
        return 'Review recommended - some scenarios show drift. While the proposed CF model generally maintains alignment, there are scenarios where compensation percentile deviates from productivity percentile by more than 10 points. Consider reviewing specific scenarios and adjusting the model if needed.';
      case 'Risk Zone':
        return 'FMV concern - significant misalignment detected. The proposed CF model shows scenarios where compensation percentile exceeds productivity percentile by 15 or more points, indicating potential fair market value risk. Strongly recommend adjusting the model before implementation.';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Automated Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Alignment Status:
          </span>
          {getAlignmentBadge(alignmentStatus)}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {getRecommendationText(alignmentStatus)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}





