export type ContractInteractionRecorder = (interaction: ContractInteraction) => void

export interface ContractInteraction {
  provider: 'mapbox' | 'openai' | 'stripe' | 'sendgrid'
  name: string
  request: {
    method: string
    url: string
    headers?: Record<string, string | null>
    body?: unknown
  }
  response: {
    status: number
    body: unknown
  }
}
