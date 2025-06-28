'use client'

import React, { useState } from 'react'
import { Search, Filter, X, Sparkles, RotateCcw, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface FilterChip {
  id: string
  label: string
  type: 'manual' | 'ai'
  query: string
}

interface EnhancedFilterProps {
  data: any[]
  entityType: 'client' | 'worker' | 'task'
  onFilteredData: (data: any[]) => void
  onResetFilters: () => void
}

export default function EnhancedFilter({
  data,
  entityType,
  onFilteredData,
  onResetFilters
}: EnhancedFilterProps) {
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

  const quickFilters = {
    client: [
      { label: 'High Priority', query: 'priority level > 7' },
      { label: 'Priority Level 5', query: 'priority level is 5' },
      { label: 'Contains Corp', query: 'client name contains Corp' },
      { label: 'Group A', query: 'group tag equals GroupA' },
    ],
    worker: [
      { label: 'Available', query: 'available slots > 0' },
      { label: 'Senior Level', query: 'qualification level > 5' },
      { label: 'Has Coding Skills', query: 'skills include coding' },
      { label: 'Group B', query: 'worker group equals GroupB' },
    ],
    task: [
      { label: 'Long Duration', query: 'duration greater than 1' },
      { label: 'ETL Category', query: 'category equals ETL' },
      { label: 'Phase 3', query: 'preferred phases include 3' },
      { label: 'High Priority', query: 'priority level > 7' },
    ],
  }

  const applyFilter = async () => {
    if (!query.trim()) {
      toast.error('Please enter a filter query')
      return
    }

    if (!entityType) {
      toast.error('Entity type is required')
      return
    }

    setIsProcessing(true)
    toast.loading('Processing filter...', { id: 'filter' })

    try {
      let filteredData = data

      if (useAI) {
        // AI-powered filtering
        const response = await fetch('/api/filter-expression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query, // Changed from naturalLanguageQuery to query
            data: data.slice(0, 5), // Send sample for context
            entityType,
          }),
        })

        const result = await response.json()

        if (result.error) throw new Error(result.error)

        if (!result.expression) {
          throw new Error('No filter expression generated')
        }

        // Apply the AI-generated filter with safer evaluation
        filteredData = data.filter((row) => {
          try {
            // Replace item with row to match the API response format
            const expression = result.expression.replace(/\bitem\./g, 'row.')
            // Use Function constructor for safer evaluation than eval
            const filterFunction = new Function('row', `return ${expression}`)
            return filterFunction(row)
          } catch (evalError) {
            console.warn('Filter expression evaluation error:', evalError)
            return true // Fallback to show all data if expression fails
          }
        })
      } else {
        // Simple text search
        const searchTerm = query.toLowerCase()
        filteredData = data.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchTerm)
          )
        )
      }

      // Add filter chip
      const newFilter: FilterChip = {
        id: Date.now().toString(),
        label: query,
        type: useAI ? 'ai' : 'manual',
        query,
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
      toast.error('Failed to apply filter. Please try again.', { id: 'filter' })
    } finally {
      setIsProcessing(false)
    }
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

          const result = await response.json()
          if (result.expression) {
            filteredData = filteredData.filter((row) => {
              try {
                const expression = result.expression.replace(/\bitem\./g, 'row.')
                const filterFunction = new Function('row', `return ${expression}`)
                return filterFunction(row)
              } catch {
                return true
              }
            })
          }
        } else {
          // Simple text search
          const searchTerm = filter.query.toLowerCase()
          filteredData = filteredData.filter(item =>
            Object.values(item).some(value =>
              String(value).toLowerCase().includes(searchTerm)
            )
          )
        }
      } catch (error) {
        console.warn('Filter application error:', error)
      }
    }

    onFilteredData(filteredData)
  }

  const applyQuickFilter = async (filterQuery: string) => {
    setQuery(filterQuery)
    // Auto-apply after setting query
    setTimeout(() => {
      applyFilter()
    }, 100)
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

          <TabsContent value="ai" className="space-y-4 mt-4">
            {/* AI Filter Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="e.g., 'show high priority clients with active projects' or 'duration greater than 1'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isProcessing && applyFilter()}
                  className="pr-10 bg-white border-gray-300"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              <Button
                onClick={applyFilter}
                disabled={isProcessing || !query.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  'Apply'
                )}
              </Button>
              <Button
                onClick={clearCurrentFilter}
                disabled={!query.trim()}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Mode Info */}
            <div className="text-xs text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="font-medium">✨ AI Mode Examples:</p>
              <div className="mt-1 space-y-1">
                <p>• <code>"priority level is 5"</code></p>
                <p>• <code>"duration greater than 1"</code></p>
                <p>• <code>"skills include coding"</code></p>
                <p>• <code>"client name contains Corp"</code></p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4 mt-4">
            {/* Text Filter Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search across all fields..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isProcessing && applyFilter()}
                  className="pr-10 bg-white border-gray-300"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <Button
                onClick={applyFilter}
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
                onClick={clearCurrentFilter}
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
