import type { TemplateSummary } from '@/api'
import { config } from '@/config'

export const TEMPLATE_CATEGORIES = ['Portfolio', 'Landing page', 'Brand site'] as const
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

/** A template the picker offers. `backendId` is the service template that renders it. */
export interface WizardTemplate {
  id: string
  label: string
  category: TemplateCategory
  /** True when the service has no such template yet (rendered through `backendId`). */
  mock: boolean
  backendId: string
}

/** Backend gap: the service has one template (studio-v1); the design shows seven. */
const MOCK_TEMPLATES: Omit<WizardTemplate, 'mock' | 'backendId'>[] = [
  { id: 'model-portfolio', label: 'Model portfolio', category: 'Portfolio' },
  { id: 'showreel-portfolio', label: 'Showreel portfolio', category: 'Portfolio' },
  { id: 'photo-portfolio', label: 'Photo portfolio', category: 'Portfolio' },
  { id: 'launch-page', label: 'Launch page', category: 'Landing page' },
  { id: 'booking-page', label: 'Booking page', category: 'Landing page' },
  { id: 'brand-story', label: 'Brand story', category: 'Brand site' },
]

const STUDIO_ID = 'studio-v1'

export function buildCatalog(real: TemplateSummary[]): WizardTemplate[] {
  const backendId = real[0]?.id ?? STUDIO_ID
  const live = real.map<WizardTemplate>((t) => ({
    id: t.id,
    label: t.id === STUDIO_ID ? 'Studio site' : t.label,
    category: 'Brand site',
    mock: false,
    backendId: t.id,
  }))
  if (!config.useMocks) return live
  const mocks = MOCK_TEMPLATES.map<WizardTemplate>((t) => ({ ...t, mock: true, backendId }))
  return [...mocks, ...live]
}

export const ACCENTS = [
  { label: 'Electric violet', value: '#6C3BFF' },
  { label: 'Electric blue', value: '#2F6BFF' },
  { label: 'Sky', value: '#0EA5E9' },
  { label: 'Signal red', value: '#FB3737' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Amber', value: '#F59E0B' },
]

export const FONTS = ['Geist', 'Oxanium', 'Inter', 'Space Grotesk', 'Playfair Display']