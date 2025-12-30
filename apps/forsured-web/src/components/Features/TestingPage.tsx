import { useState } from 'react';
import { TestTube, MessageSquare } from 'lucide-react';
import { XStack, YStack, Text, H1, H2, SizableText, Card, Button as TamaguiButton } from 'tamagui';
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
    <YStack gap="$4">
      <YStack>
        <Text fontWeight="600" color="$color12" mb="$2">Functional Job</Text>
        <SizableText color="$color11">{item.functionalJob}</SizableText>
      </YStack>

      <YStack>
        <Text fontWeight="600" color="$color12" mb="$2">Emotional & Social Jobs</Text>
        <SizableText color="$color11" mb="$1"><Text fontWeight="600">Emotional:</Text> {item.emotionalJob}</SizableText>
        <SizableText color="$color11"><Text fontWeight="600">Social:</Text> {item.socialJob}</SizableText>
      </YStack>

      <YStack>
        <Text fontWeight="600" color="$color12" mb="$2">Key Struggles</Text>
        <YStack gap="$1" paddingLeft="$4">
          {item.struggles.map((struggle, idx) => (
            <SizableText key={idx} color="$color11">• {struggle}</SizableText>
          ))}
        </YStack>
      </YStack>

      <YStack>
        <Text fontWeight="600" color="$color12" mb="$2">Desired Outcomes</Text>
        <YStack gap="$1" paddingLeft="$4">
          {item.outcomes.map((outcome, idx) => (
            <SizableText key={idx} color="$color11">• {outcome}</SizableText>
          ))}
        </YStack>
      </YStack>

      <Card backgroundColor="$blue2" borderLeftWidth={4} borderLeftColor="$blue9" padding="$4" borderRadius="$4">
        <Text fontWeight="600" color="$blue11" mb="$2">JTBD Statement</Text>
        <SizableText color="$blue12" fontStyle="italic">{item.statement}</SizableText>
      </Card>
    </YStack>
  );

  const accordionItems: AccordionItem[] = jtbdData.map(item => ({
    id: item.id,
    title: item.title,
    content: formatJTBDContent(item)
  }));

  return (
    <YStack minHeight="100vh" backgroundColor="$color2">
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <YStack $gtLg={{ marginLeft: 288 }}>
        <DrawerToggle onClick={() => setDrawerOpen(true)} />

        <YStack maxWidth={1280} marginHorizontal="auto" paddingHorizontal="$4" $sm={{ paddingHorizontal: '$6' }} $lg={{ paddingHorizontal: '$8' }} paddingVertical="$8">
          <YStack gap="$6">
            <Card
              borderRadius="$6"
              padding="$8"
              backgroundColor="$blue9"
              elevation={10}
            >
              <XStack alignItems="center" gap="$4">
                <XStack backgroundColor="rgba(255,255,255,0.2)" padding="$4" borderRadius="$6" backdropFilter="blur(10px)">
                  <TestTube size={32} color="white" />
                </XStack>
                <YStack>
                  <H1 color="white">Testing & Feedback</H1>
                  <SizableText size="$6" color="rgba(255,255,255,0.9)" mt="$1">
                    Help us build a better product for you. We've identified five key jobs that insurance professionals need to accomplish. Review these and share your feedback to help us prioritize what matters most.
                  </SizableText>
                </YStack>
              </XStack>
            </Card>

            <Card backgroundColor="$background" borderRadius="$6" elevation={5} borderWidth={1} borderColor="$borderColor" padding="$6">
              <H2 mb="$4">Jobs-to-be-Done</H2>
              <SizableText color="$color11" mb="$6">
                Below are five key jobs that insurance professionals need to accomplish. Click on each to learn more about the functional, emotional, and social aspects of these jobs, along with the struggles and desired outcomes.
              </SizableText>
              <YStack maxWidth={896} marginHorizontal="auto">
                <Accordion
                  items={accordionItems}
                  allowMultiple={false}
                  defaultOpen={[]}
                />
              </YStack>
            </Card>
          </YStack>
        </YStack>
      </YStack>

      {/* Floating Feedback Button */}
      <TamaguiButton
        position="fixed"
        bottom="$6"
        right="$6"
        backgroundColor="$blue9"
        color="white"
        paddingHorizontal="$6"
        paddingVertical="$3"
        borderRadius={9999}
        elevation={5}
        hoverStyle={{
          backgroundColor: '$blue10',
          scale: 1.05,
        }}
        onPress={() => setShowFeedbackModal(true)}
        aria-label="Share feedback"
      >
        <XStack alignItems="center" gap="$2">
          <MessageSquare size={20} />
          <Text>Share Feedback</Text>
        </XStack>
      </TamaguiButton>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Share Your Feedback"
        size="xl"
      >
        <YStack width="100%" height={600}>
          <iframe
            src="https://docs.google.com/forms/d/e/placeholder/viewform?embedded=true"
            width="100%"
            height="100%"
            frameBorder={0}
            marginHeight={0}
            marginWidth={0}
            title="Feedback Form"
            style={{ borderRadius: 'var(--radius4)' }}
          >
            Loading…
          </iframe>
        </YStack>
      </Modal>
    </YStack>
  );
}

