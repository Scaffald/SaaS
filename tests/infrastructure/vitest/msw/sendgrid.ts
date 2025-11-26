
import { http, HttpResponse } from 'msw'

export const createSendgridHandler = () =>
  http.post('https://api.sendgrid.com/v3/mail/send', async () => {
    return new HttpResponse(null, { status: 202 })
  })
