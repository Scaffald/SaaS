import { Award, BadgeCheck, Search, X } from 'lucide-react-native'
import { useState } from 'react'
import {
  Button,
  Input,
  RangeSlider,
  Row,
  ScrollView,
  Separator,
  Stack,
  Text,
} from '@scaffald/ui'
import { SearchFilterWidget } from './components/SearchFilterWidget'

interface DiscoverWorkersRightProps {
  onSearchChange: (query: string) => void
  onIndustriesChange: (industries: string[]) => void
  minScore: number
  onMinScoreChange: (score: number) => void
  selectedSkills: string[]
  onSkillsChange: (skills: string[]) => void
  selectedCertifications: string[]
  onCertificationsChange: (certifications: string[]) => void
}

/**
 * Discover Workers Right Component
 * Right panel content for the workers discovery page - displays search and filters
 */
export function DiscoverWorkersRight({
  onSearchChange,
  onIndustriesChange,
  minScore,
  onMinScoreChange,
  selectedSkills,
  onSkillsChange,
  selectedCertifications,
  onCertificationsChange,
}: DiscoverWorkersRightProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [certificationInput, setCertificationInput] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange(value)
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      onSkillsChange([...selectedSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    onSkillsChange(selectedSkills.filter((s) => s !== skill))
  }

  const handleAddCertification = () => {
    if (certificationInput.trim() && !selectedCertifications.includes(certificationInput.trim())) {
      onCertificationsChange([...selectedCertifications, certificationInput.trim()])
      setCertificationInput('')
    }
  }

  const handleRemoveCertification = (cert: string) => {
    onCertificationsChange(selectedCertifications.filter((c) => c !== cert))
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSkillInput('')
    setCertificationInput('')
    onSearchChange('')
    onIndustriesChange([])
    onMinScoreChange(0)
    onSkillsChange([])
    onCertificationsChange([])
  }

  const hasActiveFilters =
    searchQuery.length > 0 ||
    minScore > 0 ||
    selectedSkills.length > 0 ||
    selectedCertifications.length > 0

  // Custom active filters content
  const activeFiltersContent = (
    <Stack gap={8}>
      {searchQuery && (
        <Row gap={8} align="center">
          <Text color="$gray11">Search:</Text>
          <Text color="$blue10">{searchQuery}</Text>
        </Row>
      )}
      {minScore > 0 && (
        <Row gap={8} align="center">
          <Text color="$gray11">Min Score:</Text>
          <Text color="$blue10">{minScore}</Text>
        </Row>
      )}
      {selectedSkills.length > 0 && (
        <Row gap={8} align="center" wrap>
          <Text color="$gray11">Skills:</Text>
          <Text color="$blue10">{selectedSkills.length}</Text>
        </Row>
      )}
      {selectedCertifications.length > 0 && (
        <Row gap={8} align="center" wrap>
          <Text color="$gray11">Certs:</Text>
          <Text color="$green10">{selectedCertifications.length}</Text>
        </Row>
      )}
    </Stack>
  )

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding="md">
        <SearchFilterWidget
          title="Search & Filter"
          subtitle="Find skilled workers for your projects"
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchLabel={
            <Row align="center" gap={8}>
              <Search size="md" />
              <Text>Search</Text>
            </Row>
          }
          searchPlaceholder="Search by name, title, or location..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          wrapped={false}
          activeFiltersContent={activeFiltersContent}
        >
          <Separator />

          {/* Scaffald Score Filter */}
          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Text color="secondary">Scaffald Score</Text>
              <Text color="primary">{minScore}</Text>
            </Row>
            <RangeSlider
              value={minScore}
              onValueChange={onMinScoreChange}
              min={0}
              max={100}
              step={5}
            />
          </Stack>

          <Separator />

          {/* Skills Filter */}
          <Stack gap={12}>
            <Row align="center" gap={8}>
              <Award size="md" color="$gray11" />
              <Text color="$gray11">Skills</Text>
            </Row>

            <Row gap={8}>
              <Input
                style={{ flex: 1 }}
                placeholder="Add skill..."
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={handleAddSkill}
              />
              <Button size="sm" onPress={handleAddSkill} disabled={!skillInput.trim()}>
                Add
              </Button>
            </Row>

            {selectedSkills.length > 0 && (
              <Row gap={8} wrap>
                {selectedSkills.map((skill) => (
                  <Row
                    key={skill}
                    backgroundColor="$blue3"
                    paddingHorizontal={8}
                    paddingVertical={4}
                    borderRadius={12}
                    gap={4}
                    align="center"
                  >
                    <Text color="$blue11">{skill}</Text>
                    <Button size="sm" variant="text" onPress={() => handleRemoveSkill(skill)}>
                      <X size={16} color="#1d4ed8" />
                    </Button>
                  </Row>
                ))}
              </Row>
            )}
          </Stack>

          <Separator />

          {/* Certifications Filter */}
          <Stack gap={12}>
            <Row align="center" gap={8}>
              <BadgeCheck size="md" color="$gray11" />
              <Text color="$gray11">Certifications</Text>
            </Row>

            <Row gap={8}>
              <Input
                style={{ flex: 1 }}
                placeholder="Add certification..."
                value={certificationInput}
                onChangeText={setCertificationInput}
                onSubmitEditing={handleAddCertification}
              />
              <Button
                size="sm"
                onPress={handleAddCertification}
                disabled={!certificationInput.trim()}
              >
                Add
              </Button>
            </Row>

            {selectedCertifications.length > 0 && (
              <Row gap={8} wrap>
                {selectedCertifications.map((cert) => (
                  <Row
                    key={cert}
                    backgroundColor="$green3"
                    paddingHorizontal={8}
                    paddingVertical={4}
                    borderRadius={12}
                    gap={4}
                    align="center"
                  >
                    <Text color="$green11">{cert}</Text>
                    <Button size="sm" variant="text" onPress={() => handleRemoveCertification(cert)}>
                      <X size={16} color="#22c55e" />
                    </Button>
                  </Row>
                ))}
              </Row>
            )}
          </Stack>
        </SearchFilterWidget>
      </Stack>
    </ScrollView>
  )
}
