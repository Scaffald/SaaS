// @ts-nocheck
import React from 'react'
import { Paragraph, YStack } from '@app/ui'
import { StyleguidePage } from './_components/StyleguidePage'
import { AnchorHeading } from './_components/AnchorHeading'

const entries = [
  {
    version: '0.1.0',
    date: '2024-04-30',
    notes: [
      'Initial Bootstrap-style shell with tokens, components, and examples.',
      'Added automated audit summary and approval queue integration.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <StyleguidePage
      title="Changelog"
      description="Track updates to the styleguide and UI components."
    >
      <YStack gap="$6">
        {entries.map((entry) => (
          <YStack key={entry.version} gap="$3">
            <AnchorHeading
              id={`changelog-${entry.version}`}
              title={`${entry.version} — ${entry.date}`}
              description="Latest changes"
            />
            <YStack gap={4}>
              {entry.notes.map((note) => (
                <Paragraph key={note} fontSize={13} color="$color10">
                  • {note}
                </Paragraph>
              ))}
            </YStack>
          </YStack>
        ))}
      </YStack>
    </StyleguidePage>
  )
}
