import { Paragraph, Text, YStack } from '@my/ui'

import { LegalBulletList } from './legal-bullet-list'
import { LegalSection } from './legal-section'

export const AboutContent = () => {
  return (
    <YStack gap="$6">
      <LegalSection title="Our Mission">
        <Paragraph>
          SCF Neue helps construction organizations assemble reliable crews faster by connecting them
          with a trusted network of skilled workers. We bring clarity to hiring and coordination so
          projects start on time and stay on track.
        </Paragraph>
      </LegalSection>

      <LegalSection
        title="What We Do"
        description="We pair modern software with industry expertise to simplify every phase of workforce planning."
      >
        <Paragraph>
          Organizations discover vetted workers, manage active teams, and monitor performance with a
          single workspace. Workers build rich profiles that highlight their certifications,
          experience, and availability so the best opportunities find them first.
        </Paragraph>
      </LegalSection>

      <LegalSection title="How It Works">
        <LegalBulletList
          items={[
            'Create a company or worker profile to surface the most relevant connections.',
            'Use the Scaffald Score to evaluate qualifications, recent activity, and reliability at a glance.',
            'Collaborate with teams in real time by sharing project context, documentation, and next steps.',
            'Track progress with dashboards tailored to both field operations and leadership reporting.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Why SCF Neue">
        <LegalBulletList
          items={[
            'Built specifically for the construction industry with workflows that match how teams actually work.',
            'Secure by design so sensitive worker and project data stays protected.',
            'Flexible for companies of any size-from growing contractors to national enterprises.',
            'Supported by partners who understand regulations, certifications, and safety requirements.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Ready To Partner">
        <Paragraph>
          We are continuously shipping improvements to help you staff smarter, communicate clearly, and
          deliver the craftsmanship your clients expect. If you would like to learn more about SCF Neue
          or see the platform in action, reach out to <Text fontWeight="600">support@scaffald.com</Text>.
        </Paragraph>
      </LegalSection>
    </YStack>
  )
}
