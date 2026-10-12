import { useLoadingStore } from './loadingStore';

describe('useLoadingStore', () => {
  it('starts with isUploading false', () => {
    expect(useLoadingStore.getState().isUploading).toBe(false);
  });

  it('updates isUploading flag', () => {
    useLoadingStore.getState().setUploading(true);
    expect(useLoadingStore.getState().isUploading).toBe(true);

    useLoadingStore.getState().setUploading(false);
    expect(useLoadingStore.getState().isUploading).toBe(false);
  });
});
