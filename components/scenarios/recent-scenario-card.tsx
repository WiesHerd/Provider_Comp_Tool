'use client';

import { useState } from 'react';
import { ProviderScenario } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash2, X, Clock, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { getScenarioNavigationUrl, getScenarioTypeLabel } from '@/lib/utils/scenario-routing';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

// Type assertion for React 19 compatibility
const DropdownMenuRoot = DropdownMenuPrimitive.Root as any;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger as any;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal as any;
const DropdownMenuContent = DropdownMenuPrimitive.Content as any;
const DropdownMenuItem = DropdownMenuPrimitive.Item as any;
const DropdownMenuSeparator = DropdownMenuPrimitive.Separator as any;
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface RecentScenarioCardProps {
  scenario: ProviderScenario;
  onDismiss?: () => void;
}

/**
 * Formats a date to relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return new Date(dateString).toLocaleDateString();
  }
}

export function RecentScenarioCard({ scenario, onDismiss }: RecentScenarioCardProps) {
  const router = useRouter();
  const { deleteScenario, duplicateScenario, dismissFromRecent } = useScenariosStore();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleNavigate = () => {
    const url = getScenarioNavigationUrl(scenario.id, scenario.scenarioType);
    router.push(url);
  };

  const handleEdit = () => {
    router.push(`/scenarios/${scenario.id}`);
  };

  const handleDuplicate = () => {
    duplicateScenario(scenario.id);
  };

  const handleDismiss = () => {
    dismissFromRecent(scenario.id);
    setDismissOpen(false);
    onDismiss?.();
  };

  const handleDelete = () => {
    deleteScenario(scenario.id);
    setDeleteOpen(false);
    onDismiss?.();
  };

  const toolLabel = getScenarioTypeLabel(scenario.scenarioType);
  const relativeTime = formatRelativeTime(scenario.updatedAt || scenario.createdAt);

  // Get key metrics to display
  const hasTcc = scenario.normalizedTcc !== undefined && scenario.normalizedTcc > 0;
  const hasWrvus = scenario.normalizedWrvus !== undefined && scenario.normalizedWrvus > 0;
  const hasPercentiles = scenario.computedPercentiles && (
    scenario.computedPercentiles.tccPercentile !== undefined ||
    scenario.computedPercentiles.wrvuPercentile !== undefined ||
    scenario.computedPercentiles.cfPercentile !== undefined
  );

  return (
    <>
      <Card 
        className={cn(
          "group relative transition-all duration-300 cursor-pointer",
          "hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
          "border border-gray-200 dark:border-gray-800",
          "bg-white dark:bg-gray-900",
          "active:scale-[0.998] touch-manipulation",
          "overflow-hidden"
        )}
        onClick={handleNavigate}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4 sm:p-5">
          {/* Mobile-first vertical layout, horizontal on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Left section: Title, tool label, metrics */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header: Title and Dismiss button */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex-1 leading-tight">
                  {scenario.name}
                </h3>
                {/* Dismiss button - always visible on mobile, hover on desktop */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissOpen(true);
                  }}
                  className={cn(
                    "shrink-0 w-8 h-8 sm:w-7 sm:h-7 rounded-md flex items-center justify-center",
                    "transition-all duration-200",
                    "sm:opacity-0 sm:group-hover:opacity-100",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
                    "touch-manipulation"
                  )}
                  aria-label="Dismiss from recent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tool label */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {toolLabel}
              </div>

              {/* Metrics grid - 2 columns on mobile, inline on desktop */}
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-4 gap-2 sm:gap-0">
                {hasTcc && (
                  <div className="sm:flex sm:items-center sm:gap-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">TCC:</span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      ${scenario.normalizedTcc!.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
                {hasWrvus && (
                  <div className="sm:flex sm:items-center sm:gap-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">wRVUs:</span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      {scenario.normalizedWrvus!.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Percentile badges */}
              {hasPercentiles && scenario.computedPercentiles && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {scenario.computedPercentiles.tccPercentile !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      TCC: {scenario.computedPercentiles.tccPercentile.toFixed(1)}th
                    </span>
                  )}
                  {scenario.computedPercentiles.wrvuPercentile !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      wRVU: {scenario.computedPercentiles.wrvuPercentile.toFixed(1)}th
                    </span>
                  )}
                  {scenario.computedPercentiles.cfPercentile !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      CF: {scenario.computedPercentiles.cfPercentile.toFixed(1)}th
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right section: Timestamp and Actions */}
            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-3 sm:gap-2 sm:min-w-[140px]">
              {/* Timestamp */}
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {relativeTime}
              </span>
              
              {/* Actions - always visible on mobile, hover on desktop */}
              <div 
                className={cn(
                  "flex items-center gap-2",
                  "sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:duration-200"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-9 sm:h-8 px-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation"
                >
                  <Edit className="w-4 h-4 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                  <span className="sm:inline">Edit</span>
                </Button>
                
                <DropdownMenuRoot>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent
                      className="min-w-[180px] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-1 z-50"
                      align="end"
                      sideOffset={5}
                    >
                      <DropdownMenuItem
                        className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 outline-none"
                        onClick={handleDuplicate}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                      <DropdownMenuItem
                        className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-md cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 outline-none"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenuRoot>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dismiss Confirmation Dialog */}
      <Dialog.Root open={dismissOpen} onOpenChange={setDismissOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Dismiss from Recent</Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Remove &quot;{scenario.name}&quot; from Recent Scenarios? It will still be available in your full scenarios list.
            </Dialog.Description>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </Dialog.Close>
              <Button onClick={handleDismiss} variant="outline" className="w-full sm:w-auto">
                Dismiss
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Delete Scenario</Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete &quot;{scenario.name}&quot;? This action cannot be undone.
            </Dialog.Description>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </Dialog.Close>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="w-full sm:w-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

