'use client'

import React, { useState, useCallback } from 'react'
import { Search, Send, Eraser, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  FilterResult,
  FilterError,
  EntityType,
  validateQuery,
  findMatchingField,
  safeParseNumber
} from '@/lib/filter-utils'

interface TextFilterProps {
  data: any[]
  entityType: EntityType
  onFilterResult: (result: FilterResult) => void
  disabled?: boolean
  placeholder?: string
}

interface FilterState {
  query: string
  isProcessing: boolean
  lastError: FilterError | null
}

export default function TextFilter({
  data,
  entityType,
  onFilterResult,
  disabled = false,
  placeholder = "Search across all fields or use structured queries..."
}: TextFilterProps) {
  const [state, setState] = useState<FilterState>({
    query: '',
    isProcessing: false,
    lastError: null
  })

  const updateState = useCallback((updates: Partial<FilterState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const clearError = useCallback(() => {
    updateState({ lastError: null })
  }, [updateState])

  const clearQuery = useCallback(() => {
    updateState({ query: '' })
    toast.success('Filter cleared')
  }, [updateState])

  /**
   * Enhanced text search with logical expression parsing
   */
  const applyTextFilter = useCallback(async (queryToApply?: string) => {
    const currentQuery = queryToApply || state.query

    // Validate input
    const validation = validateQuery(currentQuery)
    if (!validation.isValid) {
      const error: FilterError = {
        type: 'validation',
        message: validation.error || 'Invalid query',
        details: 'Please enter a valid search term or expression.'
      }
      updateState({ lastError: error })
      toast.error(error.message)
      return
    }

    updateState({ isProcessing: true, lastError: null })
    const toastId = 'text-filter'
    toast.loading('Applying text filter...', { id: toastId })

    try {
      const searchTerm = currentQuery.toLowerCase().trim()

      const filteredData = data.filter(item => {
        try {
          // Basic text search across all fields
          const matchesGeneral = Object.values(item || {}).some(value => {
            if (value == null) return false
            return String(value).toLowerCase().includes(searchTerm)
          })

          // Enhanced logical expression parsing for text mode
          if (searchTerm.includes('>') || searchTerm.includes('<') || searchTerm.includes('=') ||
            searchTerm.includes('greater') || searchTerm.includes('less') ||
            searchTerm.includes('equals') || searchTerm.includes('contains') ||
            searchTerm.includes('include') || searchTerm.includes(' is ') || searchTerm.includes(' to ')) {

            // Handle "field greater than X", "field > X"
            const greaterThanMatch = searchTerm.match(/(.+?)\s+(?:greater\s+than|>)\s*(\d+)/i)
            if (greaterThanMatch) {
              const [, field, value] = greaterThanMatch
              const matchingField = findMatchingField(field.trim(), item, entityType)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = safeParseNumber(item[matchingField])
                const compareValue = safeParseNumber(value)
                if (fieldValue !== null && compareValue !== null) {
                  return fieldValue > compareValue
                }
              }
            }

            // Handle "field less than X", "field < X"
            const lessThanMatch = searchTerm.match(/(.+?)\s+(?:less\s+than|<)\s*(\d+)/i)
            if (lessThanMatch) {
              const [, field, value] = lessThanMatch
              const matchingField = findMatchingField(field.trim(), item, entityType)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = safeParseNumber(item[matchingField])
                const compareValue = safeParseNumber(value)
                if (fieldValue !== null && compareValue !== null) {
                  return fieldValue < compareValue
                }
              }
            }

            // Handle "field equals X", "field is X"
            const equalsMatch = searchTerm.match(/(.+?)\s+(?:equals|is)\s+(.+)/i)
            if (equalsMatch) {
              const [, field, value] = equalsMatch
              const matchingField = findMatchingField(field.trim(), item, entityType)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = String(item[matchingField]).toLowerCase()
                const compareValue = value.trim().toLowerCase()
                return fieldValue === compareValue
              }
            }

            // Handle "field contains X", "field includes X"
            const containsMatch = searchTerm.match(/(.+?)\s+(?:contains?|includes?)\s+(.+)/i)
            if (containsMatch) {
              const [, field, value] = containsMatch
              const matchingField = findMatchingField(field.trim(), item, entityType)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = String(item[matchingField]).toLowerCase()
                const compareValue = value.trim().toLowerCase()
                return fieldValue.includes(compareValue)
              }
            }

            // Handle range queries "field is X to Y"
            const rangeMatch = searchTerm.match(/(.+?)\s+is\s+(\d+)\s+to\s+(\d+)/i)
            if (rangeMatch) {
              const [, field, startValue, endValue] = rangeMatch
              const matchingField = findMatchingField(field.trim(), item, entityType)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = String(item[matchingField])
                const start = parseInt(startValue)
                const end = parseInt(endValue)

                // Handle different field formats
                if (fieldValue.includes(' - ')) {
                  // Format: "1 - 2" or "3 - 5"
                  const [rangeStart, rangeEnd] = fieldValue.split(' - ').map(x => parseInt(x.trim()))
                  if (!isNaN(rangeStart) && !isNaN(rangeEnd)) {
                    return (start <= rangeEnd && end >= rangeStart)
                  }
                }

                if (fieldValue.startsWith('[') && fieldValue.endsWith(']')) {
                  // Format: "[2,3,4]" JSON array
                  try {
                    const phases = JSON.parse(fieldValue)
                    if (Array.isArray(phases)) {
                      return phases.some(phase => {
                        const p = parseInt(phase)
                        return p >= start && p <= end
                      })
                    }
                  } catch (e) {
                    // Handle malformed JSON like "[2 - 4]"
                    const firstNumberMatch = fieldValue.match(/\[(\d+)/)
                    if (firstNumberMatch) {
                      const num = parseInt(firstNumberMatch[1])
                      return num >= start && num <= end
                    }
                  }
                }

                // Format: Direct number or comma-separated
                const phases = fieldValue.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x))
                if (phases.length > 0) {
                  return phases.some(phase => phase >= start && phase <= end)
                }
              }
            }

            // Handle simple comparisons like "duration = 2"
            const comparisonMatch = searchTerm.match(/(\w+)\s*([><=]+)\s*(\w+)/i)
            if (comparisonMatch) {
              const [, field, operator, value] = comparisonMatch
              const matchingField = findMatchingField(field, item, entityType)

              if (matchingField && item[matchingField] != null) {
                const fieldValue = safeParseNumber(item[matchingField]) ?? item[matchingField]
                const compareValue = safeParseNumber(value) ?? value

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
          }

          return matchesGeneral
        } catch (filterError) {
          console.warn('Text filter evaluation error:', filterError)
          // On error, fall back to simple text matching
          return Object.values(item || {}).some(value => {
            if (value == null) return false
            return String(value).toLowerCase().includes(searchTerm)
          })
        }
      })

      // Success - notify parent component
      onFilterResult({ data: filteredData, query: currentQuery })

      // Clear query on successful application
      updateState({ query: '' })

      toast.success(
        `Text filter applied! Showing ${filteredData.length} of ${data.length} records.`,
        { id: toastId }
      )

    } catch (error) {
      console.error('Text Filter error:', error)

      const userError: FilterError = {
        type: 'validation',
        message: 'Text filter could not be applied',
        details: 'Please check your search terms and try again.'
      }

      updateState({ lastError: userError })

      // Notify parent of error (but don't break the UI)
      onFilterResult({
        data: data, // Return original data on error
        error: userError
      })

      toast.error(userError.message, {
        id: toastId,
        duration: 6000,
        description: userError.details,
        action: {
          label: 'Dismiss',
          onClick: () => {
            toast.dismiss(toastId)
            clearError()
          }
        }
      })
    } finally {
      updateState({ isProcessing: false })
    }
  }, [state.query, entityType, data, onFilterResult, updateState, clearError])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !state.isProcessing && !disabled) {
      applyTextFilter()
    }
  }, [applyTextFilter, state.isProcessing, disabled])

  return (
    <Card className="w-full bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
      <CardContent className="p-4 space-y-4">
        {/* Error Display */}
        {state.lastError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Unable to apply this filter
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {state.lastError.details || 'Please check your input and try again.'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="text-red-600 hover:bg-red-100 p-1 h-auto"
              >
                ×
              </Button>
            </div>
          </motion.div>
        )}

        {/* Text Filter Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">Text Search & Expressions</span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder={placeholder}
                value={state.query}
                onChange={(e) => updateState({ query: e.target.value })}
                onKeyDown={handleKeyDown}
                disabled={disabled || state.isProcessing}
                className="bg-white border-gray-300 focus:border-gray-500 focus:ring-gray-500/20"
              />
            </div>

            <Button
              onClick={() => applyTextFilter()}
              disabled={state.isProcessing || !state.query.trim() || disabled}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4"
            >
              {state.isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Search className="h-4 w-4" />
                </motion.div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

            <Button
              onClick={clearQuery}
              disabled={!state.query.trim() || state.isProcessing}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Text Mode Info */}
        <div className="text-xs text-gray-600 bg-white/60 p-3 rounded-lg border border-gray-200">
          <p className="font-medium">🔍 Text Mode Examples:</p>
          <div className="mt-1 space-y-1">
            <p>• Simple search: <code className="bg-gray-100 px-1 rounded">Corp</code> or <code className="bg-gray-100 px-1 rounded">coding</code></p>
            <p>• Structured: <code className="bg-gray-100 px-1 rounded">duration greater than 3</code></p>
            <p>• Field search: <code className="bg-gray-100 px-1 rounded">skills contains data</code></p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for easy integration
export function useTextFilter(data: any[], entityType: EntityType) {
  const [filteredData, setFilteredData] = useState<any[]>(data)
  const [error, setError] = useState<FilterError | null>(null)

  const handleFilterResult = useCallback((result: FilterResult) => {
    setFilteredData(result.data)
    setError(result.error || null)
  }, [])

  const reset = useCallback(() => {
    setFilteredData(data)
    setError(null)
  }, [data])

  return {
    filteredData,
    error,
    handleFilterResult,
    reset
  }
}
