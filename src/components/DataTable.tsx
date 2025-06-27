'use client'
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table'
import React, { useState, useEffect } from 'react'
import { validateSingleField } from '@/utils/validationEngine'

// Cell component to manage individual input state
function EditableCell({
  initialValue,
  rowIndex,
  columnId,
  error,
  entityType,
  rowData,
  onDataChange,
}: {
  initialValue: string
  rowIndex: number
  columnId: string
  error?: string
  entityType?: 'client' | 'worker' | 'task'
  rowData?: Record<string, any>
  onDataChange?: (rowIndex: number, columnId: string, value: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  const [liveError, setLiveError] = useState<string | null>(null)

  // Reset local state when initialValue changes (after commit)
  useEffect(() => {
    setValue(initialValue)
    setLiveError(null)
  }, [initialValue])

  // Debounced live validation when value changes
  useEffect(() => {
    if (!entityType || !rowData) return

    const timeoutId = setTimeout(() => {
      const validationError = validateSingleField(entityType, columnId, value, rowData)
      setLiveError(validationError)
    }, 100) // Reduced debounce for more responsive feedback

    return () => clearTimeout(timeoutId)
  }, [value, entityType, columnId, rowData])

  // Prioritize live error over committed error for better UX
  const displayError = liveError !== null ? liveError : error

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onDataChange?.(rowIndex, columnId, value)
      e.currentTarget.blur() // Remove focus after confirming
    }
  }

  const handleBlur = () => {
    // Only save changes on blur if the value has actually changed
    if (value !== initialValue) {
      onDataChange?.(rowIndex, columnId, value)
    }
  }

  return (
    <input
      className={`p-1 border w-full ${displayError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      title={displayError || "Press Enter to confirm changes"}
    />
  )
}

export default function DataTable({
  data,
  errors = [],
  entityType,
  onDataChange,
}: {
  data: any[]
  errors?: Record<string, string>[]
  entityType?: 'client' | 'worker' | 'task'
  onDataChange?: (rowIndex: number, columnId: string, value: string) => void
}) {
  const columns: ColumnDef<any>[] = data.length
    ? Object.keys(data[0] || {}).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue, row, column }: { getValue: () => any; row: any; column: any }) => {
        const rowIdx = row.index
        const colId = column.id
        const error = errors[rowIdx]?.[colId]
        const rowData = data[rowIdx]
        return (
          <EditableCell
            initialValue={String(getValue() || '')}
            rowIndex={rowIdx}
            columnId={colId}
            error={error}
            entityType={entityType}
            rowData={rowData}
            onDataChange={onDataChange}
          />
        )
      },
    }))
    : []

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-auto max-h-[70vh] border p-2 rounded">
      <table className="min-w-full border">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="border px-2 py-1 bg-gray-100 text-left">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-2 py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
