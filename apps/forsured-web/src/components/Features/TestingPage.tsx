import React, { useState } from 'react';
import { TestTube, MessageSquare } from 'lucide-react';
import Accordion, { AccordionItem } from '../../ui/Accordion';
import NavigationDrawer, { DrawerToggle } from '../DesignSystem/NavigationDrawer';
import Modal from '../Common/Modal';

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
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-text-primary mb-2">Functional Job</h3>
        <p className="text-text-secondary">{item.functionalJob}</p>
      </div>

      <div>
        <h3 className="font-semibold text-text-primary mb-2">Emotional & Social Jobs</h3>
        <p className="text-text-secondary mb-1"><strong>Emotional:</strong> {item.emotionalJob}</p>
        <p className="text-text-secondary"><strong>Social:</strong> {item.socialJob}</p>
      </div>

      <div>
        <h3 className="font-semibold text-text-primary mb-2">Key Struggles</h3>
        <ul className="list-disc list-inside space-y-1 text-text-secondary">
          {item.struggles.map((struggle, idx) => (
            <li key={idx}>{struggle}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-text-primary mb-2">Desired Outcomes</h3>
        <ul className="list-disc list-inside space-y-1 text-text-secondary">
          {item.outcomes.map((outcome, idx) => (
            <li key={idx}>{outcome}</li>
          ))}
        </ul>
      </div>

      <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
        <h3 className="font-semibold text-primary-700 mb-2">JTBD Statement</h3>
        <p className="text-primary-900 italic">{item.statement}</p>
      </div>
    </div>
  );

  const accordionItems: AccordionItem[] = jtbdData.map(item => ({
    id: item.id,
    title: item.title,
    content: formatJTBDContent(item)
  }));

  return (
    <div className="min-h-screen bg-bg-secondary">
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="lg:ml-72">
        <DrawerToggle onClick={() => setDrawerOpen(true)} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl p-8 text-white shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <TestTube size={32} />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold">Testing & Feedback</h1>
                  <p className="text-white/90 text-lg mt-1">
                    Help us build a better product for you. We've identified five key jobs that insurance professionals need to accomplish. Review these and share your feedback to help us prioritize what matters most.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl shadow-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Jobs-to-be-Done</h2>
              <p className="text-text-secondary mb-6">
                Below are five key jobs that insurance professionals need to accomplish. Click on each to learn more about the functional, emotional, and social aspects of these jobs, along with the struggles and desired outcomes.
              </p>
              <Accordion
                items={accordionItems}
                allowMultiple={false}
                defaultOpen={[]}
                className="max-w-4xl mx-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-6 right-6 bg-primary-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-105 flex items-center space-x-2 z-50"
        aria-label="Share feedback"
      >
        <MessageSquare size={20} />
        <span>Share Feedback</span>
      </button>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Share Your Feedback"
        size="xl"
      >
        <div className="w-full h-[600px]">
          <iframe
            src="https://docs.google.com/forms/d/e/placeholder/viewform?embedded=true"
            width="100%"
            height="100%"
            frameBorder={0}
            marginHeight={0}
            marginWidth={0}
            title="Feedback Form"
            className="rounded-lg"
          >
            Loading…
          </iframe>
        </div>
      </Modal>
    </div>
  );
}

