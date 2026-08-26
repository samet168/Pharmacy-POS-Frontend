import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  Check,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  Tag,
  CheckSquare,
  Square
} from 'lucide-react';
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
  groupByOptions?: { label: string; value: string; icon?: React.ReactNode }[];
}

const DEFAULT_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid', 'Active', 'Inactive'];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  placeholder = 'Search by name, SKU code, category, supplier...',
  onSearchChange,
  onFilterChange,
  availableStatuses = DEFAULT_STATUSES,
  groupByOptions = [
    { label: 'None (Default)', value: '' },
    { label: 'Status', value: 'status' },
    { label: 'Department', value: 'department' },
    { label: 'Category', value: 'category' },
  ],
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [statusSearch, setStatusSearch] = useState('');
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
    (selectedStatuses.length > 0 ? selectedStatuses.length : 0) +
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

  const handleSelectAllStatuses = () => {
    if (selectedStatuses.length === availableStatuses.length) {
      setSelectedStatuses([]);
      onFilterChange({
        statuses: [],
        groupBy,
        startDate,
        endDate,
        quickFilter,
      });
    } else {
      setSelectedStatuses([...availableStatuses]);
      onFilterChange({
        statuses: [...availableStatuses],
        groupBy,
        startDate,
        endDate,
        quickFilter,
      });
    }
  };

  const handleGroupByChange = (val: string) => {
    setGroupBy(val);
    onFilterChange({
      statuses: selectedStatuses,
      groupBy: val,
      startDate,
      endDate,
      quickFilter,
    });
  };

  // Quick Date Range Presets
  const setDatePreset = (preset: 'today' | '7days' | 'thisMonth' | '30days' | 'all') => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    let start = '';
    let end = '';

    if (preset === 'today') {
      start = formatDate(now);
      end = formatDate(now);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      start = formatDate(past);
      end = formatDate(now);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      start = formatDate(firstDay);
      end = formatDate(now);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      start = formatDate(past);
      end = formatDate(now);
    } else if (preset === 'all') {
      start = '';
      end = '';
    }

    setStartDate(start);
    setEndDate(end);
    onFilterChange({
      statuses: selectedStatuses,
      groupBy,
      startDate: start,
      endDate: end,
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

  const filteredAvailableStatuses = useMemo(() => {
    if (!statusSearch.trim()) return availableStatuses;
    const q = statusSearch.toLowerCase().trim();
    return availableStatuses.filter(s => s.toLowerCase().includes(q));
  }, [availableStatuses, statusSearch]);

  const activeGroupByLabel = groupByOptions.find(o => o.value === groupBy)?.label || groupBy;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Main Search Input & Filter Options Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
        {/* Multi-field search input */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-border bg-surface text-foreground placeholder-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-xs"
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

        {/* Clean, Premium Filter Popover Trigger */}
        <div className="relative" ref={popoverRef}>
          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            shape="pill"
            size="md"
            onClick={() => setIsPopoverOpen(prev => !prev)}
            className={`flex items-center gap-2 transition-all shadow-xs ${
              activeFilterCount > 0 ? 'ring-2 ring-primary/40 font-bold bg-primary text-white shadow-md' : 'border-border hover:border-primary/50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs font-bold">Filter &amp; Group</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-2 py-0.5 rounded-full bg-white/20 dark:bg-black/20 text-white font-black text-[11px]">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isPopoverOpen ? 'rotate-180' : 'opacity-60'}`} />
          </Button>

          {/* Premium Bento Filter Records Dropdown Panel */}
          {isPopoverOpen && (
            <div className="absolute right-0 mt-2.5 w-[380px] sm:w-[420px] max-w-[95vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200 space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
                    <SlidersHorizontal className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                      Filter &amp; Group Records
                    </h3>
                    <p className="text-[11px] text-slate-400">Custom data breakdown and attributes</p>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-xl transition-all"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* 1. Group Records By Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Group Records By</span>
                  </div>
                  {groupBy && (
                    <button
                      type="button"
                      onClick={() => handleGroupByChange('')}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                    >
                      Clear Grouping
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {groupByOptions.map(opt => {
                    const isSelected = groupBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleGroupByChange(opt.value)}
                        className={`flex items-center justify-between px-3 py-2 rounded-2xl border text-xs font-semibold transition-all text-left ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/30'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Category / Status Multi-Checklist Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Tag className="h-3.5 w-3.5 text-amber-500" />
                    <span>Category &amp; Status Filter</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllStatuses}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    {selectedStatuses.length === availableStatuses.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {availableStatuses.length > 6 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                    <input
                      type="text"
                      value={statusSearch}
                      onChange={e => setStatusSearch(e.target.value)}
                      placeholder="Search options..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {filteredAvailableStatuses.map(status => {
                    const isChecked = selectedStatuses.includes(status);
                    return (
                      <label
                        key={status}
                        className={`flex items-center justify-between px-3 py-2 rounded-2xl border text-xs cursor-pointer transition-all select-none ${
                          isChecked
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleStatusToggle(status)}
                            className="hidden"
                          />
                          {isChecked ? (
                            <CheckSquare className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="truncate">{status}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. Created Date Range & Smart Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Date Range</span>
                  </div>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => setDatePreset('all')}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>

                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={() => setDatePreset('today')}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('7days')}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('thisMonth')}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('30days')}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Last 30 Days
                  </button>
                </div>

                {/* Input Pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted font-bold block mb-1">From Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => {
                        setStartDate(e.target.value);
                        onFilterChange({
                          statuses: selectedStatuses,
                          groupBy,
                          startDate: e.target.value,
                          endDate,
                          quickFilter,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-bold block mb-1">To Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => {
                        setEndDate(e.target.value);
                        onFilterChange({
                          statuses: selectedStatuses,
                          groupBy,
                          startDate,
                          endDate: e.target.value,
                          quickFilter,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400">
                  {activeFilterCount > 0 ? `${activeFilterCount} active condition(s)` : 'No active filters'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPopoverOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={applyFilters}
                    className="rounded-xl text-xs font-bold shadow-md"
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Quick Preset Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-muted font-bold text-[11px] uppercase tracking-wider flex-shrink-0">
          Quick Filters:
        </span>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('all')}
          className={`px-3 py-1 rounded-full font-bold transition-all flex-shrink-0 ${
            quickFilter === 'all'
              ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          All Items
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('active')}
          className={`px-3 py-1 rounded-full font-bold transition-all flex-shrink-0 ${
            quickFilter === 'active'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Active Only
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('rx')}
          className={`px-3 py-1 rounded-full font-bold transition-all flex-shrink-0 ${
            quickFilter === 'rx'
              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Rx Controlled
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('lowStock')}
          className={`px-3 py-1 rounded-full font-bold transition-all flex-shrink-0 ${
            quickFilter === 'lowStock'
              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Low Stock Alert
        </button>
        <button
          type="button"
          onClick={() => handleQuickFilterSelect('inactive')}
          className={`px-3 py-1 rounded-full font-bold transition-all flex-shrink-0 ${
            quickFilter === 'inactive'
              ? 'bg-slate-700 text-white shadow-sm ring-2 ring-slate-600/30'
              : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Inactive
        </button>
      </div>

      {/* 3. Active Filters Pill Display (when filters applied) */}
      {(selectedStatuses.length > 0 || groupBy || startDate || endDate) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-border/50">
          <span className="text-[11px] font-bold text-muted flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-primary" /> Active Filters:
          </span>

          {/* Group By Tag */}
          {groupBy && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 text-[11px]">
              <Layers className="h-3 w-3" /> Group: {activeGroupByLabel}
              <button
                type="button"
                onClick={() => handleGroupByChange('')}
                className="hover:text-indigo-800 dark:hover:text-indigo-200 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Statuses Tags */}
          {selectedStatuses.map(status => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 text-[11px]"
            >
              {status}
              <button
                type="button"
                onClick={() => handleStatusToggle(status)}
                className="hover:text-primary-dark ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* Date Tag */}
          {(startDate || endDate) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
              <Calendar className="h-3 w-3" />
              {startDate || 'Start'} ➡️ {endDate || 'Now'}
              <button
                type="button"
                onClick={() => setDatePreset('all')}
                className="hover:text-emerald-800 dark:hover:text-emerald-200 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Clear All Link */}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[11px] text-slate-400 hover:text-rose-500 font-bold ml-1 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

