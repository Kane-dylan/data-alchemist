'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Database } from 'lucide-react'

// Components
import ModernFileUpload from '@/components/ModernFileUpload'
import DataTable from '@/components/DataTable'
import ModularRuleManager from '@/components/ModularRuleManager'
import EnhancedFilter from '@/components/EnhancedFilter'
import EnhancedPrioritySlider from '@/components/EnhancedPrioritySlider'
import AIAssistant from '@/components/AIAssistant'
import InlineStatsPanel from '@/components/InlineStatsPanel'

// Utils
import { runValidations, ValidationResult } from '@/utils/validationEngine'
import { DataStorage } from '@/utils/dataStorage'
import { exportDataPackage } from '@/utils/exportUtility'
import { toast } from 'sonner'

interface Rule {
  id: string
  type: string
  description: string
  data: any
  confidence?: number
}

interface PriorityConfiguration {
  weights: Record<string, number>
  ranking: string[]
  pairwiseMatrix: Record<string, Record<string, number>>
  presetProfile: string
}

export default function Home() {
  // Core data state
  const [data, setData] = useState<any[]>([])
  const [entityType, setEntityType] = useState<'client' | 'worker' | 'task'>('client')
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [errors, setErrors] = useState<Record<string, string>[]>([])

  // Entity-specific data storage
  const [clients, setClients] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  // Original data for reset functionality
  const [originalClients, setOriginalClients] = useState<any[]>([])
  const [originalWorkers, setOriginalWorkers] = useState<any[]>([])
  const [originalTasks, setOriginalTasks] = useState<any[]>([])

  // Rules and priorities
  const [rules, setRules] = useState<Rule[]>([])
  const [priorityConfig, setPriorityConfig] = useState<PriorityConfiguration>({
    weights: {},
    ranking: [],
    pairwiseMatrix: {},
    presetProfile: ''
  })

  // Load persisted data on mount
  useEffect(() => {
    const storedData = DataStorage.load()
    if (storedData) {
      setClients(storedData.clients || [])
      setWorkers(storedData.workers || [])
      setTasks(storedData.tasks || [])
      setOriginalClients(storedData.clients || [])
      setOriginalWorkers(storedData.workers || [])
      setOriginalTasks(storedData.tasks || [])

      if (storedData.priorityConfig) {
        setPriorityConfig(storedData.priorityConfig)
      }

      // Set initial data based on what's available
      if (storedData.clients.length > 0) {
        setData(storedData.clients)
        setEntityType('client')
      } else if (storedData.workers.length > 0) {
        setData(storedData.workers)
        setEntityType('worker')
      } else if (storedData.tasks.length > 0) {
        setData(storedData.tasks)
        setEntityType('task')
      }

      toast.success('Data restored from previous session', {
        description: `Loaded ${storedData.clients.length + storedData.workers.length + storedData.tasks.length} records`,
        duration: 4000,
      })
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      DataStorage.save({
        clients,
        workers,
        tasks,
        lastUpload: new Date().toISOString(),
        priorityConfig
      })
    }
  }, [clients, workers, tasks, priorityConfig])

  const updateValidationState = (uploadEntityType: 'client' | 'worker' | 'task', dataToValidate: any[]) => {
    const results = runValidations(uploadEntityType, dataToValidate)
    setValidationResults(results)

    const errorMap: Record<string, string>[] = []
    dataToValidate.forEach((_, index) => {
      const rowErrors: Record<string, string> = {}
      results
        .filter(result => result.rowIndex === index)
        .forEach(result => {
          rowErrors[result.column] = result.message
        })
      errorMap[index] = rowErrors
    })
    setErrors(errorMap)

    // Show validation summary
    if (results.length > 0) {
      toast.error(`Found ${results.length} validation errors`, {
        description: 'Check the data table for details and corrections needed.',
        duration: 6000,
      })
    } else {
      toast.success('Data validation passed!', {
        description: 'All records meet quality standards.',
        duration: 3000,
      })
    }
  }

  const handleDataUpload = (parsed: any[], uploadEntityType: 'client' | 'worker' | 'task') => {
    setData(parsed)
    setEntityType(uploadEntityType)

    // Store data in entity-specific state
    switch (uploadEntityType) {
      case 'client':
        setClients(parsed)
        setOriginalClients(parsed)
        break
      case 'worker':
        setWorkers(parsed)
        setOriginalWorkers(parsed)
        break
      case 'task':
        setTasks(parsed)
        setOriginalTasks(parsed)
        break
    }

    updateValidationState(uploadEntityType, parsed)
  }

  const handleFilteredData = (filteredData: any[]) => {
    setData(filteredData)

    // Update the appropriate entity-specific state
    switch (entityType) {
      case 'client':
        setClients(filteredData)
        break
      case 'worker':
        setWorkers(filteredData)
        break
      case 'task':
        setTasks(filteredData)
        break
    }

    updateValidationState(entityType, filteredData)
  }

  const resetFilters = () => {
    setClients(originalClients)
    setWorkers(originalWorkers)
    setTasks(originalTasks)

    // Reset the displayed data to match current entity type
    const dataToReset = entityType === 'client' ? originalClients :
      entityType === 'worker' ? originalWorkers : originalTasks

    setData(dataToReset)
    updateValidationState(entityType, dataToReset)

    toast.success('Filters reset', {
      description: 'Showing original dataset.',
      duration: 2000,
    })
  }

  const handleDataChange = (rowIndex: number, columnId: string, value: string) => {
    const updatedData = [...data]
    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnId]: value }
    setData(updatedData)

    // Update entity-specific data
    switch (entityType) {
      case 'client':
        const updatedClients = [...clients]
        updatedClients[rowIndex] = { ...updatedClients[rowIndex], [columnId]: value }
        setClients(updatedClients)
        break
      case 'worker':
        const updatedWorkers = [...workers]
        updatedWorkers[rowIndex] = { ...updatedWorkers[rowIndex], [columnId]: value }
        setWorkers(updatedWorkers)
        break
      case 'task':
        const updatedTasks = [...tasks]
        updatedTasks[rowIndex] = { ...updatedTasks[rowIndex], [columnId]: value }
        setTasks(updatedTasks)
        break
    }

    updateValidationState(entityType, updatedData)
  }

  const handleAISuggestion = (suggestion: any) => {
    switch (suggestion.type) {
      case 'rule':
        const newRule: Rule = {
          id: Date.now().toString(),
          type: 'ai-generated',
          description: suggestion.title,
          data: { type: 'ai', description: suggestion.description },
          confidence: suggestion.confidence,
        }
        setRules(prev => [...prev, newRule])
        toast.success('AI suggestion applied!', {
          description: `Added rule: ${suggestion.title}`,
          duration: 4000,
        })
        break
      case 'filter':
        toast.info('Filter suggestion received', {
          description: 'This would apply the suggested filter to your data.',
        })
        break
      case 'validation':
        toast.info('Validation suggestion received', {
          description: 'This would add the suggested validation rule.',
        })
        break
    }
  }

  const handlePriorityConfigChange = useCallback((config: PriorityConfiguration) => {
    setPriorityConfig(config)
  }, [])

  const handleExport = useCallback(async () => {
    try {
      await exportDataPackage({
        clients,
        workers,
        tasks,
        priorityConfig,
        rules
      })
    } catch {
      toast.error('Export failed', {
        description: 'There was an error preparing your export package.'
      })
    }
  }, [clients, workers, tasks, priorityConfig, rules])

  const hasData = clients.length > 0 || workers.length > 0 || tasks.length > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Data Alchemist
                </h1>
                <p className="text-sm text-gray-600">
                  AI-powered data cleaning and rule management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-4">
                <div className="text-sm font-medium text-black">
                  {clients.length + workers.length + tasks.length} Records
                </div>
                <div className="text-xs text-gray-600">
                  {validationResults.length} Issues
                </div>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Export Data
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Data Management */}
          <div className="lg:col-span-2 space-y-8">
            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ModernFileUpload onData={handleDataUpload} />
            </motion.div>

            {/* Data Table with Filter */}
            {data.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <EnhancedFilter
                    data={data}
                    entityType={entityType}
                    onFilteredData={handleFilteredData}
                    onResetFilters={resetFilters}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <DataTable
                    data={data}
                    errors={errors}
                    entityType={entityType}
                    onDataChange={handleDataChange}
                  />
                </motion.div>
              </>
            )}
          </div>

          {/* Right Column - Configuration */}
          <div className="space-y-8">
            {/* Rule Management */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ModularRuleManager
                rules={rules}
                setRules={setRules}
              />
            </motion.div>

            {/* Priority Configuration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <EnhancedPrioritySlider
                onChange={handlePriorityConfigChange}
                onExport={handleExport}
                hasData={hasData}
              />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Floating Components */}
      <AIAssistant onApplySuggestion={handleAISuggestion} />

      {data.length > 0 && (
        <InlineStatsPanel
          clients={clients}
          workers={workers}
          tasks={tasks}
          validationResults={validationResults}
        />
      )}
    </div>
  )
}
