import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, X } from 'lucide-react';
import { Stack, Row, Text, Button, Card, Input, H1 } from '@unicornlove/beyond-ui';
import Select from '../Common/Select';
import ForsuredLogo from '../Common/ForsuredLogo';
import { useAuth } from '../../contexts/AuthContext';

export default function ManagerOnboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    primaryLocation: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Mark onboarding as complete with form data
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: formData,
        onboarding_completed_at: new Date().toISOString(),
      });
      console.log('Manager onboarding data:', formData);
      navigate('/manager/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      // Still redirect even on error
      navigate('/manager/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // Mark onboarding as complete (skipped)
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: { skipped: true },
        onboarding_completed_at: new Date().toISOString(),
      });
      navigate('/manager/dashboard');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      // Still redirect even on error
      navigate('/manager/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.companyName && formData.companySize && formData.primaryLocation;

  return (
    <Stack
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Stack style={{ width: '100%', maxWidth: 448, position: 'relative' }}>
        <Button
          onPress={handleSkip}
          disabled={isSubmitting}
          variant="ghost"
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          <Row style={{ gap: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 14 }}>Skip for now</Text>
            <X size={18} />
          </Row>
        </Button>

        <Stack style={{ alignItems: 'center', marginBottom: 32 }}>
          <Stack style={{ alignItems: 'center', marginBottom: 24 }}>
            <ForsuredLogo />
          </Stack>
          <H1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Welcome, General Contractor
          </H1>
          <Text style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Let's get your company set up
          </Text>
        </Stack>

        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--color-border)',
            padding: 32,
          }}
        >
          <Stack style={{ alignItems: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: 'var(--color-blue-3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building color="var(--color-blue-10)" size={32} />
            </div>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack style={{ gap: 24 }}>
              <Stack>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Company Name
                </Text>
                <Input
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  placeholder="Enter your company name"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                  }}
                  required
                />
              </Stack>

              <Stack>
                <Select
                  label="Company Size"
                  value={formData.companySize}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      companySize: value,
                    }))
                  }
                  placeholder="Select company size"
                  options={[
                    { value: '', label: 'Select company size' },
                    { value: '1-10', label: '1-10 employees' },
                    { value: '11-50', label: '11-50 employees' },
                    { value: '51-200', label: '51-200 employees' },
                    { value: '201+', label: '201+ employees' },
                  ]}
                  required
                />
              </Stack>

              <Stack>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Primary Location
                </Text>
                <Input
                  value={formData.primaryLocation}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      primaryLocation: e.target.value,
                    }))
                  }
                  placeholder="City, State"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                  }}
                  required
                />
              </Stack>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                variant="primary"
                style={{
                  width: '100%',
                  paddingLeft: 24,
                  paddingRight: 24,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderRadius: 16,
                  fontWeight: 600,
                  opacity: !isValid || isSubmitting ? 0.5 : 1,
                  cursor: !isValid || isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                <Row style={{ gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white' }}>Continue to Dashboard</Text>
                  <ArrowRight size={18} />
                </Row>
              </Button>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Stack>
  );
}
