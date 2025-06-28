'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface InlineStatsProps {
  clients: any[]
  workers: any[]
  tasks: any[]
  validationResults: any[]
}

export default function InlineStatsPanel({
  clients,
  workers,
  tasks,
  validationResults
}: InlineStatsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const calculateStats = () => {
    const totalRecords = clients.length + workers.length + tasks.length
    const errorCount = validationResults.length
    const completionRate = totalRecords > 0 ? ((totalRecords - errorCount) / totalRecords) * 100 : 0

    return {
      totalRecords,
      errorCount,
      completionRate: Math.round(completionRate),
      lastUpdated: new Date().toLocaleTimeString()
    }
  }

  const stats = calculateStats()

  const getHealthStatus = () => {
    if (stats.completionRate >= 95) return { status: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100 border-green-200' }
    if (stats.completionRate >= 80) return { status: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200' }
    if (stats.completionRate >= 60) return { status: 'Fair', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-200' }
    return { status: 'Poor', color: 'text-red-700', bgColor: 'bg-red-100 border-red-200' }
  }

  const health = getHealthStatus()

  const datasetBreakdown = [
    {
      name: 'Clients',
      count: clients.length,
      icon: '👥',
      errors: validationResults.filter(v => v.entityType === 'client').length
    },
    {
      name: 'Workers',
      count: workers.length,
      icon: '👷',
      errors: validationResults.filter(v => v.entityType === 'worker').length
    },
    {
      name: 'Tasks',
      count: tasks.length,
      icon: '📋',
      errors: validationResults.filter(v => v.entityType === 'task').length
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-40 w-80"
    >
      <Card className="shadow-lg border-2 border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-black">
              <BarChart3 className="h-5 w-5" />
              Dataset Health
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="space-y-4">
                {/* Overall Health */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div>
                    <div className="text-sm text-gray-600">Overall Health</div>
                    <div className={`text-lg font-bold ${health.color}`}>
                      {stats.completionRate}%
                    </div>
                  </div>
                  <Badge variant="secondary" className={`${health.bgColor} ${health.color} border`}>
                    {health.status}
                  </Badge>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 border border-gray-200 rounded bg-white">
                    <div className="text-xs text-gray-600">Total Records</div>
                    <div className="text-lg font-bold text-black">{stats.totalRecords}</div>
                  </div>
                  <div className="text-center p-2 border border-gray-200 rounded bg-white">
                    <div className="text-xs text-gray-600">Errors</div>
                    <div className={`text-lg font-bold ${stats.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.errorCount}
                    </div>
                  </div>
                </div>

                {/* Dataset Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-black">Dataset Breakdown</h4>
                  {datasetBreakdown.map((dataset) => (
                    <div key={dataset.name} className="flex items-center justify-between p-2 border border-gray-200 rounded bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{dataset.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-black">{dataset.name}</div>
                          <div className="text-xs text-gray-600">
                            {dataset.count} records
                          </div>
                        </div>
                      </div>
                      {dataset.errors > 0 && (
                        <Badge variant="destructive" className="text-xs bg-red-100 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {dataset.errors}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Trend Indicator */}
                <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Data Quality
                  </div>
                  <div>Updated {stats.lastUpdated}</div>
                </div>

                {/* Quick Actions */}
                {stats.errorCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-2 bg-orange-50 border border-orange-200 rounded text-xs"
                  >
                    <div className="flex items-center gap-1 text-orange-800">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">Action Required</span>
                    </div>
                    <div className="text-orange-700 mt-1">
                      {stats.errorCount} validation errors need attention
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
