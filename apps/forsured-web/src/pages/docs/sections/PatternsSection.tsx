import React, { useState } from 'react';
import { YStack, XStack, View, Text, H2, H3 } from '@unicornlove/ui';
import ComponentShowcase from '../../../components/DesignSystem/ComponentShowcase';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Textarea from '../../../components/Common/Textarea';
import Button from '../../../components/Common/Button';
import Checkbox from '../../../ui/Checkbox';
import { Alert } from '@unicornlove/ui';
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
    <YStack gap="$8" marginBottom="$12">
      <XStack alignItems="center" gap="$3" marginBottom="$6">
        <LayoutGrid color="var(--blue10)" size={32} />
        <H2 fontSize="$9" fontWeight="bold" color="$color12">
          Patterns
        </H2>
      </XStack>

      <View id="form-patterns">
        <ComponentShowcase
          title="Form Validation Pattern"
          description="Complete form with validation, error states, and success feedback"
        >
          <View width="100%" maxWidth={672}>
            <YStack tag="form" onSubmit={handleSubmit} gap="$4">
              {showSuccess && (
                <Alert
                  variant="success"
                  title="Success!"
                  closable
                  onClose={() => setShowSuccess(false)}
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

              <XStack justifyContent="flex-end" gap="$3" paddingTop="$4">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Submit Form
                </Button>
              </XStack>
            </YStack>
          </View>
        </ComponentShowcase>
      </View>

      <View id="layout-patterns">
        <ComponentShowcase
          title="Dashboard Layout Pattern"
          description="Typical dashboard layout with stats, charts, and lists"
        >
          <View width="100%">
            <XStack flexWrap="wrap" gap="$4" marginBottom="$6">
              <View flex={1} minWidth={200} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                <Text fontSize="$3" color="$color11" marginBottom="$1">
                  Total Projects
                </Text>
                <Text fontSize="$9" fontWeight="bold" color="$color12">24</Text>
                <Text fontSize="$2" color="$green11" marginTop="$1">
                  +12% from last month
                </Text>
              </View>
              <View flex={1} minWidth={200} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                <Text fontSize="$3" color="$color11" marginBottom="$1">Active Tasks</Text>
                <Text fontSize="$9" fontWeight="bold" color="$color12">156</Text>
                <Text fontSize="$2" color="$yellow11" marginTop="$1">8 overdue</Text>
              </View>
              <View flex={1} minWidth={200} backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
                <Text fontSize="$3" color="$color11" marginBottom="$1">
                  Compliance Score
                </Text>
                <Text fontSize="$9" fontWeight="bold" color="$color12">94%</Text>
                <Text fontSize="$2" color="$green11" marginTop="$1">+2% improvement</Text>
              </View>
            </XStack>

            <View backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$6">
              <Text fontWeight="600" color="$color12" marginBottom="$4">
                Recent Activity
              </Text>
              <YStack gap="$3">
                {[1, 2, 3].map((i) => (
                  <XStack
                    key={i}
                    alignItems="center"
                    gap="$3"
                    paddingVertical="$2"
                    borderBottomWidth={i < 3 ? 1 : 0}
                    borderBottomColor="$borderColor"
                  >
                    <View width={8} height={8} borderRadius={4} backgroundColor="$blue10" />
                    <View flex={1}>
                      <Text fontSize="$3" color="$color12">
                        Activity item {i}
                      </Text>
                      <Text fontSize="$2" color="$color10">2 hours ago</Text>
                    </View>
                  </XStack>
                ))}
              </YStack>
            </View>
          </View>
        </ComponentShowcase>
      </View>

      <View id="feedback-patterns">
        <ComponentShowcase
          title="Feedback Patterns"
          description="Different ways to provide user feedback"
        >
          <YStack width="100%" gap="$4">
            <Alert variant="info" title="Pro Tip">
              Use keyboard shortcuts to navigate faster through the application.
            </Alert>
            <Alert variant="success" title="Saved!" closable onClose={() => {}}>
              Your changes have been saved automatically.
            </Alert>
            <Alert variant="warning" title="Review Required">
              Please review your compliance documents before the deadline.
            </Alert>
            <Alert
              variant="error"
              title="Action Required"
              closable
              onClose={() => {}}
            >
              Your session is about to expire. Please save your work.
            </Alert>
          </YStack>
        </ComponentShowcase>
      </View>
    </YStack>
  );
}
