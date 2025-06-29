import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

interface ExportData {
  clients: any[]
  workers: any[]
  tasks: any[]
  rules: any[]
}

export const exportDataPackage = async (data: ExportData): Promise<void> => {
  const zip = new JSZip()

  try {
    // Create CSV files
    if (data.clients.length > 0) {
      const clientsCSV = convertToCSV(data.clients)
      zip.file('clients.csv', clientsCSV)
    }

    if (data.workers.length > 0) {
      const workersCSV = convertToCSV(data.workers)
      zip.file('workers.csv', workersCSV)
    }

    if (data.tasks.length > 0) {
      const tasksCSV = convertToCSV(data.tasks)
      zip.file('tasks.csv', tasksCSV)
    }

    // Create rules.json with configuration
    const rulesConfig = {
      exportDate: new Date().toISOString(),
      rules: data.rules,
      metadata: {
        clientsCount: data.clients.length,
        workersCount: data.workers.length,
        tasksCount: data.tasks.length
      }
    }
    zip.file('rules.json', JSON.stringify(rulesConfig, null, 2))

    // Create Excel file with all data
    const workbook = XLSX.utils.book_new()
    
    if (data.clients.length > 0) {
      const clientsWS = XLSX.utils.json_to_sheet(data.clients)
      XLSX.utils.book_append_sheet(workbook, clientsWS, 'Clients')
    }
    
    if (data.workers.length > 0) {
      const workersWS = XLSX.utils.json_to_sheet(data.workers)
      XLSX.utils.book_append_sheet(workbook, workersWS, 'Workers')
    }
    
    if (data.tasks.length > 0) {
      const tasksWS = XLSX.utils.json_to_sheet(data.tasks)
      XLSX.utils.book_append_sheet(workbook, tasksWS, 'Tasks')
    }

    // Add rules sheet
    if (data.rules.length > 0) {
      const rulesWS = XLSX.utils.json_to_sheet(data.rules)
      XLSX.utils.book_append_sheet(workbook, rulesWS, 'Rules')
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    zip.file('data-export.xlsx', excelBuffer)

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const timestamp = new Date().toISOString().split('T')[0]
    saveAs(zipBlob, `data-alchemist-export-${timestamp}.zip`)
  } catch (error) {
    console.error('Export failed:', error)
    throw new Error('Failed to export data package')
  }
}

// Individual export functions
export const exportClientsCSV = (clients: any[]): void => {
  if (!clients.length) return
  const csv = convertToCSV(clients)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `clients-${timestamp}.csv`)
}

export const exportWorkersCSV = (workers: any[]): void => {
  if (!workers.length) return
  const csv = convertToCSV(workers)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `workers-${timestamp}.csv`)
}

export const exportTasksCSV = (tasks: any[]): void => {
  if (!tasks.length) return
  const csv = convertToCSV(tasks)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `tasks-${timestamp}.csv`)
}

export const exportRulesJSON = (rules: any[]): void => {
  const rulesConfig = {
    exportDate: new Date().toISOString(),
    rules: rules,
    metadata: {
      rulesCount: rules.length
    }
  }
  const json = JSON.stringify(rulesConfig, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const timestamp = new Date().toISOString().split('T')[0]
  saveAs(blob, `rules-${timestamp}.json`)
}

export const exportExcelFile = (data: ExportData): void => {
  const workbook = XLSX.utils.book_new()
  
  if (data.clients.length > 0) {
    const clientsWS = XLSX.utils.json_to_sheet(data.clients)
    XLSX.utils.book_append_sheet(workbook, clientsWS, 'Clients')
  }
  
  if (data.workers.length > 0) {
    const workersWS = XLSX.utils.json_to_sheet(data.workers)
    XLSX.utils.book_append_sheet(workbook, workersWS, 'Workers')
  }
  
  if (data.tasks.length > 0) {
    const tasksWS = XLSX.utils.json_to_sheet(data.tasks)
    XLSX.utils.book_append_sheet(workbook, tasksWS, 'Tasks')
  }

  if (data.rules.length > 0) {
    const rulesWS = XLSX.utils.json_to_sheet(data.rules)
    XLSX.utils.book_append_sheet(workbook, rulesWS, 'Rules')
  }

  const timestamp = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `data-alchemist-export-${timestamp}.xlsx`)
}

const convertToCSV = (data: any[]): string => {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}
