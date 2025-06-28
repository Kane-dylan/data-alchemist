'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, Brain, Settings, Wrench, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [isExpanded, setIsExpanded] = useState(true)

  // Manual Rule Builder State
  const [manualRule, setManualRule] = useState({
    type: '',
    condition: '',
    action: '',
    priority: 'medium',
    description: '',
    taskIds: [] as string[],
    clientGroup: '',
    workerGroup: '',
    maxSlots: 1,
    startPhase: 1,
    endPhase: 5,
    field: '',
    pattern: '',
    template: '',
    ruleName: '',
    minCommonSlots: 1
  })

  const getRuleTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'corun': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'loadlimit': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'slotrestriction': return 'bg-green-100 text-green-800 border-green-200'
      case 'phasewindow': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'patternmatch': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'precedence': return 'bg-red-100 text-red-800 border-red-200'
      case 'ai-generated': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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
    toast.loading('Processing rule...', { id: 'rule-processing' })

    try {
      // Mock AI rule generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newRule: Rule = {
        id: Date.now().toString(),
        type: 'ai-generated',
        description: input,
        data: { type: 'ai-generated', description: input },
        confidence: Math.floor(Math.random() * 30) + 70 // 70-100%
      }

      setRules(prev => [...prev, newRule])
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

  const addManualRule = () => {
    if (!manualRule.type || !manualRule.condition) {
      toast.error('Please fill in all required fields')
      return
    }

    let ruleData: any = {
      type: manualRule.type,
      manual: true
    }

    // Generate rule data based on type
    switch (manualRule.type) {
      case 'coRun':
        const taskIds = manualRule.condition.split(',').map(id => id.trim()).filter(Boolean)
        ruleData = {
          ...ruleData,
          tasks: taskIds,
          reason: manualRule.action || 'efficiency'
        }
        break

      case 'slotRestriction':
        ruleData = {
          ...ruleData,
          clientGroup: manualRule.clientGroup,
          workerGroup: manualRule.workerGroup,
          minCommonSlots: manualRule.minCommonSlots
        }
        break

      case 'loadLimit':
        ruleData = {
          ...ruleData,
          group: manualRule.condition,
          maxSlotsPerPhase: manualRule.maxSlots
        }
        break

      case 'phaseWindow':
        ruleData = {
          ...ruleData,
          taskId: manualRule.condition,
          startPhase: manualRule.startPhase,
          endPhase: manualRule.endPhase
        }
        break

      case 'patternMatch':
        ruleData = {
          ...ruleData,
          field: manualRule.field,
          pattern: manualRule.pattern,
          template: manualRule.template
        }
        break

      case 'precedence':
        ruleData = {
          ...ruleData,
          ruleName: manualRule.ruleName,
          priority: manualRule.priority,
          condition: manualRule.action
        }
        break

      default:
        toast.error('Invalid rule type')
        return
    }

    const newRule: Rule = {
      id: Date.now().toString(),
      type: manualRule.type,
      description: manualRule.description || `${manualRule.type} rule`,
      data: ruleData,
      confidence: 100 // Manual rules have 100% confidence
    }

    setRules(prev => [...prev, newRule])
    
    // Reset form
    setManualRule({
      type: '',
      condition: '',
      action: '',
      priority: 'medium',
      description: '',
      taskIds: [],
      clientGroup: '',
      workerGroup: '',
      maxSlots: 1,
      startPhase: 1,
      endPhase: 5,
      field: '',
      pattern: '',
      template: '',
      ruleName: '',
      minCommonSlots: 1
    })
    
    toast.success('Manual rule added successfully!')
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-black">
            <Settings className="h-5 w-5" />
            Rule Management
            {rules.length > 0 && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                {rules.length} rule{rules.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-6">
              <Tabs defaultValue="ai-rules" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger
                    value="ai-rules"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                    <Brain className="h-4 w-4" />
                    AI Rules
                  </TabsTrigger>
                  <TabsTrigger
                    value="manual-builder"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                    <Wrench className="h-4 w-4" />
                    Manual Builder
                  </TabsTrigger>
                </TabsList>

                {/* AI Rules Tab */}
                <TabsContent value="ai-rules" className="space-y-6 mt-6">
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

                  {/* Active Rules Display */}
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
                        <SortableContext
                          items={rules.map(rule => rule.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3 max-h-96 overflow-y-auto">
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
                </TabsContent>

                {/* Manual Builder Tab */}
                <TabsContent value="manual-builder" className="space-y-6 mt-6">
                  {/* Active Rules Display */}
                  {rules.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-black">
                          Active Rules ({rules.length})
                        </h3>
                      </div>

                      <div className="space-y-3 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
                        <AnimatePresence>
                          {rules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={getRuleTypeColor(rule.type)}>
                                  {rule.type}
                                </Badge>
                                <span className="text-black truncate">{rule.description}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRule(rule.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-black">Create Structured Rules</h3>

                    {/* Rule Type Tabs */}
                    <Tabs defaultValue="corun" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-gray-100 h-auto p-1">
                        <TabsTrigger value="corun" className="data-[state=active]:bg-white data-[state=active]:text-black text-xs p-2">
                          Co-Run
                        </TabsTrigger>
                        <TabsTrigger value="slot-restriction" className="data-[state=active]:bg-white data-[state=active]:text-black text-xs p-2">
                          Slots
                        </TabsTrigger>
                        <TabsTrigger value="load-limit" className="data-[state=active]:bg-white data-[state=active]:text-black text-xs p-2">
                          Load Limit
                        </TabsTrigger>
                        <TabsTrigger value="phase-window" className="data-[state=active]:bg-white data-[state=active]:text-black text-xs p-2">
                          Phase
                        </TabsTrigger>
                        <TabsTrigger value="pattern-match" className="data-[state=active]:bg-white data-[state=active]:text-black text-xs p-2">
                          Pattern
                        </TabsTrigger>
                        <TabsTrigger value="precedence" className="data-[state=active]:bg-white data-[state=active]:text-black text-xs p-2">
                          Priority
                        </TabsTrigger>
                      </TabsList>

                      {/* Co-Run Rules */}
                      <TabsContent value="corun" className="space-y-4 mt-4">
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-black mb-3">Co-Run Rule</h4>
                          <p className="text-sm text-gray-600 mb-4">Group tasks that should run together</p>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Task IDs *</label>
                              <Input
                                placeholder="e.g., task1, task2, task3"
                                value={manualRule.condition}
                                onChange={(e) => setManualRule(prev => ({ ...prev, condition: e.target.value, type: 'coRun' }))}
                                className="bg-white border-gray-300"
                              />
                              <p className="text-xs text-gray-500">Comma-separated list of TaskIDs that should run together</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Reason</label>
                              <Select value={manualRule.action} onValueChange={(value) => setManualRule(prev => ({ ...prev, action: value }))}>
                                <SelectTrigger className="bg-white border-gray-300">
                                  <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="skill-similarity">Skill Similarity</SelectItem>
                                  <SelectItem value="resource-dependency">Resource Dependency</SelectItem>
                                  <SelectItem value="efficiency">Efficiency</SelectItem>
                                  <SelectItem value="client-preference">Client Preference</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Description</label>
                              <Input
                                placeholder="Optional description"
                                value={manualRule.description}
                                onChange={(e) => setManualRule(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Slot Restriction Rules */}
                      <TabsContent value="slot-restriction" className="space-y-4 mt-4">
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-black mb-3">Slot Restriction Rule</h4>
                          <p className="text-sm text-gray-600 mb-4">Define minimum common slots between groups</p>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-black">Client Group *</label>
                                <Select 
                                  value={manualRule.clientGroup} 
                                  onValueChange={(value) => setManualRule(prev => ({ ...prev, clientGroup: value, type: 'slotRestriction' }))}
                                >
                                  <SelectTrigger className="bg-white border-gray-300">
                                    <SelectValue placeholder="Select client group" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GroupA">Group A</SelectItem>
                                    <SelectItem value="GroupB">Group B</SelectItem>
                                    <SelectItem value="VIP">VIP Clients</SelectItem>
                                    <SelectItem value="Standard">Standard Clients</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-black">Worker Group *</label>
                                <Select 
                                  value={manualRule.workerGroup} 
                                  onValueChange={(value) => setManualRule(prev => ({ ...prev, workerGroup: value }))}
                                >
                                  <SelectTrigger className="bg-white border-gray-300">
                                    <SelectValue placeholder="Select worker group" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Senior">Senior Workers</SelectItem>
                                    <SelectItem value="Junior">Junior Workers</SelectItem>
                                    <SelectItem value="Specialist">Specialists</SelectItem>
                                    <SelectItem value="GeneralStaff">General Staff</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Minimum Common Slots *</label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={manualRule.minCommonSlots}
                                onChange={(e) => setManualRule(prev => ({ ...prev, minCommonSlots: parseInt(e.target.value) || 1 }))}
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Load Limit Rules */}
                      <TabsContent value="load-limit" className="space-y-4 mt-4">
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-black mb-3">Load Limit Rule</h4>
                          <p className="text-sm text-gray-600 mb-4">Set maximum workload per phase for groups</p>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Worker Group *</label>
                              <Select 
                                value={manualRule.condition} 
                                onValueChange={(value) => setManualRule(prev => ({ ...prev, condition: value, type: 'loadLimit' }))}
                              >
                                <SelectTrigger className="bg-white border-gray-300">
                                  <SelectValue placeholder="Select worker group" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="senior-dev">Senior Developers</SelectItem>
                                  <SelectItem value="junior-dev">Junior Developers</SelectItem>
                                  <SelectItem value="designers">Designers</SelectItem>
                                  <SelectItem value="analysts">Analysts</SelectItem>
                                  <SelectItem value="managers">Project Managers</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Max Slots Per Phase *</label>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={manualRule.maxSlots}
                                onChange={(e) => setManualRule(prev => ({ ...prev, maxSlots: parseInt(e.target.value) || 1 }))}
                                className="bg-white border-gray-300"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Description</label>
                              <Input
                                placeholder="Optional description"
                                value={manualRule.description}
                                onChange={(e) => setManualRule(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Phase Window Rules */}
                      <TabsContent value="phase-window" className="space-y-4 mt-4">
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-black mb-3">Phase Window Rule</h4>
                          <p className="text-sm text-gray-600 mb-4">Restrict tasks to specific phase ranges</p>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Task ID *</label>
                              <Input
                                placeholder="e.g., TASK001"
                                value={manualRule.condition}
                                onChange={(e) => setManualRule(prev => ({ ...prev, condition: e.target.value, type: 'phaseWindow' }))}
                                className="bg-white border-gray-300"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-black">Start Phase *</label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={manualRule.startPhase}
                                  onChange={(e) => setManualRule(prev => ({ ...prev, startPhase: parseInt(e.target.value) || 1 }))}
                                  className="bg-white border-gray-300"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-black">End Phase *</label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={manualRule.endPhase}
                                  onChange={(e) => setManualRule(prev => ({ ...prev, endPhase: parseInt(e.target.value) || 5 }))}
                                  className="bg-white border-gray-300"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Description</label>
                              <Input
                                placeholder="Optional description"
                                value={manualRule.description}
                                onChange={(e) => setManualRule(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Pattern Match Rules */}
                      <TabsContent value="pattern-match" className="space-y-4 mt-4">
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-black mb-3">Pattern Match Rule</h4>
                          <p className="text-sm text-gray-600 mb-4">Match data patterns using regex</p>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Field to Match *</label>
                              <Select 
                                value={manualRule.field} 
                                onValueChange={(value) => setManualRule(prev => ({ ...prev, field: value, type: 'patternMatch' }))}
                              >
                                <SelectTrigger className="bg-white border-gray-300">
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ClientName">Client Name</SelectItem>
                                  <SelectItem value="TaskName">Task Name</SelectItem>
                                  <SelectItem value="WorkerName">Worker Name</SelectItem>
                                  <SelectItem value="Skills">Skills</SelectItem>
                                  <SelectItem value="Category">Category</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Regex Pattern *</label>
                              <Input
                                placeholder="e.g., ^Corp.*|.*Enterprise.*"
                                value={manualRule.pattern}
                                onChange={(e) => setManualRule(prev => ({ ...prev, pattern: e.target.value }))}
                                className="bg-white border-gray-300"
                              />
                              <p className="text-xs text-gray-500">Regular expression to match against the field</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Rule Template *</label>
                              <Select 
                                value={manualRule.template} 
                                onValueChange={(value) => setManualRule(prev => ({ ...prev, template: value }))}
                              >
                                <SelectTrigger className="bg-white border-gray-300">
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high-priority">Set High Priority</SelectItem>
                                  <SelectItem value="specific-worker">Assign Specific Worker</SelectItem>
                                  <SelectItem value="exclude">Exclude from Processing</SelectItem>
                                  <SelectItem value="group-together">Group Together</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Description</label>
                              <Input
                                placeholder="Optional description"
                                value={manualRule.description}
                                onChange={(e) => setManualRule(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Precedence Rules */}
                      <TabsContent value="precedence" className="space-y-4 mt-4">
                        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-black mb-3">Precedence Override Rule</h4>
                          <p className="text-sm text-gray-600 mb-4">Define rule priority ordering</p>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Rule Name *</label>
                              <Input
                                placeholder="e.g., VIP Client Override"
                                value={manualRule.ruleName}
                                onChange={(e) => setManualRule(prev => ({ ...prev, ruleName: e.target.value, type: 'precedence' }))}
                                className="bg-white border-gray-300"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Priority Level *</label>
                              <Select 
                                value={manualRule.priority} 
                                onValueChange={(value) => setManualRule(prev => ({ ...prev, priority: value }))}
                              >
                                <SelectTrigger className="bg-white border-gray-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="critical">Critical (1)</SelectItem>
                                  <SelectItem value="high">High (2)</SelectItem>
                                  <SelectItem value="medium">Medium (3)</SelectItem>
                                  <SelectItem value="low">Low (4)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Override Condition *</label>
                              <Input
                                placeholder="e.g., ClientTag == 'VIP'"
                                value={manualRule.action}
                                onChange={(e) => setManualRule(prev => ({ ...prev, action: e.target.value }))}
                                className="bg-white border-gray-300"
                              />
                              <p className="text-xs text-gray-500">Condition when this rule takes precedence</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-black">Description</label>
                              <Input
                                placeholder="Optional description"
                                value={manualRule.description}
                                onChange={(e) => setManualRule(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-white border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Add Rule Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={addManualRule}
                        disabled={!manualRule.type || (!manualRule.condition && !manualRule.clientGroup && !manualRule.field && !manualRule.ruleName)}
                        className="w-full bg-black text-white hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {manualRule.type ? manualRule.type.charAt(0).toUpperCase() + manualRule.type.slice(1) : 'Rule'}
                      </Button>
                    </div>

                    {/* Rule Preview */}
                    {manualRule.type && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-medium text-black mb-2">Rule Preview</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Type:</strong> {manualRule.type}</p>
                          {manualRule.condition && <p><strong>Condition:</strong> {manualRule.condition}</p>}
                          {manualRule.action && <p><strong>Action:</strong> {manualRule.action}</p>}
                          {manualRule.clientGroup && <p><strong>Client Group:</strong> {manualRule.clientGroup}</p>}
                          {manualRule.workerGroup && <p><strong>Worker Group:</strong> {manualRule.workerGroup}</p>}
                          {manualRule.field && <p><strong>Field:</strong> {manualRule.field}</p>}
                          {manualRule.pattern && <p><strong>Pattern:</strong> {manualRule.pattern}</p>}
                          {manualRule.ruleName && <p><strong>Rule Name:</strong> {manualRule.ruleName}</p>}
                          <p><strong>Priority:</strong> {manualRule.priority}</p>
                          {manualRule.description && <p><strong>Description:</strong> {manualRule.description}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Enhanced Rules Summary */}
              {rules.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-black mb-3">Rules Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                    {Object.entries(
                      rules.reduce((acc, rule) => {
                        acc[rule.type] = (acc[rule.type] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="text-center p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
                        <div className="font-medium text-black capitalize">{type}</div>
                        <div className="text-gray-600">{count} rule{count !== 1 ? 's' : ''}</div>
                        <div className={`w-full h-1 rounded mt-1 ${getRuleTypeColor(type).split(' ')[0].replace('text', 'bg')}`}></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="flex justify-between items-center text-xs text-blue-800">
                      <span>Total Active Rules:</span>
                      <span className="font-medium">{rules.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-blue-800">
                      <span>Manual Rules:</span>
                      <span className="font-medium">{rules.filter(r => r.data?.manual).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-blue-800">
                      <span>AI Generated:</span>
                      <span className="font-medium">{rules.filter(r => r.type === 'ai-generated').length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
