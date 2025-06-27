export async function parseRuleFromText(text: string): Promise<any> {
  // Simulate AI output (tomorrow: use OpenRouter)
  if (text.includes('co-run') || text.includes('together')) {
    return {
      type: 'coRun',
      tasks: ['T12', 'T14'],
    }
  }

  return { error: 'Could not parse rule' }
}
