import { http, HttpResponse } from 'msw'

import type { ContractInteractionRecorder } from './types'

export const createSendgridHandler = (record: ContractInteractionRecorder) =>
  http.post('https://api.sendgrid.com/v3/mail/send', async ({ request }) => {
    const body = await request.json()

    expect(body).toHaveProperty('personalizations')
    expect(request.headers.get('authorization')).toBeTruthy()

    record({
      provider: 'sendgrid',
      name: 'SendGrid email dispatch',
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
        status: 202,
        body: null,
      },
    })

    return new HttpResponse(null, { status: 202 })
  })
