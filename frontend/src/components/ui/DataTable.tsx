import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchKeys?: (keyof T)[]
  emptyMessage?: string
  loading?: boolean
}

export default function DataTable<T extends Record<string, any>>({ data, columns, searchable = true, searchKeys, emptyMessage = 'No data found', loading = false }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((row) => {
      const keys = searchKeys || Object.keys(row)
      return keys.some((k) => String(row[k as string] || '').toLowerCase().includes(q))
    })
  }, [data, search, searchKeys])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="w-full">
      {searchable && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-1.5 text-sm"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-900">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className={`table-th ${col.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-zinc-800' : ''} ${col.className || ''}`}
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}>
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable !== false && sortKey === String(col.key) && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className="table-td">
                      <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={columns.length} className="table-td text-center py-10 text-gray-400">{emptyMessage}</td></tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`table-td ${col.className || ''}`}>
                      {col.render ? col.render(row) : String(row[col.key as string] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">{sorted.length} {sorted.length === 1 ? 'result' : 'results'}{search && ` for "${search}"`}</p>
    </div>
  )
}
