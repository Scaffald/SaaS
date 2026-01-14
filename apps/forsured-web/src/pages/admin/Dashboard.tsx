// src/pages/admin/Dashboard.tsx
import { Stack, Row, Text, H1, H2, Card } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize, borderRadius } from '@unicornlove/beyond-ui';

function AdminDashboard() {
  return (
    <Stack>
      <H1 style={{ fontSize: fontSize.h4, fontWeight: 'bold', marginBottom: spacing[24] }}>Admin Dashboard</H1>
      <Row style={{ flexWrap: 'wrap', gap: spacing[24] }}>
        <Card
          style={{
            width: '100%',
            padding: spacing[24],
            borderRadius: borderRadius.s,
            backgroundColor: colors.bg.light.default
          }}
        >
          <H2 style={{ fontSize: fontSize.h5, fontWeight: 600, marginBottom: spacing[8] }}>Total Users</H2>
          <Text style={{ fontSize: fontSize.h3, fontWeight: 'bold' }}>142</Text>
        </Card>
        <Card
          style={{
            width: '100%',
            padding: spacing[24],
            borderRadius: borderRadius.s,
            backgroundColor: colors.bg.light.default
          }}
        >
          <H2 style={{ fontSize: fontSize.h5, fontWeight: 600, marginBottom: spacing[8] }}>Active Brokers</H2>
          <Text style={{ fontSize: fontSize.h3, fontWeight: 'bold' }}>23</Text>
        </Card>
        <Card
          style={{
            width: '100%',
            padding: spacing[24],
            borderRadius: borderRadius.s,
            backgroundColor: colors.bg.light.default
          }}
        >
          <H2 style={{ fontSize: fontSize.h5, fontWeight: 600, marginBottom: spacing[8] }}>Projects</H2>
          <Text style={{ fontSize: fontSize.h3, fontWeight: 'bold' }}>89</Text>
        </Card>
        <Card
          style={{
            width: '100%',
            padding: spacing[24],
            borderRadius: borderRadius.s,
            backgroundColor: colors.bg.light.default
          }}
        >
          <H2 style={{ fontSize: fontSize.h5, fontWeight: 600, marginBottom: spacing[8] }}>Tasks Created</H2>
          <Text style={{ fontSize: fontSize.h3, fontWeight: 'bold' }}>1,234</Text>
        </Card>
      </Row>

      <Stack style={{ marginTop: spacing[32] }}>
        <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[16] }}>Recent Activity</H2>
        <Card style={{ backgroundColor: colors.bg.light.default, padding: spacing[24], borderRadius: borderRadius.s }}>
          <Row style={{ paddingTop: spacing[8], paddingBottom: spacing[8], borderBottomWidth: 1, borderBottomColor: colors.border.light.default }}>
            <Text>New GC signup: Acme Construction</Text>
          </Row>
          <Row style={{ paddingTop: spacing[8], paddingBottom: spacing[8], borderBottomWidth: 1, borderBottomColor: colors.border.light.default }}>
            <Text>Broker invitation sent to jane@insurance.com</Text>
          </Row>
          <Row style={{ paddingTop: spacing[8], paddingBottom: spacing[8] }}>
            <Text>New project created: Downtown Tower</Text>
          </Row>
        </Card>
      </Stack>
    </Stack>
  );
}

export default AdminDashboard;
