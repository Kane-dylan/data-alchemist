'use client'
import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import DataTable from '@/components/DataTable'
import RuleManager from '@/components/RuleManager'
import { runValidations, ValidationResult } from '@/utils/validationEngine'
import { downloadCSV, downloadJSON } from '@/utils/download'

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>[]>([])
  const [entityType, setEntityType] = useState<'client' | 'worker' | 'task'>('client')
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])

  // Entity-specific data storage
  const [clients, setClients] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

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
        break
      case 'worker':
        setWorkers(parsed)
        break
      case 'task':
        setTasks(parsed)
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

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-bold">AI Data Cleaner</h1>

      {/* File Upload Section */}
      <FileUpload onData={handleDataUpload} />

      {/* Data Table */}
      {data.length > 0 && <DataTable data={data} errors={errors} />}

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

          {/* Export All Button */}
          <button
            className="bg-black text-white px-6 py-3 rounded mt-4 hover:bg-gray-800 transition-colors"
            onClick={handleExportAll}
          >
            🚀 Generate & Export All
          </button>

          <p className="text-sm text-gray-600">
            Export your cleaned, header-mapped data as CSV files for use in other applications.
            Use "Generate & Export All" to download everything at once.
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
