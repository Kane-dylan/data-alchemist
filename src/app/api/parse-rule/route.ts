import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.ruleText || !body.ruleText.trim()) {
      return NextResponse.json({ error: 'Rule text is required' }, { status: 400 })
    }

    const prompt = `
You are a JSON rule generator for a spreadsheet AI tool. Convert natural language rules into structured JSON configurations.

Examples:

Input: "Tasks T12 and T14 must always run together."
Output:
{ "type": "coRun", "tasks": ["T12", "T14"] }

Input: "Limit workers in group A to maximum 2 tasks per phase."
Output:
{ "type": "loadLimit", "group": "A", "maxSlotsPerPhase": 2 }

Input: "Priority level must be between 1 and 5."
Output:
{ "type": "validation", "field": "priority", "min": 1, "max": 5 }

Input: "Email addresses must be valid format."
Output:
{ "type": "validation", "field": "email", "format": "email" }

Input: "Task T5 should never run with T9."
Output:
{ "type": "exclusion", "tasks": ["T5", "T9"] }

Now, convert this rule to JSON (return only the JSON, no explanations):
"${body.ruleText}"
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
        temperature: 0.1, // Low temperature for more consistent output
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

    let parsed

    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : rawText
      parsed = JSON.parse(jsonText)
    } catch (parseError) {
      parsed = { 
        error: 'AI did not return valid JSON', 
        raw: rawText,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}
