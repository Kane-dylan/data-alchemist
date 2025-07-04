'use client'

import React, { useState } from 'react'
import { Search, Filter, X, Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import AiFilter from './AiFilter'
import TextFilter from './TextFilter'

interface FilterChip {
  id: string
  label: string
  type: 'manual' | 'ai'
  query: string
}

interface ManageFiltersProps {
  data: any[]
  entityType: 'client' | 'worker' | 'task'
  onFilteredData: (data: any[]) => void
  onResetFilters: () => void
}

export default function ManageFilters({
  data,
  entityType,
  onFilteredData,
  onResetFilters
}: ManageFiltersProps) {
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([])
  const [useAI, setUseAI] = useState(true)
  const [filteredResults, setFilteredResults] = useState({
    client: [] as any[],
    worker: [] as any[],
    task: [] as any[]
  })
  const [showResults, setShowResults] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const quickFilters = {
    client: [
      { label: 'High Priority (4-5)', query: 'priority level >= 4' },
      { label: 'Priority Level 5', query: 'priority level equals 5' },
      { label: 'Contains "Corp"', query: 'client name contains Corp' },
      { label: 'Group A Clients', query: 'group tag equals GroupA' },
      { label: 'VIP Clients', query: 'vip client' },
      { label: 'Location: New York', query: 'location is New York' },
      { label: 'Budget > 100k', query: 'budget greater than 100000' },
      { label: 'Has Task TX', query: 'includes TX' },
    ],
    worker: [
      { label: 'Qualification 5', query: 'qualification level is 5' },
      { label: 'Has Coding Skills', query: 'skills include coding' },
      { label: 'Data & ML Skills', query: 'skills contain data and ml' },
      { label: 'Group B Workers', query: 'group is GroupB' },
      { label: 'Available Slot 2', query: 'available slots include 2' },
      { label: 'Max Load 3', query: 'max load per phase equals 3' },
      { label: 'UI/UX Skills', query: 'skills include ui/ux' },
      { label: 'Testing Skills', query: 'skills include testing' },
    ],
    task: [
      { label: 'Duration > 3', query: 'duration greater than 3' },
      { label: 'ETL Category', query: 'category equals ETL' },
      { label: 'Analytics Tasks', query: 'category is Analytics' },
      { label: 'Requires Coding', query: 'required skills include coding' },
      { label: 'Phase 2-4', query: 'preferred phases include 2' },
      { label: 'ML Category', query: 'category equals ML' },
      { label: 'Max Concurrent 1', query: 'max concurrent equals 1' },
      { label: 'Design Tasks', query: 'category is Design' },
    ],
  }

  const removeFilter = (filterId: string) => {
    const updatedFilters = activeFilters.filter(f => f.id !== filterId)
    setActiveFilters(updatedFilters)

    // Reapply remaining filters
    if (updatedFilters.length === 0) {
      onResetFilters()
      setFilteredResults({ client: [], worker: [], task: [] })
      setShowResults(false)
    } else {
      // Reapply all remaining filters
      applyAllFilters(updatedFilters)
    }
    toast.success('Filter removed')
  }

  const applyAllFilters = async (filters: FilterChip[]) => {
    if (filters.length === 0) {
      onResetFilters()
      return
    }

    let filteredData = data

    for (const filter of filters) {
      try {
        if (filter.type === 'ai') {
          const response = await fetch('/api/filter-expression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: filter.query,
              data: filteredData.slice(0, 5),
              entityType,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.expression && !result.error) {
              filteredData = filteredData.filter((row) => {
                try {
                  let expression = result.expression.trim()
                  expression = expression.replace(/\bitem\./g, 'row.')
                  expression = expression.replace(/\bdata\./g, 'row.')

                  const filterFunction = new Function('row', `
                    try {
                      return ${expression};
                    } catch (e) {
                      console.warn('Filter expression error:', e);
                      return false;
                    }
                  `)
                  return filterFunction(row)
                } catch {
                  return false
                }
              })
            }
          }
        } else {
          // Enhanced text search
          const searchTerm = filter.query.toLowerCase().trim()
          filteredData = filteredData.filter(item => {
            const matchesGeneral = Object.values(item || {}).some(value => {
              if (value == null) return false
              return String(value).toLowerCase().includes(searchTerm)
            })

            // Handle basic comparisons in text mode too
            if (searchTerm.includes('>') || searchTerm.includes('<') || searchTerm.includes('=')) {
              try {
                const comparisonMatch = searchTerm.match(/(\w+)\s*([><=]+)\s*(\w+)/i)
                if (comparisonMatch) {
                  const [, field, operator, value] = comparisonMatch
                  const fieldNames = Object.keys(item)
                  const matchingField = fieldNames.find(f =>
                    f.toLowerCase().includes(field.toLowerCase()) ||
                    field.toLowerCase().includes(f.toLowerCase())
                  )

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
        }
      } catch (error) {
        console.warn('Filter application error:', error)
      }
    }

    // Update filtered results
    setFilteredResults(prev => ({
      ...prev,
      [entityType]: filteredData
    }))

    onFilteredData(filteredData)
  }

  const applyQuickFilter = async (filterQuery: string) => {
    setQuery(filterQuery)

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
      let filteredData = data

      if (useAI) {
        // AI-powered filtering
        const response = await fetch('/api/filter-expression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: filterQuery,
            data: data.slice(0, 5), // Send sample for context
            entityType,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const result = await response.json()

        if (result.error) {
          throw new Error(result.error)
        }

        if (!result.expression) {
          throw new Error('No filter expression generated')
        }

        // Apply the AI-generated filter with safer evaluation
        filteredData = data.filter((row) => {
          try {
            // Clean and prepare the expression
            let expression = result.expression.trim()

            // Handle common expression formats
            if (!expression.startsWith('row.')) {
              // If expression doesn't start with row., try to fix common patterns
              expression = expression.replace(/\b(\w+)\b(?=\s*[><=!])/g, 'row.$1')
              expression = expression.replace(/\b(\w+)\.includes\(/g, 'row.$1.includes(')
              expression = expression.replace(/\b(\w+)\.toLowerCase\(/g, 'row.$1.toLowerCase(')
            }

            // Replace common field mappings for better compatibility
            expression = expression.replace(/\bitem\./g, 'row.')
            expression = expression.replace(/\bdata\./g, 'row.')

            // Use Function constructor for safer evaluation than eval
            const filterFunction = new Function('row', `
              try {
                return ${expression};
              } catch (e) {
                console.warn('Filter expression error:', e);
                return false;
              }
            `)
            return filterFunction(row)
          } catch (evalError) {
            console.warn('Filter expression evaluation error:', evalError)
            return false
          }
        })
      } else {
        // Enhanced text search with better field matching
        const searchTerm = filterQuery.toLowerCase().trim()

        filteredData = data.filter(item => {
          // Check all field values
          const matchesGeneral = Object.values(item || {}).some(value => {
            if (value == null) return false
            return String(value).toLowerCase().includes(searchTerm)
          })

          // Also try some basic logical parsing for text mode
          if (searchTerm.includes('>') || searchTerm.includes('<') || searchTerm.includes('=')) {
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
      }

      // Add filter chip
      const newFilter: FilterChip = {
        id: Date.now().toString(),
        label: filterQuery,
        type: useAI ? 'ai' : 'manual',
        query: filterQuery,
      }

      setActiveFilters(prev => [...prev, newFilter])

      // Update filtered results by entity type
      setFilteredResults(prev => ({
        ...prev,
        [entityType]: filteredData
      }))

      onFilteredData(filteredData)
      setQuery('')
      setShowResults(true)

      toast.success(
        `Filter applied! Showing ${filteredData.length} of ${data.length} records.`,
        { id: 'filter' }
      )
    } catch (error) {
      console.error('Filter error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Extract more specific error information
      let userFriendlyMessage = errorMessage
      let suggestions = 'Please try rephrasing your query.'

      if (errorMessage.includes('API request failed')) {
        userFriendlyMessage = 'Unable to connect to the AI filtering service'
        suggestions = 'Check your internet connection or try using manual filtering instead.'
      } else if (errorMessage.includes('Invalid filter expression')) {
        userFriendlyMessage = 'The AI generated an invalid filter expression'
        suggestions = 'Try using simpler language or switch to manual filtering.'
      } else if (errorMessage.includes('Expression evaluation failed')) {
        userFriendlyMessage = 'The filter expression could not be applied to your data'
        suggestions = 'Ensure your field names match the data structure.'
      } else if (errorMessage.includes('No filter expression generated')) {
        userFriendlyMessage = 'The AI could not understand your filter request'
        suggestions = 'Try examples like: "priority > 3", "name contains Corp", "skills include coding"'
      }

      // Don't clear the UI on error - keep everything visible
      toast.error(
        `Filter Error: ${userFriendlyMessage}`,
        {
          id: 'filter',
          duration: 8000,
          description: suggestions,
          action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss('filter')
          }
        }
      )

      // Set error state but don't reset filters or data
      setLastError(`${userFriendlyMessage}. ${suggestions}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetAllFilters = () => {
    setActiveFilters([])
    setQuery('')
    setFilteredResults({ client: [], worker: [], task: [] })
    setShowResults(false)
    onResetFilters()
    toast.success('All filters cleared')
  }

  const clearCurrentFilter = () => {
    setQuery('')
    toast.success('Current filter cleared')
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Filter className="h-5 w-5" />
          Smart Filtering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Error Display */}
        {lastError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-sm font-medium text-red-800">Filter Processing Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {lastError}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => setLastError(null)}
                    variant="outline"
                    size="sm"
                    className="text-red-800 border-red-300 hover:bg-red-100"
                  >
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => setUseAI(!useAI)}
                    variant="outline"
                    size="sm"
                    className="text-blue-800 border-blue-300 hover:bg-blue-100"
                  >
                    Switch to {useAI ? 'Manual' : 'AI'} Mode
                  </Button>
                  <Button
                    onClick={() => setQuery('')}
                    variant="outline"
                    size="sm"
                    className="text-gray-800 border-gray-300 hover:bg-gray-100"
                  >
                    Clear Query
                  </Button>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800 font-medium">💡 Example queries that work well:</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• "priority level greater than 3"</li>
                    <li>• "client name contains Corp"</li>
                    <li>• "skills include coding"</li>
                    <li>• "group is GroupA"</li>
                    <li>• "duration equals 2"</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Mode Tabs */}
        <Tabs value={useAI ? 'ai' : 'text'} onValueChange={(value) => setUseAI(value === 'ai')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger
              value="ai"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Sparkles className="h-4 w-4" />
              AI Mode
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black"
            >
              <Search className="h-4 w-4" />
              Text Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <AiFilter
              query={query}
              setQuery={setQuery}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              data={data}
              entityType={entityType}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              setFilteredResults={setFilteredResults}
              setShowResults={setShowResults}
              setLastError={setLastError}
              onFilteredData={onFilteredData}
              onClearCurrentFilter={clearCurrentFilter}
              applyQuickFilter={applyQuickFilter}
            />
          </TabsContent>

          <TabsContent value="text">
            <TextFilter
              query={query}
              setQuery={setQuery}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              data={data}
              entityType={entityType}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              setFilteredResults={setFilteredResults}
              setShowResults={setShowResults}
              setLastError={setLastError}
              onFilteredData={onFilteredData}
              onClearCurrentFilter={clearCurrentFilter}
              applyQuickFilter={applyQuickFilter}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Filters */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-black">Quick Filters</h4>
          <div className="flex flex-wrap gap-2">
            {quickFilters[entityType].map((filter, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyQuickFilter(filter.query)}
                disabled={isProcessing}
                className="text-xs border-gray-300 text-black hover:bg-gray-50"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-black">Active Filters</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="text-xs text-gray-600 hover:bg-gray-100"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {activeFilters.map((filter) => (
                  <motion.div
                    key={filter.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1"
                  >
                    <Badge
                      variant="secondary"
                      className={`text-xs ${filter.type === 'ai'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                    >
                      {filter.type === 'ai' && <Sparkles className="h-3 w-3 mr-1" />}
                      {filter.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                        className="h-auto p-0 ml-1 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Filter Results by Category */}
        {showResults && (filteredResults.client.length > 0 || filteredResults.worker.length > 0 || filteredResults.task.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-black">Filter Results</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
                className="text-xs text-gray-600 hover:bg-gray-100"
              >
                <X className="h-3 w-3 mr-1" />
                Hide Results
              </Button>
            </div>

            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger
                  value="client"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-xs"
                  disabled={filteredResults.client.length === 0}
                >
                  Clients ({filteredResults.client.length})
                </TabsTrigger>
                <TabsTrigger
                  value="worker"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-xs"
                  disabled={filteredResults.worker.length === 0}
                >
                  Workers ({filteredResults.worker.length})
                </TabsTrigger>
                <TabsTrigger
                  value="task"
                  className="data-[state=active]:bg-white data-[state=active]:text-black text-xs"
                  disabled={filteredResults.task.length === 0}
                >
                  Tasks ({filteredResults.task.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="mt-4">
                {filteredResults.client.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredResults.client.slice(0, 10).map((client, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
                        <div className="font-medium text-black">
                          {client.ClientName || client.Name || `Client ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                          {client.PriorityLevel && <span>Priority: {client.PriorityLevel}</span>}
                          {client.GroupTag && <span>Group: {client.GroupTag}</span>}
                          {client.ClientType && <span>Type: {client.ClientType}</span>}
                          {client.Status && <span>Status: {client.Status}</span>}
                        </div>
                      </div>
                    ))}
                    {filteredResults.client.length > 10 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        And {filteredResults.client.length - 10} more...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No client records match the current filters</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="worker" className="mt-4">
                {filteredResults.worker.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredResults.worker.slice(0, 10).map((worker, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
                        <div className="font-medium text-black">
                          {worker.WorkerName || worker.Name || `Worker ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                          {worker.QualificationLevel && <span>Level: {worker.QualificationLevel}</span>}
                          {worker.Skills && <span>Skills: {worker.Skills}</span>}
                          {worker.WorkerGroup && <span>Group: {worker.WorkerGroup}</span>}
                          {worker.Availability && <span>Available: {worker.Availability}</span>}
                        </div>
                      </div>
                    ))}
                    {filteredResults.worker.length > 10 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        And {filteredResults.worker.length - 10} more...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No worker records match the current filters</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="task" className="mt-4">
                {filteredResults.task.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredResults.task.slice(0, 10).map((task, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
                        <div className="font-medium text-black">
                          {task.TaskName || task.Name || `Task ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                          {task.Duration && <span>Duration: {task.Duration}</span>}
                          {task.Category && <span>Category: {task.Category}</span>}
                          {task.PreferredPhases && <span>Phases: {task.PreferredPhases}</span>}
                          {task.Priority && <span>Priority: {task.Priority}</span>}
                        </div>
                      </div>
                    ))}
                    {filteredResults.task.length > 10 && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        And {filteredResults.task.length - 10} more...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No task records match the current filters</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Filter Info */}
        <div className="text-xs text-gray-600">
          {activeFilters.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span>Showing filtered results ({data.length} records)</span>
              <span className="text-purple-600">{activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
