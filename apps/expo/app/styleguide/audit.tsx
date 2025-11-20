// @ts-nocheck

import { AnchorHeading, CodeBlock, StyleguidePage } from '@app/styleguide'
import audit from '@app/styleguide/data/audit.json'
import { Paragraph, Text, YStack } from '@app/ui'
import { useMemo } from 'react'

export default function StyleguideAuditPage() {
  const auditJson = useMemo(() => JSON.stringify(audit, null, 2), [])

  return (
    <StyleguidePage
      title="Discovery audit"
      description="Automated sweep of the monorepo to map tech stack, design tokens, assets, and integration gaps. Use this as the source of truth when extending the showcase."
      leadIn={<CodeBlock code={auditJson} filename="styleguide-audit.json" language="json" />}
    >
      <YStack gap="$6">
        <AnchorHeading
          id="audit-tech-stack"
          title="Tech stack"
          description="Framework and tooling detected by the audit pipeline."
        />
        <BulletList
          items={[
            `Framework: ${audit.techStack.framework}`,
            `Runtime: ${audit.techStack.runtime}`,
            `Build tooling: ${audit.techStack.buildTooling.join(', ')}`,
            `Workspace: ${audit.techStack.workspace}`,
            `Entry: ${audit.techStack.entry}`,
            `Base path: ${audit.techStack.basePath}`,
          ]}
        />
        <AnchorHeading
          id="audit-design-system"
          title="Design system sources"
          description="Paths that feed the design token visualizations and component demos."
        />
        <BulletList
          items={[
            `Tokens: ${audit.styleSystem.tokens.join(', ')}`,
            `Typography: ${audit.design.typography}`,
            `Logo component: ${audit.design.logo}`,
            `UI package: ${audit.componentSources.uiPackage}`,
            `Icons: ${audit.componentSources.icons}`,
          ]}
        />
        <AnchorHeading
          id="audit-unknowns"
          title="Unknowns & approvals"
          description="Items that need product or platform review before implementation."
        />
        <YStack gap="$3">
          {audit.unknowns.map((unknown) => (
            <Paragraph key={unknown.item} fontSize={13} color="$color10">
              <Text fontWeight="600" color="$color11">
                {unknown.item}:
              </Text>{' '}
              {unknown.suggestedDefault} (Risk: {unknown.risk})
            </Paragraph>
          ))}
        </YStack>
        <AnchorHeading
          id="audit-risks"
          title="Risks & integration notes"
          description="Highlights to monitor as the showcase scales."
        />
        <BulletList items={audit.risks} />
      </YStack>
    </StyleguidePage>
  )
}

type BulletListProps = {
  items: string[]
}

const BulletList = ({ items }: BulletListProps) => (
  <YStack gap="$2" paddingLeft="$3">
    {items.map((item) => (
      <Paragraph key={item} fontSize={13} color="$color10">
        • {item}
      </Paragraph>
    ))}
  </YStack>
)
