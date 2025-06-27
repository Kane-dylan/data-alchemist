'use client'
import React, { useState } from 'react'
import { buildRule, Rule } from '@/utils/ruleBuilder'

type Props = {
  onAddRule: (rule: Rule) => void
}

export default function ManualRuleBuilder({ onAddRule }: Props) {
  const [type, setType] = useState('coRun')
  const [form, setForm] = useState<any>({})

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const rule = buildRule(type as Rule['type'], form)
    onAddRule(rule)
    setForm({})
  }

  const renderFields = () => {
    switch (type) {
      case 'coRun':
        return (
          <input
            className="w-full p-2 border rounded"
            placeholder="Task IDs (comma-separated)"
            onChange={(e) => handleChange('tasks', e.target.value.split(','))}
          />
        )
      case 'loadLimit':
        return (
          <>
            <input
              className="w-full p-2 border rounded mb-2"
              placeholder="Group"
              onChange={(e) => handleChange('group', e.target.value)}
            />
            <input
              className="w-full p-2 border rounded"
              placeholder="Max Slots per Phase"
              type="number"
              onChange={(e) => handleChange('maxSlotsPerPhase', Number(e.target.value))}
            />
          </>
        )
      case 'validation':
        return (
          <>
            <input
              className="w-full p-2 border rounded mb-2"
              placeholder="Field Name"
              onChange={(e) => handleChange('field', e.target.value)}
            />
            <input
              className="w-full p-2 border rounded mb-2"
              placeholder="Min"
              type="number"
              onChange={(e) => handleChange('min', Number(e.target.value))}
            />
            <input
              className="w-full p-2 border rounded"
              placeholder="Max"
              type="number"
              onChange={(e) => handleChange('max', Number(e.target.value))}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4 border p-4 rounded bg-gray-50">
      <h3 className="font-semibold text-lg">Manual Rule Builder</h3>

      {/* Rule Type Dropdown */}
      <select
        className="p-2 border rounded w-full"
        value={type}
        onChange={(e) => {
          setType(e.target.value)
          setForm({})
        }}
      >
        <option value="coRun">Co-Run</option>
        <option value="loadLimit">Load Limit</option>
        <option value="validation">Validation</option>
      </select>

      {/* Dynamic Fields */}
      {renderFields()}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Add Rule
      </button>
    </div>
  )
}
