export async function getFilterExpressionFromNL(
  entityType: 'task' | 'client' | 'worker',
  nlQuery: string
): Promise<string> {
  const prompt = `
You are an assistant that converts natural language filters into valid JavaScript filter expressions for a given dataset.

The entity type is: "${entityType}"

Here's a user's request:
"${nlQuery}"

Return a pure JavaScript boolean expression to be used inside an array filter() function. Assume each item is an object called 'row'.

Examples:
- "duration > 1" → "row.Duration > 1"
- "preferred phases include 2" → "row.PreferredPhases.includes(2)"

Only return the expression. Do not include function or explanation.
`

  try {
    const res = await fetch('/api/parse-rule', {
      method: 'POST',
      body: JSON.stringify({ ruleText: prompt }),
      headers: { 'Content-Type': 'application/json' },
    })

    const json = await res.json()
    return json.parsedRule?.trim() || json.raw?.trim() || ''
  } catch (error) {
    console.error('Error getting filter expression:', error)
    return ''
  }
}
