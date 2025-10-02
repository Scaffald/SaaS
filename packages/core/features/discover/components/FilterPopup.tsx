import { useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Separator,
  ScrollView,
  Slider,
  AnimatePresence,
} from 'tamagui'
import { ChevronDown, ChevronRight, X } from '@tamagui/lucide-icons'

type FilterPopupProps = {
  isOpen: boolean
  onClose: () => void
  railVisible?: boolean
}

type AccordionSection = 'score' | 'skills' | 'certifications'

/**
 * Filter Popup Component
 * 300px wide x 400px high popup with accordion sections for filters
 * Animates in above the filter bar, similar to search input
 */
export const FilterPopup = ({ isOpen, onClose, railVisible = false }: FilterPopupProps) => {
  const [openSections, setOpenSections] = useState<Set<AccordionSection>>(new Set(['score']))
  const [scoreValue, setScoreValue] = useState(40)
  const [skillsSearch, setSkillsSearch] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Hardwood',
    'Exterior',
    'Interior',
  ])
  const [certificationsSearch, setCertificationsSearch] = useState('')
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([
    'OSHA Outreach · Construction',
  ])

  const toggleSection = (section: AccordionSection) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const removeSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill))
  }

  const removeCertification = (cert: string) => {
    setSelectedCertifications((prev) => prev.filter((c) => c !== cert))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <XStack
          position="absolute"
          b={100}
          l={0}
          r={railVisible ? 440 : 0}
          z={60}
          animation="quick"
          enterStyle={{ opacity: 0, y: 20 }}
          exitStyle={{ opacity: 0, y: 20 }}
          opacity={1}
          y={0}
          justify="center"
          items="center"
          px="$4"
        >
          <YStack
            width={300}
            height={400}
            flex={1}
            borderWidth={1}
            borderColor="$borderColor"
            bg="$background"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.15}
            shadowRadius={12}
            rounded="$4"
            overflow="hidden"
          >
            {/* Header */}
            <XStack
              px="$4"
              py="$3"
              justify="space-between"
              items="center"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <Text fontSize="$5" fontWeight="700">
                Filters
              </Text>
              <Button
                size="$2"
                circular
                variant="outlined"
                onPress={onClose}
                icon={X}
                scaleIcon={1.2}
              />
            </XStack>

            {/* Scrollable Content */}
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
              <YStack p="$3" gap="$2">
                {/* Elevate Score Section */}
                <YStack>
                  <Button
                    unstyled
                    onPress={() => toggleSection('score')}
                    px="$3"
                    py="$2"
                    hoverStyle={{ bg: '$color3' }}
                    pressStyle={{ bg: '$color4' }}
                    rounded="$3"
                  >
                    <XStack justify="space-between" items="center" flex={1}>
                      <Text fontSize="$4" fontWeight="600">
                        Elevate Score
                      </Text>
                      {openSections.has('score') ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </XStack>
                  </Button>

                  {openSections.has('score') && (
                    <YStack gap="$3" px="$3" py="$3">
                      <XStack justify="space-between" items="center">
                        <Text fontSize="$3" color="$color11">
                          Minimum Score
                        </Text>
                        <Text fontSize="$4" fontWeight="600">
                          {scoreValue}
                        </Text>
                      </XStack>
                      <Slider
                        value={[scoreValue]}
                        onValueChange={([val]) => setScoreValue(val)}
                        min={0}
                        max={100}
                        step={5}
                        width="100%"
                      >
                        <Slider.Track>
                          <Slider.TrackActive />
                        </Slider.Track>
                        <Slider.Thumb circular index={0} />
                      </Slider>
                    </YStack>
                  )}
                </YStack>

                <Separator />

                {/* Skills Section */}
                <YStack>
                  <Button
                    unstyled
                    onPress={() => toggleSection('skills')}
                    px="$3"
                    py="$2"
                    hoverStyle={{ bg: '$color3' }}
                    pressStyle={{ bg: '$color4' }}
                    rounded="$3"
                  >
                    <XStack justify="space-between" items="center" flex={1}>
                      <Text fontSize="$4" fontWeight="600">
                        Skills
                      </Text>
                      {openSections.has('skills') ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </XStack>
                  </Button>

                  {openSections.has('skills') && (
                    <YStack gap="$2" px="$3" py="$3">
                      <Input
                        placeholder="Search skills..."
                        value={skillsSearch}
                        onChangeText={setSkillsSearch}
                        size="$3"
                      />
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
                              <Button
                                size="$1"
                                circular
                                unstyled
                                onPress={() => removeSkill(skill)}
                              >
                                <X size={12} color="$blue11" />
                              </Button>
                            </XStack>
                          ))}
                        </XStack>
                      )}
                    </YStack>
                  )}
                </YStack>

                <Separator />

                {/* Certifications Section */}
                <YStack>
                  <Button
                    unstyled
                    onPress={() => toggleSection('certifications')}
                    px="$3"
                    py="$2"
                    hoverStyle={{ bg: '$color3' }}
                    pressStyle={{ bg: '$color4' }}
                    rounded="$3"
                  >
                    <XStack justify="space-between" items="center" flex={1}>
                      <Text fontSize="$4" fontWeight="600">
                        Certifications
                      </Text>
                      {openSections.has('certifications') ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </XStack>
                  </Button>

                  {openSections.has('certifications') && (
                    <YStack gap="$2" px="$3" py="$3">
                      <Input
                        placeholder="Search certifications..."
                        value={certificationsSearch}
                        onChangeText={setCertificationsSearch}
                        size="$3"
                      />
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
                                onPress={() => removeCertification(cert)}
                              >
                                <X size={12} color="$green11" />
                              </Button>
                            </XStack>
                          ))}
                        </XStack>
                      )}
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </ScrollView>

            {/* Footer */}
            <XStack
              px="$4"
              py="$3"
              gap="$2"
              justify="flex-end"
              borderTopWidth={1}
              borderTopColor="$borderColor"
            >
              <Button size="$3" variant="outlined" onPress={onClose}>
                <Text>Close</Text>
              </Button>
              <Button size="$3" onPress={onClose}>
                <Text>Apply</Text>
              </Button>
            </XStack>
          </YStack>
        </XStack>
      )}
    </AnimatePresence>
  )
}
