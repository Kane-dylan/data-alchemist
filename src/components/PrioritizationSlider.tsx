'use client'
import React, { useState } from 'react'

const criteriaList = [
  'PriorityLevel',
  'RequestedTaskFulfillment',
  'Fairness',
  'CostEfficiency',
  'WorkloadBalance',
]

export default function PrioritizationSlider({
  onChange,
}: {
  onChange: (weights: Record<string, number>) => void
}) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(criteriaList.map((key) => [key, 0]))
  )

  function updateWeight(key: string, value: number) {
    const newWeights = { ...weights, [key]: value }
    setWeights(newWeights)
    onChange(newWeights)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Set Priorities</h2>
      {criteriaList.map((key) => (
        <div key={key} className="space-y-1">
          <label className="block text-sm font-medium">{key}</label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={weights[key]}
            onChange={(e) => updateWeight(key, Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-600">Weight: {weights[key]}%</p>
        </div>
      ))}
    </section>
  )
}
