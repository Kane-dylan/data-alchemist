// Shared types and utilities for filtering components

export interface FilterChip {
  id: string
  label: string
  type: 'manual' | 'ai'
  query: string
}

export interface FilterError {
  message: string
  details?: string
  type: 'validation' | 'api' | 'expression' | 'network'
}

export interface FilterResult {
  data: any[]
  error?: FilterError
  query?: string // Add query to result for filter chip creation
}

export type EntityType = 'client' | 'worker' | 'task'

// Quick filter presets for each entity type
export const QUICK_FILTERS = {
  client: [
    { label: 'Contains "Corp"', query: 'client name contains Corp' },
    { label: 'Group A Clients', query: 'group tag equals GroupA' },
    { label: 'VIP Clients', query: 'vip client' },
    { label: 'Location: New York', query: 'location is New York' },
    { label: 'Budget > 100k', query: 'budget greater than 100000' },
    { label: 'Has Task TX', query: 'includes TX' },
  ],
  worker: [
    { label: 'Qualification 5', query: 'qualification level is 5' },
    { label: 'Has Coding Skills', query: 'skills include coding' },
    { label: 'Data & ML Skills', query: 'skills contain data and ml' },
    { label: 'Group B Workers', query: 'group is GroupB' },
    { label: 'Available Slot 2', query: 'available slots include 2' },
    { label: 'Max Load 3', query: 'max load per phase equals 3' },
    { label: 'UI/UX Skills', query: 'skills include ui/ux' },
    { label: 'Testing Skills', query: 'skills include testing' },
  ],
  task: [
    { label: 'Duration > 3', query: 'duration greater than 3' },
    { label: 'ETL Category', query: 'category equals ETL' },
    { label: 'Analytics Tasks', query: 'category is Analytics' },
    { label: 'Requires Coding', query: 'required skills include coding' },
    { label: 'Phase 2-4', query: 'preferred phases include 2' },
    { label: 'ML Category', query: 'category equals ML' },
    { label: 'Max Concurrent 1', query: 'max concurrent equals 1' },
    { label: 'Design Tasks', query: 'category is Design' },
  ],
} as const

// Field mappings for natural language to actual field names
export const FIELD_MAPPINGS = {
  'client name': 'ClientName',
  'name': (entityType: EntityType) => 
    entityType === 'client' ? 'ClientName' : 
    entityType === 'worker' ? 'WorkerName' : 'TaskName',
  'group tag': 'GroupTag',
  'group': (entityType: EntityType) => 
    entityType === 'client' ? 'GroupTag' : 'WorkerGroup',
  'qualification level': 'QualificationLevel',
  'qualification': 'QualificationLevel',
  'worker group': 'WorkerGroup',
  'worker name': 'WorkerName',
  'task name': 'TaskName',
  'duration': 'Duration',
  'category': 'Category',
  'skills': (entityType: EntityType) => 
    entityType === 'worker' ? 'Skills' : 'RequiredSkills',
  'required skills': 'RequiredSkills',
  'preferred phases': 'PreferredPhases',
  'phases': 'PreferredPhases',
  'available slots': 'AvailableSlots',
  'slots': 'AvailableSlots'
} as const

/**
 * Helper function to find matching field name in data
 */
export function findMatchingField(fieldName: string, item: any, entityType: EntityType): string | null {
  try {
    // Direct mapping lookup
    const mappingKey = fieldName.toLowerCase()
    const mapping = FIELD_MAPPINGS[mappingKey as keyof typeof FIELD_MAPPINGS]
    
    if (mapping) {
      const resolvedField = typeof mapping === 'function' ? mapping(entityType) : mapping
      if (item.hasOwnProperty(resolvedField)) {
        return resolvedField
      }
    }

    // Fallback to partial matching
    const fieldNames = Object.keys(item || {})
    return fieldNames.find(f =>
      f.toLowerCase().includes(fieldName.toLowerCase()) ||
      fieldName.toLowerCase().includes(f.toLowerCase())
    ) || null
  } catch (error) {
    console.warn('Error finding matching field:', error)
    return null
  }
}

/**
 * Safely parse numeric values with fallback
 */
export function safeParseNumber(value: any): number | null {
  if (value == null) return null
  const num = parseFloat(String(value))
  return isNaN(num) ? null : num
}

/**
 * Create user-friendly error messages from technical errors
 */
export function createUserFriendlyError(error: any): FilterError {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  if (errorMessage.includes('API request failed') || errorMessage.includes('fetch')) {
    return {
      type: 'network',
      message: 'Unable to connect to the AI filtering service',
      details: 'Check your internet connection or try using manual filtering instead.'
    }
  }
  
  if (errorMessage.includes('Invalid filter expression') || errorMessage.includes('Expression evaluation failed')) {
    return {
      type: 'expression',
      message: 'The filter expression could not be applied',
      details: 'Try using simpler language or switch to manual filtering.'
    }
  }
  
  if (errorMessage.includes('No filter expression generated')) {
    return {
      type: 'api',
      message: 'The AI could not understand your filter request',
      details: 'Try examples like: "name contains Corp", "skills include coding"'
    }
  }
  
  return {
    type: 'validation',
    message: 'Filter could not be applied',
    details: 'Please check your input and try again.'
  }
}

/**
 * Validates if a query string is safe and not empty
 */
export function validateQuery(query: string): { isValid: boolean; error?: string } {
  const trimmed = query.trim()
  
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a filter query' }
  }
  
  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Query is too long. Please keep it under 1000 characters.' }
  }
  
  return { isValid: true }
}

/**
 * Cleans and normalizes AI-generated expressions
 */
export function normalizeExpression(expression: string): string {
  let normalized = expression.trim()
  
  // Handle common expression formats
  if (!normalized.startsWith('row.')) {
    // If expression doesn't start with row., try to fix common patterns
    normalized = normalized.replace(/\b(\w+)\b(?=\s*[><=!])/g, 'row.$1')
    normalized = normalized.replace(/\b(\w+)\.includes\(/g, 'row.$1.includes(')
    normalized = normalized.replace(/\b(\w+)\.toLowerCase\(/g, 'row.$1.toLowerCase(')
  }
  
  // Replace common field mappings for better compatibility
  normalized = normalized.replace(/\bitem\./g, 'row.')
  normalized = normalized.replace(/\bdata\./g, 'row.')
  
  return normalized
}

/**
 * Safely evaluates a filter expression against a data row
 */
export function safeEvaluateExpression(expression: string, row: any): boolean {
  try {
    // Ensure row is an object with safe property access
    const safeRow = row || {}
    const normalizedExpression = normalizeExpression(expression)
    
    // Use Function constructor for safer evaluation than eval
    const filterFunction = new Function('row', `
      try {
        // Add helper function for safe property access
        const safeGet = (obj, path) => {
          if (!obj || typeof obj !== 'object') return null
          return obj.hasOwnProperty(path) ? obj[path] : null
        }
        
        return ${normalizedExpression};
      } catch (e) {
        console.warn('Filter expression error:', e.message || e);
        return false;
      }
    `)
    
    return Boolean(filterFunction(safeRow))
  } catch (evalError) {
    console.warn('Filter expression evaluation error:', evalError instanceof Error ? evalError.message : String(evalError))
    return false
  }
}

/**
 * Tests an expression against a small sample before applying to full dataset
 */
export function testExpression(expression: string, sampleData: any[]): { isValid: boolean; error?: string } {
  if (!sampleData.length) {
    return { isValid: true } // No data to test against
  }
  
  try {
    const testSample = sampleData.slice(0, 3)
    for (const row of testSample) {
      safeEvaluateExpression(expression, row)
    }
    return { isValid: true }
  } catch (testError) {
    return { 
      isValid: false, 
      error: `Expression test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`
    }
  }
}
