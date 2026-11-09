import type { TemplateSummary } from '@/api'

/** A template the picker offers, as the service lists it. */
export interface WizardTemplate {
  id: string
  label: string
  /** The service's category name ("Portfolios", "Psychiatrists"…). */
  category: string
  backendId: string
  /** Static picture for the picker card. */
  thumbnail?: string
}

export function buildCatalog(real: TemplateSummary[]): WizardTemplate[] {
  return real.map<WizardTemplate>((t) => ({
    id: t.id,
    label: t.label,
    category: t.category ?? 'Other',
    backendId: t.id,
    thumbnail: t.thumbnail,
  }))
}

/** Category names in order of first appearance. */
export const categoriesOf = (catalog: WizardTemplate[]) => [
  ...new Set(catalog.map((t) => t.category)),
]