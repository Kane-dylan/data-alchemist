'use client'
import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import DataTable from '@/components/DataTable'
import RuleManager from '@/components/RuleManager'
import { validateClients } from '@/utils/validateData'

export default function Home() {
  const [data, setData] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>[]>([])

  function handleDataUpload(parsed: any[]) {
    setData(parsed)

    const result = validateClients(parsed)
    setErrors(result.errors)
  }

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-bold">AI Data Cleaner</h1>

      {/* File Upload Section */}
      <FileUpload onData={handleDataUpload} />

      {/* Data Table */}
      {data.length > 0 && <DataTable data={data} errors={errors} />}

      {/* Validation Summary */}
      {errors.length > 0 && (
        <div className="p-4 border rounded bg-yellow-50">
          <h2 className="font-semibold">Validation Summary</h2>
          <ul className="list-disc ml-6 text-sm mt-2">
            {errors.map((row, idx) =>
              Object.keys(row).map((col) => (
                <li key={`${idx}-${col}`}>
                  Row {idx + 1}, <strong>{col}</strong>: {row[col]}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Rule Manager Section */}
      <RuleManager />
    </main>
  )
}
