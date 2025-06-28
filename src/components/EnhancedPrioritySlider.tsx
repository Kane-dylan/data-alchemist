'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { GripVertical, Download, Database, BarChart3, Target, Scale, Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface PriorityConfiguration {
  weights: Record<string, number>
  ranking: string[]
  pairwiseMatrix: Record<string, Record<string, number>>
  presetProfile: string
}

interface EnhancedPrioritySliderProps {
  onChange: (config: PriorityConfiguration) => void
  onExport: () => void
  hasData: boolean
}

interface SortableItemProps {
  id: string
  children: React.ReactNode
}

const SortableItem = ({ id, children }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm">
        <button {...listeners} className="text-gray-400 hover:text-gray-600">
          <GripVertical className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

const criteriaList = [
  { key: 'PriorityLevel', label: 'Priority Level', icon: Target },
  { key: 'RequestedTaskFulfillment', label: 'Task Fulfillment', icon: BarChart3 },
  { key: 'Fairness', label: 'Fairness', icon: Scale },
  { key: 'CostEfficiency', label: 'Cost Efficiency', icon: Clock },
  { key: 'WorkloadBalance', label: 'Workload Balance', icon: Database },
]

const presetProfiles = [
  { value: 'maximize_fulfillment', label: '🎯 Maximize Fulfillment', weights: { PriorityLevel: 90, RequestedTaskFulfillment: 95, Fairness: 30, CostEfficiency: 70, WorkloadBalance: 40 } },
  { value: 'fair_distribution', label: '⚖️ Fair Distribution', weights: { PriorityLevel: 50, RequestedTaskFulfillment: 60, Fairness: 95, CostEfficiency: 40, WorkloadBalance: 90 } },
  { value: 'minimize_workload', label: '⏱ Minimize Workload', weights: { PriorityLevel: 60, RequestedTaskFulfillment: 50, Fairness: 70, CostEfficiency: 90, WorkloadBalance: 95 } },
  { value: 'balanced', label: '🎯 Balanced Approach', weights: { PriorityLevel: 60, RequestedTaskFulfillment: 65, Fairness: 60, CostEfficiency: 60, WorkloadBalance: 65 } },
]

export default function EnhancedPrioritySlider({ onChange, onExport, hasData }: EnhancedPrioritySliderProps) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(criteriaList.map((criteria) => [criteria.key, 50]))
  )
  const [ranking, setRanking] = useState<string[]>(criteriaList.map(c => c.key))
  const [pairwiseMatrix, setPairwiseMatrix] = useState<Record<string, Record<string, number>>>({})
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [inputMethod, setInputMethod] = useState<'sliders' | 'ranking' | 'pairwise' | 'preset'>('sliders')
  const [isExpanded, setIsExpanded] = useState(true)

  // Use ref to store the latest onChange callback to avoid dependency issues
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    // Initialize pairwise matrix
    const matrix: Record<string, Record<string, number>> = {}
    criteriaList.forEach(criteria1 => {
      matrix[criteria1.key] = {}
      criteriaList.forEach(criteria2 => {
        matrix[criteria1.key][criteria2.key] = criteria1.key === criteria2.key ? 1 : 1
      })
    })
    setPairwiseMatrix(matrix)
  }, [])

  const handleConfigChange = useCallback(() => {
    const config: PriorityConfiguration = {
      weights,
      ranking,
      pairwiseMatrix,
      presetProfile: selectedPreset
    }
    onChangeRef.current(config)
  }, [weights, ranking, pairwiseMatrix, selectedPreset])

  useEffect(() => {
    handleConfigChange()
  }, [handleConfigChange])

  const handleWeightChange = (criteriaKey: string, value: number[]) => {
    setWeights(prev => ({ ...prev, [criteriaKey]: value[0] }))
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setRanking((items) => {
        const oldIndex = items.indexOf(active.id)
        const newIndex = items.indexOf(over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handlePairwiseChange = (criteria1: string, criteria2: string, value: number) => {
    setPairwiseMatrix(prev => ({
      ...prev,
      [criteria1]: { ...prev[criteria1], [criteria2]: value },
      [criteria2]: { ...prev[criteria2], [criteria1]: 1 / value }
    }))
  }

  const applyPreset = (presetValue: string) => {
    const preset = presetProfiles.find(p => p.value === presetValue)
    if (preset) {
      setWeights(preset.weights)
      setSelectedPreset(presetValue)
      toast.success(`Applied preset: ${preset.label}`)
    }
  }

  const handleExport = () => {
    if (!hasData) {
      toast.error('No data to export', {
        description: 'Please upload some data first before exporting.'
      })
      return
    }
    onExport()
    toast.success('Export initiated', {
      description: 'Your data and configuration files are being prepared for download.'
    })
  }

  const getCriteriaByKey = (key: string) => criteriaList.find(c => c.key === key)

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-black">
            <Database className="h-5 w-5" />
            Prioritization & Weights
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
              {/* Input Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-black">Input Method</label>
                <Select value={inputMethod} onValueChange={(value) => setInputMethod(value as any)}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="sliders">Sliders & Numeric Inputs</SelectItem>
                    <SelectItem value="ranking">Drag-and-Drop Ranking</SelectItem>
                    <SelectItem value="pairwise">Pairwise Comparison Matrix</SelectItem>
                    <SelectItem value="preset">Preset Profiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sliders Method */}
              {inputMethod === 'sliders' && (
                <div className="space-y-6">
                  <h4 className="font-medium text-black">Adjust Weights</h4>
                  {criteriaList.map((criteria) => {
                    const IconComponent = criteria.icon
                    return (
                      <div key={criteria.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-gray-600" />
                            <label className="text-sm font-medium text-black">{criteria.label}</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={weights[criteria.key]}
                              onChange={(e) => handleWeightChange(criteria.key, [parseInt(e.target.value) || 0])}
                              className="w-16 h-8 text-xs bg-white border-gray-300"
                            />
                            <Badge variant="secondary" className="bg-gray-100 text-black">
                              {weights[criteria.key]}%
                            </Badge>
                          </div>
                        </div>
                        <Slider
                          value={[weights[criteria.key]]}
                          onValueChange={(values) => handleWeightChange(criteria.key, values)}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Ranking Method */}
              {inputMethod === 'ranking' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-black">Drag to Rank by Importance</h4>
                  <p className="text-sm text-gray-600">Most important at the top</p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={ranking} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {ranking.map((criteriaKey, index) => {
                          const criteria = getCriteriaByKey(criteriaKey)
                          if (!criteria) return null
                          const IconComponent = criteria.icon
                          return (
                            <SortableItem key={criteriaKey} id={criteriaKey}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-gray-50 text-black border-gray-300">
                                    #{index + 1}
                                  </Badge>
                                  <IconComponent className="h-4 w-4 text-gray-600" />
                                  <span className="font-medium text-black">{criteria.label}</span>
                                </div>
                              </div>
                            </SortableItem>
                          )
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Pairwise Comparison */}
              {inputMethod === 'pairwise' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-black">Pairwise Comparison Matrix</h4>
                  <p className="text-sm text-gray-600">Compare criteria importance (1 = equal, 9 = extremely more important)</p>
                  <div className="grid gap-2">
                    {criteriaList.slice(0, -1).map((criteria1, i) =>
                      criteriaList.slice(i + 1).map((criteria2) => (
                        <div key={`${criteria1.key}-${criteria2.key}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-black">
                            {criteria1.label} vs {criteria2.label}
                          </span>
                          <Select
                            value={pairwiseMatrix[criteria1.key]?.[criteria2.key]?.toString() || '1'}
                            onValueChange={(value) => handlePairwiseChange(criteria1.key, criteria2.key, parseFloat(value))}
                          >
                            <SelectTrigger className="w-20 bg-white border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Preset Profiles */}
              {inputMethod === 'preset' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-black">Preset Profiles</h4>
                  <div className="grid gap-3">
                    {presetProfiles.map((preset) => (
                      <Card key={preset.value} className={`cursor-pointer border-2 transition-colors ${selectedPreset === preset.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`} onClick={() => applyPreset(preset.value)}>
                        <CardContent className="p-4">
                          <h5 className="font-medium text-black mb-2">{preset.label}</h5>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(preset.weights).map(([key, weight]) => {
                              const criteria = getCriteriaByKey(key)
                              return (
                                <Badge key={key} variant="outline" className="text-xs bg-white text-black border-gray-300">
                                  {criteria?.label}: {weight}%
                                </Badge>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Configuration Summary */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium mb-3 text-black">Current Configuration</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {criteriaList.map((criteria) => (
                    <div key={criteria.key} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-xs text-black">{criteria.label}</div>
                      <div className="text-sm text-gray-600">{weights[criteria.key]}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleExport}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  disabled={!hasData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data & Configuration
                </Button>
                {!hasData && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Upload data first to enable export
                  </p>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
