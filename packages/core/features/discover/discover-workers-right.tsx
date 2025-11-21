import { Award, BadgeCheck, Search, X } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, Input, ScrollView, Separator, Slider, Text, XStack, YStack } from 'tamagui'
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
    <YStack gap="$2">
      {searchQuery && (
        <XStack gap="$2" items="center">
          <Text fontSize="$3" color="$color11">
            Search:
          </Text>
          <Text fontSize="$3" fontWeight="600" color="$blue10">
            {searchQuery}
          </Text>
        </XStack>
      )}
      {minScore > 0 && (
        <XStack gap="$2" items="center">
          <Text fontSize="$3" color="$color11">
            Min Score:
          </Text>
          <Text fontSize="$3" fontWeight="600" color="$blue10">
            {minScore}
          </Text>
        </XStack>
      )}
      {selectedSkills.length > 0 && (
        <XStack gap="$2" items="center" flexWrap="wrap">
          <Text fontSize="$3" color="$color11">
            Skills:
          </Text>
          <Text fontSize="$3" fontWeight="600" color="$blue10">
            {selectedSkills.length}
          </Text>
        </XStack>
      )}
      {selectedCertifications.length > 0 && (
        <XStack gap="$2" items="center" flexWrap="wrap">
          <Text fontSize="$3" color="$color11">
            Certs:
          </Text>
          <Text fontSize="$3" fontWeight="600" color="$green10">
            {selectedCertifications.length}
          </Text>
        </XStack>
      )}
    </YStack>
  )

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$4">
        <SearchFilterWidget
          title="Search & Filter"
          subtitle="Find skilled workers for your projects"
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchLabel={
            <XStack items="center" gap="$2">
              <Search size={16} />
              <Text>Search</Text>
            </XStack>
          }
          searchPlaceholder="Search by name, title, or location..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          wrapped={false}
          activeFiltersContent={activeFiltersContent}
        >
          <Separator />

          {/* Scaffald Score Filter */}
          <YStack gap="$3">
            <XStack justify="space-between" items="center">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Scaffald Score
              </Text>
              <Text fontSize="$5" fontWeight="700" color="$blue10">
                {minScore}
              </Text>
            </XStack>
            <Slider
              value={[minScore]}
              onValueChange={([val]) => onMinScoreChange(val)}
              min={0}
              max={100}
              step={5}
              width="100%"
            >
              <Slider.Track>
                <Slider.TrackActive />
              </Slider.Track>
              <Slider.Thumb circular index={0} size="$0.75" />
            </Slider>
          </YStack>

          <Separator />

          {/* Skills Filter */}
          <YStack gap="$3">
            <XStack items="center" gap="$2">
              <Award size={16} color="$color12" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Skills
              </Text>
            </XStack>

            <XStack gap="$2">
              <Input
                flex={1}
                placeholder="Add skill..."
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={handleAddSkill}
                size="$3"
              />
              <Button size="$3" onPress={handleAddSkill} disabled={!skillInput.trim()}>
                Add
              </Button>
            </XStack>

            {selectedSkills.length > 0 && (
              <XStack gap="$2" flexWrap="wrap">
                {selectedSkills.map((skill) => (
                  <XStack
                    key={skill}
                    bg="$blue3"
                    px="$2"
                    py="$1"
                    rounded="$3"
                    gap="$1"
                    items="center"
                  >
                    <Text fontSize="$2" color="$blue11">
                      {skill}
                    </Text>
                    <Button size="$1" circular unstyled onPress={() => handleRemoveSkill(skill)}>
                      <X size={12} color="$blue11" />
                    </Button>
                  </XStack>
                ))}
              </XStack>
            )}
          </YStack>

          <Separator />

          {/* Certifications Filter */}
          <YStack gap="$3">
            <XStack items="center" gap="$2">
              <BadgeCheck size={16} color="$color12" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Certifications
              </Text>
            </XStack>

            <XStack gap="$2">
              <Input
                flex={1}
                placeholder="Add certification..."
                value={certificationInput}
                onChangeText={setCertificationInput}
                onSubmitEditing={handleAddCertification}
                size="$3"
              />
              <Button
                size="$3"
                onPress={handleAddCertification}
                disabled={!certificationInput.trim()}
              >
                Add
              </Button>
            </XStack>

            {selectedCertifications.length > 0 && (
              <XStack gap="$2" flexWrap="wrap">
                {selectedCertifications.map((cert) => (
                  <XStack
                    key={cert}
                    bg="$green3"
                    px="$2"
                    py="$1"
                    rounded="$3"
                    gap="$1"
                    items="center"
                  >
                    <Text fontSize="$2" color="$green11">
                      {cert}
                    </Text>
                    <Button
                      size="$1"
                      circular
                      unstyled
                      onPress={() => handleRemoveCertification(cert)}
                    >
                      <X size={12} color="$green11" />
                    </Button>
                  </XStack>
                ))}
              </XStack>
            )}
          </YStack>
        </SearchFilterWidget>
      </YStack>
    </ScrollView>
  )
}
