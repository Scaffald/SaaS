import type { ChannelAdapter, NotificationChannel } from '../types'

import { emailAdapter } from './email'
import { pushAdapter } from './push'
import { smsAdapter } from './sms'

const adapterMap: Partial<Record<NotificationChannel, ChannelAdapter>> = {
  email: emailAdapter,
  push: pushAdapter,
  sms: smsAdapter,
}

export function getAdapter(channel: NotificationChannel): ChannelAdapter | undefined {
  return adapterMap[channel]
}

export const adapters = adapterMap
