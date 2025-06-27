import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.query || !body.query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    if (!body.entityType) {
      return NextResponse.json({ error: 'Entity type is required' }, { status: 400 })
    }

    const { query, entityType } = body

    // Define schema fields for each entity type
    const schemas = {
      client: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
      worker: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
      task: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
    }

    const fields = schemas[entityType as keyof typeof schemas] || []

    const prompt = `
You are a JavaScript filter expression generator. Convert natural language queries into JavaScript boolean expressions.

Available fields for ${entityType}: ${fields.join(', ')}

Examples:
Input: "duration greater than 1"
Output: row.Duration > 1

Input: "category equals ETL"
Output: row.Category === "ETL"

Input: "priority level is 5"
Output: row.PriorityLevel === 5

Input: "skills include coding"
Output: (row.Skills || "").toString().toLowerCase().includes("coding")

Input: "preferred phases include 3"
Output: (row.PreferredPhases || "").toString().includes("3")

Rules:
- Use row.FieldName to access field values
- Use === for exact matches, > < for numbers
- Use .includes() for partial text matches
- Always handle null/undefined with (row.Field || "")
- Return only the JavaScript expression, no explanations

Convert this query to JavaScript expression:
"${query}"
`

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

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
    const expression = json.choices?.[0]?.message?.content?.trim() || ''
    
    if (!expression) {
      return NextResponse.json({ error: 'No response from AI', raw: json })
    }

    return NextResponse.json({ expression })
  } catch (error) {
    console.error('Filter Expression API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}
