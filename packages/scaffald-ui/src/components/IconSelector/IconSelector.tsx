/**
 * IconSelector – trigger + modal grid to pick a Lucide icon by name.
 */

import { useMemo, useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import * as LucideIcons from 'lucide-react-native'
import { ChevronDown, Search, X } from 'lucide-react-native'
import type { ComponentType } from 'react'
import { Stack } from '../Layout'
import { Row } from '../Layout'
import { Input } from '../Input'
import { Modal, ModalHeader, ModalContent } from '../Modal'
import { Label } from '../Typography'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { DEFAULT_ICON_NAMES } from './iconNames'
import type { IconSelectorProps } from './IconSelector.types'

const ICON_NAMES = DEFAULT_ICON_NAMES as readonly string[]

function getIconComponent(name: string): ComponentType<{ size?: number; color?: string }> | null {
  const Icon = (LucideIcons as unknown as Record<string, ComponentType<{ size?: number; color?: string }>>)[name]
  return Icon ?? null
}

export function IconSelector({
  value,
  onChange,
  disabled = false,
  label = 'Icon',
  placeholder = 'Select an icon',
  iconNames = ICON_NAMES,
}: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return [...iconNames]
    const lower = search.toLowerCase()
    return iconNames.filter((name) => name.toLowerCase().includes(lower))
  }, [search, iconNames])

  const SelectedIcon = value ? getIconComponent(value) : null

  const handleSelect = (iconName: string) => {
    onChange(iconName)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <Stack gap={spacing[2]}>
      {label ? <Label>{label}</Label> : null}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
            padding: spacing[3],
            borderWidth: 1,
            borderColor: colors.border.light.default,
            borderRadius: borderRadius.m,
            backgroundColor: colors.bg.light.default,
            opacity: disabled ? 0.5 : 1,
          },
          pressed && !disabled && { backgroundColor: colors.gray[50] },
        ]}
      >
        {SelectedIcon ? (
          <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
            <SelectedIcon size={20} color={colors.icon.light.default} />
          </View>
        ) : null}
        <Text style={{ flex: 1, fontSize: 16, color: colors.text.light.primary }}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.text.light.secondary} />
      </Pressable>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)} width={400}>
        <ModalHeader
          title="Select icon"
          onClose={() => setIsOpen(false)}
          showCloseButton
        />
        <ModalContent>
          <Stack gap={spacing[3]}>
            <Row align="center" gap={spacing[2]}>
              <Search size={16} color={colors.text.light.secondary} />
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Search icons..."
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              {search ? (
                <Pressable
                  onPress={() => setSearch('')}
                  style={{ padding: spacing[2] }}
                  hitSlop={8}
                >
                  <X size={18} color={colors.text.light.secondary} />
                </Pressable>
              ) : null}
            </Row>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing[1],
                  padding: spacing[2],
                }}
              >
                {filteredIcons.map((iconName) => {
                  const IconComponent = getIconComponent(iconName)
                  const isSelected = iconName === value
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => handleSelect(iconName)}
                      style={({ pressed }) => [
                        {
                          width: 44,
                          height: 44,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: borderRadius.m,
                          borderWidth: 1,
                          backgroundColor: isSelected ? colors.primary[50] : colors.bg.light.default,
                          borderColor: isSelected ? colors.primary[200] : colors.border.light.default,
                        },
                        pressed && { backgroundColor: isSelected ? colors.primary[100] : colors.gray[50] },
                      ]}
                    >
                      {IconComponent ? (
                        <IconComponent size={20} color={isSelected ? colors.primary[600] : colors.icon.light.default} />
                      ) : null}
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>
            <Text
              style={{
                fontSize: 12,
                color: colors.text.light.secondary,
                textAlign: 'center',
              }}
            >
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
            </Text>
          </Stack>
        </ModalContent>
      </Modal>
    </Stack>
  )
}
