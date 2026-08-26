import React, { useState, useEffect, useRef } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, Filter, Check } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Badge } from './Badge';
import { Button } from './Button';

export interface FilterState {
  statuses: string[];
  groupBy: string;
  startDate: string;
  endDate: string;
  quickFilter: string;
}

interface SearchFilterBarProps {
  placeholder?: string;
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: FilterState) => void;
  availableStatuses?: string[];
  groupByOptions?: { label: string; value: string }[];
}

const DEFAULT_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid', 'Active', 'Inactive'];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  placeholder = 'Search by name, SKU code, category, supplier...',
  onSearchChange,
  onFilterChange,
  availableStatuses = DEFAULT_STATUSES,
  groupByOptions = [
    { label: 'None', value: '' },
    { label: 'Status', value: 'status' },
    { label: 'Department', value: 'department' },
    { label: 'Category', value: 'category' },
  ],
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const activeFilterCount =
    (quickFilter !== 'all' ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0) +
    (groupBy ? 1 : 0) +
    (startDate || endDate ? 1 : 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickFilterSelect = (filter: string) => {
    setQuickFilter(filter);
    onFilterChange({
      statuses: selectedStatuses,
      groupBy,
      startDate,
      endDate,
      quickFilter: filter,
    });
  };

  const handleStatusToggle = (status: string) => {
    const updated = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    setSelectedStatuses(updated);
    onFilterChange({
      statuses: updated,
      groupBy,
      startDate,
      endDate,
      quickFilter,
    });
  };

  const applyFilters = () => {
    onFilterChange({
      statuses: selectedStatuses,
      groupBy,
      startDate,
      endDate,
      quickFilter,
    });
    setIsPopoverOpen(false);
  };

  const clearAllFilters = () => {
    setQuickFilter('all');
    setSelectedStatuses([]);
    setGroupBy('');
    setStartDate('');
    setEndDate('');
    onFilterChange({
      statuses: [],
      groupBy: '',
      startDate: '',
      endDate: '',
      quickFilter: 'all',
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Main Search Input & Filter Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
        {/* Multi-field search input */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-sm"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue('')}
              className="absolute right-3 p-1 rounded-full text-muted hover:text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Clean Filter Popover Button */}
        <div className="relative" ref={popoverRef}>
          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            shape="pill"
            size="md"
            onClick={() => setIsPopoverOpen(prev => !prev)}
            className={`flex items-center gap-2 ${
              activeFilterCount > 0 ? 'ring-2 ring-primary/30 font-semibold' : ''
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter Options</span>
            {activeFilterCount > 0 && (
              <Badge variant="info" className="ml-0.5 px-1.5 py-0.2 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
          </Button>

          {/* Clean, Readable Dropdown Panel ("ពេល dropអោយងាមើល") */}
          {isPopoverOpen && (
            <div className="absolute right-0 mt-2 w-88 bg-surface border border-border rounded-2xl shadow-xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Filter Records</h3>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Status & Categories Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">
                  Category / Group Filter
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {availableStatuses.map(status => {
                    const isChecked = selectedStatuses.includes(status);
                    return (
                      <label
                        key={status}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                            : 'border-border bg-background text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleStatusToggle(status)}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span className="truncate">{status}</span>
                        </div>
                        {isChecked && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Group By Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">
                  Group Records By
                </label>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {groupByOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Created Date Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted block mb-0.5">From Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block mb-0.5">To Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={applyFilters}>
                  Apply Filter
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Clean Quick Filter Chips without emojis */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-muted font-medium flex-shrink-0">Filter By:</span>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('all')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors flex-shrink-0 ${
            quickFilter === 'all'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          All Items
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('active')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors flex-shrink-0 ${
            quickFilter === 'active'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Active Only
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('rx')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors flex-shrink-0 ${
            quickFilter === 'rx'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Rx Controlled
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('lowStock')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors flex-shrink-0 ${
            quickFilter === 'lowStock'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Low Stock Alert
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('inactive')}
          className={`px-3 py-1 rounded-full font-semibold transition-colors flex-shrink-0 ${
            quickFilter === 'inactive'
              ? 'bg-neutral-700 text-white shadow-xs'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Inactive
        </button>
      </div>
    </div>
  );
};
