import React, { useState } from 'react';
import { Stack, Row, Box, Text, H2, H3, Alert } from '@scaffald/ui';
import ComponentShowcase from '../../../components/DesignSystem/ComponentShowcase';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Textarea from '../../../components/Common/Textarea';
import Button from '../../../components/Common/Button';
import Checkbox from '../../../ui/Checkbox';
import { LayoutGrid } from 'lucide-react';

export default function PatternsSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    bio: '',
    terms: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.role) errors.role = 'Role is required';
    if (!formData.terms) errors.terms = 'You must accept the terms';
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length === 0) {
      setShowSuccess(true);
      setFormErrors({});
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setFormErrors(errors);
    }
  };

  return (
    <Stack style={{ gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
      <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <LayoutGrid color="var(--color-blue-10)" size={32} />
        <H2 style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-12)' }}>
          Patterns
        </H2>
      </Row>

      <Box id="form-patterns">
        <ComponentShowcase
          title="Form Validation Pattern"
          description="Complete form with validation, error states, and success feedback"
        >
          <Box style={{ width: '100%', maxWidth: 672 }}>
            <Stack as="form" onSubmit={handleSubmit} style={{ gap: 'var(--space-4)' }}>
              {showSuccess && (
                <Alert
                  type="success"
                  title="Success!"
                  dismissible
                  onDismiss={() => setShowSuccess(false)}
                >
                  Your form has been submitted successfully.
                </Alert>
              )}

              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={formErrors.name}
                required
                fullWidth
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={formErrors.email}
                helperText="We'll never share your email"
                required
                fullWidth
              />

              <Select
                label="Role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                options={[
                  { value: '', label: 'Select a role...' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'subcontractor', label: 'Subcontractor' },
                  { value: 'broker', label: 'Broker' },
                ]}
                error={formErrors.role}
                required
                fullWidth
              />

              <Textarea
                label="Bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                helperText="Optional: Tell us about yourself"
                fullWidth
              />

              <Checkbox
                label="I accept the terms and conditions"
                checked={formData.terms}
                onChange={(e) =>
                  setFormData({ ...formData, terms: e.target.checked })
                }
                error={formErrors.terms}
                required
              />

              <Row style={{ justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)' }}>
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Submit Form
                </Button>
              </Row>
            </Stack>
          </Box>
        </ComponentShowcase>
      </Box>

      <Box id="layout-patterns">
        <ComponentShowcase
          title="Dashboard Layout Pattern"
          description="Typical dashboard layout with stats, charts, and lists"
        >
          <Box style={{ width: '100%' }}>
            <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <Box style={{ flex: 1, minWidth: 200, backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)', marginBottom: 'var(--space-1)' }}>
                  Total Projects
                </Text>
                <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-12)' }}>24</Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-11)', marginTop: 'var(--space-1)' }}>
                  +12% from last month
                </Text>
              </Box>
              <Box style={{ flex: 1, minWidth: 200, backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)', marginBottom: 'var(--space-1)' }}>Active Tasks</Text>
                <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-12)' }}>156</Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-yellow-11)', marginTop: 'var(--space-1)' }}>8 overdue</Text>
              </Box>
              <Box style={{ flex: 1, minWidth: 200, backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)', marginBottom: 'var(--space-1)' }}>
                  Compliance Score
                </Text>
                <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-12)' }}>94%</Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-11)', marginTop: 'var(--space-1)' }}>+2% improvement</Text>
              </Box>
            </Row>

            <Box style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-4)', padding: 'var(--space-6)' }}>
              <Text style={{ fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>
                Recent Activity
              </Text>
              <Stack style={{ gap: 'var(--space-3)' }}>
                {[1, 2, 3].map((i) => (
                  <Row
                    key={i}
                    style={{
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      paddingTop: 'var(--space-2)',
                      paddingBottom: 'var(--space-2)',
                      borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <Box style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'var(--color-blue-10)' }} />
                    <Box style={{ flex: 1 }}>
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-12)' }}>
                        Activity item {i}
                      </Text>
                      <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-10)' }}>2 hours ago</Text>
                    </Box>
                  </Row>
                ))}
              </Stack>
            </Box>
          </Box>
        </ComponentShowcase>
      </Box>

      <Box id="feedback-patterns">
        <ComponentShowcase
          title="Feedback Patterns"
          description="Different ways to provide user feedback"
        >
          <Stack style={{ width: '100%', gap: 'var(--space-4)' }}>
            <Alert type="info" title="Pro Tip">
              Use keyboard shortcuts to navigate faster through the application.
            </Alert>
            <Alert type="success" title="Saved!" dismissible onDismiss={() => {}}>
              Your changes have been saved automatically.
            </Alert>
            <Alert type="warning" title="Review Required">
              Please review your compliance documents before the deadline.
            </Alert>
            <Alert
              type="error"
              title="Action Required"
              dismissible
              onDismiss={() => {}}
            >
              Your session is about to expire. Please save your work.
            </Alert>
          </Stack>
        </ComponentShowcase>
      </Box>
    </Stack>
  );
}
