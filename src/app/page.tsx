'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Database, ChevronDown } from 'lucide-react'

// Components
import ModernFileUpload from '@/components/ModernFileUpload'
import TabbedDataView from '@/components/TabbedDataView'
import ModularRuleManager from '@/components/ModularRuleManager'
import FilterManager from '@/components/FilterManager'

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
import { safeEvaluateExpression } from '@/lib/filter-utils'
import { toast } from 'sonner'

interface Rule {
  id: string
  type: string
  description: string
  data: any
  confidence?: number
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

  // Rules
  const [rules, setRules] = useState<Rule[]>([])

  // Track applied AI filter queries for duplicate prevention
  const [appliedAIFilters, setAppliedAIFilters] = useState<string[]>([])

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
      setClients(storedData.clients || [])
      setWorkers(storedData.workers || [])
      setTasks(storedData.tasks || [])
      setOriginalClients(storedData.clients || [])
      setOriginalWorkers(storedData.workers || [])
      setOriginalTasks(storedData.tasks || [])

      if (storedData.uploadedFiles) {
        // Handle backward compatibility for files without rowCount
        const compatibleFiles = {
          clients: storedData.uploadedFiles.clients ? {
            ...storedData.uploadedFiles.clients,
            rowCount: storedData.uploadedFiles.clients.rowCount || storedData.clients.length
          } : undefined,
          workers: storedData.uploadedFiles.workers ? {
            ...storedData.uploadedFiles.workers,
            rowCount: storedData.uploadedFiles.workers.rowCount || storedData.workers.length
          } : undefined,
          tasks: storedData.uploadedFiles.tasks ? {
            ...storedData.uploadedFiles.tasks,
            rowCount: storedData.uploadedFiles.tasks.rowCount || storedData.tasks.length
          } : undefined,
        }
        setUploadedFiles(compatibleFiles)
      }

      if (storedData.rules) {
        setRules(storedData.rules)
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
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0 || rules.length > 0) {
      DataStorage.save({
        clients,
        workers,
        tasks,
        lastUpload: new Date().toISOString(),
        uploadedFiles,
        rules
      })
    }
  }, [clients, workers, tasks, uploadedFiles, rules])

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

  const handleDataUpload = (parsed: any[], uploadEntityType: 'client' | 'worker' | 'task', filename?: string) => {
    setData(parsed)
    setEntityType(uploadEntityType)

    const fileInfo = {
      name: filename || `${uploadEntityType}_data.csv`,
      uploadDate: new Date().toISOString(),
      rowCount: parsed.length
    }

    // Store data in entity-specific state
    switch (uploadEntityType) {
      case 'client':
        setClients(parsed)
        setOriginalClients(parsed)
        setUploadedFiles(prev => ({
          ...prev,
          clients: fileInfo
        }))
        break
      case 'worker':
        setWorkers(parsed)
        setOriginalWorkers(parsed)
        setUploadedFiles(prev => ({
          ...prev,
          workers: fileInfo
        }))
        break
      case 'task':
        setTasks(parsed)
        setOriginalTasks(parsed)
        setUploadedFiles(prev => ({
          ...prev,
          tasks: fileInfo
        }))
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

    // Also reset applied AI filters tracking
    setAppliedAIFilters([])

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

  const handleAISuggestion = async (suggestion: any) => {
    try {
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
          toast.success('AI rule applied!', {
            description: `Added rule: ${suggestion.title}`,
            duration: 4000,
          })
          break

        case 'filter':
          if (suggestion.query && suggestion.action === 'apply_filter') {
            // Track the applied filter query to prevent duplicates
            setAppliedAIFilters(prev => [...prev, suggestion.query])

            // Apply the filter suggestion directly to the data
            try {
              toast.loading('Applying AI filter suggestion...', { id: 'ai-filter' })

              // Use AI filtering if available, otherwise fall back to text filtering
              const response = await fetch('/api/filter-expression', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: suggestion.query,
                  data: data.slice(0, 5), // Send sample for context
                  entityType,
                }),
              })

              if (response.ok) {
                const result = await response.json()

                if (result.expression && !result.error) {
                  // Apply AI-generated filter
                  const filteredData = data.filter((row) => {
                    try {
                      // Use the safeEvaluateExpression from filter-utils for consistency
                      return safeEvaluateExpression(result.expression, row)
                    } catch (evalError) {
                      console.warn('AI filter evaluation error:', evalError)
                      return false
                    }
                  })

                  handleFilteredData(filteredData)

                  toast.success(`AI filter applied! Showing ${filteredData.length} of ${data.length} records.`, {
                    id: 'ai-filter',
                    description: `Filter: ${suggestion.query}`,
                    duration: 5000
                  })
                } else {
                  throw new Error(result.error || 'Invalid AI filter expression')
                }
              } else {
                throw new Error('AI filter service unavailable')
              }
            } catch (filterError) {
              console.warn('AI filter failed, falling back to text search:', filterError)

              // Fallback to simple text filtering - DO NOT break UI
              try {
                const searchTerm = suggestion.query.toLowerCase()
                const filteredData = data.filter(item => {
                  return Object.values(item || {}).some(value => {
                    if (value == null) return false
                    return String(value).toLowerCase().includes(searchTerm)
                  })
                })

                handleFilteredData(filteredData)

                toast.success(`Filter suggestion applied! Showing ${filteredData.length} of ${data.length} records.`, {
                  id: 'ai-filter',
                  description: `Used text search for: ${suggestion.query}`,
                  duration: 5000
                })
              } catch (fallbackError) {
                console.error('Fallback filter also failed:', fallbackError)
                // Don't modify data on error - keep UI intact
                toast.error('⚠️ Filter failed to apply', {
                  description: 'Please check your input and try again.',
                  duration: 6000,
                  action: {
                    label: 'Dismiss',
                    onClick: () => toast.dismiss('ai-filter')
                  }
                })
              }
            }
          } else {
            toast.info('Filter suggestion noted', {
              description: suggestion.description,
              duration: 3000
            })
          }
          break

        case 'validation':
          // For now, just show the suggestion - could be enhanced to add actual validation rules
          toast.info('Validation suggestion received', {
            description: suggestion.description,
            duration: 4000,
            action: {
              label: 'Learn More',
              onClick: () => {
                toast.info('Validation Rules', {
                  description: 'This feature allows you to set up automatic data quality checks.',
                  duration: 6000
                })
              }
            }
          })
          break

        default:
          toast.info('AI suggestion received', {
            description: suggestion.description,
            duration: 3000
          })
      }
    } catch (error) {
      console.error('Error applying AI suggestion:', error)
      // Don't break UI - show friendly error message
      toast.error('⚠️ AI suggestion failed to apply', {
        description: 'The suggestion could not be applied. Please try again or apply it manually.',
        duration: 6000,
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss()
        }
      })
    }
  }



  const handleExport = useCallback(async () => {
    try {
      await exportDataPackage({
        clients,
        workers,
        tasks,
        rules
      })
      toast.success('ZIP package exported successfully!')
    } catch {
      toast.error('Export failed', {
        description: 'There was an error preparing your export package.'
      })
    }
  }, [clients, workers, tasks, rules])

  const handleExportClients = useCallback(() => {
    try {
      if (clients.length === 0) {
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
      if (workers.length === 0) {
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
      if (tasks.length === 0) {
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
      if (rules.length === 0) {
        toast.error('No rules to export')
        return
      }
      exportRulesJSON(rules)
      toast.success('Rules JSON exported successfully!')
    } catch (error) {
      toast.error('Failed to export rules JSON')
    }
  }, [rules])

  const handleExportExcel = useCallback(() => {
    try {
      exportExcelFile({
        clients,
        workers,
        tasks,
        rules
      })
      toast.success('Excel file exported successfully!')
    } catch (error) {
      toast.error('Failed to export Excel file')
    }
  }, [clients, workers, tasks, rules])

  const handleTabChange = (entityType: 'client' | 'worker' | 'task') => {
    setEntityType(entityType)
    const dataToShow = entityType === 'client' ? clients :
      entityType === 'worker' ? workers : tasks
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
      { type: 'client' as const, data: entityType === 'client' ? [] : clients },
      { type: 'worker' as const, data: entityType === 'worker' ? [] : workers },
      { type: 'task' as const, data: entityType === 'task' ? [] : tasks }
    ].find(item => item.data.length > 0)

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    disabled={clients.length + workers.length + tasks.length === 0}
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
                      disabled={clients.length === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Clients CSV</div>
                        <div className="text-xs text-gray-500">{clients.length} records</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleExportWorkers}
                      disabled={workers.length === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Workers CSV</div>
                        <div className="text-xs text-gray-500">{workers.length} records</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleExportTasks}
                      disabled={tasks.length === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Tasks CSV</div>
                        <div className="text-xs text-gray-500">{tasks.length} records</div>
                      </div>
                    </Button>

                    <Button
                      onClick={handleExportRules}
                      disabled={rules.length === 0}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">Rules JSON</div>
                        <div className="text-xs text-gray-500">{rules.length} rules</div>
                      </div>
                    </Button>

                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="text-sm font-medium px-3 py-2 text-gray-700">Complete Packages</div>

                    <Button
                      onClick={handleExportExcel}
                      disabled={clients.length + workers.length + tasks.length === 0}
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
                      disabled={clients.length + workers.length + tasks.length === 0}
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
            {data.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FilterManager
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
            {data.length > 0 && (
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
          </div>
        </div>
      </main>

      {/* Floating Components */}
      <AIAssistant
        onApplySuggestion={handleAISuggestion}
        data={data}
        entityType={entityType}
        appliedFilters={appliedAIFilters}
      />
    </div>
  )
}
