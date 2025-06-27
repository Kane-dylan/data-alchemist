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

  function clearFilter() {
    setQuery('')
    onFiltered(data) // Reset to original data
  }

  async function applyFilter() {
    setLoading(true)
    try {
      const expression = await getFilterExpressionFromNL(entityType, query)

      if (!expression) {
        alert('Could not generate filter expression from your query. Please try rephrasing.')
        setLoading(false)
        return
      }

      console.log('Filter expression:', expression) // Debug log

      const filtered = data.filter((row) => {
        try {
          // Create a safe function to evaluate the expression
          const func = new Function('row', `return ${expression}`)
          return func(row)
        } catch (evalError) {
          console.error('Error evaluating filter for row:', row, 'Error:', evalError)
          return false
        }
      })

      console.log(`Filtered ${data.length} rows down to ${filtered.length}`) // Debug log
      onFiltered(filtered)
    } catch (err) {
      console.error('Filter error:', err)
      alert('Could not process your query. Please try again.')
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
      <div className="flex gap-2">
        <button
          onClick={applyFilter}
          className="bg-blue-600 text-white px-4 py-2 rounded flex-1"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Apply Filter'}
        </button>
        <button
          onClick={clearFilter}
          className="bg-gray-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
