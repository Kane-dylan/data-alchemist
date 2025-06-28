'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, FileText, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import DataTable from './DataTable'
import { toast } from 'sonner'

interface TabbedDataViewProps {
  clients: any[]
  workers: any[]
  tasks: any[]
  errors: Record<string, string>[]
  currentEntityType: 'client' | 'worker' | 'task'
  uploadedFiles?: {
    clients?: { name: string; uploadDate: string }
    workers?: { name: string; uploadDate: string }
    tasks?: { name: string; uploadDate: string }
  }
  onTabChange: (entityType: 'client' | 'worker' | 'task') => void
  onDataChange: (rowIndex: number, columnId: string, value: string) => void
  onDeleteTab: (entityType: 'client' | 'worker' | 'task') => void
}

export default function TabbedDataView({
  clients,
  workers,
  tasks,
  errors,
  currentEntityType,
  uploadedFiles,
  onTabChange,
  onDataChange,
  onDeleteTab
}: TabbedDataViewProps) {
  const [confirmDelete, setConfirmDelete] = useState<'client' | 'worker' | 'task' | null>(null)

  const getTabData = (type: 'client' | 'worker' | 'task') => {
    switch (type) {
      case 'client': return clients
      case 'worker': return workers
      case 'task': return tasks
      default: return []
    }
  }

  const getTabColor = (type: 'client' | 'worker' | 'task') => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'worker': return 'bg-green-100 text-green-800 border-green-300'
      case 'task': return 'bg-purple-100 text-purple-800 border-purple-300'
    }
  }

  const getUploadedFileInfo = (type: 'client' | 'worker' | 'task') => {
    if (!uploadedFiles) return null

    switch (type) {
      case 'client': return uploadedFiles.clients
      case 'worker': return uploadedFiles.workers
      case 'task': return uploadedFiles.tasks
      default: return null
    }
  }

  const handleDeleteConfirm = (entityType: 'client' | 'worker' | 'task') => {
    setConfirmDelete(entityType)
  }

  const handleDeleteCancel = () => {
    setConfirmDelete(null)
  }

  const handleDeleteExecute = () => {
    if (confirmDelete) {
      onDeleteTab(confirmDelete)
      setConfirmDelete(null)
      toast.success(`${confirmDelete} data removed`, {
        description: 'Tab and associated data have been deleted.'
      })
    }
  }

  const availableTabs = [
    { type: 'client' as const, data: clients, label: 'Clients' },
    { type: 'worker' as const, data: workers, label: 'Workers' },
    { type: 'task' as const, data: tasks, label: 'Tasks' }
  ].filter(tab => tab.data.length > 0)

  if (availableTabs.length === 0) {
    return (
      <Card className="w-full bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">No Data Available</h3>
          <p className="text-gray-600">Upload files to view data in tabs</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <FileText className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentEntityType} onValueChange={(value) => onTabChange(value as 'client' | 'worker' | 'task')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-gray-100">
              {availableTabs.map((tab) => (
                <TabsTrigger
                  key={tab.type}
                  value={tab.type}
                  className="data-[state=active]:bg-white data-[state=active]:text-black relative"
                >
                  <div className="flex items-center gap-2">
                    <span>{tab.label}</span>
                    <Badge variant="secondary" className={`text-xs ${getTabColor(tab.type)}`}>
                      {tab.data.length}
                    </Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {availableTabs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteConfirm(currentEntityType)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Delete Tab
              </Button>
            )}
          </div>

          {availableTabs.map((tab) => (
            <TabsContent key={tab.type} value={tab.type}>
              <div className="space-y-4">
                {/* File Info */}
                {getUploadedFileInfo(tab.type) && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black">
                        {getUploadedFileInfo(tab.type)?.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Uploaded: {new Date(getUploadedFileInfo(tab.type)?.uploadDate || '').toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={getTabColor(tab.type)}>
                      {tab.data.length} records
                    </Badge>
                  </div>
                )}

                {/* Data Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DataTable
                    data={tab.data}
                    errors={errors}
                    entityType={tab.type}
                    onDataChange={onDataChange}
                  />
                </motion.div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Confirm Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-black">
                  Are you sure you want to delete all <strong>{confirmDelete}</strong> data?
                  This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleDeleteCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteExecute}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
