import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, X } from 'lucide-react';
import { YStack, XStack, Text, Button, Card, Circle, Input, H1 } from 'tamagui';
import { ResponsiveSelect } from '@unicornlove/ui';
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
    <YStack
      minHeight="100vh"
      backgroundColor="$background"
      alignItems="center"
      justifyContent="center"
      padding="$4"
    >
      <YStack width="100%" maxWidth={448} position="relative">
        <Button
          onPress={handleSkip}
          disabled={isSubmitting}
          position="absolute"
          top="$6"
          right="$6"
          variant="ghost"
          size="$3"
          opacity={isSubmitting ? 0.5 : 1}
        >
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$3">Skip for now</Text>
          <X size={18} />
          </XStack>
        </Button>

        <YStack alignItems="center" marginBottom="$8">
          <YStack alignItems="center" marginBottom="$6">
            <ForsuredLogo />
          </YStack>
          <H1 fontSize="$8" fontWeight="bold" marginBottom="$2" textAlign="center">
            Welcome, General Contractor
          </H1>
          <Text color="$color11" textAlign="center">Let's get your company set up</Text>
        </YStack>

        <Card
          backgroundColor="$background"
          borderRadius="$4"
          elevation={4}
          borderWidth={1}
          borderColor="$borderColor"
          padding="$8"
        >
          <YStack alignItems="center" marginBottom="$6">
            <Circle
              size={64}
              backgroundColor="$blue3"
              alignItems="center"
              justifyContent="center"
            >
              <Building color="$blue10" size={32} />
            </Circle>
          </YStack>

          <YStack tag="form" onSubmit={handleSubmit} gap="$6">
            <YStack>
              <Text
                fontSize="$3"
                fontWeight="600"
                color="$color12"
                marginBottom="$2"
                display="block"
              >
                Company Name
              </Text>
              <Input
                value={formData.companyName}
                onChangeText={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    companyName: value,
                  }))
                }
                placeholder="Enter your company name"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$4"
                paddingVertical="$3"
                width="100%"
                required
              />
            </YStack>

            <YStack>
              <ResponsiveSelect
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
                size="$4"
                required
              />
            </YStack>

            <YStack>
              <Text
                fontSize="$3"
                fontWeight="600"
                color="$color12"
                marginBottom="$2"
                display="block"
              >
                Primary Location
              </Text>
              <Input
                value={formData.primaryLocation}
                onChangeText={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    primaryLocation: value,
                  }))
                }
                placeholder="City, State"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$4"
                paddingVertical="$3"
                width="100%"
                required
              />
            </YStack>

            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              width="100%"
              variant="primary"
              paddingHorizontal="$6"
              paddingVertical="$3"
              borderRadius="$4"
              fontWeight="600"
              opacity={!isValid || isSubmitting ? 0.5 : 1}
              cursor={!isValid || isSubmitting ? 'not-allowed' : 'pointer'}
            >
              <XStack gap="$2" alignItems="center" justifyContent="center">
                <Text color="white">Continue to Dashboard</Text>
              <ArrowRight size={18} />
              </XStack>
            </Button>
          </YStack>
        </Card>
      </YStack>
    </YStack>
  );
}
