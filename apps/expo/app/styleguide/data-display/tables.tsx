import { Table, Tbody, Td, Th, Thead, Tr, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

const rows = [
  { name: 'Project kickoff', owner: 'Olivia', status: 'In Progress' },
  { name: 'Design QA', owner: 'Mason', status: 'Pending' },
  { name: 'Release', owner: 'Chloe', status: 'Scheduled' },
]

export default function TablesPage() {
  return (
    <StyleguidePage
      title="Tables"
      description="Striped, condensed tables styled after Bootstrap components."
    >
      <YStack gap="$6">
        <AnchorHeading description="Apply alternating backgrounds with even-row styling.">
          Striped table
        </AnchorHeading>
        <ExampleBlock
          title="Data table"
          code={`<Table width="100%">\n  <Thead><Tr><Th>Task</Th><Th>Owner</Th><Th>Status</Th></Tr></Thead>\n  <Tbody>...</Tbody>\n</Table>`}
        >
          <Table width="100%">
            <Thead>
              <Tr>
                <Th>Task</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row, index) => (
                <Tr
                  key={row.name}
                  backgroundColor={index % 2 === 0 ? '$gray2' : 'transparent'}
                  borderBottomWidth={1}
                  borderColor="$gray4"
                >
                  <Td>{row.name}</Td>
                  <Td>{row.owner}</Td>
                  <Td>{row.status}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
