'use client'
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table'
import React from 'react'

export default function DataTable({
  data,
  errors = [],
}: {
  data: any[]
  errors?: Record<string, string>[]
}) {
  const columns: ColumnDef<any>[] = data.length
    ? Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue, row, column }: { getValue: () => any; row: any; column: any }) => {
        const rowIdx = row.index
        const colId = column.id
        const error = errors[rowIdx]?.[colId]
        return (
          <input
            className={`p-1 border ${error ? 'border-red-500 bg-red-50' : ''}`}
            defaultValue={getValue() as string}
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
