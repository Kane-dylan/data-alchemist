export interface Rule {
  id: string
  type: string
  description: string
  data: any
  confidence?: number
  createdAt?: string
  updatedAt?: string
}

export interface RulesExport {
  version: string
  exportDate: string
  rules: Rule[]
  metadata: {
    totalRules: number
    ruleTypes: string[]
    exportSource: string
  }
}

export const exportRulesToJSON = (rules: Rule[]): string => {
  const rulesExport: RulesExport = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    rules: rules.map(rule => ({
      ...rule,
      createdAt: rule.createdAt || new Date().toISOString(),
      updatedAt: rule.updatedAt || new Date().toISOString()
    })),
    metadata: {
      totalRules: rules.length,
      ruleTypes: [...new Set(rules.map(r => r.type))],
      exportSource: 'Data Alchemist - Manual Rule Builder'
    }
  }

  return JSON.stringify(rulesExport, null, 2)
}

export const downloadRulesAsJSON = (rules: Rule[], filename: string = 'rules.json') => {
  const jsonContent = exportRulesToJSON(rules)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export const validateRuleStructure = (rule: Rule): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!rule.id) errors.push('Rule ID is required')
  if (!rule.type) errors.push('Rule type is required')
  if (!rule.description) errors.push('Rule description is required')
  if (!rule.data || typeof rule.data !== 'object') errors.push('Rule data must be an object')
  
  // Type-specific validations
  switch (rule.type) {
    case 'coRun':
      if (!rule.data.tasks || !Array.isArray(rule.data.tasks)) {
        errors.push('Co-run rules must have a tasks array')
      }
      break
    
    case 'loadLimit':
      if (!rule.data.group) errors.push('Load limit rules must specify a group')
      if (!rule.data.maxSlotsPerPhase || isNaN(rule.data.maxSlotsPerPhase)) {
        errors.push('Load limit rules must specify maxSlotsPerPhase as a number')
      }
      break
    
    case 'slotRestriction':
      if (!rule.data.clientGroup) errors.push('Slot restriction rules must specify clientGroup')
      if (!rule.data.workerGroup) errors.push('Slot restriction rules must specify workerGroup')
      break
    
    case 'phaseWindow':
      if (!rule.data.taskId) errors.push('Phase window rules must specify taskId')
      if (!rule.data.startPhase || !rule.data.endPhase) {
        errors.push('Phase window rules must specify startPhase and endPhase')
      }
      break
    
    case 'patternMatch':
      if (!rule.data.field) errors.push('Pattern match rules must specify field')
      if (!rule.data.pattern) errors.push('Pattern match rules must specify pattern')
      break
    
    case 'precedence':
      if (!rule.data.ruleName) errors.push('Precedence rules must specify ruleName')
      break
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
