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

  loadModels: () => {
    const models = loadCFModels();
    set({ models });
  },

  addModel: (model: SavedCFModel) => {
    const models = loadCFModels();
    const existingIndex = models.findIndex(m => m.id === model.id);

    if (existingIndex >= 0) {
      models[existingIndex] = model;
    } else {
      models.push(model);
    }

    saveCFModels(models);
    set({ models });
  },

  updateModel: (id: string, updates: Partial<SavedCFModel>) => {
    const model = get().getModel(id);
    if (!model) return;

    const updated: SavedCFModel = {
      ...model,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    get().addModel(updated);
  },

  deleteModel: (id: string) => {
    const models = loadCFModels().filter(m => m.id !== id);
    saveCFModels(models);
    set({ models });

    // Clear active model if it was deleted
    if (get().activeModelId === id) {
      set({ activeModelId: null });
    }
  },

  duplicateModel: (id: string) => {
    const model = get().getModel(id);
    if (!model) return;

    const duplicated: SavedCFModel = {
      ...model,
      id: `cf-model-${Date.now()}`,
      name: `${model.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    get().addModel(duplicated);
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




