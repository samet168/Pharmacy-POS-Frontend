'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Download, ChevronDown, FileSpreadsheet, FileText, Printer, FileCode } from 'lucide-react';
import { exportToExcel, exportToWord, exportToPDF, exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';

export interface ExportDropdownProps {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  className?: string;
  buttonVariant?: 'primary' | 'outline' | 'secondary' | 'ghost';
  buttonSize?: 'sm' | 'md' | 'lg';
  buttonText?: string;
  disabled?: boolean;
}

export function ExportDropdown({
  filename,
  title,
  subtitle,
  headers,
  rows,
  className = '',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonText = 'Export',
  disabled = false,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'excel' | 'word' | 'pdf' | 'csv') => {
    if (!rows || rows.length === 0) {
      toast.error('No data available to export.');
      return;
    }

    setOpen(false);

    try {
      if (format === 'excel') {
        exportToExcel(filename, title, headers, rows, subtitle);
        toast.success(`Exported ${rows.length} records to Microsoft Excel (.xls)`);
      } else if (format === 'word') {
        exportToWord(filename, title, headers, rows, subtitle);
        toast.success(`Exported ${rows.length} records to Microsoft Word (.doc)`);
      } else if (format === 'pdf') {
        exportToPDF(filename, title, headers, rows, subtitle);
        toast.success(`Generated PDF print document for ${rows.length} records`);
      } else if (format === 'csv') {
        exportToCSV(filename, headers, rows);
        toast.success(`Exported ${rows.length} records to CSV`);
      }
    } catch (error) {
      console.error('Export failed', error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1.5 font-bold shadow-sm"
      >
        <Download className="h-4 w-4" />
        <span>{buttonText}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
            Choose Export Format
          </div>

          <button
            onClick={() => handleExport('excel')}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl transition-colors text-left"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <div>Excel Spreadsheet</div>
              <div className="text-[10px] text-slate-400 font-normal">.xls / .xlsx document</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl transition-colors text-left"
          >
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <div>PDF Document</div>
              <div className="text-[10px] text-slate-400 font-normal">Print &amp; Save as .pdf</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('word')}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-300 rounded-xl transition-colors text-left"
          >
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div>Word Document</div>
              <div className="text-[10px] text-slate-400 font-normal">.doc formatted report</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
          >
            <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <div>CSV File</div>
              <div className="text-[10px] text-slate-400 font-normal">Raw comma-separated data</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
