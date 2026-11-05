import { request } from './http'
import type { PreviewInput, PreviewResult, Template, TemplateSummary } from './types'

export const templatesApi = {
  list: (signal?: AbortSignal) => request<TemplateSummary[]>('/site/template', { signal }),

  get: (id: string, signal?: AbortSignal) =>
    request<Template>(`/site/template/${encodeURIComponent(id)}`, { signal }),

  /** Validates the payload and returns rendered HTML; stores nothing, needs no key. */
  preview: (body: PreviewInput, signal?: AbortSignal) =>
    request<PreviewResult>('/site/template/preview', { method: 'POST', body, signal }),
}