import { assertEquals } from 'https://deno.land/std@0.218.0/assert/mod';

import { appRouter } from '../routers/_app';
import { createAdminClient } from './setup';
import { getTestContext, requireAuthSetup } from './test-context';

Deno.test({
  name: "notifications preferences can be saved and restored",
  async fn() {
    await requireAuthSetup();
    const ctx = await getTestContext();

    const caller = appRouter.createCaller({
      user: { id: ctx.user.userId, email: ctx.user.email },
      userToken: ctx.user.token,
      supabase: ctx.user.client,
      supabaseAdmin: createAdminClient(),
    });

    const original = await caller.notifications.preferences.get();

    await caller.notifications.preferences.save({
      globalEnabled: false,
      channelEnabled: {
        in_app: true,
        email: false,
        push: true,
        sms: false,
      },
      digestFrequency: "digest_daily",
      quietHours: { start: "21:00", end: "07:00" },
    });

    const updated = await caller.notifications.preferences.get();

    assertEquals(updated.globalEnabled, false);
    assertEquals(updated.channelEnabled.email, false);
    assertEquals(updated.digestFrequency, "digest_daily");
    assertEquals(updated.quietHours?.start, "21:00");

    await caller.notifications.preferences.save({
      globalEnabled: original.globalEnabled,
      channelEnabled: original.channelEnabled,
      quietHours: original.quietHours ?? undefined,
      digestFrequency: original.digestFrequency,
    });
  },
});
