'use client';

import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <table className={`w-full border-collapse ${className}`}>
      {children}
    </table>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <thead className={`bg-bento-bg dark:bg-slate-800 ${className}`}>{children}</thead>;
};

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <tbody className={className}>{children}</tbody>;
};

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <tr className={`border-b border-bento-gray dark:border-slate-700 hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors ${className}`}>{children}</tr>;
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string; numeric?: boolean }> = ({ children, className = '', numeric = false }) => {
  return (
    <th className={`px-6 py-4 text-left text-sm font-semibold text-bento-primary dark:text-slate-100 ${numeric ? 'font-mono' : ''} ${className}`}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<{ children: React.ReactNode; className?: string; numeric?: boolean }> = ({ children, className = '', numeric = false }) => {
  return (
    <td className={`px-6 py-4 text-sm text-slate-600 dark:text-slate-400 ${numeric ? 'font-mono' : ''} ${className}`}>
      {children}
    </td>
  );
};