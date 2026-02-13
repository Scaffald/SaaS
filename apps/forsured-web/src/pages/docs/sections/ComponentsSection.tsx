import React, { useState } from 'react';
import { Stack, Row, Box, Text, H2, H3, Spinner, Alert } from '@scaffald/ui';
import ComponentShowcase from '../../../components/DesignSystem/ComponentShowcase';
import Button from '../../../components/Common/Button';
import Badge from '../../../components/Common/Badge';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Textarea from '../../../components/Common/Textarea';
import Card from '../../../components/Common/Card';
import Modal from '../../../components/Common/Modal';
import StatusBadge from '../../../components/Common/StatusBadge';
import ComplianceScore from '../../../components/Common/ComplianceScore';
import IconButton from '../../../components/Common/IconButton';
import Checkbox from '../../../ui/Checkbox';
import Radio from '../../../ui/Radio';
import Switch from '../../../ui/Switch';
import Tooltip from '../../../ui/Tooltip';
import Progress, { CircularProgress } from '../../../ui/Progress';
import Avatar, { AvatarGroup } from '../../../ui/Avatar';
import Tabs from '../../../ui/Tabs';
import Accordion from '../../../ui/Accordion';
import Divider from '../../../ui/Divider';
import { EmptyState } from '../../../ui/EmptyState';
import Breadcrumbs from '../../../ui/Breadcrumbs';
import Pagination from '../../../ui/Pagination';
import {
  Box as BoxIcon,
  Play,
  Star,
  Settings,
  Bell,
  Search,
  Plus,
  Inbox,
} from 'lucide-react';

export default function ComponentsSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Stack style={{ gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
      <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <BoxIcon color="var(--color-blue-10)" size={32} />
        <H2 style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-12)' }}>
          Components
        </H2>
      </Row>

      <Box id="buttons">
        <ComponentShowcase
          title="Buttons"
          description="Buttons with multiple variants, sizes, and states"
        >
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button size="$2">Small</Button>
          <Button size="$4">Large</Button>
          <Button leftIcon={Play}>With Icon</Button>
          <Button disabled><Spinner size="small" color="var(--color-11)" /> Loading</Button>
          <Button disabled>Disabled</Button>
        </ComponentShowcase>
      </Box>

      <Box id="forms">
        <H3 style={{ fontSize: 'var(--font-size-8)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>
          Form Controls
        </H3>

        <Stack style={{ gap: 'var(--space-6)' }}>
          <ComponentShowcase
            title="Input Fields"
            description="Text inputs with labels, errors, and helper text"
          >
            <Stack style={{ width: '100%', maxWidth: 448, gap: 'var(--space-4)' }}>
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
              />
              <Input label="With Error" error="This field is required" />
              <Input
                label="With Helper Text"
                helperText="Optional helper text"
              />
              <Input label="Required Field" required placeholder="Required" />
            </Stack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Select Dropdowns"
            description="Dropdown select with options"
          >
            <Box style={{ width: '100%', maxWidth: 448 }}>
              <Select
                label="Choose an option"
                options={[
                  { value: '', label: 'Select...' },
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </Box>
          </ComponentShowcase>

          <ComponentShowcase
            title="Textarea"
            description="Multi-line text input"
          >
            <Box style={{ width: '100%', maxWidth: 448 }}>
              <Textarea
                label="Description"
                rows={4}
                placeholder="Enter a description..."
              />
            </Box>
          </ComponentShowcase>

          <ComponentShowcase
            title="Checkboxes"
            description="Single and grouped checkboxes"
          >
            <Stack style={{ width: '100%', maxWidth: 448, gap: 'var(--space-3)' }}>
              <Checkbox label="Default checkbox" />
              <Checkbox label="Checked checkbox" defaultChecked />
              <Checkbox label="Small size" size="sm" />
              <Checkbox label="Large size" size="lg" />
              <Checkbox
                label="With helper text"
                helperText="This is helper text"
              />
            </Stack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Radio Buttons"
            description="Single-choice radio buttons"
          >
            <Stack style={{ width: '100%', maxWidth: 448, gap: 'var(--space-3)' }}>
              <Radio name="demo" label="Option 1" />
              <Radio name="demo" label="Option 2" defaultChecked />
              <Radio name="demo" label="Option 3" />
            </Stack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Switches"
            description="Toggle switches for binary choices"
          >
            <Stack style={{ width: '100%', maxWidth: 448, gap: 'var(--space-3)' }}>
              <Switch label="Enable notifications" />
              <Switch label="Auto-save" defaultChecked />
              <Switch label="Small size" size="sm" />
              <Switch label="Large size" size="lg" />
            </Stack>
          </ComponentShowcase>
        </Stack>
      </Box>

      <Box id="display">
        <H3 style={{ fontSize: 'var(--font-size-8)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>
          Display Components
        </H3>

        <Stack style={{ gap: 'var(--space-6)' }}>
          <ComponentShowcase
            title="Badges"
            description="Small status indicators and labels"
          >
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge size="$2">Small</Badge>
            <Badge size="$4">Large</Badge>
            <Badge variant="filled">Filled</Badge>
          </ComponentShowcase>

          <ComponentShowcase
            title="Status Badges"
            description="Status indicators with icons"
          >
            <StatusBadge status="compliant" />
            <StatusBadge status="verified" />
            <StatusBadge status="warning" />
            <StatusBadge status="pending" />
            <StatusBadge status="critical" />
            <StatusBadge status="expired" />
          </ComponentShowcase>

          <ComponentShowcase
            title="Compliance Score"
            description="Circular score indicators with trends"
          >
            <ComplianceScore score={95} trend="up" size="sm" />
            <ComplianceScore score={85} trend="stable" size="md" />
            <ComplianceScore score={65} trend="down" size="lg" />
          </ComponentShowcase>

          <ComponentShowcase
            title="Avatars"
            description="User profile images with fallbacks"
          >
            <Avatar fallback="JD" size="xs" />
            <Avatar fallback="JD" size="sm" />
            <Avatar fallback="JD" size="md" status="online" />
            <Avatar fallback="AB" size="lg" status="away" />
            <Avatar fallback="CD" size="xl" status="busy" />
            <Avatar fallback="EF" size="2xl" shape="square" />
            <AvatarGroup
              avatars={[
                { fallback: 'JD' },
                { fallback: 'AB' },
                { fallback: 'CD' },
                { fallback: 'EF' },
                { fallback: 'GH' },
                { fallback: 'IJ' },
              ]}
              max={4}
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Cards"
            description="Container components with shadow and padding options"
          >
            <Card padding="sm" width={192}>
              <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-1)' }}>
                Small Padding
              </Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Card content</Text>
            </Card>
            <Card padding="md" width={192}>
              <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-1)' }}>
                Medium Padding
              </Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Card content</Text>
            </Card>
            <Card padding="lg" width={192}>
              <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-1)' }}>
                With Hover
              </Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>Hover over me</Text>
            </Card>
          </ComponentShowcase>

          <ComponentShowcase
            title="Icon Buttons"
            description="Compact buttons with just icons"
          >
            <IconButton icon={Settings} />
            <IconButton icon={Bell} variant="primary" />
            <IconButton icon={Search} variant="secondary" />
            <IconButton icon={Plus} variant="danger" />
            <IconButton icon={Star} size="sm" />
            <IconButton icon={Star} size="lg" />
            <IconButton icon={Bell} badge badgeContent="3" />
            <IconButton icon={Settings} shape="round" />
          </ComponentShowcase>
        </Stack>
      </Box>

      <Box id="feedback">
        <H3 style={{ fontSize: 'var(--font-size-8)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>
          Feedback Components
        </H3>

        <Stack style={{ gap: 'var(--space-6)' }}>
          <ComponentShowcase
            title="Alerts"
            description="Informational messages with variants"
          >
            <Stack style={{ width: '100%', gap: 'var(--space-4)' }}>
              <Alert type="info" title="Information">
                This is an informational message.
              </Alert>
              <Alert
                type="success"
                title="Success"
                dismissible
                onDismiss={() => {}}
              >
                Your changes have been saved successfully.
              </Alert>
              <Alert type="warning" title="Warning">
                Please review your information before submitting.
              </Alert>
              <Alert type="error" title="Error" dismissible onDismiss={() => {}}>
                An error occurred while processing your request.
              </Alert>
            </Stack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Modals"
            description="Dialog overlays for focused content"
          >
            <Button onPress={() => setModalOpen(true)}>Open Modal</Button>
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Example Modal"
              size="medium"
            >
              <Text style={{ color: 'var(--color-11)' }}>
                This is an example modal dialog. It can contain any content you
                need.
              </Text>
              <Row style={{ marginTop: 'var(--space-4)', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button variant="ghost" onPress={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onPress={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </Row>
            </Modal>
          </ComponentShowcase>

          <ComponentShowcase
            title="Tooltips"
            description="Contextual information on hover"
          >
            <Tooltip content="Top tooltip" position="top">
              <Button size="$2">Top</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" position="bottom">
              <Button size="$2">Bottom</Button>
            </Tooltip>
            <Tooltip content="Left tooltip" position="left">
              <Button size="$2">Left</Button>
            </Tooltip>
            <Tooltip content="Right tooltip" position="right">
              <Button size="$2">Right</Button>
            </Tooltip>
          </ComponentShowcase>

          <ComponentShowcase
            title="Progress Bars"
            description="Linear and circular progress indicators"
          >
            <Stack style={{ width: '100%', gap: 'var(--space-4)' }}>
              <Progress value={25} variant="primary" showLabel />
              <Progress
                value={50}
                variant="success"
                showLabel
                label="Upload Progress"
              />
              <Progress value={75} variant="warning" showLabel />
              <Progress value={90} variant="error" showLabel />
              <Row style={{ justifyContent: 'center', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
                <CircularProgress value={25} variant="primary" size={80} />
                <CircularProgress value={50} variant="success" size={80} />
                <CircularProgress value={75} variant="warning" size={80} />
                <CircularProgress value={90} variant="error" size={80} />
              </Row>
            </Stack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Empty States"
            description="Placeholder content when no data is available"
          >
            <EmptyState
              icon={Inbox}
              title="No items found"
              description="Get started by creating your first item"
              action={{ label: 'Create Item', onClick: () => {} }}
              secondaryAction={{ label: 'Learn More', onClick: () => {} }}
            />
          </ComponentShowcase>
        </Stack>
      </Box>

      <Box id="navigation">
        <H3 style={{ fontSize: 'var(--font-size-8)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>
          Navigation Components
        </H3>

        <Stack style={{ gap: 'var(--space-6)' }}>
          <ComponentShowcase
            title="Tabs"
            description="Tabbed navigation with multiple variants"
          >
            <Stack style={{ width: '100%', gap: 'var(--space-6)' }}>
              <Tabs
                variant="line"
                tabs={[
                  {
                    id: 'overview',
                    label: 'Overview',
                    content: (
                      <Box style={{ padding: 'var(--space-4)' }}>
                        <Text style={{ color: 'var(--color-11)' }}>Overview content</Text>
                      </Box>
                    ),
                  },
                  {
                    id: 'details',
                    label: 'Details',
                    content: (
                      <Box style={{ padding: 'var(--space-4)' }}>
                        <Text style={{ color: 'var(--color-11)' }}>Details content</Text>
                      </Box>
                    ),
                  },
                  {
                    id: 'settings',
                    label: 'Settings',
                    content: (
                      <Box style={{ padding: 'var(--space-4)' }}>
                        <Text style={{ color: 'var(--color-11)' }}>Settings content</Text>
                      </Box>
                    ),
                    badge: '3',
                  },
                ]}
              />
              <Tabs
                variant="pill"
                tabs={[
                  {
                    id: 'all',
                    label: 'All',
                    content: (
                      <Box style={{ padding: 'var(--space-4)' }}>
                        <Text style={{ color: 'var(--color-11)' }}>All items</Text>
                      </Box>
                    ),
                  },
                  {
                    id: 'active',
                    label: 'Active',
                    content: (
                      <Box style={{ padding: 'var(--space-4)' }}>
                        <Text style={{ color: 'var(--color-11)' }}>Active items</Text>
                      </Box>
                    ),
                    badge: '12',
                  },
                  {
                    id: 'archived',
                    label: 'Archived',
                    content: (
                      <Box style={{ padding: 'var(--space-4)' }}>
                        <Text style={{ color: 'var(--color-11)' }}>Archived items</Text>
                      </Box>
                    ),
                  },
                ]}
              />
            </Stack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Breadcrumbs"
            description="Hierarchical navigation trail"
          >
            <Box style={{ width: '100%' }}>
              <Breadcrumbs
                showHome
                items={[
                  { label: 'Projects', onClick: () => {} },
                  { label: 'Project Name', onClick: () => {} },
                  { label: 'Details' },
                ]}
              />
            </Box>
          </ComponentShowcase>

          <ComponentShowcase
            title="Pagination"
            description="Navigate through pages of content"
          >
            <Pagination
              currentPage={currentPage}
              totalPages={10}
              onPageChange={setCurrentPage}
              showFirstLast
            />
          </ComponentShowcase>

          <ComponentShowcase
            title="Accordion"
            description="Collapsible content panels"
          >
            <Box style={{ width: '100%', maxWidth: 672 }}>
              <Accordion
                items={[
                  {
                    id: '1',
                    title: 'What is included?',
                    content: (
                      <Text style={{ color: 'var(--color-11)' }}>
                        All features are included in every plan.
                      </Text>
                    ),
                  },
                  {
                    id: '2',
                    title: 'How does billing work?',
                    content: (
                      <Text style={{ color: 'var(--color-11)' }}>
                        You are billed monthly based on your usage.
                      </Text>
                    ),
                  },
                  {
                    id: '3',
                    title: 'Can I cancel anytime?',
                    content: (
                      <Text style={{ color: 'var(--color-11)' }}>
                        Yes, you can cancel your subscription at any time.
                      </Text>
                    ),
                  },
                ]}
                defaultOpen={['1']}
              />
            </Box>
          </ComponentShowcase>
        </Stack>
      </Box>

      <Box id="layout">
        <H3 style={{ fontSize: 'var(--font-size-8)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>
          Layout Components
        </H3>

        <ComponentShowcase
          title="Dividers"
          description="Visual separators for content"
        >
          <Stack style={{ width: '100%', gap: 'var(--space-6)' }}>
            <Divider />
            <Divider label="OR" />
            <Divider label="Section Break" />
            <Row
              style={{
                alignItems: 'center',
                gap: 'var(--space-4)',
                height: 100,
              }}
            >
              <Box style={{ flex: 1, backgroundColor: 'var(--color-background-tertiary)', borderRadius: 'var(--radius-4)', height: '100%' }} />
              <Divider orientation="vertical" />
              <Box style={{ flex: 1, backgroundColor: 'var(--color-background-tertiary)', borderRadius: 'var(--radius-4)', height: '100%' }} />
            </Row>
          </Stack>
        </ComponentShowcase>
      </Box>
    </Stack>
  );
}
