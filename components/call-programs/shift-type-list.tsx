'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useProgramCatalogStore } from '@/lib/store/program-catalog-store';
import { ShiftType, CoverageType } from '@/types/call-program';
import * as Dialog from '@radix-ui/react-dialog';

const COVERAGE_TYPES: CoverageType[] = ['In-house', 'Home call', 'Hybrid', 'Tele-call'];

export function ShiftTypeList() {
  const { shiftTypes, addShiftType, updateShiftType, deleteShiftType, loadInitialData } = useProgramCatalogStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null);
  const [formData, setFormData] = useState<Partial<ShiftType>>({
    name: '',
    code: '',
    coverageType: 'In-house',
    startTime: '17:00',
    endTime: '07:00',
    isWeekendEligible: false,
    isHolidayEligible: true,
    countsTowardBurden: true,
    isBackupShift: false,
  });

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleOpenDialog = (shiftType?: ShiftType) => {
    if (shiftType) {
      setEditingShiftType(shiftType);
      setFormData(shiftType);
    } else {
      setEditingShiftType(null);
      setFormData({
        name: '',
        code: '',
        coverageType: 'In-house',
        startTime: '17:00',
        endTime: '07:00',
        isWeekendEligible: false,
        isHolidayEligible: true,
        countsTowardBurden: true,
        isBackupShift: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingShiftType(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.coverageType || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingShiftType) {
      updateShiftType(editingShiftType.id, formData);
    } else {
      const newShiftType: ShiftType = {
        id: `shift-${Date.now()}`,
        name: formData.name!,
        code: formData.code!,
        coverageType: formData.coverageType!,
        startTime: formData.startTime!,
        endTime: formData.endTime!,
        isWeekendEligible: formData.isWeekendEligible ?? false,
        isHolidayEligible: formData.isHolidayEligible ?? true,
        countsTowardBurden: formData.countsTowardBurden ?? true,
        isBackupShift: formData.isBackupShift ?? false,
      };
      addShiftType(newShiftType);
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this shift type?')) {
      deleteShiftType(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Shift Types</CardTitle>
          <Button onClick={() => handleOpenDialog()} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Shift Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {shiftTypes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No shift types defined. Click &quot;Add Shift Type&quot; to create one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Coverage</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Time</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Weekend</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Holiday</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Burden</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">Backup</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shiftTypes.map((shiftType) => (
                  <tr key={shiftType.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">{shiftType.name}</td>
                    <td className="py-3 px-4 font-mono text-sm">{shiftType.code}</td>
                    <td className="py-3 px-4">{shiftType.coverageType}</td>
                    <td className="py-3 px-4 text-sm">
                      {shiftType.startTime}–{shiftType.endTime}
                    </td>
                    <td className="text-center py-3 px-4">
                      {shiftType.isWeekendEligible ? '✓' : '—'}
                    </td>
                    <td className="text-center py-3 px-4">
                      {shiftType.isHolidayEligible ? '✓' : '—'}
                    </td>
                    <td className="text-center py-3 px-4">
                      {shiftType.countsTowardBurden ? '✓' : '—'}
                    </td>
                    <td className="text-center py-3 px-4">
                      {shiftType.isBackupShift ? '✓' : '—'}
                    </td>
                    <td className="text-right py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(shiftType)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(shiftType.id)}
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
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 z-50 border border-gray-200 dark:border-gray-700 w-[calc(100vw-2rem)] sm:w-96 max-w-md max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold mb-4">
              {editingShiftType ? 'Edit Shift Type' : 'Create Shift Type'}
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weeknight In-house 5p–7a"
                />
              </div>
              
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WNIH"
                  maxLength={10}
                />
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    value={formData.endTime || ''}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="07:00 or 24h"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekendEligible">Weekend Eligible</Label>
                  <Switch
                    id="weekendEligible"
                    checked={formData.isWeekendEligible ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isWeekendEligible: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="holidayEligible">Holiday Eligible</Label>
                  <Switch
                    id="holidayEligible"
                    checked={formData.isHolidayEligible ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, isHolidayEligible: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="countsTowardBurden">Counts Toward Burden</Label>
                  <Switch
                    id="countsTowardBurden"
                    checked={formData.countsTowardBurden ?? true}
                    onCheckedChange={(checked) => setFormData({ ...formData, countsTowardBurden: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="isBackupShift">Backup/Jeopardy Shift</Label>
                  <Switch
                    id="isBackupShift"
                    checked={formData.isBackupShift ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isBackupShift: checked })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingShiftType ? 'Update' : 'Create'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}

