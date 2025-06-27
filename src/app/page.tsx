'use client'
import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import DataTable from '@/components/DataTable'
import RuleManager from '@/components/RuleManager'
import NaturalLanguageFilter from '@/components/NaturalLanguageFilter'
import { runValidations, ValidationResult } from '@/utils/validationEngine'
import { downloadCSV, downloadJSON } from '@/utils/download'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import Papa from 'papaparse'

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>[]>([])
  const [entityType, setEntityType] = useState<'client' | 'worker' | 'task'>('client')
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])

  // Entity-specific data storage
  const [clients, setClients] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  // Original data (for reset functionality)
  const [originalClients, setOriginalClients] = useState<any[]>([])
  const [originalWorkers, setOriginalWorkers] = useState<any[]>([])
  const [originalTasks, setOriginalTasks] = useState<any[]>([])

  // Rules and priorities state (lifted from RuleManager)
  const [rules, setRules] = useState<any[]>([])
  const [priorities, setPriorities] = useState<Record<string, number>>({})

  function handleDataUpload(parsed: any[], uploadEntityType: 'client' | 'worker' | 'task') {
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

    // Run validation using the new validation engine
    const results = runValidations(uploadEntityType, parsed)
    setValidationResults(results)

    // Convert validation results to the format expected by DataTable
    const errorMap: Record<string, string>[] = []
    parsed.forEach((_, index) => {
      const rowErrors: Record<string, string> = {}
      results
        .filter(result => result.rowIndex === index)
        .forEach(result => {
          rowErrors[result.column] = result.message
        })
      errorMap[index] = rowErrors
    })
    setErrors(errorMap)
  }

  function resetFilters() {
    setClients(originalClients)
    setWorkers(originalWorkers)
    setTasks(originalTasks)
    // Reset the displayed data to match current entity type
    switch (entityType) {
      case 'client':
        setData(originalClients)
        break
      case 'worker':
        setData(originalWorkers)
        break
      case 'task':
        setData(originalTasks)
        break
    }

    // Re-run validation on the reset data
    const dataToValidate = entityType === 'client' ? originalClients :
      entityType === 'worker' ? originalWorkers : originalTasks
    const results = runValidations(entityType, dataToValidate)
    setValidationResults(results)

    // Convert validation results to the format expected by DataTable
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
  }

  function handleFilteredData(filteredData: any[]) {
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

    // Re-run validation on the filtered data
    const results = runValidations(entityType, filteredData)
    setValidationResults(results)

    // Convert validation results to the format expected by DataTable
    const errorMap: Record<string, string>[] = []
    filteredData.forEach((_, index) => {
      const rowErrors: Record<string, string> = {}
      results
        .filter(result => result.rowIndex === index)
        .forEach(result => {
          rowErrors[result.column] = result.message
        })
      errorMap[index] = rowErrors
    })
    setErrors(errorMap)
  }

  async function handleExportAllAsZip() {
    if (clients.length === 0 || workers.length === 0 || tasks.length === 0) {
      alert('Please upload and fix all data before exporting.')
      return
    }

    if (rules.length === 0) {
      alert('You must add some rules before exporting.')
      return
    }

    try {
      const zip = new JSZip()

      zip.file('rules.json', JSON.stringify({ rules, priorities }, null, 2))
      zip.file('clients_clean.csv', Papa.unparse(clients))
      zip.file('workers_clean.csv', Papa.unparse(workers))
      zip.file('tasks_clean.csv', Papa.unparse(tasks))

      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, 'cleaned_dataset_bundle.zip')

      alert('ZIP file has been downloaded successfully!')
    } catch (error) {
      console.error('Error creating ZIP:', error)
      alert('Error creating ZIP file. Please try again.')
    }
  }

  function handleExportAll() {
    if (clients.length === 0 || workers.length === 0 || tasks.length === 0) {
      alert('Please upload and fix all data before exporting.')
      return
    }

    if (rules.length === 0) {
      alert('You must add some rules before exporting.')
      return
    }

    downloadCSV(clients, 'clients_clean.csv')
    downloadCSV(workers, 'workers_clean.csv')
    downloadCSV(tasks, 'tasks_clean.csv')
    downloadJSON({ rules, priorities }, 'rules.json')

    alert('All files have been downloaded successfully!')
  }

  function handleDataChange(rowIndex: number, columnId: string, value: string) {
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

    // Re-run validation
    const results = runValidations(entityType, updatedData)
    setValidationResults(results)

    // Convert validation results to the format expected by DataTable
    const errorMap: Record<string, string>[] = []
    updatedData.forEach((_, index) => {
      const rowErrors: Record<string, string> = {}
      results
        .filter(result => result.rowIndex === index)
        .forEach(result => {
          rowErrors[result.column] = result.message
        })
      errorMap[index] = rowErrors
    })
    setErrors(errorMap)
  }

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-bold">AI Data Cleaner</h1>

      {/* File Upload Section */}
      <FileUpload onData={handleDataUpload} />

      {/* Data Table */}
      {data.length > 0 && <DataTable data={data} errors={errors} entityType={entityType} onDataChange={handleDataChange} />}

      {/* Natural Language Filter */}
      {data.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Smart Data Filtering</h3>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <NaturalLanguageFilter
                entityType={entityType}
                data={data}
                onFiltered={handleFilteredData}
              />
            </div>
            <button
              onClick={resetFilters}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
          <div className="text-xs text-gray-500">
            <strong>Examples:</strong>
            <ul className="list-disc ml-5 mt-1">
              <li><em>Tasks:</em> "duration greater than 1" or "category equals ETL" or "preferred phases include 3"</li>
              <li><em>Clients:</em> "priority level is 5" or "client name contains Corp" or "group tag equals GroupA"</li>
              <li><em>Workers:</em> "qualification level greater than 5" or "skills include coding" or "worker group equals GroupB"</li>
            </ul>
          </div>
        </section>
      )}

      {/* Validation Summary */}
      {validationResults.length > 0 && (
        <div className="p-4 border rounded bg-yellow-50">
          <h2 className="font-semibold">Validation Summary ({entityType} data)</h2>
          <p className="text-sm text-gray-600 mb-2">
            Found {validationResults.length} validation error(s)
          </p>
          <ul className="list-disc ml-6 text-sm mt-2 max-h-40 overflow-y-auto">
            {validationResults.map((result, idx) => (
              <li key={idx}>
                Row {result.rowIndex + 1}, <strong>{result.column}</strong>: {result.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CSV Export Section */}
      {(clients.length > 0 || workers.length > 0 || tasks.length > 0) && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Export Cleaned Data</h3>
          <div className="flex flex-wrap gap-2">
            {clients.length > 0 && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                onClick={() => downloadCSV(clients, 'clients_clean.csv')}
              >
                Export Clients CSV ({clients.length} rows)
              </button>
            )}
            {workers.length > 0 && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                onClick={() => downloadCSV(workers, 'workers_clean.csv')}
              >
                Export Workers CSV ({workers.length} rows)
              </button>
            )}
            {tasks.length > 0 && (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                onClick={() => downloadCSV(tasks, 'tasks_clean.csv')}
              >
                Export Tasks CSV ({tasks.length} rows)
              </button>
            )}
          </div>

          {/* Export All Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
              onClick={handleExportAll}
            >
              🚀 Generate & Export All
            </button>
            <button
              className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700 transition-colors"
              onClick={handleExportAllAsZip}
            >
              📦 Export All as ZIP
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Export your cleaned, header-mapped data as CSV files for use in other applications.
            Use "Generate & Export All" to download files separately or "Export All as ZIP" for a bundled download.
          </p>
        </section>
      )}

      {/* Rule Manager Section */}
      <RuleManager
        rules={rules}
        setRules={setRules}
        priorities={priorities}
        setPriorities={setPriorities}
      />
    </main>
  )
}
