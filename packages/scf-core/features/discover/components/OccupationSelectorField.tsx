/**
 * Occupation Selector Field
 *
 * A form field that allows selecting an O*NET occupation code
 * to auto-populate job details from O*NET data.
 *
 * @see Issue #106 - O*NET Phase 6: Smart Job Posting
 */

import { useState, useCallback, useMemo } from 'react'
import {
  Button,
  Card,
  Input,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { StatusBadge } from '@scf/core/components/ui'
import { Briefcase, Check, Sparkles, X, Zap } from 'lucide-react-native'
import { Pressable } from 'react-native'

// ============================================================================
// Types
// ============================================================================

interface OccupationResult {
  onet_code: string
  title: string
  description: string
}

interface AutoFilledJobData {
  description: string
  required_skills: string[]
  education_requirements: string
  experience_level: string
}

interface OccupationSelectorFieldProps {
  value: string | null
  onSelect: (onetCode: string, autoFillData: AutoFilledJobData) => void
  onClear: () => void
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_OCCUPATIONS: OccupationResult[] = [
  { onet_code: '47-2111.00', title: 'Electricians', description: 'Install, maintain, and repair electrical wiring, equipment, and fixtures' },
  { onet_code: '47-2152.00', title: 'Plumbers, Pipefitters, and Steamfitters', description: 'Assemble, install, alter, and repair pipework' },
  { onet_code: '47-2031.00', title: 'Carpenters', description: 'Construct, erect, install, or repair structures and fixtures' },
  { onet_code: '11-9021.00', title: 'Construction Managers', description: 'Plan, direct, or coordinate construction activities' },
  { onet_code: '47-2073.00', title: 'Operating Engineers', description: 'Operate construction equipment' },
  { onet_code: '47-1011.00', title: 'First-Line Supervisors of Construction Trades', description: 'Directly supervise construction trades workers' },
  { onet_code: '47-2231.00', title: 'Solar Photovoltaic Installers', description: 'Assemble, install, or maintain solar systems' },
  { onet_code: '49-9021.00', title: 'HVAC Mechanics and Installers', description: 'Install or repair heating, ventilation, and cooling systems' },
]

const MOCK_AUTOFILL: Record<string, AutoFilledJobData> = {
  '47-2111.00': {
    description: 'Install, maintain, and repair electrical wiring, equipment, and fixtures. Ensure compliance with local and national electrical codes. Read blueprints and technical diagrams.',
    required_skills: ['Electrical Code Knowledge', 'Blueprint Reading', 'Circuit Design', 'Troubleshooting', 'Safety Protocols', 'PLC Programming'],
    education_requirements: 'High school diploma or equivalent. Completion of electrician apprenticeship program. State journeyman electrician license.',
    experience_level: '3-5 years',
  },
  '11-9021.00': {
    description: 'Plan, direct, or coordinate construction project activities. Manage budgets, schedules, and subcontractors. Ensure compliance with building codes and safety regulations.',
    required_skills: ['Project Management', 'Budget Management', 'Scheduling', 'Building Codes', 'Safety Management', 'Contract Negotiation'],
    education_requirements: "Bachelor's degree in Construction Management, Civil Engineering, or related field.",
    experience_level: '5-10 years',
  },
}

// ============================================================================
// Sub-Components
// ============================================================================

function OccupationResultItem({ occupation, isSelected, onSelect }: { occupation: OccupationResult; isSelected: boolean; onSelect: () => void }) {
  const { theme } = useThemeContext()

  return (
    <Pressable onPress={onSelect}>
      <Row
        gap={10}
        align="center"
        padding="sm"
        style={{
          backgroundColor: isSelected ? colors.bg[theme].selected : colors.bg[theme].subtle,
          borderRadius: 8,
          borderWidth: isSelected ? 1 : 0,
          borderColor: colors.border[theme].active,
        }}
      >
        <Stack style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: colors.bg[theme].default, alignItems: 'center', justifyContent: 'center' }}>
          <Briefcase size={16} color={isSelected ? colors.fg[theme].active : colors.icon[theme].subtle} />
        </Stack>
        <Stack style={{ flex: 1 }} gap={1}>
          <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: isSelected ? '600' : '400' }}>
            {occupation.title}
          </Text>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
            {occupation.onet_code}
          </Text>
        </Stack>
        {isSelected && <Check size={18} color={colors.fg[theme].active} />}
      </Row>
    </Pressable>
  )
}

function AutoFillPreview({ data }: { data: AutoFilledJobData }) {
  const { theme } = useThemeContext()

  return (
    <Card variant="glass" padding="md" style={{ borderWidth: 1, borderColor: colors.border[theme].active }}>
      <Stack gap={12}>
        <Row gap={6} align="center">
          <Sparkles size={16} color={colors.fg[theme].active} />
          <Text style={{ color: colors.fg[theme].active, fontWeight: '600', fontSize: 14 }}>Auto-Fill Preview</Text>
        </Row>

        <Stack gap={8}>
          <Stack gap={2}>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 11, fontWeight: '600' }}>DESCRIPTION</Text>
            <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }} numberOfLines={3}>
              {data.description}
            </Text>
          </Stack>

          <Stack gap={2}>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 11, fontWeight: '600' }}>REQUIRED SKILLS</Text>
            <Row gap={4} style={{ flexWrap: 'wrap' }}>
              {data.required_skills.map((skill) => (
                <StatusBadge key={skill} variant="default">{skill}</StatusBadge>
              ))}
            </Row>
          </Stack>

          <Row gap={16}>
            <Stack gap={2}>
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 11, fontWeight: '600' }}>EDUCATION</Text>
              <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>{data.education_requirements}</Text>
            </Stack>
          </Row>

          <Stack gap={2}>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 11, fontWeight: '600' }}>EXPERIENCE</Text>
            <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>{data.experience_level}</Text>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function OccupationSelectorField({ value, onSelect, onClear }: OccupationSelectorFieldProps) {
  const { theme } = useThemeContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const selectedOccupation = MOCK_OCCUPATIONS.find((o) => o.onet_code === value)
  const autoFillData = value ? MOCK_AUTOFILL[value] : null

  const filteredOccupations = useMemo(() => {
    if (!searchTerm) return MOCK_OCCUPATIONS
    const term = searchTerm.toLowerCase()
    return MOCK_OCCUPATIONS.filter(
      (o) => o.title.toLowerCase().includes(term) || o.onet_code.includes(term) || o.description.toLowerCase().includes(term)
    )
  }, [searchTerm])

  const handleSelect = useCallback(
    (onetCode: string) => {
      const data = MOCK_AUTOFILL[onetCode] ?? {
        description: '',
        required_skills: [],
        education_requirements: '',
        experience_level: '',
      }
      onSelect(onetCode, data)
      setIsExpanded(false)
      setSearchTerm('')
    },
    [onSelect]
  )

  return (
    <Stack gap={8}>
      <Row justify="space-between" align="center">
        <Stack gap={2}>
          <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>
            O*NET Occupation
          </Text>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
            Select an occupation to auto-fill job details
          </Text>
        </Stack>
        {value && (
          <Button size="sm" variant="outline" iconStart={X} onPress={onClear}>
            Clear
          </Button>
        )}
      </Row>

      {/* Selected occupation display */}
      {selectedOccupation && !isExpanded ? (
        <Pressable onPress={() => setIsExpanded(true)}>
          <Row
            gap={10}
            align="center"
            padding="md"
            style={{ backgroundColor: colors.bg[theme].selected, borderRadius: 10, borderWidth: 1, borderColor: colors.border[theme].active }}
          >
            <Zap size={18} color={colors.fg[theme].active} />
            <Stack style={{ flex: 1 }} gap={1}>
              <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>{selectedOccupation.title}</Text>
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>{selectedOccupation.onet_code}</Text>
            </Stack>
            <StatusBadge variant="success">Selected</StatusBadge>
          </Row>
        </Pressable>
      ) : (
        <Stack gap={8}>
          {/* Search Input */}
          <Row gap={8} align="center">
            <Stack style={{ flex: 1 }}>
              <Input
                placeholder="Search occupations (e.g., Electrician, 47-2111)..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                onFocus={() => setIsExpanded(true)}
              />
            </Stack>
          </Row>

          {/* Results */}
          {isExpanded && (
            <Stack gap={4} style={{ maxHeight: 300 }}>
              {filteredOccupations.map((occ) => (
                <OccupationResultItem
                  key={occ.onet_code}
                  occupation={occ}
                  isSelected={value === occ.onet_code}
                  onSelect={() => handleSelect(occ.onet_code)}
                />
              ))}
              {filteredOccupations.length === 0 && (
                <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                  No occupations found matching "{searchTerm}"
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      )}

      {/* Auto-fill preview */}
      {autoFillData && <AutoFillPreview data={autoFillData} />}
    </Stack>
  )
}
