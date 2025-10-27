import { Table, Tbody, Td, Th, Thead, Tr, YStack } from 'tamagui'

export type ApiRow = {
  name: string
  type: string
  description?: string
  defaultValue?: string
  required?: boolean
}

export type ApiTableProps = {
  rows: ApiRow[]
}

export function ApiTable({ rows }: ApiTableProps) {
  if (!rows.length) return null

  return (
    <YStack borderWidth={1} borderColor="$gray5" borderRadius="$5" overflow="hidden">
      <Table width="100%" backgroundColor="$color">
        <Thead backgroundColor="$gray2">
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Description</Th>
            <Th>Default</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.name} borderBottomWidth={1} borderColor="$gray4">
              <Td fontWeight={row.required ? '700' : '500'}>{row.name}</Td>
              <Td fontFamily="monospace">{row.type}</Td>
              <Td color="$gray11">{row.description ?? '—'}</Td>
              <Td fontFamily="monospace">{row.defaultValue ?? '—'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </YStack>
  )
}
