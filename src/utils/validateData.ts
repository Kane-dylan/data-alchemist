export function validateClients(data: any[]) {
  const errors: Record<string, string>[] = []

  data.forEach((row, index) => {
    const rowErrors: Record<string, string> = {}

    // Example validation rules - you can customize these based on your needs
    Object.keys(row).forEach((key) => {
      const value = row[key]

      // Check for empty required fields
      if (!value || value.toString().trim() === '') {
        rowErrors[key] = 'This field is required'
      }
      
      // Email validation
      else if (key.toLowerCase().includes('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          rowErrors[key] = 'Invalid email format'
        }
      }
      
      // Phone validation (basic)
      else if (key.toLowerCase().includes('phone')) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(value.toString().replace(/[\s\-\(\)]/g, ''))) {
          rowErrors[key] = 'Invalid phone number format'
        }
      }
      
      // Age validation
      else if (key.toLowerCase().includes('age')) {
        const age = parseInt(value)
        if (isNaN(age) || age < 0 || age > 150) {
          rowErrors[key] = 'Invalid age (must be 0-150)'
        }
      }
      
      // Date validation
      else if (key.toLowerCase().includes('date')) {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          rowErrors[key] = 'Invalid date format'
        }
      }
      
      // Priority Level validation (if it exists)
      else if (key.toLowerCase().includes('priority')) {
        const priority = parseInt(value)
        if (isNaN(priority) || priority < 1 || priority > 5) {
          rowErrors[key] = 'Priority must be 1-5'
        }
      }
      
      // ClientID validation (if it exists)
      else if (key.toLowerCase().includes('id')) {
        // Check for duplicate IDs
        const duplicateIndex = data.findIndex((otherRow, otherIndex) => 
          otherIndex !== index && otherRow[key] === value
        )
        if (duplicateIndex !== -1) {
          rowErrors[key] = 'Duplicate ID found'
        }
      }
    })

    errors[index] = rowErrors
  })

  return {
    errors,
    hasErrors: errors.some(row => Object.keys(row).length > 0),
    totalErrors: errors.reduce((sum, row) => sum + Object.keys(row).length, 0)
  }
}
