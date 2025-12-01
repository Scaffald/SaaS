import { HttpResponse, http } from 'msw'

import type { ContractInteractionRecorder } from './types'

export const createSendgridHandler = (record: ContractInteractionRecorder) =>
  http.post('https://api.sendgrid.com/v3/mail/send', async ({ request }) => {
    const body = await request.json()

    expect(body).toHaveProperty('personalizations')
    expect(request.headers.get('authorization')).toBeTruthy()

    record({
      name: 'SendGrid email dispatch',
      provider: 'sendgrid',
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
        body: null,
        status: 202,
      },
    })

    return new HttpResponse(null, { status: 202 })
  })
