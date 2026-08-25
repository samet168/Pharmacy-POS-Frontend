import { useState, useCallback } from 'react';

export function useSelection<T>(items: T[], getId: (item: T) => string | number) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isCrossPageSelected, setIsCrossPageSelected] = useState(false);

  const toggleSelect = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setIsCrossPageSelected(false);
  }, []);

  const selectAllCurrentPage = useCallback(() => {
    const currentPageIds = items.map(getId);
    setSelectedIds(new Set(currentPageIds));
    setIsCrossPageSelected(false);
  }, [items, getId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsCrossPageSelected(false);
  }, []);

  const selectAllCrossPage = useCallback(() => {
    setIsCrossPageSelected(true);
  }, []);

  const isSelected = useCallback(
    (id: string | number) => selectedIds.has(id) || isCrossPageSelected,
    [selectedIds, isCrossPageSelected]
  );

  const selectedCount = isCrossPageSelected ? 'ALL' : selectedIds.size;
  const isAllCurrentSelected = items.length > 0 && items.every(item => selectedIds.has(getId(item)));

  return {
    selectedIds,
    isCrossPageSelected,
    selectedCount: selectedIds.size,
    isAllCurrentSelected,
    toggleSelect,
    selectAllCurrentPage,
    clearSelection,
    selectAllCrossPage,
    isSelected,
  };
}
