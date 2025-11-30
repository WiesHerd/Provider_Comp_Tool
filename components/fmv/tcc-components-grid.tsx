'use client';

import { useState } from 'react';
import { TCCComponent, TCCComponentType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Plus, Trash2, Tag, DollarSign } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TCC_COMPONENT_TYPES: TCCComponentType[] = [
  'Base Salary',
  'Quality Incentive',
  'Productivity Incentive',
  'Call Pay',
  'Admin Stipend',
  'Other',
  'Custom',
];

interface TCCComponentsGridProps {
  components: TCCComponent[];
  onComponentsChange: (components: TCCComponent[]) => void;
}

export function TCCComponentsGrid({ components, onComponentsChange }: TCCComponentsGridProps) {
  // Find base pay component
  const basePayComponent = components.find(c => c.type === 'Base Salary');
  const basePayAmount = basePayComponent?.amount || 0;

  // Track raw input strings for percentage inputs to allow decimal entry
  const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>({});
  
  // Get display value for percentage input
  const getPercentageDisplayValue = (component: TCCComponent): string => {
    // If we have a stored input value, use it
    if (component.id in percentageInputs) {
      return percentageInputs[component.id];
    }
    // Otherwise, use the component's percentage value
    if (component.percentage !== undefined && component.percentage !== 0) {
      return component.percentage.toString();
    }
    return '';
  };

  const addComponent = () => {
    // Check if Base Salary already exists
    const hasBaseSalary = components.some(c => c.type === 'Base Salary');
    const defaultType = hasBaseSalary ? 'Other' : 'Base Salary';
    
    const newComponent: TCCComponent = {
      id: `component-${Date.now()}`,
      label: '',
      type: defaultType,
      calculationMethod: 'fixed',
      amount: 0,
      fixedAmount: 0,
    };
    onComponentsChange([...components, newComponent]);
  };

  const removeComponent = (id: string) => {
    // Always keep at least one component
    if (components.length > 1) {
      onComponentsChange(components.filter(c => c.id !== id));
    }
  };

  const updateComponent = (id: string, updates: Partial<TCCComponent>) => {
    const updatedComponents = components.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        
        // Calculate amount based on method
        if (updated.calculationMethod === 'percentage' && updated.percentage !== undefined) {
          updated.amount = (basePayAmount * updated.percentage) / 100;
        } else if (updated.calculationMethod === 'fixed' && updated.fixedAmount !== undefined) {
          updated.amount = updated.fixedAmount;
        }
        
        return updated;
      }
      return c;
    });
    
    // Recalculate all percentage-based components when base pay changes
    const recalculatedComponents = updatedComponents.map(c => {
      if (c.calculationMethod === 'percentage' && c.percentage !== undefined && c.type !== 'Base Salary') {
        const currentBasePay = updatedComponents.find(b => b.type === 'Base Salary')?.amount || 0;
        return { ...c, amount: (currentBasePay * c.percentage) / 100 };
      }
      return c;
    });
    
    onComponentsChange(recalculatedComponents);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Compensation Components</h3>
        <Button onClick={addComponent} size="sm" variant="outline" className="gap-1.5 h-8">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

      {/* Single container with all components */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        {components.map((component, index) => (
          <div key={component.id} className="relative">
            {/* Subtle divider between components */}
            {index > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800" />
            )}
            
            <div className="p-4">
              {/* Grid layout for consistent alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Column 1: Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Type</label>
                  {component.type === 'Custom' ? (
                    <Input
                      value={component.label || ''}
                      onChange={(e) => {
                        const customType = e.target.value;
                        updateComponent(component.id, {
                          type: 'Custom',
                          label: customType
                        });
                      }}
                      placeholder="Enter custom type"
                      icon={<Tag className="w-4 h-4" />}
                      className="h-9"
                    />
                  ) : (
                    <Select
                      value={component.type}
                      onValueChange={(value) => {
                        if (value === 'Custom') {
                          updateComponent(component.id, { type: 'Custom', label: '' });
                        } else {
                          updateComponent(component.id, { type: value as TCCComponentType });
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TCC_COMPONENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Column 2: Label (hidden for Custom type) */}
                {component.type !== 'Custom' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Label</label>
                    <Input
                      value={component.label}
                      onChange={(e) => updateComponent(component.id, { label: e.target.value })}
                      placeholder="Optional"
                      icon={<Tag className="w-4 h-4" />}
                      className="h-9"
                    />
                  </div>
                ) : (
                  <div></div>
                )}
              </div>

              {/* Second row: Method and Amount inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 mt-4 items-start">
                {/* Method column (only for non-base-salary) */}
                {component.type !== 'Base Salary' ? (
                  <div className="w-40 space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Method</label>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant={(component.calculationMethod || 'fixed') === 'fixed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setPercentageInputs(prev => {
                            const updated = { ...prev };
                            delete updated[component.id];
                            return updated;
                          });
                          updateComponent(component.id, { 
                            calculationMethod: 'fixed',
                            fixedAmount: component.fixedAmount || component.amount || 0,
                            percentage: component.percentage || 0,
                          });
                        }}
                        className="flex-1 h-9 text-xs"
                      >
                        Amount
                      </Button>
                      <Button
                        type="button"
                        variant={component.calculationMethod === 'percentage' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          updateComponent(component.id, { 
                            calculationMethod: 'percentage',
                            percentage: component.percentage || 0,
                            fixedAmount: component.fixedAmount || 0,
                          });
                        }}
                        className="flex-1 h-9 text-xs"
                      >
                        <span className="hidden sm:inline">% Base</span>
                        <span className="sm:hidden">%</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div></div>
                )}

                {/* Amount column */}
                <div>
                  {component.type === 'Base Salary' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Annual Amount</label>
                      <CurrencyInput
                        value={component.amount}
                        onChange={(value) => updateComponent(component.id, { 
                          amount: value,
                          fixedAmount: value,
                          calculationMethod: 'fixed',
                        })}
                        className="h-9"
                      />
                    </div>
                  ) : component.calculationMethod === 'percentage' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                          Percentage of Base Pay
                        </label>
                        <div className="relative">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={getPercentageDisplayValue(component)}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              setPercentageInputs(prev => ({ ...prev, [component.id]: inputValue }));
                              if (inputValue === '') {
                                updateComponent(component.id, { percentage: 0 });
                                return;
                              }
                              if (inputValue === '.') {
                                return;
                              }
                              const cleaned = inputValue.replace(/[^0-9.]/g, '');
                              const parts = cleaned.split('.');
                              if (parts.length > 2) {
                                return;
                              }
                              if (parts.length === 2 && parts[1].length > 4) {
                                return;
                              }
                              const numValue = parseFloat(cleaned);
                              if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
                                updateComponent(component.id, { percentage: numValue });
                              }
                            }}
                            onBlur={(e) => {
                              const inputValue = e.target.value.trim();
                              if (inputValue === '' || inputValue === '.') {
                                if (component.percentage === 0 || component.percentage === undefined) {
                                  setPercentageInputs(prev => {
                                    const updated = { ...prev };
                                    delete updated[component.id];
                                    return updated;
                                  });
                                } else {
                                  setPercentageInputs(prev => ({ ...prev, [component.id]: component.percentage!.toString() }));
                                }
                                return;
                              }
                              const numValue = parseFloat(inputValue);
                              if (!isNaN(numValue) && numValue >= 0) {
                                const formatted = numValue % 1 === 0 ? numValue.toString() : numValue.toString();
                                setPercentageInputs(prev => ({ ...prev, [component.id]: formatted }));
                              } else {
                                if (component.percentage !== undefined && component.percentage !== 0) {
                                  setPercentageInputs(prev => ({ ...prev, [component.id]: component.percentage!.toString() }));
                                } else {
                                  setPercentageInputs(prev => {
                                    const updated = { ...prev };
                                    delete updated[component.id];
                                    return updated;
                                  });
                                }
                              }
                            }}
                            placeholder="0.00"
                            className="pr-8 h-9"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">%</span>
                        </div>
                        {basePayAmount === 0 && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Add Base Salary first to calculate percentage
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Annual Amount</label>
                        <CurrencyInput
                          value={component.amount || 0}
                          onChange={() => {}} // Read-only
                          className="h-9"
                          disabled
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Annual Amount</label>
                      <CurrencyInput
                        value={component.fixedAmount || component.amount || 0}
                        onChange={(value) => updateComponent(component.id, { 
                          fixedAmount: value,
                          amount: value,
                        })}
                        className="h-9"
                      />
                    </div>
                  )}
                </div>

                {/* Delete button - right side of second row */}
                {components.length > 1 && (
                  <div className="flex items-start pt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(component.id)}
                      className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                      aria-label="Delete component"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Cash Compensation Summary */}
      {components.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg p-4 sm:p-6 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                    Total Cash Compensation
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    {new Intl.NumberFormat('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(
                      components.reduce((sum, component) => sum + (component.amount || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

