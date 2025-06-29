import { NextRequest, NextResponse } from 'next/server'

// HEAD method for checking API availability
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.query || !body.entityType) {
      return NextResponse.json({ 
        error: 'Missing required parameters', 
        details: 'Both query and entityType are required. Please provide a natural language filter query and specify the entity type (client, worker, or task).'
      }, { status: 400 })
    }

    const { query, entityType } = body

    if (!query?.trim()) {
      return NextResponse.json({ 
        error: 'Empty query', 
        details: 'Please provide a meaningful filter query. Examples: "contains Corp", "skills include coding"'
      }, { status: 400 })
    }

    if (!['client', 'worker', 'task'].includes(entityType)) {
      return NextResponse.json({ 
        error: 'Invalid entity type', 
        details: 'Entity type must be one of: "client", "worker", or "task"'
      }, { status: 400 })
    }

    const prompt = `
You are an expert assistant that converts natural language filters into valid JavaScript filter expressions for a data alchemist system.

ENTITY TYPE: "${entityType}"

COMPREHENSIVE FIELD DEFINITIONS WITH REAL SAMPLE DATA:
${
  entityType === 'client'
    ? `CLIENT FIELDS WITH REAL EXAMPLES:
    - ClientID: String format "C{number}" (e.g., "C1", "C2", "C25", "C49")
    - ClientName: String company names (e.g., "Acme Corp", "Globex Inc", "Stark Industries", "Wayne Enterprises", "Los Pollos Hermanos", "Springfield Nuclear")
    - RequestedTaskIDs: String of comma-separated task IDs (e.g., "T17,T27,T33,T31,T20,T3,T32,T26", "T35,T39,T10,T17,T46", "T20,TX,T9,T8,T29")
    - GroupTag: String enum exactly "GroupA", "GroupB", or "GroupC" (case-sensitive)
    - AttributesJSON: Mixed format - either JSON string or plain text:
        * JSON: '{"location":"New York","budget":100000}', '{"sla":"24h","vip":true}', '{"location":"London"}'
        * Plain text: "ensure deliverables align with project scope", "budget approved pending CFO review", "client prefers morning meetings"`
    : entityType === 'worker'
    ? `WORKER FIELDS WITH REAL EXAMPLES:
    - WorkerID: String format "W{number}" (e.g., "W1", "W2", "W25", "W49")
    - WorkerName: String format "Worker{number}" (e.g., "Worker1", "Worker2", "Worker25", "Worker49")
    - Skills: String of comma-separated skills (e.g., "data,analysis", "coding,ml", "testing,ui/ux", "reporting,devops", "design,testing")
    - AvailableSlots: String JSON array format (e.g., "[1,2,3]", "[2,4,5]", "[1,4]", "[3,5]", "[2,3,4]", "[1,2,5]")
    - MaxLoadPerPhase: Number 1-3 (e.g., 1, 2, 3)
    - WorkerGroup: String enum exactly "GroupA", "GroupB", or "GroupC" (case-sensitive)
    - QualificationLevel: Number 1-5 (e.g., 1, 2, 3, 4, 5 where 5=highest expertise)`
    : `TASK FIELDS WITH REAL EXAMPLES:
    - TaskID: String format "T{number}" (e.g., "T1", "T2", "T25", "T49")
    - TaskName: String descriptive names (e.g., "Data Cleanup", "Report Generation", "Model Training", "UI Prototype", "Load Testing", "Security Audit")
    - Category: String enum exactly one of: "ETL", "Analytics", "ML", "Design", "QA", "Security", "Infrastructure", "Writing", "DevOps", "Research", "Marketing", "Sales", "Compliance"
    - Duration: Number integer (e.g., 1, 2, 3, 4, 5 representing hours/days)
    - RequiredSkills: String of comma-separated skills (e.g., "coding", "analysis,reporting", "ml,coding", "testing,ui/ux", "data,devops")
    - PreferredPhases: Mixed format examples:
        * Range format: "1 - 2", "3 - 5", "2 - 3", "1 - 4", "2 - 4"
        * JSON array: "[2,3,4]", "[1,3]", "[4,5]", "[2]", "[1,2,3]"
        * Special cases: "[2 - 4]" (malformed JSON with range inside)
    - MaxConcurrent: Number 1-4 (e.g., 1, 2, 3, 4)`
}

USER QUERY: "${query}"

COMPREHENSIVE NATURAL LANGUAGE PATTERN RECOGNITION WITH REAL DATA EXAMPLES:

1. NUMERIC COMPARISONS WITH VARIATIONS:
   - "duration equals 2" → row.Duration === 2
   - "duration is 2" → row.Duration === 2
   - "duration = 2" → row.Duration === 2
   - "qualification level is 5" → row.QualificationLevel === 5
   - "max load per phase less than 3" → row.MaxLoadPerPhase < 3
   - "max concurrent greater than 2" → row.MaxConcurrent > 2

2. STRING MATCHING WITH REAL COMPANY NAMES (CASE-INSENSITIVE):
   - "name contains Corp" → row.ClientName && row.ClientName.toLowerCase().includes('corp')
   - "client name contains Corp" → row.ClientName && row.ClientName.toLowerCase().includes('corp')
   - "name has Acme" → row.ClientName && row.ClientName.toLowerCase().includes('acme')
   - "Wayne" → row.ClientName && row.ClientName.toLowerCase().includes('wayne')
   - "Stark Industries" → row.ClientName && row.ClientName.toLowerCase().includes('stark industries')
   - "category equals ETL" → row.Category && row.Category.toLowerCase() === 'etl'
   - "category is Analytics" → row.Category && row.Category.toLowerCase() === 'analytics'
   - "task name contains Data" → row.TaskName && row.TaskName.toLowerCase().includes('data')
   - "group tag is GroupA" → row.GroupTag === 'GroupA'
   - "group is GroupB" → row.GroupTag === 'GroupB' || row.WorkerGroup === 'GroupB'

3. SKILLS MATCHING WITH REAL SKILL COMBINATIONS:
   - "skills include coding" → row.Skills && row.Skills.toLowerCase().includes('coding') || row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('coding')
   - "required skills include analysis" → row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('analysis')
   - "skills contain ml" → row.Skills && row.Skills.toLowerCase().includes('ml') || row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('ml')
   - "has data skills" → row.Skills && row.Skills.toLowerCase().includes('data') || row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('data')
   - "devops" → row.Skills && row.Skills.toLowerCase().includes('devops') || row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('devops')
   - "ui/ux" → row.Skills && row.Skills.toLowerCase().includes('ui/ux') || row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('ui/ux')
   - "testing and coding" → (row.Skills && row.Skills.toLowerCase().includes('testing') && row.Skills.toLowerCase().includes('coding')) || (row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('testing') && row.RequiredSkills.toLowerCase().includes('coding'))

4. JSON ARRAY FIELDS (AvailableSlots) WITH ERROR HANDLING:
   - "available slots include 2" → (function(){try{const slots=JSON.parse(row.AvailableSlots||'[]');return Array.isArray(slots)&&slots.includes(2)}catch(e){return false}})()
   - "slots contain 3" → (function(){try{const slots=JSON.parse(row.AvailableSlots||'[]');return Array.isArray(slots)&&slots.includes(3)}catch(e){return false}})()
   - "has slot 5" → (function(){try{const slots=JSON.parse(row.AvailableSlots||'[]');return Array.isArray(slots)&&slots.includes(5)}catch(e){return false}})()
   - "slots in phase 1" → (function(){try{const slots=JSON.parse(row.AvailableSlots||'[]');return Array.isArray(slots)&&slots.includes(1)}catch(e){return false}})()

5. PREFERRED PHASES (COMPLEX MIXED FORMAT HANDLING):
   - "preferred phases include 2" → (function(){const pf=row.PreferredPhases;if(!pf)return false;if(pf.includes(' - ')){const[start,end]=pf.split(' - ').map(x=>parseInt(x.trim()));return !isNaN(start)&&!isNaN(end)&&2>=start&&2<=end}try{const phases=JSON.parse(pf);return Array.isArray(phases)&&phases.includes(2)}catch(e){return pf.includes('2')}})()
   - "phases contain 3" → (function(){const pf=row.PreferredPhases;if(!pf)return false;if(pf.includes(' - ')){const[start,end]=pf.split(' - ').map(x=>parseInt(x.trim()));return !isNaN(start)&&!isNaN(end)&&3>=start&&3<=end}try{const phases=JSON.parse(pf);return Array.isArray(phases)&&phases.includes(3)}catch(e){return pf.includes('3')}})()
   - "phases 2 to 4" → (function(){const pf=row.PreferredPhases;if(!pf)return false;if(pf.includes(' - ')){const[start,end]=pf.split(' - ').map(x=>parseInt(x.trim()));return !isNaN(start)&&!isNaN(end)&&!(4<start||2>end)}try{const phases=JSON.parse(pf);return Array.isArray(phases)&&phases.some(p=>p>=2&&p<=4)}catch(e){const nums=pf.match(/\d+/g);return nums&&nums.some(n=>parseInt(n)>=2&&parseInt(n)<=4)}})()
   - "phase range 1-3" → (function(){const pf=row.PreferredPhases;if(!pf)return false;if(pf.includes(' - ')){const[start,end]=pf.split(' - ').map(x=>parseInt(x.trim()));return !isNaN(start)&&!isNaN(end)&&!(3<start||1>end)}try{const phases=JSON.parse(pf);return Array.isArray(phases)&&phases.some(p=>p>=1&&p<=3)}catch(e){const nums=pf.match(/\d+/g);return nums&&nums.some(n=>parseInt(n)>=1&&parseInt(n)<=3)}})()

6. TASK ID LISTS WITH REAL EXAMPLES:
   - "requested tasks include T17" → row.RequestedTaskIDs && row.RequestedTaskIDs.includes('T17')
   - "tasks contain T27" → row.RequestedTaskIDs && row.RequestedTaskIDs.includes('T27')
   - "has task T99" → row.RequestedTaskIDs && row.RequestedTaskIDs.includes('T99')
   - "includes TX" → row.RequestedTaskIDs && row.RequestedTaskIDs.includes('TX')
   - "task T1" → row.TaskID === 'T1' || (row.RequestedTaskIDs && row.RequestedTaskIDs.includes('T1'))

7. JSON ATTRIBUTES WITH REAL EXAMPLES:
   - "location is New York" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return attr.location&&attr.location.toLowerCase().includes('new york')}catch(e){return row.AttributesJSON&&row.AttributesJSON.toLowerCase().includes('new york')}})()
   - "location contains London" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return attr.location&&attr.location.toLowerCase().includes('london')}catch(e){return row.AttributesJSON&&row.AttributesJSON.toLowerCase().includes('london')}})()
   - "budget > 100000" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return attr.budget&&parseFloat(attr.budget)>100000}catch(e){return false}})()
   - "budget greater than 50000" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return attr.budget&&parseFloat(attr.budget)>50000}catch(e){return false}})()
   - "vip is true" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return attr.vip===true}catch(e){return row.AttributesJSON&&row.AttributesJSON.includes('vip":true')}})()
   - "vip client" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return attr.vip===true}catch(e){return row.AttributesJSON&&row.AttributesJSON.toLowerCase().includes('vip')}})()
   - "sla 24h" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return attr.sla&&attr.sla.includes('24h')}catch(e){return row.AttributesJSON&&row.AttributesJSON.includes('24h')}})()

8. EXISTENCE AND CONTENT CHECKS:
   - "has location" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return !!attr.location}catch(e){return row.AttributesJSON&&row.AttributesJSON.includes('location')}})()
   - "has budget" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return !!attr.budget}catch(e){return row.AttributesJSON&&row.AttributesJSON.includes('budget')}})()
   - "has notes" → (function(){try{const attr=JSON.parse(row.AttributesJSON||'{}');return !!attr.notes}catch(e){return row.AttributesJSON&&row.AttributesJSON.includes('notes')}})()
   - "contains morning" → row.AttributesJSON && row.AttributesJSON.toLowerCase().includes('morning')
   - "mentions compliance" → row.AttributesJSON && row.AttributesJSON.toLowerCase().includes('compliance')
   - "CFO review" → row.AttributesJSON && row.AttributesJSON.toLowerCase().includes('cfo')

9. ID-BASED SEARCHES:
   - "client C25" → row.ClientID === 'C25'
   - "worker W15" → row.WorkerID === 'W15'
   - "task T42" → row.TaskID === 'T42'
   - "ID starts with C" → row.ClientID && row.ClientID.startsWith('C')
   - "worker ID greater than W30" → row.WorkerID && parseInt(row.WorkerID.substring(1)) > 30

10. BOOLEAN COMBINATIONS:
   - "GroupA or GroupB" → row.GroupTag === 'GroupA' || row.GroupTag === 'GroupB' || row.WorkerGroup === 'GroupA' || row.WorkerGroup === 'GroupB'
   - "coding and ml skills" → (row.Skills && row.Skills.toLowerCase().includes('coding') && row.Skills.toLowerCase().includes('ml')) || (row.RequiredSkills && row.RequiredSkills.toLowerCase().includes('coding') && row.RequiredSkills.toLowerCase().includes('ml'))

CRITICAL RULES FOR ROBUST EXPRESSION GENERATION:
- ALWAYS use exact field names with proper PascalCase capitalization (ClientID, WorkerName, TaskName, etc.)
- ALWAYS handle null/undefined values with safe checks (row.Field && ...)
- ALWAYS use .toLowerCase() for case-insensitive text matching
- ALWAYS wrap complex logic in immediately invoked functions to handle errors gracefully
- ALWAYS use try-catch for JSON parsing operations (AttributesJSON, AvailableSlots, PreferredPhases)
- NEVER assume data format - handle both string and array possibilities for PreferredPhases
- Handle malformed data gracefully (e.g., "TX" in task IDs, "[2 - 4]" in phases)
- For ambiguous fields (like "group"), check both possible field names (GroupTag for clients, WorkerGroup for workers)
- For skills, check both Skills (workers) and RequiredSkills (tasks) when context is unclear
- Return ONLY the boolean expression, no explanations, markdown, or extra text
- Ensure expression evaluates to true/false for each row

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
      const errorText = await res.text()
      throw new Error(`OpenRouter API error: ${res.status} - ${errorText}`)
    }

    const json = await res.json()
    const rawText = json.choices?.[0]?.message?.content || ''
    
    if (!rawText) {
      return NextResponse.json({ 
        error: 'No response from AI', 
        raw: json,
        details: 'The AI service did not return any content. Please try again or rephrase your query.'
      })
    }

    // Clean up the response to extract just the expression
    const cleanExpression = rawText
      .trim()
      .replace(/^Expression:\s*/i, '')
      .replace(/^```javascript\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .replace(/^return\s+/i, '')
      .trim()

    // Validate that we have a meaningful expression
    if (!cleanExpression || cleanExpression.length < 5) {
      return NextResponse.json({ 
        error: 'Invalid filter expression generated', 
        raw: rawText,
        expression: cleanExpression,
        details: 'The AI generated an expression that appears to be too short or invalid. Please try rephrasing your query.'
      })
    }

    // Basic syntax validation
    const forbiddenPatterns = [
      /eval\(/i,
      /function\s*\(/i,
      /=>\s*{/i,
      /;\s*\w/i, // Multiple statements
      /\/\*[\s\S]*?\*\//g, // Block comments
    ]

    const hasForbiddenPattern = forbiddenPatterns.some(pattern => pattern.test(cleanExpression))
    if (hasForbiddenPattern) {
      return NextResponse.json({ 
        error: 'Unsafe filter expression detected', 
        raw: rawText,
        expression: cleanExpression,
        details: 'The generated expression contains potentially unsafe code patterns. Please try a simpler query.'
      })
    }

    return NextResponse.json({ 
      expression: cleanExpression, 
      raw: rawText,
      success: true 
    })
  } catch (error) {
    console.error('Filter API Error:', error)
    
    // Provide more specific error messages based on error type
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Request parsing error', 
          details: 'Invalid JSON in request body. Please check your request format and try again.'
        }, 
        { status: 400 }
      )
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: 'AI service unavailable', 
          details: 'Unable to connect to the AI service. Please try again in a moment or contact support if the issue persists.'
        }, 
        { status: 503 }
      )
    }
    
    // Generic error with helpful message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        error: 'Filter processing failed', 
        details: `An error occurred while processing your filter: ${errorMessage}. Please try rephrasing your query or use a simpler filter expression.`
      }, 
      { status: 500 }
    )
  }
}
