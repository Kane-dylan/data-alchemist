'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, Brain, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Rule {
  id: string
  type: string
  description: string
  data: any
  confidence?: number
}

interface ModularRuleManagerProps {
  rules: Rule[]
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>
}

// Sortable Rule Card Component
function SortableRuleCard({ rule, onDelete }: { rule: Rule; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getRuleTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'corun': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'loadlimit': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'validation': return 'bg-green-100 text-green-800 border-green-200'
      case 'ai-generated': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card className={`transition-all duration-200 bg-white border-gray-200 ${isDragging ? 'shadow-lg scale-105 rotate-2' : 'hover:shadow-md'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <Button
              variant="ghost"
              size="sm"
              className="p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </Button>

            {/* Rule Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getRuleTypeColor(rule.type)}>
                    {rule.type}
                  </Badge>
                  {rule.confidence && (
                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                      {rule.confidence}% confidence
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(rule.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-black mb-2">{rule.description}</p>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 hover:text-black">
                  View JSON
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto text-black">
                  {JSON.stringify(rule.data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ModularRuleManager({ rules, setRules }: ModularRuleManagerProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
      toast.success('Rule order updated')
    }
  }

  const addRule = async () => {
    if (!input.trim()) {
      toast.error('Please enter a rule description')
      return
    }

    setLoading(true)
    toast.loading('Processing rule with AI...', { id: 'rule-processing' })

    try {
      const res = await fetch('/api/parse-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleText: input }),
      })

      const json = await res.json()

      if (json.error) throw new Error(json.error)

      const newRule: Rule = {
        id: Date.now().toString(),
        type: json.type || 'custom',
        description: input,
        data: json,
        confidence: Math.floor(Math.random() * 20) + 80, // Mock confidence
      }

      setRules((prev) => [...prev, newRule])
      setInput('')
      toast.success('Rule added successfully!', { id: 'rule-processing' })
    } catch (err: any) {
      console.error('Rule parsing error:', err)
      toast.error(err.message || 'Failed to parse rule', { id: 'rule-processing' })
    } finally {
      setLoading(false)
    }
  }

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
    toast.success('Rule removed')
  }

  const addSampleRules = () => {
    const sampleRules: Rule[] = [
      {
        id: `sample-${Date.now()}-1`,
        type: 'coRun',
        description: 'Tasks with similar skill requirements should run together',
        data: { type: 'coRun', tasks: ['web-dev', 'ui-design'], reason: 'skill-similarity' },
        confidence: 95
      },
      {
        id: `sample-${Date.now()}-2`,
        type: 'loadLimit',
        description: 'Limit senior developers to maximum 3 concurrent projects',
        data: { type: 'loadLimit', group: 'senior-dev', maxSlotsPerPhase: 3 },
        confidence: 88
      }
    ]

    setRules(prev => [...prev, ...sampleRules])
    toast.success('Sample rules added')
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Settings className="h-5 w-5" />
          Rule Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Rule Input */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Describe a rule in plain English..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && addRule()}
              className="flex-1 bg-white border-gray-300"
            />
            <Button
              onClick={addRule}
              disabled={loading || !input.trim()}
              className="shrink-0 bg-gray-900 hover:bg-gray-800 text-white"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-1" />
                  Add Rule
                </>
              )}
            </Button>
          </div>

          {rules.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="mb-4">No rules yet. Start by describing your business logic.</p>
              <Button variant="outline" onClick={addSampleRules} className="border-gray-300 text-black hover:bg-gray-50">
                <Plus className="h-4 w-4 mr-2" />
                Add Sample Rules
              </Button>
            </div>
          )}
        </div>

        {/* Rules List with Drag and Drop */}
        {rules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-black">
                Active Rules ({rules.length})
              </h3>
              <Button variant="outline" size="sm" onClick={addSampleRules} className="border-gray-300 text-black hover:bg-gray-50">
                <Plus className="h-4 w-4 mr-1" />
                Add Samples
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  <AnimatePresence>
                    {rules.map((rule) => (
                      <SortableRuleCard
                        key={rule.id}
                        rule={rule}
                        onDelete={removeRule}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
