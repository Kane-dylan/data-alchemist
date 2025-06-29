'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Check, X, RefreshCw, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'

interface Suggestion {
  id: string
  type: 'rule' | 'filter' | 'validation'
  title: string
  description: string
  confidence: number
  query?: string // For filter suggestions
  action?: string // For specific actions
}

interface FilterSuggestion extends Suggestion {
  type: 'filter'
  query: string
  action: 'apply_filter'
}

interface RuleSuggestion extends Suggestion {
  type: 'rule'
}

interface ValidationSuggestion extends Suggestion {
  type: 'validation'
}

type TypedSuggestion = FilterSuggestion | RuleSuggestion | ValidationSuggestion

interface AIAssistantProps {
  onApplySuggestion: (suggestion: Suggestion) => void
  data?: any[] // Current data context for better suggestions
  entityType?: 'client' | 'worker' | 'task'
  appliedFilters?: string[] // List of applied filter queries to avoid duplicates
}

export default function AIAssistant({
  onApplySuggestion,
  data = [],
  entityType = 'client',
  appliedFilters = []
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())

  // Mock AI suggestion generation - replace with actual AI service
  const generateSuggestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Generate context-aware suggestions based on current data and entity type
      const candidateSuggestions: Suggestion[] = []

      if (data.length > 0) {
        // Filter suggestions based on entity type
        switch (entityType) {
          case 'client':
            candidateSuggestions.push(
              {
                id: 'filter-client-high-value',
                type: 'filter',
                title: 'High-value clients',
                description: 'Filter clients with budget > $100,000 for priority focus',
                confidence: 89,
                query: 'budget greater than 100000',
                action: 'apply_filter'
              },
              {
                id: 'filter-client-vip',
                type: 'filter',
                title: 'VIP clients',
                description: 'Show only VIP status clients for special handling',
                confidence: 85,
                query: 'vip client',
                action: 'apply_filter'
              },
              {
                id: 'filter-client-group-a',
                type: 'filter',
                title: 'Group A clients',
                description: 'Focus on Group A clients for campaign targeting',
                confidence: 82,
                query: 'group tag equals GroupA',
                action: 'apply_filter'
              }
            )
            break

          case 'worker':
            candidateSuggestions.push(
              {
                id: 'filter-worker-coding',
                type: 'filter',
                title: 'Skilled developers',
                description: 'Filter workers with coding and development skills',
                confidence: 92,
                query: 'skills include coding',
                action: 'apply_filter'
              },
              {
                id: 'filter-worker-high-qual',
                type: 'filter',
                title: 'High qualification workers',
                description: 'Show workers with qualification level 5 or higher',
                confidence: 88,
                query: 'qualification level greater than 4',
                action: 'apply_filter'
              },
              {
                id: 'rule-worker-skill-match',
                type: 'rule',
                title: 'Skill matching optimization',
                description: 'Automatically match workers with compatible skill sets to similar tasks',
                confidence: 88
              }
            )
            break

          case 'task':
            candidateSuggestions.push(
              {
                id: 'filter-task-long-duration',
                type: 'filter',
                title: 'Long-duration tasks',
                description: 'Focus on tasks with duration > 3 days for resource planning',
                confidence: 84,
                query: 'duration greater than 3',
                action: 'apply_filter'
              },
              {
                id: 'filter-task-etl',
                type: 'filter',
                title: 'ETL tasks',
                description: 'Show only ETL category tasks for data pipeline management',
                confidence: 89,
                query: 'category equals ETL',
                action: 'apply_filter'
              },
              {
                id: 'rule-task-corun',
                type: 'rule',
                title: 'Co-run similar tasks',
                description: 'Tasks with similar skill requirements should run together for efficiency',
                confidence: 90
              }
            )
            break
        }

        // Common suggestions for all entity types
        candidateSuggestions.push(
          {
            id: `validation-data-quality-${entityType}`,
            type: 'validation',
            title: 'Data quality check',
            description: 'Add validation rules to ensure data consistency and completeness',
            confidence: 79
          }
        )
      } else {
        // Default suggestions when no data is available
        candidateSuggestions.push(
          {
            id: 'default-validation',
            type: 'validation',
            title: 'Upload data validation',
            description: 'Set up automatic validation rules for incoming data files',
            confidence: 75
          },
          {
            id: 'default-workflow',
            type: 'rule',
            title: 'Standard workflows',
            description: 'Create default workflow rules for common data processing tasks',
            confidence: 70
          }
        )
      }

      // Filter out already applied suggestions and duplicate queries
      const newSuggestions = candidateSuggestions.filter(suggestion => {
        // Check if suggestion ID was already applied
        if (appliedSuggestions.has(suggestion.id)) {
          return false
        }

        // For filter suggestions, also check if the query was already applied
        if (suggestion.type === 'filter' && 'query' in suggestion) {
          const suggestionQuery = (suggestion as FilterSuggestion).query.toLowerCase().trim()
          return !appliedFilters.some(appliedQuery =>
            appliedQuery.toLowerCase().trim() === suggestionQuery
          )
        }

        return true
      })

      setSuggestions(newSuggestions)
      setHasNewSuggestions(newSuggestions.length > 0)

      if (newSuggestions.length > 0) {
        toast.success(`Generated ${newSuggestions.length} AI suggestions`, {
          description: 'Review the suggestions and apply the ones that fit your workflow.',
          duration: 4000
        })
      } else if (candidateSuggestions.length > 0) {
        toast.info('All relevant suggestions have been applied', {
          description: 'Try refreshing or changing data to get new suggestions.',
          duration: 3000
        })
      }

    } catch (err) {
      const errorMsg = 'Failed to generate AI suggestions. Please try again.'
      setError(errorMsg)
      toast.error('AI Assistant Error', {
        description: errorMsg,
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }, [data, entityType, appliedSuggestions, appliedFilters])

  // Utility function to check if AI filtering is available
  const checkAIFilterAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/filter-expression', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  // Enhanced suggestion generation with availability checks
  const generateSuggestionsWithContext = useCallback(async () => {
    const isAIAvailable = await checkAIFilterAvailability()

    if (!isAIAvailable) {
      // Generate simpler suggestions when AI is not available
      const fallbackSuggestions: Suggestion[] = [
        {
          id: `fallback-${Date.now()}`,
          type: 'validation',
          title: 'Basic data validation',
          description: 'Set up standard validation rules for data consistency',
          confidence: 75
        }
      ]

      setSuggestions(fallbackSuggestions)
      return
    }

    // Proceed with full AI suggestions if available
    await generateSuggestions()
  }, [generateSuggestions, checkAIFilterAvailability])

  // Auto-generate suggestions when data changes
  useEffect(() => {
    if (data.length > 0) {
      // Debounce to avoid too frequent updates
      const timer = setTimeout(() => {
        generateSuggestionsWithContext()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [data.length, entityType, generateSuggestionsWithContext])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'rule': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'filter': return 'bg-green-100 text-green-800 border-green-200'
      case 'validation': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rule': return <Sparkles className="h-3 w-3" />
      case 'filter': return <Lightbulb className="h-3 w-3" />
      case 'validation': return <AlertTriangle className="h-3 w-3" />
      default: return <Brain className="h-3 w-3" />
    }
  }

  const handleApply = useCallback((suggestion: Suggestion) => {
    try {
      onApplySuggestion(suggestion)

      // Mark suggestion as applied to prevent duplicates
      setAppliedSuggestions(prev => new Set([...prev, suggestion.id]))

      // Remove applied suggestion from the list
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))

      toast.success('AI suggestion applied!', {
        description: `Applied: ${suggestion.title}`,
        duration: 3000
      })

      // Close if no more suggestions
      if (suggestions.length <= 1) {
        setIsOpen(false)
      }
    } catch (err) {
      console.error('Error applying suggestion:', err)
      toast.error('Failed to apply suggestion', {
        description: 'The suggestion could not be applied. Please try again or apply it manually.',
        duration: 6000,
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss()
        }
      })
    }
  }, [onApplySuggestion, suggestions.length])

  const handleIgnore = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    toast.info('Suggestion dismissed')

    // Close if no more suggestions
    if (suggestions.length <= 1) {
      setIsOpen(false)
    }
  }, [suggestions.length])

  const handleRefresh = useCallback(() => {
    if (!isLoading) {
      // Optionally reset applied suggestions on manual refresh
      setAppliedSuggestions(new Set())
      generateSuggestions()
    }
  }, [isLoading, generateSuggestions])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Mark suggestions as seen when popover opens
  useEffect(() => {
    if (isOpen) {
      setHasNewSuggestions(false)
    }
  }, [isOpen])

  // Type guard functions for better type safety
  const isFilterSuggestion = (suggestion: Suggestion): suggestion is FilterSuggestion => {
    return suggestion.type === 'filter' && 'query' in suggestion && 'action' in suggestion
  }

  const isRuleSuggestion = (suggestion: Suggestion): suggestion is RuleSuggestion => {
    return suggestion.type === 'rule'
  }

  const isValidationSuggestion = (suggestion: Suggestion): suggestion is ValidationSuggestion => {
    return suggestion.type === 'validation'
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-6 w-6" />
                </motion.div>
              ) : (
                <Brain className="h-6 w-6" />
              )}
            </Button>

            {/* Notification indicator */}
            {hasNewSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium shadow-md"
              >
                {suggestions.length}
              </motion.div>
            )}
          </motion.div>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="end"
          className="w-80 p-0 mr-4"
          sideOffset={10}
        >
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg text-black">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Suggestions
                  {suggestions.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {suggestions.length}
                    </Badge>
                  )}
                </CardTitle>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    title="Refresh suggestions"
                  >
                    <motion.div
                      animate={isLoading ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        AI Assistant Error
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {error}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                      className="text-red-600 hover:bg-red-100 p-1 h-auto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating AI suggestions...</span>
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!isLoading && suggestions.length === 0 && !error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 text-center"
                >
                  <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">No suggestions available</p>
                  <p className="text-xs text-gray-500">
                    Upload data or try refreshing for AI-powered insights
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-2"
                  >
                    Generate Suggestions
                  </Button>
                </motion.div>
              )}

              {/* Suggestions List */}
              <AnimatePresence mode="popLayout">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${getTypeColor(suggestion.type)} border`}>
                          {getTypeIcon(suggestion.type)}
                          <span className="ml-1">{suggestion.type}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">
                          {suggestion.confidence}%
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${suggestion.confidence >= 90 ? 'bg-green-500' :
                            suggestion.confidence >= 75 ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}
                        />
                      </div>
                    </div>

                    <h4 className="font-medium text-sm mb-1 text-black">
                      {suggestion.title}
                    </h4>

                    <p className="text-xs text-gray-600 mb-3">
                      {suggestion.description}
                    </p>

                    {/* Show query for filter suggestions */}
                    {isFilterSuggestion(suggestion) && (
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <span className="font-medium text-green-800">Filter: </span>
                        <code className="text-green-700">{suggestion.query}</code>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApply(suggestion)}
                        className="h-7 px-3 text-xs bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIgnore(suggestion.id)}
                        className="h-7 px-3 text-xs border-gray-300 text-black hover:bg-gray-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Help Text */}
              {suggestions.length > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-t border-gray-200">
                  💡 AI suggestions are based on your current data and workflow patterns.
                  Apply the ones that make sense for your use case.
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
