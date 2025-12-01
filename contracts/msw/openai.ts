import { HttpResponse, http } from 'msw'

import type { ContractInteractionRecorder } from './types'

const openAiResponse = {
  choices: [
    {
      finish_reason: 'stop',
      index: 0,
      message: {
        content:
          '{"general":{"fullName":"Casey Contractor"},"experience":[{"company":"ACME","title":"Engineer"}]}' as const,
        role: 'assistant',
      },
    },
  ],
  created: 1_700_000_000,
  id: 'chatcmpl-contract-1',
  model: 'gpt-4-turbo-preview',
  object: 'chat.completion',
  usage: {
    completion_tokens: 200,
    prompt_tokens: 1200,
    total_tokens: 1400,
  },
}

export const createOpenAIHandler = (record: ContractInteractionRecorder) =>
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json()

    expect(body.model).toBe('gpt-4-turbo-preview')
    expect(Array.isArray(body.messages)).toBe(true)

    record({
      name: 'OpenAI chat completions',
      provider: 'openai',
      request: {
        body,
        headers: {
          authorization: request.headers.get('authorization'),
          'content-type': request.headers.get('content-type'),
        },
        method: request.method,
        url: request.url,
      },
      response: {
        body: openAiResponse,
        status: 200,
      },
    })

    return HttpResponse.json(openAiResponse)
  })
