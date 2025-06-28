'use client'

import React, { useState, useCallback } from 'react'
import { Upload, File, X, FileText, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { mapHeadersWithClaude } from '@/utils/mapHeaders'
import { toast } from 'sonner'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  entityType: 'client' | 'worker' | 'task'
}

interface ModernFileUploadProps {
  onData: (data: any[], entityType: 'client' | 'worker' | 'task') => void
}

export default function ModernFileUpload({ onData }: ModernFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [entityType, setEntityType] = useState<'client' | 'worker' | 'task'>('client')
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('csv')) return <FileText className="h-4 w-4 text-green-500" />
    if (type.includes('excel') || type.includes('xlsx')) return <Database className="h-4 w-4 text-blue-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      toast.error('Please upload only CSV or Excel files')
      return
    }

    setIsProcessing(true)
    toast.loading('Processing file and mapping headers...', { id: 'processing' })

    try {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        entityType
      }

      setFiles(prev => [...prev, uploadedFile])

      if (file.name.endsWith('.csv')) {
        await handleCSVFile(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleExcelFile(file)
      }

      toast.success(`File processed successfully! Mapped to ${entityType} schema.`, { id: 'processing' })
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Error processing file. Please try again.', { id: 'processing' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCSVFile = async (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: async (results: Papa.ParseResult<any>) => {
        await processData(results.data, results.meta.fields || [])
      },
    })
  }

  const handleExcelFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const workbook = XLSX.read(bstr, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet)

      const headers = data.length > 0 ? Object.keys(data[0] as any) : []
      await processData(data, headers)
    }
    reader.readAsBinaryString(file)
  }

  const processData = async (rawData: any[], headers: string[]) => {
    if (rawData.length === 0) {
      onData([], entityType)
      return
    }

    try {
      const headerMap = await mapHeadersWithClaude(headers, entityType)

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
      onData(rawData, entityType)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getEntityTypeColor = (type: 'client' | 'worker' | 'task') => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-800'
      case 'worker': return 'bg-green-100 text-green-800'
      case 'task': return 'bg-purple-100 text-purple-800'
    }
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Upload className="h-5 w-5" />
          File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entity Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Data Type:</label>
          <div className="flex gap-2">
            {['client', 'worker', 'task'].map((type) => (
              <Button
                key={type}
                variant={entityType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntityType(type as 'client' | 'worker' | 'task')}
                disabled={isProcessing}
                className={entityType === type ? 'bg-gray-900 text-white hover:bg-gray-800' : 'border-gray-300 text-black hover:bg-gray-50'}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 bg-gray-50'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-black">
                {dragActive ? 'Drop file here' : 'Drag and drop or click to upload'}
              </p>
              <p className="text-xs text-gray-600">
                Supports CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-black">Uploaded Files</h4>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-black">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">
                          {formatFileSize(file.size)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getEntityTypeColor(file.entityType)}`}
                        >
                          {file.entityType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    disabled={isProcessing}
                    className="hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Processing file and mapping headers...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
