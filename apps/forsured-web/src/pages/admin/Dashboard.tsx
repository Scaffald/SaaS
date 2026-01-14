// src/pages/admin/Dashboard.tsx
import { Stack, Row, Text, H1, H2, Card } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize, borderRadius } from '@unicornlove/beyond-ui';
import PageTransition from '../../components/Common/PageTransition';
import AnimatedList from '../../components/Common/AnimatedList';

// Stats data for AnimatedList
const statsData = [
  { id: 'users', title: 'Total Users', value: '142' },
  { id: 'brokers', title: 'Active Brokers', value: '23' },
  { id: 'projects', title: 'Projects', value: '89' },
  { id: 'tasks', title: 'Tasks Created', value: '1,234' },
];

// Activity data for AnimatedList
const activityData = [
  { id: '1', text: 'New GC signup: Acme Construction' },
  { id: '2', text: 'Broker invitation sent to jane@insurance.com' },
  { id: '3', text: 'New project created: Downtown Tower' },
];

function AdminDashboard() {
  return (
    <PageTransition>
      <Stack>
        <H1 style={{ fontSize: fontSize.h4, fontWeight: 'bold', marginBottom: spacing[24] }}>Admin Dashboard</H1>
        <AnimatedList
          items={statsData}
          keyExtractor={(stat) => stat.id}
          gap={24}
          style={{ display: 'flex', flexWrap: 'wrap' }}
        >
          {(stat) => (
            <Card
              style={{
                width: '100%',
                padding: spacing[24],
                borderRadius: borderRadius.s,
                backgroundColor: colors.bg.light.default
              }}
            >
              <H2 style={{ fontSize: fontSize.h5, fontWeight: 600, marginBottom: spacing[8] }}>{stat.title}</H2>
              <Text style={{ fontSize: fontSize.h3, fontWeight: 'bold' }}>{stat.value}</Text>
            </Card>
          )}
        </AnimatedList>

        <Stack style={{ marginTop: spacing[32] }}>
          <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[16] }}>Recent Activity</H2>
          <Card style={{ backgroundColor: colors.bg.light.default, padding: spacing[24], borderRadius: borderRadius.s }}>
            <AnimatedList
              items={activityData}
              keyExtractor={(activity) => activity.id}
              gap={0}
              staggerDelay={75}
            >
              {(activity, index) => (
                <Row
                  style={{
                    paddingTop: spacing[8],
                    paddingBottom: spacing[8],
                    borderBottomWidth: index < activityData.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border.light.default,
                  }}
                >
                  <Text>{activity.text}</Text>
                </Row>
              )}
            </AnimatedList>
          </Card>
        </Stack>
      </Stack>
    </PageTransition>
  );
}

export default AdminDashboard;
