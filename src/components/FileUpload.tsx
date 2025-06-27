'use client'
import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { mapHeadersWithClaude } from '@/utils/mapHeaders'

export default function FileUpload({ onData }: { onData: (data: any[], entityType: 'client' | 'worker' | 'task') => void }) {
  const [fileName, setFileName] = useState('')
  const [entityType, setEntityType] = useState<'client' | 'worker' | 'task'>('client')
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setIsProcessing(true)

    try {
      if (file.name.endsWith('.csv')) {
        await handleCSVFile(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleExcelFile(file)
      }
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleCSVFile(file: File) {
    Papa.parse(file, {
      header: true,
      complete: async (results: Papa.ParseResult<any>) => {
        await processData(results.data, results.meta.fields || [])
      },
    })
  }

  async function handleExcelFile(file: File) {
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const workbook = XLSX.read(bstr, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet)

      // Extract headers from the first row
      const headers = data.length > 0 ? Object.keys(data[0] as any) : []
      await processData(data, headers)
    }
    reader.readAsBinaryString(file)
  }

  async function processData(rawData: any[], headers: string[]) {
    if (rawData.length === 0) {
      onData([], entityType)
      return
    }

    try {
      // Map headers using Claude
      const headerMap = await mapHeadersWithClaude(headers, entityType)

      // Remap the data using the header mapping
      const remappedData = rawData.map((row) => {
        const newRow: any = {}
        Object.keys(row).forEach((oldKey) => {
          const newKey = headerMap[oldKey] || oldKey
          newRow[newKey] = row[oldKey]
        })
        return newRow
      })

      onData(remappedData, entityType)
    } catch (error) {
      console.error('Error mapping headers:', error)
      // Fallback to original data if header mapping fails
      onData(rawData, entityType)
    }
  }

  return (
    <div className="p-4 border rounded shadow">
      <div className="space-y-4">
        {/* Entity Type Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Data Type:</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as 'client' | 'worker' | 'task')}
            className="p-2 border rounded"
            disabled={isProcessing}
          >
            <option value="client">Client Data</option>
            <option value="worker">Worker Data</option>
            <option value="task">Task Data</option>
          </select>
        </div>

        {/* File Input */}
        <div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          {isProcessing && (
            <p className="mt-2 text-sm text-blue-600">
              Processing file and mapping headers...
            </p>
          )}
          {fileName && !isProcessing && (
            <p className="mt-2 text-sm text-gray-500">
              Uploaded: {fileName} (mapped to {entityType} schema)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
