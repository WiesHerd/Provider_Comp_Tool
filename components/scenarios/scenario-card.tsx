'use client';

import { useState } from 'react';
import { ProviderScenario } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import * as Dialog from '@radix-ui/react-dialog';

interface ScenarioCardProps {
  scenario: ProviderScenario;
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const router = useRouter();
  const { deleteScenario, duplicateScenario } = useScenariosStore();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleEdit = () => {
    router.push(`/scenarios/${scenario.id}`);
  };

  const handleDuplicate = () => {
    duplicateScenario(scenario.id);
  };

  const handleDelete = () => {
    deleteScenario(scenario.id);
    setDeleteOpen(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {scenario.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created: {new Date(scenario.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">FTE</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{scenario.fte.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total TCC</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ${(scenario.totalTcc || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {scenario.normalizedTcc && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Normalized TCC</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${scenario.normalizedTcc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
            {scenario.normalizedWrvus && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Normalized wRVUs</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {scenario.normalizedWrvus.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>

          {scenario.computedPercentiles && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Percentiles</div>
              <div className="flex flex-wrap gap-2">
                {scenario.computedPercentiles.tccPercentile !== undefined && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    TCC: {scenario.computedPercentiles.tccPercentile.toFixed(1)}th
                  </span>
                )}
                {scenario.computedPercentiles.wrvuPercentile !== undefined && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    wRVU: {scenario.computedPercentiles.wrvuPercentile.toFixed(1)}th
                  </span>
                )}
                {scenario.computedPercentiles.cfPercentile !== undefined && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    CF: {scenario.computedPercentiles.cfPercentile.toFixed(1)}th
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-1" />
              View / Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicate} className="flex-1">
              <Copy className="w-4 h-4 mr-1" />
              Duplicate
            </Button>
            <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
              <Dialog.Trigger asChild>
                <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </Dialog.Trigger>
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
                    <Button onClick={handleDelete} variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700">
                      Delete
                    </Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

