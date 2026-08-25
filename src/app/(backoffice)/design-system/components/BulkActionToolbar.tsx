import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  EyeOff,
  Archive,
  Trash2,
  Download,
  ChevronDown,
  X,
  CheckSquare,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { BulkAction, BulkActionsConfig } from '../types';

interface BulkActionToolbarProps<T> {
  selectedCount: number;
  totalCount: number;
  isCrossPageSelected?: boolean;
  onSelectAllCrossPage?: () => void;
  onClearSelection: () => void;
  config?: BulkActionsConfig<T>;
  onTriggerAction: (action: BulkAction) => void;
  onExportSelected?: () => void;
}

export function BulkActionToolbar<T>({
  selectedCount,
  totalCount,
  isCrossPageSelected = false,
  onSelectAllCrossPage,
  onClearSelection,
  config,
  onTriggerAction,
  onExportSelected,
}: BulkActionToolbarProps<T>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCount <= 0) return null;

  const allowed = config?.allowed ?? {
    duplicate: true,
    deactivate: true,
    archive: true,
    delete: true,
  };

  const handleActionClick = (action: BulkAction) => {
    setIsMenuOpen(false);
    onTriggerAction(action);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-primary/10 border border-primary/30 p-3 rounded-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2">
      {/* Selection Info & Counter */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span>
            <strong className="text-primary">{selectedCount}</strong> record(s) selected
          </span>
        </div>

        {!isCrossPageSelected && onSelectAllCrossPage && totalCount > selectedCount && (
          <button
            type="button"
            onClick={onSelectAllCrossPage}
            className="text-xs text-primary hover:underline font-medium"
          >
            Select all {totalCount} records
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground font-medium pl-2 border-l border-border"
        >
          <X className="h-3 w-3" />
          <span>Clear selection</span>
        </button>
      </div>

      {/* Actions group */}
      <div className="flex items-center gap-2">
        {/* Primary Action Dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="primary"
            shape="pill"
            size="sm"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center gap-2"
          >
            <span>Action</span>
            <Badge variant="neutral" className="bg-white/20 text-white px-1.5 py-0 text-[11px]">
              {selectedCount}
            </Badge>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {allowed.duplicate !== false && (
                <button
                  type="button"
                  onClick={() => handleActionClick('duplicate')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5 text-muted" />
                  <span>Duplicate row</span>
                </button>
              )}

              {allowed.deactivate !== false && (
                <button
                  type="button"
                  onClick={() => handleActionClick('deactivate')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <EyeOff className="h-3.5 w-3.5 text-muted" />
                  <span>Deactivate</span>
                </button>
              )}

              {allowed.archive !== false && (
                <button
                  type="button"
                  onClick={() => handleActionClick('archive')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Archive className="h-3.5 w-3.5 text-muted" />
                  <span>Archive</span>
                </button>
              )}

              {allowed.delete !== false && (
                <button
                  type="button"
                  onClick={() => handleActionClick('delete')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors border-t border-border mt-1 pt-2"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  <span className="font-medium">Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Secondary Action: Export Selected */}
        {onExportSelected && (
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            onClick={onExportSelected}
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export selected</span>
          </Button>
        )}
      </div>
    </div>
  );
}
