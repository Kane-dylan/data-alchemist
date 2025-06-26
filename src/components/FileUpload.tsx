'use client'
import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export default function FileUpload({ onData }: { onData: (data: any[]) => void }) {
  const [fileName, setFileName] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results: Papa.ParseResult<any>) => onData(results.data),
      })
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (evt) => {
        const bstr = evt.target?.result
        const workbook = XLSX.read(bstr, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(sheet)
        onData(data as any[])
      }
      reader.readAsBinaryString(file)
    }
  }

  return (
    <div className="p-4 border rounded shadow">
      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
      {fileName && <p className="mt-2 text-sm text-gray-500">Uploaded: {fileName}</p>}
    </div>
  )
}
