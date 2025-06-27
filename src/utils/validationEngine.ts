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

    // Priority range
    const priority = Number(row.PriorityLevel)
    if (isNaN(priority) || priority < 1 || priority > 5) {
      errors.push({ rowIndex: i, column: 'PriorityLevel', message: 'Priority must be 1–5' })
    }

    // JSON validation for AttributesJSON
    if (row.AttributesJSON) {
      try {
        JSON.parse(row.AttributesJSON)
      } catch {
        errors.push({ rowIndex: i, column: 'AttributesJSON', message: 'Invalid JSON' })
      }
    }

    // RequestedTaskIDs validation (should be comma-separated or array)
    if (row.RequestedTaskIDs) {
      const taskIds = typeof row.RequestedTaskIDs === 'string' 
        ? row.RequestedTaskIDs.split(',') 
        : row.RequestedTaskIDs
      
      if (!Array.isArray(taskIds) && typeof row.RequestedTaskIDs !== 'string') {
        errors.push({ rowIndex: i, column: 'RequestedTaskIDs', message: 'TaskIDs must be comma-separated string or array' })
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

    // Duration validation (should be positive number)
    const duration = Number(row.Duration)
    if (row.Duration && (isNaN(duration) || duration <= 0)) {
      errors.push({ rowIndex: i, column: 'Duration', message: 'Duration must be a positive number' })
    }

    // RequiredSkills validation (comma-separated or array)
    if (row.RequiredSkills) {
      const skills = typeof row.RequiredSkills === 'string' 
        ? row.RequiredSkills.split(',') 
        : row.RequiredSkills
      
      if (!Array.isArray(skills) && typeof row.RequiredSkills !== 'string') {
        errors.push({ rowIndex: i, column: 'RequiredSkills', message: 'Skills must be comma-separated string or array' })
      }
    }

    // MaxConcurrent validation (should be positive integer)
    const maxConcurrent = Number(row.MaxConcurrent)
    if (row.MaxConcurrent && (isNaN(maxConcurrent) || maxConcurrent < 1 || !Number.isInteger(maxConcurrent))) {
      errors.push({ rowIndex: i, column: 'MaxConcurrent', message: 'MaxConcurrent must be a positive integer' })
    }

    // PreferredPhases validation (comma-separated phases)
    if (row.PreferredPhases) {
      const phases = typeof row.PreferredPhases === 'string' 
        ? row.PreferredPhases.split(',') 
        : row.PreferredPhases
      
      if (!Array.isArray(phases) && typeof row.PreferredPhases !== 'string') {
        errors.push({ rowIndex: i, column: 'PreferredPhases', message: 'Phases must be comma-separated string or array' })
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

    // AvailableSlots validation (should be positive integer)
    const availableSlots = Number(row.AvailableSlots)
    if (row.AvailableSlots && (isNaN(availableSlots) || availableSlots < 0 || !Number.isInteger(availableSlots))) {
      errors.push({ rowIndex: i, column: 'AvailableSlots', message: 'AvailableSlots must be a non-negative integer' })
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
export function runValidations(type: 'client' | 'task' | 'worker', rows: DataRow[]): ValidationResult[] {
  switch (type) {
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
