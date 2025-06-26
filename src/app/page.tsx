'use client'
import FileUpload from '@/components/FileUpload'
import DataTable from '@/components/DataTable'
import { useState } from 'react'

export default function Home() {
  const [data, setData] = useState<any[]>([])

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold">AI Data Cleaner</h1>
      <FileUpload onData={setData} />
      {data.length > 0 && <DataTable data={data} />}
    </main>
  )
}
