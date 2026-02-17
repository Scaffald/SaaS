import { describe, it, expect } from 'vitest';

describe('conversationNotifications', () => {
  it('exports notifyConversationParticipants', async () => {
    const mod = await import('../conversationNotifications');
    expect(mod.notifyConversationParticipants).toBeDefined();
    expect(typeof mod.notifyConversationParticipants).toBe('function');
  });

  it('exports buildConversationEmailHtml', async () => {
    const mod = await import('../conversationNotifications');
    expect(mod.buildConversationEmailHtml).toBeDefined();
    expect(typeof mod.buildConversationEmailHtml).toBe('function');
  });

  describe('buildConversationEmailHtml', () => {
    it('builds full_content email with message and sender', async () => {
      const { buildConversationEmailHtml } = await import('../conversationNotifications');
      const html = buildConversationEmailHtml({
        policy: 'full_content',
        senderName: 'Alice Smith',
        messageContent: 'Please upload the COI.\nThanks!',
        taskName: 'Insurance Review',
        conversationUrl: 'https://app.forsured.com/tasks/123/conversations/456',
        isBrokerWithoutAccount: false,
      });

      expect(html).toContain('Alice Smith');
      expect(html).toContain('Insurance Review');
      expect(html).toContain('Please upload the COI.<br>Thanks!');
      expect(html).toContain('View in Forsured');
      expect(html).toContain('Conversations are confidential');
      // Should NOT contain broker upsell
      expect(html).not.toContain('Sign up for Forsured');
    });

    it('builds full_content email with attachments', async () => {
      const { buildConversationEmailHtml } = await import('../conversationNotifications');
      const html = buildConversationEmailHtml({
        policy: 'full_content',
        senderName: 'Bob',
        messageContent: 'Here are the docs.',
        taskName: 'Doc Upload',
        conversationUrl: 'https://app.forsured.com/tasks/1/conversations/2',
        attachmentNames: ['coi.pdf', 'endorsement.pdf'],
        isBrokerWithoutAccount: false,
      });

      expect(html).toContain('Attachments: coi.pdf, endorsement.pdf');
    });

    it('builds links_only email without message content', async () => {
      const { buildConversationEmailHtml } = await import('../conversationNotifications');
      const html = buildConversationEmailHtml({
        policy: 'links_only',
        senderName: 'Alice Smith',
        messageContent: 'This should not appear',
        taskName: 'Insurance Review',
        conversationUrl: 'https://app.forsured.com/tasks/123/conversations/456',
        isBrokerWithoutAccount: false,
      });

      expect(html).toContain('Alice Smith');
      expect(html).toContain('Insurance Review');
      expect(html).toContain('View Message');
      expect(html).toContain('https://app.forsured.com/tasks/123/conversations/456');
      expect(html).not.toContain('This should not appear');
      expect(html).toContain('Conversations are confidential');
    });

    it('includes broker upsell banner and CTA when isBrokerWithoutAccount', async () => {
      const { buildConversationEmailHtml } = await import('../conversationNotifications');
      const html = buildConversationEmailHtml({
        policy: 'full_content',
        senderName: 'Alice Smith',
        messageContent: 'Hello broker!',
        taskName: 'Insurance Review',
        conversationUrl: 'https://app.forsured.com/tasks/123/conversations/456',
        isBrokerWithoutAccount: true,
        clientName: 'Acme Construction',
      });

      // Should contain the broker banner
      expect(html).toContain('Acme Construction');
      expect(html).toContain('uses Forsured to manage insurance compliance');
      // Should contain the upsell CTA
      expect(html).toContain('Sign up for Forsured');
      expect(html).toContain('signup?ref=conversation-email');
      expect(html).toContain('Create your free account');
      // Should still contain confidentiality footer
      expect(html).toContain('Conversations are confidential');
    });

    it('includes confidentiality footer in all cases', async () => {
      const { buildConversationEmailHtml } = await import('../conversationNotifications');

      const fullContent = buildConversationEmailHtml({
        policy: 'full_content',
        senderName: 'Test',
        messageContent: 'msg',
        taskName: 'task',
        conversationUrl: 'https://example.com',
        isBrokerWithoutAccount: false,
      });

      const linksOnly = buildConversationEmailHtml({
        policy: 'links_only',
        senderName: 'Test',
        messageContent: 'msg',
        taskName: 'task',
        conversationUrl: 'https://example.com',
        isBrokerWithoutAccount: false,
      });

      const brokerEmail = buildConversationEmailHtml({
        policy: 'full_content',
        senderName: 'Test',
        messageContent: 'msg',
        taskName: 'task',
        conversationUrl: 'https://example.com',
        isBrokerWithoutAccount: true,
        clientName: 'Client Co',
      });

      expect(fullContent).toContain('encrypted in flight and at rest');
      expect(linksOnly).toContain('encrypted in flight and at rest');
      expect(brokerEmail).toContain('encrypted in flight and at rest');
    });
  });
});
