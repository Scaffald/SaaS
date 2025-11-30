// @ts-nocheck
import { ScrollView, Separator, Text, XStack, YStack } from 'tamagui'

type PropRow = {
  name: string
  type: string
  description: string
  defaultValue?: string
  required?: boolean
}

type PropsTableProps = {
  title?: string
  props: PropRow[]
  note?: string
}

export function PropsTable({ title, props, note }: PropsTableProps) {
  return (
    <YStack gap="$3" width="100%">
      {title ? (
        <Text fontSize={18} fontWeight="600" color="$color12">
          {title}
        </Text>
      ) : null}
      {note ? (
        <Text fontSize={12} color="$color10">
          {note}
        </Text>
      ) : null}
      <ScrollView horizontal>
        <YStack
          borderWidth={1}
          borderColor="$color6"
          borderRadius="$4"
          overflow="hidden"
          minWidth="100%"
        >
          <HeaderRow />
          <Separator borderColor="$color6" />
          {props.map((prop) => (
            <PropRow key={prop.name} {...prop} />
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

const HeaderRow = () => (
  <XStack bg="$color3" paddingVertical={12} paddingHorizontal={16} gap={16}>
    <Text fontSize={12} fontWeight="600" width={140} color="$color11" textTransform="uppercase">
      Prop
    </Text>
    <Text fontSize={12} fontWeight="600" width={200} color="$color11" textTransform="uppercase">
      Type
    </Text>
    <Text fontSize={12} fontWeight="600" flex={1} color="$color11" textTransform="uppercase">
      Description
    </Text>
    <Text fontSize={12} fontWeight="600" width={120} color="$color11" textTransform="uppercase">
      Default
    </Text>
  </XStack>
)

const PropRow = ({ name, type, description, defaultValue, required }: PropRow) => (
  <XStack paddingVertical={12} paddingHorizontal={16} gap={16} bg="$color1">
    <Text fontSize={13} width={140} color="$color11" fontFamily="monospace">
      {name}
      {required ? <Text color="$color9">*</Text> : null}
    </Text>
    <Text fontSize={13} width={200} color="$color10" fontFamily="monospace">
      {type}
    </Text>
    <Text fontSize={13} flex={1} color="$color11">
      {description}
    </Text>
    <Text fontSize={13} width={120} color="$color10">
      {defaultValue ?? '—'}
    </Text>
  </XStack>
)
