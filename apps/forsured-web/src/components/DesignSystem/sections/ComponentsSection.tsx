import React, { useState } from 'react';
import { YStack, XStack, View, Text, H2, H3 } from '@unicornlove/ui';
import ComponentShowcase from '../ComponentShowcase';
import Button from '../../Common/Button';
import Badge from '../../Common/Badge';
import Input from '../../Common/Input';
import Select from '../../Common/Select';
import Textarea from '../../Common/Textarea';
import Card from '../../Common/Card';
import Modal from '../../Common/Modal';
import StatusBadge from '../../Common/StatusBadge';
import ComplianceScore from '../../Common/ComplianceScore';
import IconButton from '../../Common/IconButton';
import Checkbox from '../../../ui/Checkbox';
import Radio from '../../../ui/Radio';
import Switch from '../../../ui/Switch';
import { Alert } from '@unicornlove/ui';
import Tooltip from '../../../ui/Tooltip';
import Progress, { CircularProgress } from '../../../ui/Progress';
import Avatar, { AvatarGroup } from '../../../ui/Avatar';
import { TabsCustom as Tabs } from '@unicornlove/ui';
import Accordion from '../../../ui/Accordion';
import Divider from '../../../ui/Divider';
import { EmptyState } from '@unicornlove/ui';
import Breadcrumbs from '../../../ui/Breadcrumbs';
import Pagination from '../../../ui/Pagination';
import {
  Box,
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
    <YStack gap="$8" marginBottom="$12">
      <XStack alignItems="center" gap="$3" marginBottom="$6">
        <Box color="var(--blue10)" size={32} />
        <H2 fontSize="$9" fontWeight="bold" color="$color12">
          Components
        </H2>
      </XStack>

      <View id="buttons">
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
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button leftIcon={Play}>With Icon</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </ComponentShowcase>
      </View>

      <View id="forms">
        <H3 fontSize="$8" fontWeight="600" color="$color12" marginBottom="$4">
          Form Controls
        </H3>

        <YStack gap="$6">
          <ComponentShowcase
            title="Input Fields"
            description="Text inputs with labels, errors, and helper text"
          >
            <YStack width="100%" maxWidth={448} gap="$4">
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
            </YStack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Select Dropdowns"
            description="Dropdown select with options"
          >
            <View width="100%" maxWidth={448}>
              <Select
                label="Choose an option"
                options={[
                  { value: '', label: 'Select...' },
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </View>
          </ComponentShowcase>

          <ComponentShowcase
            title="Textarea"
            description="Multi-line text input"
          >
            <View width="100%" maxWidth={448}>
              <Textarea
                label="Description"
                rows={4}
                placeholder="Enter a description..."
              />
            </View>
          </ComponentShowcase>

          <ComponentShowcase
            title="Checkboxes"
            description="Single and grouped checkboxes"
          >
            <YStack width="100%" maxWidth={448} gap="$3">
              <Checkbox label="Default checkbox" />
              <Checkbox label="Checked checkbox" checked />
              <Checkbox label="Small size" size="sm" />
              <Checkbox label="Large size" size="lg" />
              <Checkbox
                label="With helper text"
                helperText="This is helper text"
              />
            </YStack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Radio Buttons"
            description="Single-choice radio buttons"
          >
            <YStack width="100%" maxWidth={448} gap="$3">
              <Radio name="demo" label="Option 1" />
              <Radio name="demo" label="Option 2" checked />
              <Radio name="demo" label="Option 3" />
            </YStack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Switches"
            description="Toggle switches for binary choices"
          >
            <YStack width="100%" maxWidth={448} gap="$3">
              <Switch label="Enable notifications" />
              <Switch label="Auto-save" checked />
              <Switch label="Small size" size="sm" />
              <Switch label="Large size" size="lg" />
            </YStack>
          </ComponentShowcase>
        </YStack>
      </View>

      <View id="display">
        <H3 fontSize="$8" fontWeight="600" color="$color12" marginBottom="$4">
          Display Components
        </H3>

        <YStack gap="$6">
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
            <Badge size="sm">Small</Badge>
            <Badge size="lg">Large</Badge>
            <Badge dot>With Dot</Badge>
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
              <Text fontWeight="600" color="$color12" marginBottom="$1">
                Small Padding
              </Text>
              <Text fontSize="$3" color="$color11">Card content</Text>
            </Card>
            <Card padding="md" width={192}>
              <Text fontWeight="600" color="$color12" marginBottom="$1">
                Medium Padding
              </Text>
              <Text fontSize="$3" color="$color11">Card content</Text>
            </Card>
            <Card padding="lg" hover width={192}>
              <Text fontWeight="600" color="$color12" marginBottom="$1">
                With Hover
              </Text>
              <Text fontSize="$3" color="$color11">Hover over me</Text>
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
        </YStack>
      </View>

      <View id="feedback">
        <H3 fontSize="$8" fontWeight="600" color="$color12" marginBottom="$4">
          Feedback Components
        </H3>

        <YStack gap="$6">
          <ComponentShowcase
            title="Alerts"
            description="Informational messages with variants"
          >
            <YStack width="100%" gap="$4">
              <Alert variant="info" title="Information">
                This is an informational message.
              </Alert>
              <Alert
                variant="success"
                title="Success"
                closable
                onClose={() => {}}
              >
                Your changes have been saved successfully.
              </Alert>
              <Alert variant="warning" title="Warning">
                Please review your information before submitting.
              </Alert>
              <Alert variant="error" title="Error" closable onClose={() => {}}>
                An error occurred while processing your request.
              </Alert>
            </YStack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Modals"
            description="Dialog overlays for focused content"
          >
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Example Modal"
              size="md"
            >
              <Text color="$color11">
                This is an example modal dialog. It can contain any content you
                need.
              </Text>
              <XStack marginTop="$4" justifyContent="flex-end" gap="$3">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </XStack>
            </Modal>
          </ComponentShowcase>

          <ComponentShowcase
            title="Tooltips"
            description="Contextual information on hover"
          >
            <Tooltip content="Top tooltip" position="top">
              <Button size="sm">Top</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" position="bottom">
              <Button size="sm">Bottom</Button>
            </Tooltip>
            <Tooltip content="Left tooltip" position="left">
              <Button size="sm">Left</Button>
            </Tooltip>
            <Tooltip content="Right tooltip" position="right">
              <Button size="sm">Right</Button>
            </Tooltip>
          </ComponentShowcase>

          <ComponentShowcase
            title="Progress Bars"
            description="Linear and circular progress indicators"
          >
            <YStack width="100%" gap="$4">
              <Progress value={25} variant="primary" showLabel />
              <Progress
                value={50}
                variant="success"
                showLabel
                label="Upload Progress"
              />
              <Progress value={75} variant="warning" showLabel />
              <Progress value={90} variant="error" showLabel />
              <XStack justifyContent="center" gap="$4" paddingTop="$4">
                <CircularProgress value={25} variant="primary" size={80} />
                <CircularProgress value={50} variant="success" size={80} />
                <CircularProgress value={75} variant="warning" size={80} />
                <CircularProgress value={90} variant="error" size={80} />
              </XStack>
            </YStack>
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
        </YStack>
      </View>

      <View id="navigation">
        <H3 fontSize="$8" fontWeight="600" color="$color12" marginBottom="$4">
          Navigation Components
        </H3>

        <YStack gap="$6">
          <ComponentShowcase
            title="Tabs"
            description="Tabbed navigation with multiple variants"
          >
            <YStack width="100%" gap="$6">
              <Tabs
                variant="line"
                tabs={[
                  {
                    id: 'overview',
                    label: 'Overview',
                    content: (
                      <View padding="$4">
                        <Text color="$color11">Overview content</Text>
                      </View>
                    ),
                  },
                  {
                    id: 'details',
                    label: 'Details',
                    content: (
                      <View padding="$4">
                        <Text color="$color11">Details content</Text>
                      </View>
                    ),
                  },
                  {
                    id: 'settings',
                    label: 'Settings',
                    content: (
                      <View padding="$4">
                        <Text color="$color11">Settings content</Text>
                      </View>
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
                      <View padding="$4">
                        <Text color="$color11">All items</Text>
                      </View>
                    ),
                  },
                  {
                    id: 'active',
                    label: 'Active',
                    content: (
                      <View padding="$4">
                        <Text color="$color11">Active items</Text>
                      </View>
                    ),
                    badge: '12',
                  },
                  {
                    id: 'archived',
                    label: 'Archived',
                    content: (
                      <View padding="$4">
                        <Text color="$color11">Archived items</Text>
                      </View>
                    ),
                  },
                ]}
              />
            </YStack>
          </ComponentShowcase>

          <ComponentShowcase
            title="Breadcrumbs"
            description="Hierarchical navigation trail"
          >
            <View width="100%">
              <Breadcrumbs
                showHome
                items={[
                  { label: 'Projects', onClick: () => {} },
                  { label: 'Project Name', onClick: () => {} },
                  { label: 'Details' },
                ]}
              />
            </View>
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
            <View width="100%" maxWidth={672}>
              <Accordion
                items={[
                  {
                    id: '1',
                    title: 'What is included?',
                    content: (
                      <Text color="$color11">
                        All features are included in every plan.
                      </Text>
                    ),
                  },
                  {
                    id: '2',
                    title: 'How does billing work?',
                    content: (
                      <Text color="$color11">
                        You are billed monthly based on your usage.
                      </Text>
                    ),
                  },
                  {
                    id: '3',
                    title: 'Can I cancel anytime?',
                    content: (
                      <Text color="$color11">
                        Yes, you can cancel your subscription at any time.
                      </Text>
                    ),
                  },
                ]}
                defaultOpen={['1']}
              />
            </View>
          </ComponentShowcase>
        </YStack>
      </View>

      <View id="layout">
        <H3 fontSize="$8" fontWeight="600" color="$color12" marginBottom="$4">
          Layout Components
        </H3>

        <ComponentShowcase
          title="Dividers"
          description="Visual separators for content"
        >
          <YStack width="100%" gap="$6">
            <Divider />
            <Divider label="OR" />
            <Divider label="Section Break" />
            <XStack
              alignItems="center"
              gap="$4"
              height={100}
            >
              <View flex={1} backgroundColor="$backgroundTertiary" borderRadius="$4" height="100%" />
              <Divider orientation="vertical" />
              <View flex={1} backgroundColor="$backgroundTertiary" borderRadius="$4" height="100%" />
            </XStack>
          </YStack>
        </ComponentShowcase>
      </View>
    </YStack>
  );
}
