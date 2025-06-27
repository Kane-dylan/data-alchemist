export type Rule =
  | { type: 'coRun'; tasks: string[] }
  | { type: 'loadLimit'; group: string; maxSlotsPerPhase: number }
  | { type: 'validation'; field: string; min: number; max: number }
  | Record<string, any> // fallback

export function buildRule(type: Rule['type'], options: any): Rule {
  switch (type) {
    case 'coRun':
      return { type: 'coRun', tasks: options.tasks }
    case 'loadLimit':
      return { type: 'loadLimit', group: options.group, maxSlotsPerPhase: options.maxSlotsPerPhase }
    case 'validation':
      return { type: 'validation', field: options.field, min: options.min, max: options.max }
    default:
      return { type, ...options }
  }
}
