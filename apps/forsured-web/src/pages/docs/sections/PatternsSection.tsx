import React, { useState } from 'react';
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
    <section className="space-y-8 mb-12">
      <div className="flex items-center space-x-3 mb-6">
        <LayoutGrid className="text-primary-500" size={32} />
        <h2 className="text-3xl font-display font-bold text-text-primary">
          Patterns
        </h2>
      </div>

      <div id="form-patterns">
        <ComponentShowcase
          title="Form Validation Pattern"
          description="Complete form with validation, error states, and success feedback"
        >
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Submit Form
                </Button>
              </div>
            </form>
          </div>
        </ComponentShowcase>
      </div>

      <div id="layout-patterns">
        <ComponentShowcase
          title="Dashboard Layout Pattern"
          description="Typical dashboard layout with stats, charts, and lists"
        >
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-1">
                  Total Projects
                </p>
                <p className="text-3xl font-bold text-text-primary">24</p>
                <p className="text-xs text-success-600 mt-1">
                  +12% from last month
                </p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-1">Active Tasks</p>
                <p className="text-3xl font-bold text-text-primary">156</p>
                <p className="text-xs text-warning-600 mt-1">8 overdue</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-1">
                  Compliance Score
                </p>
                <p className="text-3xl font-bold text-text-primary">94%</p>
                <p className="text-xs text-success-600 mt-1">+2% improvement</p>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6">
              <h4 className="font-semibold text-text-primary mb-4">
                Recent Activity
              </h4>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary">
                        Activity item {i}
                      </p>
                      <p className="text-xs text-text-tertiary">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ComponentShowcase>
      </div>

      <div id="feedback-patterns">
        <ComponentShowcase
          title="Feedback Patterns"
          description="Different ways to provide user feedback"
        >
          <div className="w-full space-y-4">
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
          </div>
        </ComponentShowcase>
      </div>
    </section>
  );
}
