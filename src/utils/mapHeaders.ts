export async function mapHeadersWithClaude(headers: string[], entityType: 'client' | 'worker' | 'task') {
  try {
    const prompt = `
You are a data cleaning assistant.

Your job is to match messy CSV headers to expected schema fields.

User uploaded headers: ${JSON.stringify(headers)}

Map them to correct fields for "${entityType}" entity.

Use this exact format:
{
  "mapped": {
    "uploadedHeader1": "CorrectFieldName",
    "uploadedHeader2": "CorrectFieldName"
  }
}

Expected schema for "${entityType}":
${
  entityType === 'client'
    ? 'ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON'
    : entityType === 'worker'
    ? 'WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel'
    : 'TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent'
}

Examples of mapping:
- "client_id" → "ClientID"
- "client name" → "ClientName"  
- "priority" → "PriorityLevel"
- "worker_name" → "WorkerName"
- "skills" → "Skills"

Only output JSON — no explanation.
    `

    const res = await fetch('/api/parse-rule', {
      method: 'POST',
      body: JSON.stringify({ ruleText: prompt }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    const json = await res.json()
    
    if (json.error) {
      throw new Error(json.error)
    }

    return json.mapped ?? {}
  } catch (error) {
    console.error('Error mapping headers:', error)
    // Return identity mapping as fallback
    const fallbackMapping: Record<string, string> = {}
    headers.forEach(header => {
      fallbackMapping[header] = header
    })
    return fallbackMapping
  }
}
