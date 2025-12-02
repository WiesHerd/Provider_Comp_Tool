'use client';

import { cn } from '@/lib/utils/cn';
import { Settings, Sliders, BarChart3, GitCompare, CheckCircle2 } from 'lucide-react';

export type CFModelingSection = 'setup' | 'modeling' | 'results' | 'comparison';

interface CFModelingSidebarProps {
  activeSection: CFModelingSection;
  onSectionChange: (section: CFModelingSection) => void;
  completedSections?: Set<CFModelingSection>;
  hasResults?: boolean;
}

interface SidebarItem {
  id: CFModelingSection;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'setup',
    label: 'Setup',
    icon: <Settings className="w-5 h-5" />,
    description: 'Context & Market Data',
  },
  {
    id: 'modeling',
    label: 'Modeling',
    icon: <Sliders className="w-5 h-5" />,
    description: 'CF Configuration',
  },
  {
    id: 'comparison',
    label: 'Comparison',
    icon: <GitCompare className="w-5 h-5" />,
    description: 'Multi-Model Analysis',
  },
  {
    id: 'results',
    label: 'Results',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Analysis & Insights',
  },
];

export function CFModelingSidebar({
  activeSection,
  onSectionChange,
  completedSections = new Set(),
  hasResults = false,
}: CFModelingSidebarProps) {
  return (
    <div className="w-full sm:w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <nav className="p-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = activeSection === item.id;
          const isCompleted = completedSections.has(item.id);
          const isDisabled = item.id === 'results' && !hasResults;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onSectionChange(item.id)}
              disabled={isDisabled}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'text-left',
                isActive
                  ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white'
                  : isDisabled
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
              )}
            >
              <span className={cn(
                'flex-shrink-0',
                isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
              )}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {isCompleted && !isActive && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                </div>
                {item.description && (
                  <div className={cn(
                    'text-xs mt-0.5',
                    isActive
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}





