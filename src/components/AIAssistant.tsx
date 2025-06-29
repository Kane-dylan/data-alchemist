'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Suggestion {
  id: string
  type: 'rule' | 'filter' | 'validation'
  title: string
  description: string
  confidence: number
}

interface AIAssistantProps {
  onApplySuggestion: (suggestion: Suggestion) => void
}

export default function AIAssistant({ onApplySuggestion }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions] = useState<Suggestion[]>([
    {
      id: '1',
      type: 'rule',
      title: 'Co-run similar tasks',
      description: 'Tasks with similar skill requirements should run together for efficiency',
      confidence: 92
    },
    {
      id: '2',
      type: 'filter',
      title: 'Filter active clients',
      description: 'Show only clients with active status',
      confidence: 85
    },
    {
      id: '3',
      type: 'validation',
      title: 'Email format validation',
      description: 'Add validation for email field format consistency',
      confidence: 78
    }
  ])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'rule': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'filter': return 'bg-green-100 text-green-800 border-green-200'
      case 'validation': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleApply = (suggestion: Suggestion) => {
    onApplySuggestion(suggestion)
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl"
            >
              <Brain className="h-6 w-6" />
            </Button>
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
              <CardTitle className="flex items-center gap-2 text-lg text-black">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className={`${getTypeColor(suggestion.type)} border`}>
                        {suggestion.type}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {suggestion.confidence}%
                      </span>
                    </div>

                    <h4 className="font-medium text-sm mb-1 text-black">
                      {suggestion.title}
                    </h4>

                    <p className="text-xs text-gray-600 mb-3">
                      {suggestion.description}
                    </p>

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
                        className="h-7 px-3 text-xs border-gray-300 text-black hover:bg-gray-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Ignore
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
