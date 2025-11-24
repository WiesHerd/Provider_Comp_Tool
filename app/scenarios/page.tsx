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
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button onClick={() => router.push('/fmv-calculator')}>
          <Plus className="w-4 h-4 mr-1" />
          New Scenario
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            No scenarios saved yet. Create your first scenario to get started.
          </p>
          <Button onClick={() => router.push('/fmv-calculator')}>
            Create Scenario
          </Button>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6" data-tour="scenarios-list">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  );
}

