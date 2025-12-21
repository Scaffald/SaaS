import type { ChannelAdapter, NotificationChannel } from '../types.ts';

import { emailAdapter } from './email.ts';
import { pushAdapter } from './push.ts';
import { smsAdapter } from './sms.ts';

const adapterMap: Partial<Record<NotificationChannel, ChannelAdapter>> = {
  email: emailAdapter,
  push: pushAdapter,
  sms: smsAdapter,
}

export function getAdapter(channel: NotificationChannel): ChannelAdapter | undefined {
  return adapterMap[channel]
}

export const adapters = adapterMap
