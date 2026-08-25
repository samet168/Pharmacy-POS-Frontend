export type BulkAction = 'duplicate' | 'deactivate' | 'archive' | 'delete';

export interface SearchConfig<T> {
  searchFields: { id: string; label: string; get: (item: T) => string }[];
  filterSections?: {
    id: string;
    label: string;
    options: { id: string; label: string; test: (item: T) => boolean }[];
  }[];
}

export interface BulkActionsConfig<T> {
  allowed: {
    duplicate?: boolean;
    deactivate?: boolean;
    archive?: boolean;
    delete?: boolean;
  };
  run: (action: BulkAction, items: T[]) => Promise<unknown>;
  confirm?: {
    delete?: { title: string; message: (count: number) => string; confirmLabel?: string };
    archive?: { title: string; message: (count: number) => string; confirmLabel?: string };
  };
}
