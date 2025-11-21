import { http, HttpResponse } from 'msw'

import type { ContractInteractionRecorder } from './types'

const openAiResponse = {
  id: 'chatcmpl-contract-1',
  object: 'chat.completion',
  created: 1_700_000_000,
  model: 'gpt-4-turbo-preview',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content:
          '{"general":{"fullName":"Casey Contractor"},"experience":[{"company":"ACME","title":"Engineer"}]}' as const,
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 1200,
    completion_tokens: 200,
    total_tokens: 1400,
  },
}

export const createOpenAIHandler = (record: ContractInteractionRecorder) =>
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()

    expect(body.model).toBe('gpt-4-turbo-preview')
    expect(Array.isArray(body.messages)).toBe(true)

    record({
      provider: 'openai',
      name: 'OpenAI chat completions',
      request: {
        method: request.method,
        url: request.url,
        headers: {
          authorization: request.headers.get('authorization'),
          'content-type': request.headers.get('content-type'),
        },
        body,
      },
      response: {
        status: 200,
        body: openAiResponse,
      },
    })

    return HttpResponse.json(openAiResponse)
  })
