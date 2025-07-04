'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Database, ChevronDown } from 'lucide-react'

// Components
import ModernFileUpload from '@/components/ModernFileUpload'
import TabbedDataView from '@/components/TabbedDataView'
import ModularRuleManager from '@/components/ModularRuleManager'
import ManageFilters from '@/components/ManageFilters'
import EnhancedPrioritySlider from '@/components/EnhancedPrioritySlider'
import AIAssistant from '@/components/AIAssistant'
import InlineStatsPanel from '@/components/InlineStatsPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Utils
import { runValidations, ValidationResult } from '@/utils/validationEngine'
import { DataStorage } from '@/utils/dataStorage'
import {
  exportDataPackage,
  exportClientsCSV,
  exportWorkersCSV,
  exportTasksCSV,
  exportRulesJSON,
  exportExcelFile
} from '@/utils/exportUtility'
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

  // Uploaded files metadata
  const [uploadedFiles, setUploadedFiles] = useState<{
    clients?: { name: string; uploadDate: string; rowCount: number }
    workers?: { name: string; uploadDate: string; rowCount: number }
    tasks?: { name: string; uploadDate: string; rowCount: number }
  }>({})
  // Load persisted data on mount
  useEffect(() => {
    const storedData = DataStorage.load()
    if (storedData) {
      // Ensure all data arrays are properly initialized
      const clientsData = Array.isArray(storedData.clients) ? storedData.clients : []
      const workersData = Array.isArray(storedData.workers) ? storedData.workers : []
      const tasksData = Array.isArray(storedData.tasks) ? storedData.tasks : []
      const rulesData = Array.isArray(storedData.rules) ? storedData.rules : []

      setClients(clientsData)
      setWorkers(workersData)
      setTasks(tasksData)
      setOriginalClients(clientsData)
      setOriginalWorkers(workersData)
      setOriginalTasks(tasksData)

      if (storedData.priorityConfig) {
        setPriorityConfig(storedData.priorityConfig)
      }

      if (storedData.uploadedFiles) {
        // Handle backward compatibility for files without rowCount
        const compatibleFiles = {
          clients: storedData.uploadedFiles.clients ? {
            ...storedData.uploadedFiles.clients,
            rowCount: storedData.uploadedFiles.clients.rowCount || clientsData.length
          } : undefined,
          workers: storedData.uploadedFiles.workers ? {
            ...storedData.uploadedFiles.workers,
            rowCount: storedData.uploadedFiles.workers.rowCount || workersData.length
          } : undefined,
          tasks: storedData.uploadedFiles.tasks ? {
            ...storedData.uploadedFiles.tasks,
            rowCount: storedData.uploadedFiles.tasks.rowCount || tasksData.length
          } : undefined,
        }
        setUploadedFiles(compatibleFiles)
      }

      if (rulesData.length > 0) {
        setRules(rulesData)
      }

      // Set initial data based on what's available
      if (clientsData.length > 0) {
        setData(clientsData)
        setEntityType('client')
      } else if (workersData.length > 0) {
        setData(workersData)
        setEntityType('worker')
      } else if (tasksData.length > 0) {
        setData(tasksData)
        setEntityType('task')
      }

      const totalRecords = clientsData.length + workersData.length + tasksData.length
      if (totalRecords > 0) {
        toast.success('Data restored from previous session', {
          description: `Loaded ${totalRecords} records`,
          duration: 4000,
        })
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0 || rules.length > 0) {
      DataStorage.save({
        clients,
        workers,
        tasks,
        lastUpload: new Date().toISOString(),
        priorityConfig,
        uploadedFiles,
        rules
      })
    }
  }, [clients, workers, tasks, priorityConfig, uploadedFiles, rules])

  const updateValidationState = (uploadEntityType: 'client' | 'worker' | 'task', dataToValidate: any[]) => {
    // Ensure dataToValidate is an array
    const safeData = Array.isArray(dataToValidate) ? dataToValidate : []

    const results = runValidations(uploadEntityType, safeData)
    setValidationResults(results)

    const errorMap: Record<string, string>[] = []
    safeData.forEach((_, index) => {
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

  const handleDataUpload = (parsed: any[], uploadEntityType: 'client' | 'worker' | 'task', filename?: string) => {
    // Ensure parsed is an array
    const safeParsed = Array.isArray(parsed) ? parsed : []
    setData(safeParsed)
    setEntityType(uploadEntityType)

    const fileInfo = {
      name: filename || `${uploadEntityType}_data.csv`,
      uploadDate: new Date().toISOString(),
      rowCount: safeParsed.length
    }

    // Store data in entity-specific state
    switch (uploadEntityType) {
      case 'client':
        setClients(safeParsed)
        setOriginalClients(safeParsed)
        setUploadedFiles(prev => ({
          ...prev,
          clients: fileInfo
        }))
        break
      case 'worker':
        setWorkers(safeParsed)
        setOriginalWorkers(safeParsed)
        setUploadedFiles(prev => ({
          ...prev,
          workers: fileInfo
        }))
        break
      case 'task':
        setTasks(safeParsed)
        setOriginalTasks(safeParsed)
        setUploadedFiles(prev => ({
          ...prev,
          tasks: fileInfo
        }))
        break
    }

    updateValidationState(uploadEntityType, safeParsed)
  }

  const handleFilteredData = (filteredData: any[]) => {
    // Ensure filteredData is an array
    const safeFilteredData = Array.isArray(filteredData) ? filteredData : []
    setData(safeFilteredData)

    // Update the appropriate entity-specific state
    switch (entityType) {
      case 'client':
        setClients(safeFilteredData)
        break
      case 'worker':
        setWorkers(safeFilteredData)
        break
      case 'task':
        setTasks(safeFilteredData)
        break
    }

    updateValidationState(entityType, safeFilteredData)
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
    // Ensure data is an array and rowIndex is valid
    if (!Array.isArray(data) || rowIndex < 0 || rowIndex >= data.length) {
      console.warn('Invalid data or rowIndex in handleDataChange')
      return
    }

    const updatedData = [...data]
    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnId]: value }
    setData(updatedData)

    // Update entity-specific data
    switch (entityType) {
      case 'client':
        if (Array.isArray(clients) && rowIndex < clients.length) {
          const updatedClients = [...clients]
          updatedClients[rowIndex] = { ...updatedClients[rowIndex], [columnId]: value }
          setClients(updatedClients)
        }
        break
      case 'worker':
        if (Array.isArray(workers) && rowIndex < workers.length) {
          const updatedWorkers = [...workers]
          updatedWorkers[rowIndex] = { ...updatedWorkers[rowIndex], [columnId]: value }
          setWorkers(updatedWorkers)
        }
        break
      case 'task':
        if (Array.isArray(tasks) && rowIndex < tasks.length) {
          const updatedTasks = [...tasks]
          updatedTasks[rowIndex] = { ...updatedTasks[rowIndex], [columnId]: value }
          setTasks(updatedTasks)
        }
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
        clients: Array.isArray(clients) ? clients : [],
        workers: Array.isArray(workers) ? workers : [],
        tasks: Array.isArray(tasks) ? tasks : [],
        priorityConfig,
        rules: Array.isArray(rules) ? rules : []
      })
      toast.success('ZIP package exported successfully!')
    } catch {
      toast.error('Export failed', {
        description: 'There was an error preparing your export package.'
      })
    }
  }, [clients, workers, tasks, priorityConfig, rules])

  const handleExportClients = useCallback(() => {
    try {
      if (!Array.isArray(clients) || clients.length === 0) {
        toast.error('No client data to export')
        return
      }
      exportClientsCSV(clients)
      toast.success('Clients CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export clients CSV')
    }
  }, [clients])

  const handleExportWorkers = useCallback(() => {
    try {
      if (!Array.isArray(workers) || workers.length === 0) {
        toast.error('No worker data to export')
        return
      }
      exportWorkersCSV(workers)
      toast.success('Workers CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export workers CSV')
    }
  }, [workers])

  const handleExportTasks = useCallback(() => {
    try {
      if (!Array.isArray(tasks) || tasks.length === 0) {
        toast.error('No task data to export')
        return
      }
      exportTasksCSV(tasks)
      toast.success('Tasks CSV exported successfully!')
    } catch (error) {
      toast.error('Failed to export tasks CSV')
    }
  }, [tasks])

  const handleExportRules = useCallback(() => {
    try {
      if (!Array.isArray(rules) || rules.length === 0) {
        toast.error('No rules to export')
        return
      }
      exportRulesJSON(rules, priorityConfig)
      toast.success('Rules JSON exported successfully!')
    } catch (error) {
      toast.error('Failed to export rules JSON')
    }
  }, [rules, priorityConfig])

  const handleExportExcel = useCallback(() => {
    try {
      exportExcelFile({
        clients: Array.isArray(clients) ? clients : [],
        workers: Array.isArray(workers) ? workers : [],
        tasks: Array.isArray(tasks) ? tasks : [],
        priorityConfig,
        rules: Array.isArray(rules) ? rules : []
      })
      toast.success('Excel file exported successfully!')
    } catch (error) {
      toast.error('Failed to export Excel file')
    }
  }, [clients, workers, tasks, priorityConfig, rules])

  const handleTabChange = (entityType: 'client' | 'worker' | 'task') => {
    setEntityType(entityType)
    const dataToShow = entityType === 'client' ? (Array.isArray(clients) ? clients : []) :
      entityType === 'worker' ? (Array.isArray(workers) ? workers : []) :
        (Array.isArray(tasks) ? tasks : [])
    setData(dataToShow)
    updateValidationState(entityType, dataToShow)
  }

  const handleDeleteTab = (entityType: 'client' | 'worker' | 'task') => {
    switch (entityType) {
      case 'client':
        setClients([])
        setOriginalClients([])
        setUploadedFiles(prev => {
          const newFiles = { ...prev }
          delete newFiles.clients
          return newFiles
        })
        break
      case 'worker':
        setWorkers([])
        setOriginalWorkers([])
        setUploadedFiles(prev => {
          const newFiles = { ...prev }
          delete newFiles.workers
          return newFiles
        })
        break
      case 'task':
        setTasks([])
        setOriginalTasks([])
        setUploadedFiles(prev => {
          const newFiles = { ...prev }
          delete newFiles.tasks
          return newFiles
        })
        break
    }

    // Switch to another available tab if current one is deleted
    const remainingData = [
      { type: 'client' as const, data: entityType === 'client' ? [] : (Array.isArray(clients) ? clients : []) },
      { type: 'worker' as const, data: entityType === 'worker' ? [] : (Array.isArray(workers) ? workers : []) },
      { type: 'task' as const, data: entityType === 'task' ? [] : (Array.isArray(tasks) ? tasks : []) }
    ].find(item => Array.isArray(item.data) && item.data.length > 0)

    if (remainingData) {
      setEntityType(remainingData.type)
      setData(remainingData.data)
      updateValidationState(remainingData.type, remainingData.data)
    } else {
      setData([])
      setErrors([])
      setValidationResults([])
    }
  }

  const hasData = (Array.isArray(clients) ? clients.length : 0) > 0 ||
    (Array.isArray(workers) ? workers.length : 0) > 0 ||
    (Array.isArray(tasks) ? tasks.length : 0) > 0

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
                  {(Array.isArray(clients) ? clients.length : 0) +
                    (Array.isArray(workers) ? workers.length : 0) +
                    (Array.isArray(tasks) ? tasks.length : 0)} Records
                </div>
                <div className="text-xs text-gray-600">
                  {Array.isArray(validationResults) ? validationResults.length : 0} Issues
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    disabled={(Array.isArray(clients) ? clients.length : 0) +
                      (Array.isArray(workers) ? workers.length : 0) +
                      (Array.isArray(tasks) ? tasks.length : 0) === 0}
                  >
                    Export Data
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-2">
                    <div className="text-sm font-medium px-3 py-2 text-gray-700">Individual Files</div>

                    <Button
                      onClick={handleExportClients}
                      disabled={(Array.isArray(clients) ? clients.length : 0) === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Clients CSV</div>
                        <div className="text-xs text-gray-500">{Array.isArray(clients) ? clients.length : 0} records</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleExportWorkers}
                      disabled={(Array.isArray(workers) ? workers.length : 0) === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Workers CSV</div>
                        <div className="text-xs text-gray-500">{Array.isArray(workers) ? workers.length : 0} records</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleExportTasks}
                      disabled={(Array.isArray(tasks) ? tasks.length : 0) === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Tasks CSV</div>
                        <div className="text-xs text-gray-500">{Array.isArray(tasks) ? tasks.length : 0} records</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleExportRules}
                      disabled={(Array.isArray(rules) ? rules.length : 0) === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Rules JSON</div>
                        <div className="text-xs text-gray-500">{Array.isArray(rules) ? rules.length : 0} rules</div>
                      </div>
                    </Button>

                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="text-sm font-medium px-3 py-2 text-gray-700">Complete Packages</div>

                    <Button
                      onClick={handleExportExcel}
                      disabled={(Array.isArray(clients) ? clients.length : 0) +
                        (Array.isArray(workers) ? workers.length : 0) +
                        (Array.isArray(tasks) ? tasks.length : 0) === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Excel Workbook</div>
                        <div className="text-xs text-gray-500">All data in one file</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleExport}
                      disabled={(Array.isArray(clients) ? clients.length : 0) +
                        (Array.isArray(workers) ? workers.length : 0) +
                        (Array.isArray(tasks) ? tasks.length : 0) === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">ZIP Package</div>
                        <div className="text-xs text-gray-500">CSVs + Excel + Rules</div>
                      </div>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
            {Array.isArray(data) && data.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ManageFilters
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
                  <TabbedDataView
                    clients={clients}
                    workers={workers}
                    tasks={tasks}
                    errors={errors}
                    currentEntityType={entityType}
                    uploadedFiles={uploadedFiles}
                    onTabChange={handleTabChange}
                    onDataChange={handleDataChange}
                    onDeleteTab={handleDeleteTab}
                  />
                </motion.div>
              </>
            )}
          </div>

          {/* Right Column - Configuration */}
          <div className="space-y-8">
            {/* Data Health Panel */}
            {Array.isArray(data) && data.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <InlineStatsPanel
                  clients={clients}
                  workers={workers}
                  tasks={tasks}
                  validationResults={validationResults}
                />
              </motion.div>
            )}

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
    </div>
  )
}
