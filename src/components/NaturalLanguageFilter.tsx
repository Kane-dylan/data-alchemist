'use client'
import React, { useState } from 'react'
import { getFilterExpressionFromNL } from '@/utils/filterWithClaude'

export default function NaturalLanguageFilter({
  data,
  onFiltered,
  entityType,
}: {
  data: any[]
  entityType: 'task' | 'client' | 'worker'
  onFiltered: (filtered: any[]) => void
}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  async function applyFilter() {
    setLoading(true)
    try {
      const expression = await getFilterExpressionFromNL(entityType, query)

      const filtered = data.filter((row) => {
        try {
          // Create a safe function to evaluate the expression
          const func = new Function('row', `return ${expression}`)
          return func(row)
        } catch {
          return false
        }
      })

      onFiltered(filtered)
    } catch (err) {
      alert('Could not process your query.')
    }
    setLoading(false)
  }

  return (
    <div className="p-4 bg-gray-100 rounded space-y-2">
      <label className="block font-medium text-sm">Search using natural language:</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. tasks with duration > 1 and phase 2"
        className="w-full p-2 border rounded"
      />
      <button
        onClick={applyFilter}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Apply Filter'}
      </button>
    </div>
  )
}
