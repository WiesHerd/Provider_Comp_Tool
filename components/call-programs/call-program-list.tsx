'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';
import { Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useProgramCatalogStore } from '@/lib/store/program-catalog-store';
import { useUserPreferencesStore } from '@/lib/store/user-preferences-store';
import { CallProgram, CoverageType } from '@/types/call-program';
import { CallAssumptions } from '@/types/call-pay-engine';
import * as Dialog from '@radix-ui/react-dialog';
import { Specialty } from '@/types/call-pay';
import { cn } from '@/lib/utils/cn';

const COVERAGE_TYPES: CoverageType[] = ['In-house', 'Home call', 'Hybrid', 'Tele-call'];

// Common specialties from existing types
const SPECIALTIES: Specialty[] = [
  'Family Medicine',
  'Internal Medicine',
  'Hospitalist',
  'Pediatrics',
  'Anesthesiology',
  'General Surgery',
  'Orthopedic Surgery',
  'Neurosurgery',
  'Trauma Surgery',
  'Cardiothoracic Surgery',
  'Vascular Surgery',
  'Urology',
  'OB/GYN',
  'ENT (Otolaryngology)',
  'Ophthalmology',
  'Cardiology',
  'Critical Care',
  'Emergency Medicine',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Pulmonology',
  'Radiology',
  'Psychiatry',
  'Pathology',
  'Other',
];

export function CallProgramList() {
  const {
    programs,
    shiftTypes,
    addProgram,
    updateProgram,
    deleteProgram,
    loadInitialData,
  } = useProgramCatalogStore();
  const { activeProgramId, setActiveProgram } = useUserPreferencesStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CallProgram | null>(null);
  const [formData, setFormData] = useState<Partial<CallProgram>>({
    name: '',
    specialty: '',
    serviceLine: '',
    site: '',
    modelYear: new Date().getFullYear(),
    coverageType: 'In-house',
    shiftTypeIds: [],
    defaultAssumptions: {
      weekdayCallsPerMonth: 8,
      weekendCallsPerMonth: 4,
      holidaysPerYear: 12,
    },
  });

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleOpenDialog = (program?: CallProgram) => {
    if (program) {
      setEditingProgram(program);
      setFormData(program);
    } else {
      setEditingProgram(null);
      setFormData({
        name: '',
        specialty: '',
        serviceLine: '',
        site: '',
        modelYear: new Date().getFullYear(),
        coverageType: 'In-house',
        shiftTypeIds: [],
        defaultAssumptions: {
          weekdayCallsPerMonth: 8,
          weekendCallsPerMonth: 4,
          holidaysPerYear: 12,
        },
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProgram(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.specialty || !formData.coverageType) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingProgram) {
      updateProgram(editingProgram.id, formData);
    } else {
      const newProgram: CallProgram = {
        id: `program-${Date.now()}`,
        name: formData.name!,
        specialty: formData.specialty!,
        serviceLine: formData.serviceLine,
        site: formData.site,
        modelYear: formData.modelYear!,
        coverageType: formData.coverageType!,
        shiftTypeIds: formData.shiftTypeIds || [],
        defaultAssumptions: formData.defaultAssumptions!,
      };
      addProgram(newProgram);
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this program?')) {
      deleteProgram(id);
    }
  };

  const handleSetActive = (id: string) => {
    setActiveProgram(id);
  };

  const toggleShiftType = (shiftTypeId: string) => {
    const currentIds = formData.shiftTypeIds || [];
    const newIds = currentIds.includes(shiftTypeId)
      ? currentIds.filter(id => id !== shiftTypeId)
      : [...currentIds, shiftTypeId];
    setFormData({ ...formData, shiftTypeIds: newIds });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Call Programs</CardTitle>
          <Button onClick={() => handleOpenDialog()} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {programs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No call programs defined. Click &quot;Add Program&quot; to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Program Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Specialty</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Site</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Year</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Coverage</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Shift Types</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr
                    key={program.id}
                    className={cn(
                      "border-b border-gray-100 dark:border-gray-800",
                      activeProgramId === program.id && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {program.name}
                        {activeProgramId === program.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{program.specialty}</td>
                    <td className="py-3 px-4">{program.site || '—'}</td>
                    <td className="py-3 px-4">{program.modelYear}</td>
                    <td className="py-3 px-4">{program.coverageType}</td>
                    <td className="py-3 px-4 text-sm">
                      {program.shiftTypeIds.length > 0
                        ? program.shiftTypeIds.length + ' shift type(s)'
                        : 'None'}
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {activeProgramId !== program.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActive(program.id)}
                          >
                            Set Active
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(program)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(program.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 z-50 border border-gray-200 dark:border-gray-700 w-[calc(100vw-2rem)] sm:w-[600px] max-w-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">
              {editingProgram ? 'Edit Call Program' : 'Create Call Program'}
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pediatric Cardiology Call"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Select
                    value={formData.specialty || ''}
                    onValueChange={(value) => setFormData({ ...formData, specialty: value as Specialty })}
                  >
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="modelYear">Model Year *</Label>
                  <NumberInput
                    id="modelYear"
                    value={formData.modelYear || new Date().getFullYear()}
                    onChange={(value) => setFormData({ ...formData, modelYear: value })}
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceLine">Service Line</Label>
                  <Input
                    id="serviceLine"
                    value={formData.serviceLine || ''}
                    onChange={(e) => setFormData({ ...formData, serviceLine: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    value={formData.site || ''}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    placeholder="e.g., Main Campus"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="coverageType">Coverage Type *</Label>
                <Select
                  value={formData.coverageType || 'In-house'}
                  onValueChange={(value) => setFormData({ ...formData, coverageType: value as CoverageType })}
                >
                  <SelectTrigger id="coverageType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COVERAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Shift Types</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {shiftTypes.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No shift types available. Create shift types first.
                    </p>
                  ) : (
                    shiftTypes.map((shiftType) => (
                      <div key={shiftType.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`shift-${shiftType.id}`}
                          checked={(formData.shiftTypeIds || []).includes(shiftType.id)}
                          onChange={() => toggleShiftType(shiftType.id)}
                          className="rounded"
                        />
                        <label
                          htmlFor={`shift-${shiftType.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {shiftType.name} ({shiftType.code})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Default Assumptions</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="weekdayCalls" className="text-xs">Weekday Calls/Month</Label>
                    <NumberInput
                      id="weekdayCalls"
                      value={formData.defaultAssumptions?.weekdayCallsPerMonth || 8}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          defaultAssumptions: {
                            ...formData.defaultAssumptions!,
                            weekdayCallsPerMonth: value,
                          },
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekendCalls" className="text-xs">Weekend Calls/Month</Label>
                    <NumberInput
                      id="weekendCalls"
                      value={formData.defaultAssumptions?.weekendCallsPerMonth || 4}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          defaultAssumptions: {
                            ...formData.defaultAssumptions!,
                            weekendCallsPerMonth: value,
                          },
                        })
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="holidays" className="text-xs">Holidays/Year</Label>
                    <NumberInput
                      id="holidays"
                      value={formData.defaultAssumptions?.holidaysPerYear || 12}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          defaultAssumptions: {
                            ...formData.defaultAssumptions!,
                            holidaysPerYear: value,
                          },
                        })
                      }
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingProgram ? 'Update' : 'Create'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}

