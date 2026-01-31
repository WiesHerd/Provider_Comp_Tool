import { create } from 'zustand';
import { SavedCFModel } from '@/types/cf-models';
import { loadCFModels, saveCFModels } from '@/lib/utils/storageClient';

interface CFModelsState {
  models: SavedCFModel[];
  activeModelId: string | null;
  loadModels: () => void;
  addModel: (model: SavedCFModel) => void;
  updateModel: (id: string, updates: Partial<SavedCFModel>) => void;
  deleteModel: (id: string) => void;
  duplicateModel: (id: string) => void;
  getModel: (id: string) => SavedCFModel | null;
  setActiveModel: (id: string | null) => void;
  getAllModels: () => SavedCFModel[];
}

export const useCFModelsStore = create<CFModelsState>()((set, get) => ({
  models: [],
  activeModelId: null,

  loadModels: async () => {
    const models = await loadCFModels();
    set({ models });
  },

  addModel: async (model: SavedCFModel) => {
    const currentModels = get().models;
    const existingIndex = currentModels.findIndex(m => m.id === model.id);

    let updatedModels: SavedCFModel[];
    if (existingIndex >= 0) {
      updatedModels = [...currentModels];
      updatedModels[existingIndex] = model;
    } else {
      updatedModels = [...currentModels, model];
    }

    set({ models: updatedModels });
    // Save to storage (async, fire and forget)
    void saveCFModels(updatedModels);
  },

  updateModel: async (id: string, updates: Partial<SavedCFModel>) => {
    const model = get().getModel(id);
    if (!model) return;

    const updated: SavedCFModel = {
      ...model,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await get().addModel(updated);
  },

  deleteModel: async (id: string) => {
    const currentModels = get().models;
    const filteredModels = currentModels.filter(m => m.id !== id);
    
    set({ models: filteredModels });
    // Save to storage (async, fire and forget)
    void saveCFModels(filteredModels);

    // Clear active model if it was deleted
    if (get().activeModelId === id) {
      set({ activeModelId: null });
    }
  },

  duplicateModel: async (id: string) => {
    const model = get().getModel(id);
    if (!model) return;

    const duplicated: SavedCFModel = {
      ...model,
      id: `cf-model-${Date.now()}`,
      name: `${model.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await get().addModel(duplicated);
  },

  getModel: (id: string) => {
    return get().models.find(m => m.id === id) || null;
  },

  setActiveModel: (id: string | null) => {
    set({ activeModelId: id });
  },

  getAllModels: () => {
    return get().models;
  },
}));
