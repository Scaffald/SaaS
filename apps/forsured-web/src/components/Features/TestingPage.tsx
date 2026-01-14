import { useState } from 'react';
import { TestTube, MessageSquare } from 'lucide-react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';
import Accordion, { AccordionItem } from '../../ui/Accordion';
import NavigationDrawer, { DrawerToggle } from '../DesignSystem/NavigationDrawer';
import Modal from '../Common/Modal';
import Button from '../Common/Button';

interface JTBDItem {
  id: string;
  title: string;
  functionalJob: string;
  emotionalJob: string;
  socialJob: string;
  struggles: string[];
  outcomes: string[];
  statement: string;
}

const jtbdData: JTBDItem[] = [
  {
    id: 'help-younger-producers',
    title: 'Help Younger Producers Be More Effective',
    functionalJob: 'Enable less-experienced insurance producers to handle complex construction clients confidently and efficiently',
    emotionalJob: 'Feel credible, trusted, and equipped when working with demanding GCs and subs',
    socialJob: 'Be perceived by peers and leadership as competent and proactive in construction insurance',
    struggles: [
      'Inexperience with construction-specific insurance requirements (e.g., COI details, endorsements)',
      'Overreliance on senior producers or brokers for technical reviews',
      'Difficulty balancing client service with internal compliance demands'
    ],
    outcomes: [
      'Fewer escalations to senior staff',
      'Faster quote-to-bind cycles',
      'Positive client feedback and retention'
    ],
    statement: 'When managing construction clients, I want to quickly understand and resolve coverage requirements so I can appear competent and build client trust — without needing constant oversight.'
  },
  {
    id: 'reduce-compliance-fire-drills',
    title: 'Reduce Compliance Fire Drills',
    functionalJob: 'Eliminate last-minute, high-stress compliance issues that disrupt project timelines or renewals',
    emotionalJob: 'Feel organized, calm, and in control of client deliverables',
    socialJob: 'Be known as a reliable partner who prevents problems before they happen',
    struggles: [
      'Chasing subcontractors for missing COIs or expired endorsements',
      'Constant back-and-forth between brokers, clients, and project managers',
      'Lack of visibility into which projects or subs are at risk'
    ],
    outcomes: [
      'Fewer "urgent" compliance escalations',
      'Real-time visibility into missing documentation',
      'Reduction in policy or project delays'
    ],
    statement: 'When projects are underway, I want to proactively manage compliance so I\'m not scrambling to fix issues at the last minute — and my clients see me as dependable and proactive.'
  },
  {
    id: 'protect-book-of-business',
    title: 'Protect My Book of Business',
    functionalJob: 'Maintain client retention and protect against E&O exposure or lost commissions',
    emotionalJob: 'Feel confident that nothing will slip through the cracks that could damage relationships or reputation',
    socialJob: 'Be seen by leadership and clients as a responsible, strategic account steward',
    struggles: [
      'Exposure from outdated or incorrect COIs',
      'Losing clients due to preventable compliance errors',
      'Lack of traceable audit trails for documentation'
    ],
    outcomes: [
      'Maintain 95%+ retention rates',
      'Clear visibility into compliance gaps',
      'Documented proof of due diligence'
    ],
    statement: 'When managing my book, I want to know every client is in good standing so I can avoid liability and keep my accounts secure and renewals smooth.'
  },
  {
    id: 'demonstrate-proactive-expertise',
    title: 'Demonstrate Proactive Expertise',
    functionalJob: 'Show clients that compliance and insurance management are being handled with foresight and intelligence',
    emotionalJob: 'Feel proud of my professional value and recognized for proactive insight',
    socialJob: 'Be viewed by clients as a strategic advisor — not just a transactional insurance agent',
    struggles: [
      'Difficulty quantifying the value of proactive risk management',
      'Limited visibility into client or sub performance to demonstrate insights',
      'Competing against lower-cost brokers who appear "good enough"'
    ],
    outcomes: [
      'Client testimonials highlighting proactive service',
      'Increased referral and renewal rates',
      'Fewer issues discovered by clients before the broker'
    ],
    statement: 'When working with construction clients, I want to anticipate compliance and coverage issues before they occur so my clients see me as a true expert and not just a salesperson.'
  },
  {
    id: 'maintain-situational-awareness',
    title: 'Maintain Situational Awareness',
    functionalJob: 'Understand at a glance what\'s happening across all clients, subs, and projects to make timely decisions',
    emotionalJob: 'Feel in control and confident about where attention is needed',
    socialJob: 'Be recognized internally as the "go-to" for reliable status information and decisions',
    struggles: [
      'Fragmented systems (spreadsheets, emails, PDFs)',
      'No unified dashboard for compliance or risk signals',
      'Reactive rather than proactive workflows'
    ],
    outcomes: [
      'Centralized dashboard for client and sub compliance',
      'Ability to filter and prioritize by urgency or project type',
      'Reduction in time spent on manual data collection'
    ],
    statement: 'When managing multiple projects, I want a clear picture of client and sub compliance status so I can focus my time where it matters most — not just firefighting.'
  }
];

export default function TestingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const formatJTBDContent = (item: JTBDItem) => (
    <Stack style={{ gap: 16 }}>
      <Stack>
        <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>Functional Job</Text>
        <Text style={{ color: 'var(--color-11)' }}>{item.functionalJob}</Text>
      </Stack>

      <Stack>
        <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>Emotional & Social Jobs</Text>
        <Text style={{ color: 'var(--color-11)', marginBottom: 4 }}><Text style={{ fontWeight: 600 }}>Emotional:</Text> {item.emotionalJob}</Text>
        <Text style={{ color: 'var(--color-11)' }}><Text style={{ fontWeight: 600 }}>Social:</Text> {item.socialJob}</Text>
      </Stack>

      <Stack>
        <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>Key Struggles</Text>
        <Stack style={{ gap: 4, paddingLeft: 16 }}>
          {item.struggles.map((struggle, idx) => (
            <Text key={idx} style={{ color: 'var(--color-11)' }}>* {struggle}</Text>
          ))}
        </Stack>
      </Stack>

      <Stack>
        <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 8 }}>Desired Outcomes</Text>
        <Stack style={{ gap: 4, paddingLeft: 16 }}>
          {item.outcomes.map((outcome, idx) => (
            <Text key={idx} style={{ color: 'var(--color-11)' }}>* {outcome}</Text>
          ))}
        </Stack>
      </Stack>

      <div style={{ backgroundColor: 'var(--color-blue-2)', borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: 'var(--color-blue-9)', padding: 16, borderRadius: 8 }}>
        <Text style={{ fontWeight: 600, color: 'var(--color-blue-11)', marginBottom: 8 }}>JTBD Statement</Text>
        <Text style={{ color: 'var(--color-blue-12)', fontStyle: 'italic' }}>{item.statement}</Text>
      </div>
    </Stack>
  );

  const accordionItems: AccordionItem[] = jtbdData.map(item => ({
    id: item.id,
    title: item.title,
    content: formatJTBDContent(item)
  }));

  return (
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-2)' }}>
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Stack style={{ marginLeft: 288 }}>
        <DrawerToggle onPress={() => setDrawerOpen(true)} />

        <Stack style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 16, paddingRight: 16, paddingTop: 32, paddingBottom: 32 }}>
          <Stack style={{ gap: 24 }}>
            <div
              style={{
                borderRadius: 12,
                padding: 32,
                backgroundColor: 'var(--color-blue-9)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
            >
              <Row style={{ alignItems: 'center', gap: 16 }}>
                <Row style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12, backdropFilter: 'blur(10px)' }}>
                  <TestTube size={32} color="white" />
                </Row>
                <Stack>
                  <Text style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>Testing & Feedback</Text>
                  <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
                    Help us build a better product for you. We've identified five key jobs that insurance professionals need to accomplish. Review these and share your feedback to help us prioritize what matters most.
                  </Text>
                </Stack>
              </Row>
            </div>

            <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24 }}>
              <Text style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Jobs-to-be-Done</Text>
              <Text style={{ color: 'var(--color-11)', marginBottom: 24 }}>
                Below are five key jobs that insurance professionals need to accomplish. Click on each to learn more about the functional, emotional, and social aspects of these jobs, along with the struggles and desired outcomes.
              </Text>
              <Stack style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto' }}>
                <Accordion
                  items={accordionItems}
                  allowMultiple={false}
                  defaultOpen={[]}
                />
              </Stack>
            </div>
          </Stack>
        </Stack>
      </Stack>

      {/* Floating Feedback Button */}
      <button
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: 'var(--color-blue-9)',
          color: 'white',
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 12,
          paddingBottom: 12,
          borderRadius: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        onPress={() => setShowFeedbackModal(true)}
        aria-label="Share feedback"
      >
        <MessageSquare size={20} />
        <Text style={{ color: 'white' }}>Share Feedback</Text>
      </button>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Share Your Feedback"
        size="xl"
      >
        <Stack style={{ width: '100%', height: 600 }}>
          <iframe
            src="https://docs.google.com/forms/d/e/placeholder/viewform?embedded=true"
            width="100%"
            height="100%"
            frameBorder={0}
            marginHeight={0}
            marginWidth={0}
            title="Feedback Form"
            style={{ borderRadius: 8 }}
          >
            Loading...
          </iframe>
        </Stack>
      </Modal>
    </Stack>
  );
}
