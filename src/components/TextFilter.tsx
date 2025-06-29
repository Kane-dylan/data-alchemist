'use client'

import React from 'react'
import { Search, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface FilterChip {
  id: string
  label: string
  type: 'manual' | 'ai'
  query: string
}

interface TextFilterProps {
  query: string
  setQuery: (query: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  data: any[]
  entityType: 'client' | 'worker' | 'task'
  activeFilters: FilterChip[]
  setActiveFilters: React.Dispatch<React.SetStateAction<FilterChip[]>>
  setFilteredResults: React.Dispatch<React.SetStateAction<{
    client: any[]
    worker: any[]
    task: any[]
  }>>
  setShowResults: (show: boolean) => void
  setLastError: (error: string | null) => void
  onFilteredData: (data: any[]) => void
  onClearCurrentFilter: () => void
  applyQuickFilter?: (query: string) => void
}

export default function TextFilter({
  query,
  setQuery,
  isProcessing,
  setIsProcessing,
  data,
  entityType,
  activeFilters,
  setActiveFilters,
  setFilteredResults,
  setShowResults,
  setLastError,
  onFilteredData,
  onClearCurrentFilter,
  applyQuickFilter
}: TextFilterProps) {

  const applyTextFilter = async (filterQuery: string = query) => {
    if (!filterQuery.trim()) {
      toast.error('Please enter a filter query')
      return
    }

    if (!entityType) {
      toast.error('Entity type is required')
      return
    }

    setIsProcessing(true)
    setLastError(null)
    toast.loading('Processing filter...', { id: 'filter' })

    try {
      // Enhanced text search with better field matching
      const searchTerm = filterQuery.toLowerCase().trim()

      const filteredData = data.filter(item => {
        // Check all field values for simple text search
        const matchesGeneral = Object.values(item || {}).some(value => {
          if (value == null) return false
          return String(value).toLowerCase().includes(searchTerm)
        })

        // Handle logical expressions in text mode
        if (searchTerm.includes('>') || searchTerm.includes('<') || searchTerm.includes('=') ||
          searchTerm.includes('greater') || searchTerm.includes('less') ||
          searchTerm.includes('equals') || searchTerm.includes('contains') ||
          searchTerm.includes('include') || searchTerm.includes(' is ') || searchTerm.includes(' to ')) {
          try {
            // Create field mapping for natural language to actual field names
            const fieldMappings = {
              'priority level': 'PriorityLevel',
              'priority': 'PriorityLevel',
              'client name': 'ClientName',
              'name': entityType === 'client' ? 'ClientName' : entityType === 'worker' ? 'WorkerName' : 'TaskName',
              'group tag': 'GroupTag',
              'group': entityType === 'client' ? 'GroupTag' : 'WorkerGroup',
              'qualification level': 'QualificationLevel',
              'qualification': 'QualificationLevel',
              'worker group': 'WorkerGroup',
              'worker name': 'WorkerName',
              'task name': 'TaskName',
              'duration': 'Duration',
              'category': 'Category',
              'skills': entityType === 'worker' ? 'Skills' : 'RequiredSkills',
              'required skills': 'RequiredSkills',
              'preferred phases': 'PreferredPhases',
              'phases': 'PreferredPhases',
              'available slots': 'AvailableSlots',
              'slots': 'AvailableSlots'
            }

            // Helper function to find matching field
            const findMatchingField = (fieldName: string): string | null => {
              // Direct mapping
              const mappingKey = fieldName.toLowerCase()
              if (mappingKey in fieldMappings) {
                return fieldMappings[mappingKey as keyof typeof fieldMappings]
              }

              // Fallback to partial matching
              const fieldNames = Object.keys(item)
              return fieldNames.find(f =>
                f.toLowerCase().includes(fieldName.toLowerCase()) ||
                fieldName.toLowerCase().includes(f.toLowerCase())
              ) || null
            }

            // Handle "field greater than X", "field > X", etc.
            const greaterThanMatch = searchTerm.match(/(.+?)\s+(?:greater\s+than|>)\s*(\d+)/i)
            if (greaterThanMatch) {
              const [, field, value] = greaterThanMatch
              const matchingField = findMatchingField(field.trim())

              if (matchingField && item[matchingField] != null) {
                const fieldValue = parseFloat(item[matchingField])
                const compareValue = parseFloat(value)
                if (!isNaN(fieldValue) && !isNaN(compareValue)) {
                  return fieldValue > compareValue
                }
              }
            }

            // Handle "field equals X", "field is X"
            const equalsMatch = searchTerm.match(/(.+?)\s+(?:equals|is)\s+(.+)/i)
            if (equalsMatch) {
              const [, field, value] = equalsMatch
              const matchingField = findMatchingField(field.trim())

              if (matchingField && item[matchingField] != null) {
                const fieldValue = String(item[matchingField]).toLowerCase()
                const compareValue = value.trim().toLowerCase()
                return fieldValue === compareValue
              }
            }

            // Handle "field contains X", "field include X"  
            const containsMatch = searchTerm.match(/(.+?)\s+(?:contains?|includes?)\s+(.+)/i)
            if (containsMatch) {
              const [, field, value] = containsMatch
              const matchingField = findMatchingField(field.trim())

              if (matchingField && item[matchingField] != null) {
                const fieldValue = String(item[matchingField]).toLowerCase()
                const compareValue = value.trim().toLowerCase()
                return fieldValue.includes(compareValue)
              }
            }

            // Handle "field is X to Y" range queries
            const rangeMatch = searchTerm.match(/(.+?)\s+is\s+(\d+)\s+to\s+(\d+)/i)
            if (rangeMatch) {
              const [, field, startValue, endValue] = rangeMatch
              const matchingField = findMatchingField(field.trim())

              if (matchingField && item[matchingField] != null) {
                const fieldValue = String(item[matchingField])
                const start = parseInt(startValue)
                const end = parseInt(endValue)

                // Handle different PreferredPhases formats
                // Format 1: "1 - 2" or "3 - 5"
                if (fieldValue.includes(' - ')) {
                  const [rangeStart, rangeEnd] = fieldValue.split(' - ').map(x => parseInt(x.trim()))
                  if (!isNaN(rangeStart) && !isNaN(rangeEnd)) {
                    // Check if requested range overlaps with task range
                    return (start <= rangeEnd && end >= rangeStart)
                  }
                }

                // Format 2: "[2,3,4]" JSON array
                if (fieldValue.startsWith('[') && fieldValue.endsWith(']')) {
                  try {
                    const phases = JSON.parse(fieldValue)
                    if (Array.isArray(phases)) {
                      return phases.some(phase => {
                        const p = parseInt(phase)
                        return p >= start && p <= end
                      })
                    }
                  } catch (e) {
                    // Handle malformed JSON like "[2 - 4]" by extracting first number
                    const firstNumberMatch = fieldValue.match(/\[(\d+)/)
                    if (firstNumberMatch) {
                      const num = parseInt(firstNumberMatch[1])
                      return num >= start && num <= end
                    }
                  }
                }

                // Format 3: Direct number or comma-separated
                const phases = fieldValue.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x))
                if (phases.length > 0) {
                  return phases.some(phase => phase >= start && phase <= end)
                }
              }
            }

            // Handle simple comparisons like "priority > 3" or "duration = 2"
            const comparisonMatch = searchTerm.match(/(\w+)\s*([><=]+)\s*(\w+)/i)
            if (comparisonMatch) {
              const [, field, operator, value] = comparisonMatch
              const matchingField = findMatchingField(field)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = parseFloat(item[matchingField]) || item[matchingField]
                const compareValue = parseFloat(value) || value

                switch (operator) {
                  case '>': return fieldValue > compareValue
                  case '<': return fieldValue < compareValue
                  case '>=': return fieldValue >= compareValue
                  case '<=': return fieldValue <= compareValue
                  case '=':
                  case '==':
                  case '===': return fieldValue == compareValue
                  default: return matchesGeneral
                }
              }
            }
          } catch (e) {
            // Fall back to general matching
          }
        }

        return matchesGeneral
      })

      // Add filter chip
      const newFilter: FilterChip = {
        id: Date.now().toString(),
        label: filterQuery,
        type: 'manual',
        query: filterQuery,
      }

      setActiveFilters(prev => [...prev, newFilter])

      // Update filtered results by entity type
      setFilteredResults(prev => ({
        ...prev,
        [entityType]: filteredData
      }))

      onFilteredData(filteredData)
      if (filterQuery === query) {
        setQuery('')
      }
      setShowResults(true)

      toast.success(
        `Filter applied! Showing ${filteredData.length} of ${data.length} records.`,
        { id: 'filter' }
      )
    } catch (error) {
      console.error('Filter error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      toast.error(`Filter Error: ${errorMessage}`, {
        id: 'filter',
        duration: 8000,
        description: 'Please try rephrasing your query.',
      })

      setLastError(`${errorMessage}. Please try rephrasing your query.`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Use applyQuickFilter if available, otherwise use applyTextFilter
  const handleQuickFilter = applyQuickFilter || applyTextFilter

  return (
    <div className="space-y-4 mt-4">
      {/* Text Filter Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Search across all fields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && applyTextFilter()}
            className="pr-10 bg-white border-gray-300"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
        </div>
        <Button
          onClick={() => applyTextFilter()}
          disabled={isProcessing || !query.trim()}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            'Apply'
          )}
        </Button>
        <Button
          onClick={onClearCurrentFilter}
          disabled={!query.trim()}
          variant="outline"
          className="border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Mode Info */}
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p>🔍 Text mode: Simple text search across all data fields</p>
        <div className="mt-1 space-y-1">
          <p>• Tasks: <code>"duration greater than 1" or "category equals ETL" or "preferred phases include 3"</code></p>
          <p>• Clients: <code>"priority level is 5" or "client name contains Corp" or "group tag equals GroupA"</code></p>
          <p>• Workers: <code>"qualification level greater than 5" or "skills include coding" or "worker group equals GroupB"</code></p>
        </div>
      </div>
    </div>
  )
}
