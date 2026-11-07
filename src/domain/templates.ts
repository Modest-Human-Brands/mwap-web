import type { TemplateSummary } from '@/api'

/** A template the picker offers, as the service lists it. */
export interface WizardTemplate {
  id: string
  label: string
  /** The service's category name ("Portfolios", "Psychiatrists"…). */
  category: string
  backendId: string
}

export function buildCatalog(real: TemplateSummary[]): WizardTemplate[] {
  return real.map<WizardTemplate>((t) => ({
    id: t.id,
    label: t.label,
    category: t.category ?? 'Other',
    backendId: t.id,
  }))
}

/** Category names in order of first appearance. */
export const categoriesOf = (catalog: WizardTemplate[]) => [
  ...new Set(catalog.map((t) => t.category)),
]

export const ACCENTS = [
  { label: 'Electric violet', value: '#6C3BFF' },
  { label: 'Electric blue', value: '#2F6BFF' },
  { label: 'Sky', value: '#0EA5E9' },
  { label: 'Signal red', value: '#FB3737' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Amber', value: '#F59E0B' },
]

export const FONTS = ['Geist', 'Oxanium', 'Inter', 'Space Grotesk', 'Playfair Display']