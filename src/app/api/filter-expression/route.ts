import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.query || !body.entityType) {
      return NextResponse.json({ error: 'Query and entityType are required' }, { status: 400 })
    }

    const { query, entityType } = body

    const prompt = `
You are an assistant that converts natural language filters into valid JavaScript filter expressions for a given dataset.

The entity type is: "${entityType}"

For "${entityType}" entities, the available fields are:
${
  entityType === 'client'
    ? 'ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON'
    : entityType === 'worker'
    ? 'WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel'
    : 'TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent'
}

Here's the user's filter request:
"${query}"

Return ONLY a pure JavaScript boolean expression to be used inside an array filter() function. Assume each item is an object called 'row'.

Important examples for different field types:
- "duration > 1" → row.Duration > 1
- "priority is 5" → row.PriorityLevel === 5  
- "preferred phases include 3" → (Array.isArray(row.PreferredPhases) ? row.PreferredPhases.includes(3) : row.PreferredPhases && row.PreferredPhases.toString().includes('3'))
- "category equals ETL" → row.Category === 'ETL'
- "name contains Corp" → row.ClientName && row.ClientName.toLowerCase().includes('corp')
- "skills include coding" → (Array.isArray(row.Skills) ? row.Skills.includes('coding') : row.Skills && row.Skills.toLowerCase().includes('coding'))

Remember:
- Use exact field names with proper capitalization
- Handle both array and string formats for list fields
- Use case-insensitive matching for text searches
- Return ONLY the expression, no explanations or extra text

Expression:
`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status}`)
    }

    const json = await res.json()
    const rawText = json.choices?.[0]?.message?.content || ''
    
    if (!rawText) {
      return NextResponse.json({ error: 'No response from AI', raw: json })
    }

    // Clean up the response to extract just the expression
    const cleanExpression = rawText
      .trim()
      .replace(/^Expression:\s*/i, '')
      .replace(/^```javascript\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .replace(/^return\s+/i, '')
      .trim()

    return NextResponse.json({ expression: cleanExpression, raw: rawText })
  } catch (error) {
    console.error('Filter API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}
