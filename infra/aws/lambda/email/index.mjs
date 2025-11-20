export const handler = async (event) => {
  const AWS = await import('aws-sdk')
  const ses = new AWS.SES({ region: 'us-east-1' })

  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event
  const { from, to, subject, html, text, configurationSetName = 'scf-alerts' } = body

  if (!from || !to || !subject || (!html && !text)) {
    throw new Error('Missing required email fields')
  }

  const params = {
    Source: from,
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject },
      Body: {},
    },
    ConfigurationSetName: configurationSetName,
  }

  if (html) {
    params.Message.Body.Html = { Data: html }
  }

  if (text) {
    params.Message.Body.Text = { Data: text }
  }

  const response = await ses.sendEmail(params).promise()

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId: response.MessageId }),
  }
}
