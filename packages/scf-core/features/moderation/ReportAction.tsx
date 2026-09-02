/**
 * The affordance itself — a small "Report" control that opens the sheet.
 *
 * Exists so a surface adds reporting with one line and one import, rather than
 * each screen inventing its own trigger and its own sheet state. Consistency
 * matters here beyond tidiness: a store reviewer checks whether reporting is
 * *findable*, and an affordance that looks different everywhere reads as
 * missing in the places they happen not to look (#690).
 */

import { useState } from 'react'
import { Pressable } from 'react-native'
import { Row, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Flag } from 'lucide-react-native'
import { ReportSheet } from './ReportSheet'
import type { ReportSubjectType } from '@scaffald/sdk/resources/moderation'

export interface ReportActionProps {
  subjectType: ReportSubjectType
  subjectId: string
  reportedUserId?: string | null
  reportedUserName?: string | null
  /** Hide when the viewer is the author — you cannot report yourself. */
  hidden?: boolean
  /** `icon` for dense rows like a message; `link` where there is room for a word. */
  variant?: 'icon' | 'link'
  label?: string
}

export function ReportAction({
  subjectType,
  subjectId,
  reportedUserId,
  reportedUserName,
  hidden = false,
  variant = 'icon',
  label = 'Report',
}: ReportActionProps) {
  const { theme } = useThemeContext()
  const [open, setOpen] = useState(false)

  if (hidden) return null

  const tint = colors.text[theme].tertiary

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        // Named rather than "Report" alone: a screen reader user moving through
        // a thread otherwise hears "Report" a dozen times with no way to tell
        // which one they are on.
        accessibilityLabel={
          reportedUserName ? `Report ${reportedUserName}` : `Report this ${subjectLabel(subjectType)}`
        }
        // Reporting is deliberately not a big button, but it must still be a
        // comfortable target on a phone used with gloves.
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ paddingVertical: 4, paddingHorizontal: 4 }}
      >
        {variant === 'link' ? (
          <Row gap={6} align="center">
            <Flag size={14} color={tint} />
            <Text style={{ fontSize: 13, color: tint }}>{label}</Text>
          </Row>
        ) : (
          <Flag size={16} color={tint} />
        )}
      </Pressable>

      {/*
        Mounted only while open, deliberately.

        ReportSheet calls the report and block mutations, so rendering it
        permanently-hidden made every message row in a thread instantiate two
        mutations and require a QueryClient just to draw a flag icon — which
        is exactly how this broke InquiryCommentThread's existing tests. The
        sheet is a modal; it has no reason to exist before it is opened.
      */}
      {open ? (
        <ReportSheet
          visible
          onClose={() => setOpen(false)}
          subjectType={subjectType}
          subjectId={subjectId}
          reportedUserId={reportedUserId}
          reportedUserName={reportedUserName}
        />
      ) : null}
    </>
  )
}

function subjectLabel(t: ReportSubjectType): string {
  switch (t) {
    case 'community_post':
      return 'post'
    case 'community_comment':
      return 'comment'
    case 'inquiry_message':
      return 'message'
    case 'job':
      return 'job'
    case 'user':
      return 'person'
  }
}
