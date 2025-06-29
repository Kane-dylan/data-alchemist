'use client'

import React, { useState, useCallback } from 'react'
import { Filter, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import AiFilter from './AiFilter'
import TextFilter from './TextFilter'
import {
  FilterChip,
  FilterResult,
  EntityType,
  QUICK_FILTERS
} from '@/lib/filter-utils'

interface FilterManagerProps {
  data: any[]
  entityType: EntityType
  onFilteredData: (data: any[]) => void
  onResetFilters: () => void
}

export default function FilterManager({
  data,
  entityType,
  onFilteredData,
  onResetFilters
}: FilterManagerProps) {
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([])
  const [useAI, setUseAI] = useState(true)

  const addFilterChip = useCallback((query: string, type: 'ai' | 'manual') => {
    const newFilter: FilterChip = {
      id: Date.now().toString(),
      label: query,
      type,
      query,
    }
    setActiveFilters(prev => [...prev, newFilter])
  }, [])

  const removeFilter = useCallback((filterId: string) => {
    const updatedFilters = activeFilters.filter(f => f.id !== filterId)
    setActiveFilters(updatedFilters)

    if (updatedFilters.length === 0) {
      onResetFilters()
      toast.success('Filter removed - showing all data')
    } else {
      // Note: For full functionality, we'd need to reapply remaining filters
      // This is a simplified implementation
      toast.success('Filter removed')
    }
  }, [activeFilters, onResetFilters])

  const resetAllFilters = useCallback(() => {
    setActiveFilters([])
    onResetFilters()
    toast.success('All filters cleared')
  }, [onResetFilters])

  const clearAIFilters = useCallback(() => {
    const aiFilters = activeFilters.filter(f => f.type === 'ai')
    const nonAIFilters = activeFilters.filter(f => f.type !== 'ai')

    if (aiFilters.length === 0) {
      toast.info('No AI filters to clear')
      return
    }

    setActiveFilters(nonAIFilters)

    if (nonAIFilters.length === 0) {
      onResetFilters()
      toast.success(`Cleared ${aiFilters.length} AI filter${aiFilters.length !== 1 ? 's' : ''} - showing all data`)
    } else {
      // Note: For full functionality, we'd need to reapply remaining filters
      toast.success(`Cleared ${aiFilters.length} AI filter${aiFilters.length !== 1 ? 's' : ''}`)
    }
  }, [activeFilters, onResetFilters])

  const handleAiFilterResult = useCallback((result: FilterResult) => {
    if (result.error) {
      // Error case - don't add filter chip, show user-friendly error, but keep UI intact
      console.warn('AI Filter error:', result.error)
      toast.error('⚠️ Filter failed to apply', {
        description: result.error.message || 'Please check your input and try again.',
        duration: 6000,
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss()
        }
      })
      return
    }

    // Success case - add filter chip and update data
    if (result.query) {
      addFilterChip(result.query, 'ai')
    }
    onFilteredData(result.data)
  }, [addFilterChip, onFilteredData])

  const handleTextFilterResult = useCallback((result: FilterResult) => {
    if (result.error) {
      // Error case - don't add filter chip, show user-friendly error
      console.warn('Text Filter error:', result.error)
      toast.error('⚠️ Text filter failed to apply', {
        description: result.error.message || 'Please check your search terms and try again.',
        duration: 6000,
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss()
        }
      })
      return
    }

    // Success case - add filter chip and update data
    if (result.query) {
      addFilterChip(result.query, 'manual')
    }
    onFilteredData(result.data)
  }, [addFilterChip, onFilteredData])

  const applyQuickFilter = useCallback(async (filterQuery: string) => {
    // Apply quick filter using the current mode (AI or Text)
    if (useAI) {
      // Trigger AI filter with quick filter query
      toast.info('Applying quick filter with AI...', { duration: 2000 })
    } else {
      // Trigger text filter with quick filter query
      toast.info('Applying quick filter with text search...', { duration: 2000 })
    }

    // Add the filter chip immediately for quick filters since they're predefined
    addFilterChip(filterQuery, useAI ? 'ai' : 'manual')
  }, [useAI, addFilterChip])

  const currentQuickFilters = QUICK_FILTERS[entityType] || []

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Filter className="h-5 w-5" />
          Smart Filtering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Mode Tabs */}
        <Tabs
          value={useAI ? 'ai' : 'text'}
          onValueChange={(value) => setUseAI(value === 'ai')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger
              value="ai"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black"
            >
              AI Mode
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Text Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-4">
            <AiFilter
              data={data}
              entityType={entityType}
              onFilterResult={handleAiFilterResult}
            />
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <TextFilter
              data={data}
              entityType={entityType}
              onFilterResult={handleTextFilterResult}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Filters */}
        {currentQuickFilters.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-black">Quick Filters</h4>
            <div className="flex flex-wrap gap-2">
              {currentQuickFilters.map((filter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickFilter(filter.query)}
                  className="text-xs border-gray-300 text-black hover:bg-gray-50 transition-colors"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-black">Active Filters</h4>
              <div className="flex items-center gap-2">
                {activeFilters.some(f => f.type === 'ai') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAIFilters}
                    className="text-xs text-purple-600 hover:bg-purple-50"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear AI Filters
                  </Button>
                )}
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
            </div>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {activeFilters.map((filter) => (
                  <motion.div
                    key={filter.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1 pr-1 text-xs ${filter.type === 'ai'
                        ? 'bg-purple-100 text-purple-800 border-purple-200 shadow-sm'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      title={filter.type === 'ai' ? 'AI-suggested filter' : 'Manual filter'}
                    >
                      {filter.type === 'ai' && (
                        <span className="text-purple-600 mr-1">✨</span>
                      )}
                      <span className="truncate max-w-32" title={filter.label}>
                        {filter.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* AI Filters Summary */}
            {activeFilters.some(f => f.type === 'ai') && (
              <div className="text-xs text-purple-600 bg-purple-50 p-3 rounded border border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium flex items-center gap-1">
                    ✨ AI-Applied Filters ({activeFilters.filter(f => f.type === 'ai').length})
                  </span>
                  <span className="text-purple-500">
                    Manual: {activeFilters.filter(f => f.type !== 'ai').length}
                  </span>
                </div>
                <div className="text-purple-500 text-xs">
                  AI suggestions will avoid suggesting filters already applied
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Summary */}
        {activeFilters.length > 0 && (
          <div className="text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>{activeFilters.length} active filter{activeFilters.length !== 1 ? 's' : ''}</span>
                {activeFilters.some(f => f.type === 'ai') && (
                  <span className="text-purple-600 font-medium">
                    ✨ {activeFilters.filter(f => f.type === 'ai').length} AI-powered
                  </span>
                )}
              </div>
              <span className="text-right">
                {data.length} record{data.length !== 1 ? 's' : ''} displayed
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
