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
          searchTerm.includes('include') || searchTerm.includes(' is ') || searchTerm.includes(' to ') ||
          searchTerm.includes('in phase') || searchTerm.includes('phase ') ||
          (searchTerm.includes('tasks') && (searchTerm.includes('longer') || searchTerm.includes('last'))) ||
          searchTerm.includes('concurrency') || searchTerm.includes('concurrent') ||
          searchTerm.includes('more')) {
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
              'slots': 'AvailableSlots',
              'max concurrent': 'MaxConcurrent',
              'concurrency': 'MaxConcurrent',
              'concurrent': 'MaxConcurrent'
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

            // Handle "field greater than X", "field more than X", "field > X", etc.
            const greaterThanMatch = searchTerm.match(/(.+?)\s+(?:greater\s+than|more\s+than|>\s*|≥\s*)\s*(\d+)/i)
            if (greaterThanMatch) {
              const [, field, value] = greaterThanMatch
              
              // Extract just the field name from phrases like "tasks with duration"
              let cleanField = field.trim()
              if (cleanField.includes('tasks with ')) {
                cleanField = cleanField.replace(/^.*tasks with\s+/, '')
              }
              if (cleanField.includes('task ')) {
                cleanField = cleanField.replace(/^.*task\s+/, '')
              }
              
              const matchingField = findMatchingField(cleanField)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = parseFloat(item[matchingField])
                const compareValue = parseFloat(value)
                if (!isNaN(fieldValue) && !isNaN(compareValue)) {
                  // Handle ≥ (greater than or equal) vs > (greater than)
                  const isGreaterOrEqual = searchTerm.includes('≥')
                  return isGreaterOrEqual ? fieldValue >= compareValue : fieldValue > compareValue
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

            // Helper function to check if a task can run in a specific phase
            const canRunInPhase = (preferredPhases: any, targetPhase: number): boolean => {
              if (!preferredPhases) return false
              const fieldValue = String(preferredPhases)
              
              // Format 1: "1-2" or "3-5" range format
              if (fieldValue.includes('-') && !fieldValue.startsWith('[')) {
                const [rangeStart, rangeEnd] = fieldValue.split('-').map(x => parseInt(x.trim()))
                if (!isNaN(rangeStart) && !isNaN(rangeEnd)) {
                  return targetPhase >= rangeStart && targetPhase <= rangeEnd
                }
              }
              
              // Format 2: "[2,3,4]" JSON array
              if (fieldValue.startsWith('[') && fieldValue.endsWith(']')) {
                try {
                  const phases = JSON.parse(fieldValue)
                  if (Array.isArray(phases)) {
                    return phases.includes(targetPhase)
                  }
                } catch (e) {
                  // Handle malformed JSON like "[2-4]"
                  const numbersInBrackets = fieldValue.match(/\[([^\]]+)\]/)?.[1]
                  if (numbersInBrackets) {
                    if (numbersInBrackets.includes('-')) {
                      const [start, end] = numbersInBrackets.split('-').map(x => parseInt(x.trim()))
                      if (!isNaN(start) && !isNaN(end)) {
                        return targetPhase >= start && targetPhase <= end
                      }
                    } else {
                      const nums = numbersInBrackets.split(',').map(x => parseInt(x.trim()))
                      return nums.includes(targetPhase)
                    }
                  }
                }
              }
              
              // Format 3: Simple number "2"
              if (/^\d+$/.test(fieldValue.trim())) {
                return parseInt(fieldValue.trim()) === targetPhase
              }
              
              return false
            }

            // Handle "tasks that last X phase and run in phase Y" first (most specific)
            const complexDurationPhaseMatch = searchTerm.match(/tasks?\s+that\s+last\s+(\d+)\s+phase\s+and\s+run\s+in\s+phase\s+(\d+)/i)
            if (complexDurationPhaseMatch) {
              const [, duration, phase] = complexDurationPhaseMatch
              const durationValue = parseInt(duration)
              const phaseValue = parseInt(phase)
              
              // Check duration
              const durationMatches = item.Duration && parseInt(item.Duration) === durationValue
              
              // Check phase
              const phaseMatches = canRunInPhase(item.PreferredPhases, phaseValue)
              
              return durationMatches && phaseMatches
            }

            // Handle "tasks in phase X", "in phase X", "phase X"
            const phaseMatch = searchTerm.match(/(?:tasks?\s+)?in\s+phase\s+(\d+)|(?:^|\s)phase\s+(\d+)/i)
            if (phaseMatch) {
              const phaseNumber = parseInt(phaseMatch[1] || phaseMatch[2])
              
              if (!isNaN(phaseNumber)) {
                return canRunInPhase(item.PreferredPhases, phaseNumber)
              }
            }

            // Handle complex AND conditions like "Design tasks longer than 1 phase"
            const complexAndMatch = searchTerm.match(/(\w+)\s+tasks?\s+(?:longer\s+than|more\s+than|greater\s+than)\s+(\d+)\s+(?:phase|duration)/i)
            if (complexAndMatch) {
              const [, category, value] = complexAndMatch
              const categoryField = 'Category'
              const durationField = 'Duration'
              
              if (item[categoryField] && item[durationField]) {
                const categoryMatches = String(item[categoryField]).toLowerCase() === category.toLowerCase()
                const durationValue = parseFloat(item[durationField])
                const compareValue = parseFloat(value)
                
                if (!isNaN(durationValue) && !isNaN(compareValue)) {
                  return categoryMatches && durationValue > compareValue
                }
              }
            }

            // Handle "show tasks with concurrency ≥ X" or "concurrency >= X"
            const concurrencyMatch = searchTerm.match(/(?:show\s+tasks?\s+with\s+)?concurrenc(?:y|ies?)\s*[≥>=]+\s*(\d+)/i)
            if (concurrencyMatch) {
              const value = parseInt(concurrencyMatch[1])
              const concurrencyField = 'MaxConcurrent'
              
              if (item[concurrencyField] && !isNaN(value)) {
                const fieldValue = parseFloat(item[concurrencyField])
                if (!isNaN(fieldValue)) {
                  return fieldValue >= value
                }
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

            // Handle simple comparisons like "priority > 3", "duration = 2", "concurrency ≥ 2"
            const comparisonMatch = searchTerm.match(/(\w+)\s*([><=≥≤]+|>=|<=)\s*(\w+)/i)
            if (comparisonMatch) {
              const [, field, operator, value] = comparisonMatch
              const matchingField = findMatchingField(field)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = parseFloat(item[matchingField]) || item[matchingField]
                const compareValue = parseFloat(value) || value

                switch (operator) {
                  case '>': return fieldValue > compareValue
                  case '<': return fieldValue < compareValue
                  case '>=':
                  case '≥': return fieldValue >= compareValue
                  case '<=':
                  case '≤': return fieldValue <= compareValue
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
        <p>🔍 Text mode: Enhanced natural language search with complex pattern matching</p>
        <div className="mt-1 space-y-1">
          <p>• Tasks: <code>"duration more than 1"</code>, <code>"tasks in phase 2"</code>, <code>"Design tasks longer than 1 phase"</code>, <code>"concurrency ≥ 2"</code></p>
          <p>• Clients: <code>"priority level is 5"</code>, <code>"client name contains Corp"</code>, <code>"group tag equals GroupA"</code></p>
          <p>• Workers: <code>"qualification level greater than 5"</code>, <code>"skills include coding"</code>, <code>"worker group equals GroupB"</code></p>
        </div>
      </div>
    </div>
  )
}
