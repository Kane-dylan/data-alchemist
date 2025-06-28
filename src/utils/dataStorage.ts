// Storage utility for persisting data across sessions
export interface StoredData {
  clients: any[]
  workers: any[]
  tasks: any[]
  lastUpload: string
  priorityConfig?: any
  uploadedFiles?: {
    clients?: { name: string; uploadDate: string; rowCount: number }
    workers?: { name: string; uploadDate: string; rowCount: number }
    tasks?: { name: string; uploadDate: string; rowCount: number }
  }
  rules?: any[]
}

const STORAGE_KEY = 'data-alchemist-state'

export const DataStorage = {
  save: (data: StoredData): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...data,
        lastUpload: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to save data to localStorage:', error)
    }
  },

  load: (): StoredData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      return JSON.parse(stored)
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
      return null
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear data from localStorage:', error)
    }
  },

  hasData: (): boolean => {
    const data = DataStorage.load()
    return data !== null && (
      data.clients.length > 0 || 
      data.workers.length > 0 || 
      data.tasks.length > 0
    )
  }
}
