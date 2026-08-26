import { FilterState } from '@/app/(backoffice)/design-system/components/SearchFilterBar';

/**
 * Universal Filter Records Helper for Pharmacy POS Backoffice Tables & Grids.
 * Filters any record array based on Search, Statuses Checklist, Date Range, and Quick Filters.
 */
export function applyRecordFilters<T extends Record<string, any>>(
  records: T[],
  filters: {
    searchTerm?: string;
    searchFields?: (keyof T | string)[];
    filterState?: Partial<FilterState>;
    statusField?: keyof T | string;
    dateField?: keyof T | string;
    categoryField?: keyof T | string;
    customFilter?: (item: T) => boolean;
  }
): T[] {
  const {
    searchTerm = '',
    searchFields = ['name', 'username', 'code', 'invoiceNumber', 'phone', 'title', 'sku', 'brandName'],
    filterState = {},
    statusField = 'status',
    dateField = 'createdAt',
    categoryField = 'categoryId',
    customFilter,
  } = filters;

  const q = searchTerm.toLowerCase().trim();
  const selectedStatuses = (filterState.statuses || []).map(s => s.toLowerCase().trim());
  const startDate = filterState.startDate ? new Date(filterState.startDate + 'T00:00:00') : null;
  const endDate = filterState.endDate ? new Date(filterState.endDate + 'T23:59:59') : null;
  const quick = filterState.quickFilter || 'all';

  return records.filter(item => {
    // 1. Search Query Multi-field Match
    if (q) {
      const matchesSearch = searchFields.some(field => {
        const val = item[field as string];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
      if (!matchesSearch) return false;
    }

    // 2. Statuses & Categories Checklist Filter
    if (selectedStatuses.length > 0) {
      const rawStatus = item[statusField as string];
      const rawCategory = item[categoryField as string];
      const statusStr = String(rawStatus ?? '').toLowerCase().trim();
      const categoryStr = String(rawCategory ?? '').toLowerCase().trim();

      const matched = selectedStatuses.some(st => {
        return (
          statusStr === st ||
          statusStr.includes(st) ||
          categoryStr === st ||
          categoryStr.includes(st)
        );
      });

      if (!matched) return false;
    }

    // 3. Date Range Filter
    if (startDate || endDate) {
      const rawDate = item[dateField as string] || item['date'] || item['createdAt'] || item['updatedAt'] || item['startsAt'];
      if (rawDate) {
        const itemDate = new Date(rawDate);
        if (!isNaN(itemDate.getTime())) {
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
        }
      }
    }

    // 4. Quick Filter (all, active, inactive, etc.)
    if (quick && quick !== 'all') {
      if (quick === 'active') {
        const isActive = item['active'] ?? item['isActive'] ?? (item['status'] === 'ACTIVE');
        if (isActive === false) return false;
      } else if (quick === 'inactive') {
        const isActive = item['active'] ?? item['isActive'] ?? (item['status'] === 'ACTIVE');
        if (isActive !== false && item['status'] !== 'INACTIVE') return false;
      } else if (quick === 'lowStock') {
        const minStock = Number(item['minStockAlert'] || item['minStock'] || 0);
        const currentStock = Number(item['stock'] || item['currentStock'] || 0);
        if (currentStock > minStock && minStock <= 0) return false;
      } else if (quick === 'rx') {
        if (!item['isControlledSubstance'] && !item['prescriptionRequired']) return false;
      } else {
        const statusVal = String(item[statusField as string] || '').toLowerCase();
        if (statusVal !== quick.toLowerCase()) return false;
      }
    }

    // 5. Custom Page Specific Callback Filter
    if (customFilter && !customFilter(item)) {
      return false;
    }

    return true;
  });
}

export interface RecordGroup<T> {
  key: string;
  label: string;
  items: T[];
  count: number;
}

/**
 * Groups an array of records by a field key or custom resolver function.
 */
export function groupRecordsBy<T extends Record<string, any>>(
  records: T[],
  groupByField: string,
  labelResolver?: (key: string, items: T[]) => string
): RecordGroup<T>[] {
  if (!groupByField) {
    return [{ key: 'all', label: 'All Records', items: records, count: records.length }];
  }

  const map = new Map<string, T[]>();

  records.forEach(item => {
    let rawKey = item[groupByField];
    if (rawKey === undefined || rawKey === null || rawKey === '') {
      rawKey = 'Unassigned / Other';
    } else if (typeof rawKey === 'boolean') {
      rawKey = rawKey ? 'Active' : 'Inactive';
    } else {
      rawKey = String(rawKey);
    }

    const groupList = map.get(rawKey) || [];
    groupList.push(item);
    map.set(rawKey, groupList);
  });

  const groups: RecordGroup<T>[] = [];
  map.forEach((items, key) => {
    const label = labelResolver ? labelResolver(key, items) : key;
    groups.push({
      key,
      label,
      items,
      count: items.length,
    });
  });

  return groups.sort((a, b) => b.count - a.count);
}

