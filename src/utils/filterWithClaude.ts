export async function getFilterExpressionFromNL(
  entityType: 'task' | 'client' | 'worker',
  nlQuery: string
): Promise<string> {
  try {
    const res = await fetch('/api/filter-expression', {
      method: 'POST',
      body: JSON.stringify({ 
        query: nlQuery,
        entityType: entityType 
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    const json = await res.json()
    
    if (json.error) {
      console.error('Filter expression error:', json.error)
      return ''
    }

    return json.expression || ''
  } catch (error) {
    console.error('Error getting filter expression:', error)
    return ''
  }
}
