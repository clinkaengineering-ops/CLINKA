import { create } from "zustand";

interface LoadingStore {
  isUploading: boolean;
  setUploading: (isUploading: boolean) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isUploading: false,
  setUploading: (isUploading) => set({ isUploading }),
}));
