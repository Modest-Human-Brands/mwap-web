import type { TemplateSummary } from '@/api'
import { config } from '@/config'

/** A template the picker offers. `backendId` is the service template that renders it. */
export interface WizardTemplate {
  id: string
  label: string
  /** The service's category name ("Portfolios", "Psychiatrists"…). */
  category: string
  /** True when the service has no such template yet (rendered through `backendId`). */
  mock: boolean
  backendId: string
}

/**
 * Backend gap: the design shows seven templates, the service has fewer. The model portfolio is the
 * service's `contact-sheet`; the rest are listed as mocks and render through a real template.
 */
const MOCK_TEMPLATES: Omit<WizardTemplate, 'mock' | 'backendId'>[] = [
  { id: 'showreel-portfolio', label: 'Showreel portfolio', category: 'Portfolios' },
  { id: 'photo-portfolio', label: 'Photo portfolio', category: 'Portfolios' },
  { id: 'launch-page', label: 'Launch page', category: 'Landing pages' },
  { id: 'booking-page', label: 'Booking page', category: 'Landing pages' },
  { id: 'brand-story', label: 'Brand story', category: 'Brand sites' },
]

export function buildCatalog(real: TemplateSummary[]): WizardTemplate[] {
  const live = real.map<WizardTemplate>((t) => ({
    id: t.id,
    label: t.label,
    category: t.category ?? 'Other',
    mock: false,
    backendId: t.id,
  }))
  const backendId = real[0]?.id
  if (!config.useMocks || !backendId) return live
  const mocks = MOCK_TEMPLATES.map<WizardTemplate>((t) => ({ ...t, mock: true, backendId }))
  return [...live, ...mocks]
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