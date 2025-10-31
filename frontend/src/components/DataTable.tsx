import { useMemo, useState } from 'react';
import type { Opportunity } from '../lib/types';
import { FrameRow } from './FrameRow';
import { LoadingSpinner } from './LoadingSpinner';

interface DataTableProps {
  opportunities: Opportunity[];
  onViewDetails: (frameId: string) => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'profit' | 'margin';
type SortDirection = 'asc' | 'desc';
type ItemTypeFilter = 'all' | 'warframe' | 'weapon';

export function DataTable({ opportunities, onViewDetails, isLoading = false }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('profit');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<ItemTypeFilter>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFiltered = useMemo(() => {
    let filtered = opportunities;

    // Apply category filter
    if (itemTypeFilter !== 'all') {
      filtered = filtered.filter((opp) => opp.item_type === itemTypeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((opp) =>
        opp.frame_name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.frame_name.localeCompare(b.frame_name);
          break;
        case 'profit':
          comparison = a.profit_plat - b.profit_plat;
          break;
        case 'margin':
          comparison = a.profit_margin - b.profit_margin;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [opportunities, sortField, sortDirection, searchQuery, itemTypeFilter]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-wf-dark-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-wf-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-wf-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 bg-wf-dark-bg-light border border-wf-dark-border rounded-md text-wf-dark-text placeholder-wf-dark-text-dim focus:outline-none focus:ring-2 focus:ring-wf-primary"
        />
        
        {/* Category Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setItemTypeFilter('all')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              itemTypeFilter === 'all'
                ? 'bg-wf-primary text-white'
                : 'bg-wf-dark-bg-lighter text-wf-dark-text-dim hover:text-wf-dark-text'
            }`}
          >
            All ({opportunities.length})
          </button>
          <button
            onClick={() => setItemTypeFilter('warframe')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              itemTypeFilter === 'warframe'
                ? 'bg-wf-primary text-white'
                : 'bg-wf-dark-bg-lighter text-wf-dark-text-dim hover:text-wf-dark-text'
            }`}
          >
            Warframes ({opportunities.filter(o => o.item_type === 'warframe').length})
          </button>
          <button
            onClick={() => setItemTypeFilter('weapon')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              itemTypeFilter === 'weapon'
                ? 'bg-wf-primary text-white'
                : 'bg-wf-dark-bg-lighter text-wf-dark-text-dim hover:text-wf-dark-text'
            }`}
          >
            Weapons ({opportunities.filter(o => o.item_type === 'weapon').length})
          </button>
        </div>
        
        <div className="text-sm text-wf-dark-text-dim flex items-center">
          {sortedAndFiltered.length} item{sortedAndFiltered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="bg-wf-dark-bg-light border border-wf-dark-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-wf-dark-bg-lighter border-b border-wf-dark-border">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-wf-dark-text uppercase tracking-wider cursor-pointer hover:bg-wf-dark-bg"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Item
                    <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-wf-dark-text uppercase tracking-wider">
                  Parts Sum
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-wf-dark-text uppercase tracking-wider">
                  Set Price
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-wf-dark-text uppercase tracking-wider cursor-pointer hover:bg-wf-dark-bg"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Profit
                    <SortIcon field="profit" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-wf-dark-text uppercase tracking-wider cursor-pointer hover:bg-wf-dark-bg"
                  onClick={() => handleSort('margin')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Margin
                    <SortIcon field="margin" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-wf-dark-text uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wf-dark-border">
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-wf-dark-text-dim">
                    {searchQuery ? 'No items match your search' : 'No opportunities available'}
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((opportunity) => (
                  <FrameRow
                    key={opportunity.frame_id}
                    opportunity={opportunity}
                    onViewDetails={onViewDetails}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

