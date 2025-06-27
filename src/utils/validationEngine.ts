type DataRow = Record<string, any>

export type ValidationResult = {
  rowIndex: number
  column: string
  message: string
}

export function validateClients(clients: DataRow[]): ValidationResult[] {
  const errors: ValidationResult[] = []
  const seenIds = new Set()

  clients.forEach((row, i) => {
    // Required fields
    if (!row.ClientID) {
      errors.push({ rowIndex: i, column: 'ClientID', message: 'Missing ClientID' })
    }

    if (!row.ClientName) {
      errors.push({ rowIndex: i, column: 'ClientName', message: 'Missing ClientName' })
    }

    // Duplicate IDs
    if (row.ClientID && seenIds.has(row.ClientID)) {
      errors.push({ rowIndex: i, column: 'ClientID', message: 'Duplicate ClientID' })
    } else if (row.ClientID) {
      seenIds.add(row.ClientID)
    }

    // Priority range (must be integer 1-5)
    const priority = Number(row.PriorityLevel)
    if (row.PriorityLevel !== undefined && row.PriorityLevel !== null && row.PriorityLevel !== '') {
      if (isNaN(priority) || priority < 1 || priority > 5 || !Number.isInteger(priority)) {
        errors.push({ rowIndex: i, column: 'PriorityLevel', message: 'PriorityLevel must be integer 1–5' })
      }
    }

    // JSON validation for AttributesJSON
    if (row.AttributesJSON) {
      try {
        JSON.parse(row.AttributesJSON)
      } catch {
        errors.push({ rowIndex: i, column: 'AttributesJSON', message: 'Invalid JSON' })
      }
    }

    // RequestedTaskIDs validation (comma-separated TaskIDs like "T1,T2,T3")
    if (row.RequestedTaskIDs) {
      if (typeof row.RequestedTaskIDs === 'string') {
        const taskIds = row.RequestedTaskIDs.split(',').map(id => id.trim())
        const invalidTaskIds = taskIds.filter(id => !id.match(/^T\d+$/))
        if (invalidTaskIds.length > 0) {
          errors.push({ rowIndex: i, column: 'RequestedTaskIDs', message: 'TaskIDs must be in format T1,T2,T3...' })
        }
      } else if (Array.isArray(row.RequestedTaskIDs)) {
        const invalidTaskIds = row.RequestedTaskIDs.filter((id: string) => !String(id).match(/^T\d+$/))
        if (invalidTaskIds.length > 0) {
          errors.push({ rowIndex: i, column: 'RequestedTaskIDs', message: 'TaskIDs must be in format T1,T2,T3...' })
        }
      } else {
        errors.push({ rowIndex: i, column: 'RequestedTaskIDs', message: 'RequestedTaskIDs must be comma-separated string or array' })
      }
    }
  })

  return errors
}

export function validateTasks(tasks: DataRow[]): ValidationResult[] {
  const errors: ValidationResult[] = []
  const seenIds = new Set()

  tasks.forEach((row, i) => {
    // Required fields
    if (!row.TaskID) {
      errors.push({ rowIndex: i, column: 'TaskID', message: 'Missing TaskID' })
    }

    if (!row.TaskName) {
      errors.push({ rowIndex: i, column: 'TaskName', message: 'Missing TaskName' })
    }

    if (!row.Category) {
      errors.push({ rowIndex: i, column: 'Category', message: 'Missing Category' })
    }

    // Duplicate IDs
    if (row.TaskID && seenIds.has(row.TaskID)) {
      errors.push({ rowIndex: i, column: 'TaskID', message: 'Duplicate TaskID' })
    } else if (row.TaskID) {
      seenIds.add(row.TaskID)
    }

    // Duration validation (number of phases, must be ≥1)
    if (row.Duration !== undefined && row.Duration !== null && row.Duration !== '') {
      const duration = Number(row.Duration)
      if (isNaN(duration) || duration < 1) {
        errors.push({ rowIndex: i, column: 'Duration', message: 'Duration must be ≥1 phases' })
      }
    }

    // RequiredSkills validation (comma-separated tags like "coding,analysis")
    if (row.RequiredSkills) {
      if (typeof row.RequiredSkills === 'string') {
        const skills = row.RequiredSkills.split(',').map(skill => skill.trim())
        if (skills.some(skill => skill.length === 0)) {
          errors.push({ rowIndex: i, column: 'RequiredSkills', message: 'Skills cannot contain empty values' })
        }
      } else if (!Array.isArray(row.RequiredSkills)) {
        errors.push({ rowIndex: i, column: 'RequiredSkills', message: 'RequiredSkills must be comma-separated string or array' })
      }
    }

    // MaxConcurrent validation (max parallel assignments, positive integer)
    if (row.MaxConcurrent !== undefined && row.MaxConcurrent !== null && row.MaxConcurrent !== '') {
      const maxConcurrent = Number(row.MaxConcurrent)
      if (isNaN(maxConcurrent) || maxConcurrent < 1 || !Number.isInteger(maxConcurrent)) {
        errors.push({ rowIndex: i, column: 'MaxConcurrent', message: 'MaxConcurrent must be positive integer' })
      }
    }

    // PreferredPhases validation (list or range syntax: "1-3" or [2,4,5] or "1,2,3")
    if (row.PreferredPhases) {
      if (typeof row.PreferredPhases === 'string') {
        // Handle JSON array format like "[2,4,5]"
        if (row.PreferredPhases.startsWith('[') && row.PreferredPhases.endsWith(']')) {
          try {
            const phases = JSON.parse(row.PreferredPhases)
            if (!Array.isArray(phases) || phases.some(phase => isNaN(Number(phase)) || Number(phase) < 1)) {
              errors.push({ rowIndex: i, column: 'PreferredPhases', message: 'Phases must be positive numbers in array format [1,2,3]' })
            }
          } catch {
            errors.push({ rowIndex: i, column: 'PreferredPhases', message: 'Invalid JSON array format for PreferredPhases' })
          }
        }
        // Handle range syntax like "1-3"
        else if (row.PreferredPhases.includes('-')) {
          const rangeParts = row.PreferredPhases.split('-').map(part => part.trim())
          if (rangeParts.length !== 2 || rangeParts.some(part => isNaN(Number(part)))) {
            errors.push({ rowIndex: i, column: 'PreferredPhases', message: 'Range format must be "1-3" or use comma-separated values' })
          }
        }
        // Handle comma-separated like "1,2,3"
        else {
          const phases = row.PreferredPhases.split(',').map(phase => phase.trim())
          if (phases.some(phase => isNaN(Number(phase)) || Number(phase) < 1)) {
            errors.push({ rowIndex: i, column: 'PreferredPhases', message: 'Phases must be positive numbers' })
          }
        }
      } else if (Array.isArray(row.PreferredPhases)) {
        if (row.PreferredPhases.some((phase: any) => isNaN(Number(phase)) || Number(phase) < 1)) {
          errors.push({ rowIndex: i, column: 'PreferredPhases', message: 'Phases must be positive numbers' })
        }
      } else {
        errors.push({ rowIndex: i, column: 'PreferredPhases', message: 'PreferredPhases must be range "1-3", comma-separated "1,2,3", or array [1,2,3]' })
      }
    }
  })

  return errors
}

export function validateWorkers(workers: DataRow[]): ValidationResult[] {
  const errors: ValidationResult[] = []
  const seenIds = new Set()

  workers.forEach((row, i) => {
    // Required fields
    if (!row.WorkerID) {
      errors.push({ rowIndex: i, column: 'WorkerID', message: 'Missing WorkerID' })
    }

    if (!row.WorkerName) {
      errors.push({ rowIndex: i, column: 'WorkerName', message: 'Missing WorkerName' })
    }

    // Duplicate IDs
    if (row.WorkerID && seenIds.has(row.WorkerID)) {
      errors.push({ rowIndex: i, column: 'WorkerID', message: 'Duplicate WorkerID' })
    } else if (row.WorkerID) {
      seenIds.add(row.WorkerID)
    }

    // AvailableSlots validation (should be array of phase numbers like [1,3,5])
    if (row.AvailableSlots) {
      if (typeof row.AvailableSlots === 'string') {
        try {
          const slots = JSON.parse(row.AvailableSlots)
          if (!Array.isArray(slots) || slots.some(slot => isNaN(Number(slot)) || Number(slot) < 1)) {
            errors.push({ rowIndex: i, column: 'AvailableSlots', message: 'AvailableSlots must be array of positive phase numbers like [1,3,5]' })
          }
        } catch {
          errors.push({ rowIndex: i, column: 'AvailableSlots', message: 'AvailableSlots must be valid JSON array like [1,3,5]' })
        }
      } else if (Array.isArray(row.AvailableSlots)) {
        if (row.AvailableSlots.some((slot: any) => isNaN(Number(slot)) || Number(slot) < 1)) {
          errors.push({ rowIndex: i, column: 'AvailableSlots', message: 'AvailableSlots must contain positive phase numbers' })
        }
      } else {
        errors.push({ rowIndex: i, column: 'AvailableSlots', message: 'AvailableSlots must be array of phase numbers like [1,3,5]' })
      }
    }

    // MaxLoadPerPhase validation (should be positive integer)
    const maxLoad = Number(row.MaxLoadPerPhase)
    if (row.MaxLoadPerPhase && (isNaN(maxLoad) || maxLoad < 1 || !Number.isInteger(maxLoad))) {
      errors.push({ rowIndex: i, column: 'MaxLoadPerPhase', message: 'MaxLoadPerPhase must be a positive integer' })
    }

    // QualificationLevel validation (should be 1-10)
    const qualLevel = Number(row.QualificationLevel)
    if (row.QualificationLevel && (isNaN(qualLevel) || qualLevel < 1 || qualLevel > 10)) {
      errors.push({ rowIndex: i, column: 'QualificationLevel', message: 'QualificationLevel must be between 1-10' })
    }

    // Skills validation (comma-separated or array)
    if (row.Skills) {
      const skills = typeof row.Skills === 'string' 
        ? row.Skills.split(',') 
        : row.Skills
      
      if (!Array.isArray(skills) && typeof row.Skills !== 'string') {
        errors.push({ rowIndex: i, column: 'Skills', message: 'Skills must be comma-separated string or array' })
      }
    }

    // WorkerGroup validation (should not be empty if provided)
    if (row.WorkerGroup !== undefined && row.WorkerGroup !== null && String(row.WorkerGroup).trim() === '') {
      errors.push({ rowIndex: i, column: 'WorkerGroup', message: 'WorkerGroup cannot be empty' })
    }
  })

  return errors
}

// Central validation dispatcher
export function runValidations(entityType: 'client' | 'worker' | 'task', rows: DataRow[]): ValidationResult[] {
  switch (entityType) {
    case 'client':
      return validateClients(rows)
    case 'task':
      return validateTasks(rows)
    case 'worker':
      return validateWorkers(rows)
    default:
      return []
  }
}

/**
 * Validate a single field value for live validation in the data table
 */
export function validateSingleField(
  entityType: 'client' | 'worker' | 'task',
  fieldName: string,
  value: string,
  rowData: DataRow = {}
): string | null {
  try {
    // Create a temporary row with the new value for validation
    const tempRow = { ...rowData, [fieldName]: value }
    
    // Run validation on a single-item array
    const results = runValidations(entityType, [tempRow])
    
    // Find the error for this specific field
    const fieldError = results.find(result => result.column === fieldName)
    
    return fieldError ? fieldError.message : null
  } catch (error) {
    // If validation fails for any reason, don't show an error
    // This prevents crashes during live typing
    console.warn('Live validation error:', error)
    return null
  }
}
