'use client';

import { useState, useEffect } from 'react';
import { TCCComponent, TCCComponentType, TCCCalculationMethod, FTE } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { Plus, Trash2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

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

  const totalTcc = components.reduce((sum, c) => {
    // Calculate amount on the fly for percentage-based components
    if (c.calculationMethod === 'percentage' && c.percentage !== undefined && c.type !== 'Base Salary') {
      return sum + (basePayAmount * c.percentage) / 100;
    }
    return sum + (c.amount || 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">TCC Components</h3>
        <Button onClick={addComponent} size="sm" variant="default" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Component
        </Button>
      </div>

      <div className="space-y-4">
        {components.map((component) => (
          <Card key={component.id} variant="default" className="relative">
            <CardContent className="p-4 md:p-6">
              {/* Row 1: Type + Label + Delete Button */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Type</label>
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
                            icon={<Tag className="w-5 h-5" />}
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
                      <SelectTrigger>
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

                {component.type !== 'Custom' && (
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Label</label>
                    <Input
                      value={component.label}
                      onChange={(e) => updateComponent(component.id, { label: e.target.value })}
                      placeholder="Optional"
                      icon={<Tag className="w-5 h-5" />}
                    />
                  </div>
                )}
              </div>

              {/* Delete Button - Top Right */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeComponent(component.id)}
                className="absolute top-4 right-4"
                aria-label="Delete component"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>

              {/* Row 2: Method + Amount */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Calculation Method Selector - only show for non-base-salary components */}
                {component.type !== 'Base Salary' && (
                  <div className="sm:w-48">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Method</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={(component.calculationMethod || 'fixed') === 'fixed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          // Clear local input state when switching away from percentage
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
                        className="flex-1"
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
                        className="flex-1"
                      >
                        <span className="hidden sm:inline">% Base</span>
                        <span className="sm:hidden">%</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Amount Input - varies based on calculation method */}
                <div className="flex-1">
                  {component.type === 'Base Salary' ? (
                    <>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Annual Amount</label>
                      <CurrencyInput
                        value={component.amount}
                        onChange={(value) => updateComponent(component.id, { 
                          amount: value,
                          fixedAmount: value,
                          calculationMethod: 'fixed',
                        })}
                      />
                    </>
                  ) : component.calculationMethod === 'percentage' ? (
                    <>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Percentage of Base Pay
                        {basePayAmount > 0 && (
                          <span className="text-xs text-gray-500 ml-1 font-normal">
                            (${((basePayAmount * (component.percentage || 0)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={getPercentageDisplayValue(component)}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            
                            // Update local state immediately to show what user is typing
                            setPercentageInputs(prev => ({ ...prev, [component.id]: inputValue }));
                            
                            // Allow empty input
                            if (inputValue === '') {
                              updateComponent(component.id, { percentage: 0 });
                              return;
                            }
                            
                            // Allow just a decimal point (user might be typing "15.")
                            if (inputValue === '.') {
                              return; // Don't update component yet, just show the decimal
                            }
                            
                            // Remove any non-numeric characters except decimal point
                            const cleaned = inputValue.replace(/[^0-9.]/g, '');
                            
                            // Only allow one decimal point
                            const parts = cleaned.split('.');
                            if (parts.length > 2) {
                              return; // Invalid input, don't update
                            }
                            
                            // Allow up to 4 decimal places for precision (e.g., 15.7525%)
                            if (parts.length === 2 && parts[1].length > 4) {
                              return; // Too many decimals, don't update
                            }
                            
                            const numValue = parseFloat(cleaned);
                            if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
                              updateComponent(component.id, { percentage: numValue });
                            }
                          }}
                          onBlur={(e) => {
                            // On blur, preserve the value - format it properly but don't clear it
                            const inputValue = e.target.value.trim();
                            
                            // If empty, keep it as 0 but preserve the display
                            if (inputValue === '' || inputValue === '.') {
                              // Only clear if the component percentage is actually 0
                              if (component.percentage === 0 || component.percentage === undefined) {
                                setPercentageInputs(prev => {
                                  const updated = { ...prev };
                                  delete updated[component.id];
                                  return updated;
                                });
                              } else {
                                // Preserve the component's percentage value
                                setPercentageInputs(prev => ({ ...prev, [component.id]: component.percentage!.toString() }));
                              }
                              return;
                            }
                            
                            // If it's a valid number, preserve it
                            const numValue = parseFloat(inputValue);
                            if (!isNaN(numValue) && numValue >= 0) {
                              // Format the value nicely (remove trailing zeros if whole number)
                              const formatted = numValue % 1 === 0 ? numValue.toString() : numValue.toString();
                              setPercentageInputs(prev => ({ ...prev, [component.id]: formatted }));
                            } else {
                              // Invalid input - restore the component's actual percentage value
                              if (component.percentage !== undefined && component.percentage !== 0) {
                                setPercentageInputs(prev => ({ ...prev, [component.id]: component.percentage!.toString() }));
                              } else {
                                // Clear the local state to show empty
                                setPercentageInputs(prev => {
                                  const updated = { ...prev };
                                  delete updated[component.id];
                                  return updated;
                                });
                              }
                            }
                          }}
                          placeholder="0.00"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">%</span>
                      </div>
                      {basePayAmount === 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Add Base Salary first to calculate percentage
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Annual Amount</label>
                      <CurrencyInput
                        value={component.fixedAmount || component.amount || 0}
                        onChange={(value) => updateComponent(component.id, { 
                          fixedAmount: value,
                          amount: value,
                        })}
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


    </div>
  );
}

