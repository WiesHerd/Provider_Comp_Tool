'use client';

import { useEffect } from 'react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ScenarioCard } from '@/components/scenarios/scenario-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ScenariosPage() {
  const router = useRouter();
  const { scenarios, loadScenarios } = useScenariosStore();

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Saved Scenarios
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your saved compensation scenarios
          </p>
        </div>
        <Button onClick={() => router.push('/fmv-calculator')}>
          <Plus className="w-4 h-4 mr-1" />
          New Scenario
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No scenarios saved yet. Create your first scenario to get started.
          </p>
          <Button onClick={() => router.push('/fmv-calculator')}>
            Create Scenario
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  );
}

