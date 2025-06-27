'use client'
import React, { useState } from 'react'
import { downloadJSON } from '@/utils/download'
import PrioritizationSlider from './PrioritizationSlider'
import ManualRuleBuilder from './ManualRuleBuilder'

type Rule = Record<string, any>

interface RuleManagerProps {
  rules: Rule[]
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>
  priorities: Record<string, number>
  setPriorities: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

export default function RuleManager({ rules, setRules, priorities, setPriorities }: RuleManagerProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function addRule() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/parse-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleText: input }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRules((prev) => [...prev, json])
      setInput('')
    } catch (err: any) {
      setError(err.message || 'Failed to parse rule')
    } finally {
      setLoading(false)
    }
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }

  function exportRules() {
    downloadJSON({ rules, priorities })
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Rule Builder</h2>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 p-2 border rounded"
          placeholder="Describe a rule in plain English…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={addRule}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Parsing…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Manual Rule Builder */}
      <ManualRuleBuilder onAddRule={(rule) => setRules((prev) => [...prev, rule])} />

      {/* Rules List */}
      {rules.length > 0 && (
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Rule JSON</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-2 py-1 font-mono whitespace-pre-wrap">
                    {JSON.stringify(rule)}
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() => removeRule(idx)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prioritization Slider */}
      <PrioritizationSlider onChange={setPriorities} />

      {/* Export Button */}
      <button
        onClick={exportRules}
        disabled={rules.length === 0}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Download rules.json
      </button>
    </section>
  )
}
