'use client';

import { useState, useEffect } from 'react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, ScenarioType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';

interface ScenarioLoaderProps {
  scenarioType: ScenarioType;
  onLoad: (scenario: ProviderScenario) => void;
  className?: string;
}

export function ScenarioLoader({ scenarioType, onLoad, className }: ScenarioLoaderProps) {
  const { scenarios, loadScenarios } = useScenariosStore();
  const [selectedId, setSelectedId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    setMounted(true);
    loadScenarios();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload scenarios when scenarioType changes
  useEffect(() => {
    if (mounted) {
      loadScenarios();
    }
  }, [scenarioType, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter scenarios by type
  // Include scenarios that match the type, or legacy scenarios (no type) for 'wrvu-modeler' screen
  const filteredScenarios = scenarios.filter(
    (s) => s.scenarioType === scenarioType || 
          (!s.scenarioType && (scenarioType === 'wrvu-modeler' || scenarioType === 'general'))
  );

  const handleLoad = () => {
    if (!selectedId) return;
    const scenario = scenarios.find((s) => s.id === selectedId);
    if (scenario) {
      onLoad(scenario);
      setSelectedId(''); // Clear selection after loading
    }
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Load Saved Scenario
      </label>
      {filteredScenarios.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No saved scenarios available. Save a scenario to load it here.
        </div>
      ) : (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a scenario..." />
              </SelectTrigger>
              <SelectContent>
                {filteredScenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                    {scenario.providerName && ` - ${scenario.providerName}`}
                    {scenario.specialty && ` (${scenario.specialty})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleLoad}
            disabled={!selectedId}
            variant="outline"
            className="mb-0"
          >
            <Download className="w-4 h-4 mr-1" />
            Load
          </Button>
        </div>
      )}
    </div>
  );
}

