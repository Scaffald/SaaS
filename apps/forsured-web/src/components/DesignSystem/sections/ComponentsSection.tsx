import React, { useState } from 'react';
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
import Alert from '../../../ui/Alert';
import Tooltip from '../../../ui/Tooltip';
import Progress, { CircularProgress } from '../../../ui/Progress';
import Avatar, { AvatarGroup } from '../../../ui/Avatar';
import Tabs from '../../../ui/Tabs';
import Accordion from '../../../ui/Accordion';
import Divider from '../../../ui/Divider';
import EmptyState from '../../../ui/EmptyState';
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
    <section className="space-y-8 mb-12">
      <div className="flex items-center space-x-3 mb-6">
        <Box className="text-primary-500" size={32} />
        <h2 className="text-3xl font-display font-bold text-text-primary">
          Components
        </h2>
      </div>

      <div id="buttons">
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
      </div>

      <div id="forms">
        <h3 className="text-2xl font-semibold text-text-primary mb-4">
          Form Controls
        </h3>

        <div className="space-y-6">
          <ComponentShowcase
            title="Input Fields"
            description="Text inputs with labels, errors, and helper text"
          >
            <div className="w-full max-w-md space-y-4">
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
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Select Dropdowns"
            description="Dropdown select with options"
          >
            <div className="w-full max-w-md">
              <Select
                label="Choose an option"
                options={[
                  { value: '', label: 'Select...' },
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Textarea"
            description="Multi-line text input"
          >
            <div className="w-full max-w-md">
              <Textarea
                label="Description"
                rows={4}
                placeholder="Enter a description..."
              />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Checkboxes"
            description="Single and grouped checkboxes"
          >
            <div className="w-full max-w-md space-y-3">
              <Checkbox label="Default checkbox" />
              <Checkbox label="Checked checkbox" checked />
              <Checkbox label="Small size" size="sm" />
              <Checkbox label="Large size" size="lg" />
              <Checkbox
                label="With helper text"
                helperText="This is helper text"
              />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Radio Buttons"
            description="Single-choice radio buttons"
          >
            <div className="w-full max-w-md space-y-3">
              <Radio name="demo" label="Option 1" />
              <Radio name="demo" label="Option 2" checked />
              <Radio name="demo" label="Option 3" />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Switches"
            description="Toggle switches for binary choices"
          >
            <div className="w-full max-w-md space-y-3">
              <Switch label="Enable notifications" />
              <Switch label="Auto-save" checked />
              <Switch label="Small size" size="sm" />
              <Switch label="Large size" size="lg" />
            </div>
          </ComponentShowcase>
        </div>
      </div>

      <div id="display">
        <h3 className="text-2xl font-semibold text-text-primary mb-4">
          Display Components
        </h3>

        <div className="space-y-6">
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
            <Card padding="sm" className="w-48">
              <h4 className="font-semibold text-text-primary mb-1">
                Small Padding
              </h4>
              <p className="text-sm text-text-secondary">Card content</p>
            </Card>
            <Card padding="md" className="w-48">
              <h4 className="font-semibold text-text-primary mb-1">
                Medium Padding
              </h4>
              <p className="text-sm text-text-secondary">Card content</p>
            </Card>
            <Card padding="lg" hover className="w-48">
              <h4 className="font-semibold text-text-primary mb-1">
                With Hover
              </h4>
              <p className="text-sm text-text-secondary">Hover over me</p>
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
        </div>
      </div>

      <div id="feedback">
        <h3 className="text-2xl font-semibold text-text-primary mb-4">
          Feedback Components
        </h3>

        <div className="space-y-6">
          <ComponentShowcase
            title="Alerts"
            description="Informational messages with variants"
          >
            <div className="w-full space-y-4">
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
            </div>
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
              <p className="text-text-secondary">
                This is an example modal dialog. It can contain any content you
                need.
              </p>
              <div className="mt-4 flex justify-end space-x-3">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </div>
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
            <div className="w-full space-y-4">
              <Progress value={25} variant="primary" showLabel />
              <Progress
                value={50}
                variant="success"
                showLabel
                label="Upload Progress"
              />
              <Progress value={75} variant="warning" showLabel />
              <Progress value={90} variant="error" showLabel />
              <div className="flex justify-center space-x-4 pt-4">
                <CircularProgress value={25} variant="primary" size={80} />
                <CircularProgress value={50} variant="success" size={80} />
                <CircularProgress value={75} variant="warning" size={80} />
                <CircularProgress value={90} variant="error" size={80} />
              </div>
            </div>
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
        </div>
      </div>

      <div id="navigation">
        <h3 className="text-2xl font-semibold text-text-primary mb-4">
          Navigation Components
        </h3>

        <div className="space-y-6">
          <ComponentShowcase
            title="Tabs"
            description="Tabbed navigation with multiple variants"
          >
            <div className="w-full space-y-6">
              <Tabs
                variant="line"
                tabs={[
                  {
                    id: 'overview',
                    label: 'Overview',
                    content: (
                      <div className="p-4 text-text-secondary">
                        Overview content
                      </div>
                    ),
                  },
                  {
                    id: 'details',
                    label: 'Details',
                    content: (
                      <div className="p-4 text-text-secondary">
                        Details content
                      </div>
                    ),
                  },
                  {
                    id: 'settings',
                    label: 'Settings',
                    content: (
                      <div className="p-4 text-text-secondary">
                        Settings content
                      </div>
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
                      <div className="p-4 text-text-secondary">All items</div>
                    ),
                  },
                  {
                    id: 'active',
                    label: 'Active',
                    content: (
                      <div className="p-4 text-text-secondary">
                        Active items
                      </div>
                    ),
                    badge: '12',
                  },
                  {
                    id: 'archived',
                    label: 'Archived',
                    content: (
                      <div className="p-4 text-text-secondary">
                        Archived items
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Breadcrumbs"
            description="Hierarchical navigation trail"
          >
            <div className="w-full">
              <Breadcrumbs
                showHome
                items={[
                  { label: 'Projects', onClick: () => {} },
                  { label: 'Project Name', onClick: () => {} },
                  { label: 'Details' },
                ]}
              />
            </div>
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
            <div className="w-full max-w-2xl">
              <Accordion
                items={[
                  {
                    id: '1',
                    title: 'What is included?',
                    content: (
                      <p className="text-text-secondary">
                        All features are included in every plan.
                      </p>
                    ),
                  },
                  {
                    id: '2',
                    title: 'How does billing work?',
                    content: (
                      <p className="text-text-secondary">
                        You are billed monthly based on your usage.
                      </p>
                    ),
                  },
                  {
                    id: '3',
                    title: 'Can I cancel anytime?',
                    content: (
                      <p className="text-text-secondary">
                        Yes, you can cancel your subscription at any time.
                      </p>
                    ),
                  },
                ]}
                defaultOpen={['1']}
              />
            </div>
          </ComponentShowcase>
        </div>
      </div>

      <div id="layout">
        <h3 className="text-2xl font-semibold text-text-primary mb-4">
          Layout Components
        </h3>

        <ComponentShowcase
          title="Dividers"
          description="Visual separators for content"
        >
          <div className="w-full space-y-6">
            <Divider />
            <Divider label="OR" />
            <Divider label="Section Break" />
            <div
              className="flex items-center space-x-4"
              style={{ height: '100px' }}
            >
              <div className="flex-1 bg-bg-tertiary rounded-lg h-full" />
              <Divider orientation="vertical" />
              <div className="flex-1 bg-bg-tertiary rounded-lg h-full" />
            </div>
          </div>
        </ComponentShowcase>
      </div>
    </section>
  );
}
