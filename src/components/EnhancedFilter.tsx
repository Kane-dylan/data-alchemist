'use client'

import React, { useState } from 'react'
import { Search, Filter, X, Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

  const quickFilters = {
    client: [
      { label: 'High Priority', query: 'priority > 7' },
      { label: 'VIP Clients', query: 'status = VIP' },
      { label: 'Recent', query: 'created_date > 30 days ago' },
    ],
    worker: [
      { label: 'Available', query: 'status = available' },
      { label: 'Senior Level', query: 'level = senior' },
      { label: 'High Skill', query: 'skill_rating > 8' },
    ],
    task: [
      { label: 'Urgent', query: 'priority = urgent' },
      { label: 'In Progress', query: 'status = in_progress' },
      { label: 'Due Soon', query: 'due_date < 7 days' },
    ],
  }

  const applyFilter = async () => {
    if (!query.trim()) {
      toast.error('Please enter a filter query')
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
            naturalLanguageQuery: query,
            data: data.slice(0, 5), // Send sample for context
            entityType,
          }),
        })

        const result = await response.json()

        if (result.error) throw new Error(result.error)

        // Apply the AI-generated filter
        filteredData = data.filter((item) => {
          try {
            // Simple evaluation - in production, use a safer expression evaluator
            const expression = result.expression.replace(/\b\w+\b/g, (match: string) => `item.${match}`)
            return eval(expression)
          } catch {
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
      onFilteredData(filteredData)
      setQuery('')

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
    setActiveFilters(prev => prev.filter(f => f.id !== filterId))
    // For simplicity, reset to original data when removing filters
    // In production, you'd want to reapply remaining filters
    if (activeFilters.length === 1) {
      onResetFilters()
    }
    toast.success('Filter removed')
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
    onResetFilters()
    toast.success('All filters cleared')
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
        {/* Filter Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder={useAI ? "e.g., 'show high priority clients with active projects'" : "Search in data..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isProcessing && applyFilter()}
              className="pr-10 bg-white border-gray-300"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {useAI ? (
                <Sparkles className="h-4 w-4 text-purple-500" />
              ) : (
                <Search className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setUseAI(!useAI)}
            className={useAI ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-300 text-black hover:bg-gray-50'}
          >
            {useAI ? (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                AI
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-1" />
                Text
              </>
            )}
          </Button>

          <Button
            onClick={applyFilter}
            disabled={isProcessing || !query.trim()}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>

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

        {/* Filter Info */}
        <div className="text-xs text-gray-600">
          {useAI ? (
            <p>✨ AI mode: Use natural language to describe what you want to see</p>
          ) : (
            <p>🔍 Text mode: Simple text search across all fields</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
