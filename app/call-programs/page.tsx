'use client';

import React, { useEffect } from 'react';
import { ShiftTypeList } from '@/components/call-programs/shift-type-list';
import { CallProgramList } from '@/components/call-programs/call-program-list';
import { useProgramCatalogStore } from '@/lib/store/program-catalog-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CallProgramsPage() {
  const router = useRouter();
  const { loadInitialData } = useProgramCatalogStore();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-5xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="min-h-[44px] touch-target"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Call Program Catalog
          </h1>
        </div>

        {/* Tabs for Shift Types and Programs */}
        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="programs">Call Programs</TabsTrigger>
            <TabsTrigger value="shift-types">Shift Types</TabsTrigger>
          </TabsList>
          
          <TabsContent value="programs" className="space-y-6">
            <CallProgramList />
          </TabsContent>
          
          <TabsContent value="shift-types" className="space-y-6">
            <ShiftTypeList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



