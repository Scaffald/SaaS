
import { http, HttpResponse } from 'msw'

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

export const createOpenAIHandler = () =>
  http.post('https://api.openai.com/v1/chat/completions', async () => {
    return HttpResponse.json(openAiResponse)
  })
