/** Display names for template page keys; the design calls the projects page "Work". */
const PAGE_LABELS: Record<string, string> = { projects: 'Work' }

export const pageLabel = (key: string) =>
  PAGE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)