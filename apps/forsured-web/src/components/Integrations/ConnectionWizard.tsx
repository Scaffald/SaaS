import { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Key,
  Lock,
  RefreshCw,
  Settings,
  Database,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader,
} from 'lucide-react';
import { XStack, YStack, Text, Button as TamaguiButton, Spinner, H3, SizableText } from 'tamagui';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import {
  IntegrationConnection,
  AuthMethod,
  SyncFrequency,
  ConnectionStatus,
} from '../../types';
import { useIntegrationConnections } from '../../hooks/useIntegrationConnections';

interface ConnectionWizardProps {
  integrationId: string;
  integrationName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (connection: IntegrationConnection) => void;
}

interface ConnectionSettings {
  authMethod: AuthMethod;
  apiKey?: string;
  username?: string;
  password?: string;
  oauthToken?: string;
  syncDataTypes: string[];
  syncFrequency: SyncFrequency;
  initialSync: boolean;
}

export default function ConnectionWizard({
  integrationId,
  integrationName,
  isOpen,
  onClose,
  onSuccess,
}: ConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState<ConnectionSettings>({
    authMethod: 'api_key',
    syncDataTypes: ['projects', 'documents'],
    syncFrequency: 'daily',
    initialSync: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus | null>(null);
  const [initialSyncProgress, setInitialSyncProgress] = useState(0);

  const { createConnection, updateConnection } = useIntegrationConnections();

  const handleClose = () => {
    setCurrentStep(1);
    setSettings({
      authMethod: 'api_key',
      syncDataTypes: ['projects', 'documents'],
      syncFrequency: 'daily',
      initialSync: true,
    });
    setError(null);
    setConnectionStatus(null);
    setInitialSyncProgress(0);
    onClose();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate authentication step
      if (settings.authMethod === 'api_key' && !settings.apiKey?.trim()) {
        setError('API key is required');
        return;
      }
      if (
        settings.authMethod === 'username_password' &&
        (!settings.username?.trim() || !settings.password?.trim())
      ) {
        setError('Username and password are required');
        return;
      }
      setError(null);
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate connection process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock connection (90% success rate)
      const success = Math.random() > 0.1;

      if (success) {
        const connection = await createConnection({
          integration_id: integrationId,
          integration_name: integrationName,
          auth_method: settings.authMethod,
          auth_config: {
            api_key: settings.apiKey,
            username: settings.username,
            oauth_token: settings.oauthToken,
          },
          sync_frequency: settings.syncFrequency,
          sync_data_types: settings.syncDataTypes,
          status: 'active',
          last_sync_at: new Date().toISOString(),
          metadata: {
            connected_at: new Date().toISOString(),
          },
        });

        setConnectionStatus('active');

        // Simulate initial sync if enabled
        if (settings.initialSync) {
          setCurrentStep(4); // Go to sync progress step
          simulateInitialSync();
        } else {
          setCurrentStep(3); // Go to success step
        }

        onSuccess?.(connection);
      } else {
        setError(
          'Connection failed. Please check your credentials and try again.'
        );
        setConnectionStatus('error');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect. Please try again.'
      );
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const simulateInitialSync = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setCurrentStep(3), 500); // Go to success step
      }
      setInitialSyncProgress(Math.min(progress, 100));
    }, 300);
  };

  const handleOAuthConnect = () => {
    // Simulate OAuth flow
    setLoading(true);
    setTimeout(() => {
      // Mock OAuth success
      setSettings({
        ...settings,
        oauthToken: 'mock_oauth_token_' + Date.now(),
        authMethod: 'oauth',
      });
      setLoading(false);
      setError(null);
      handleNext();
    }, 2000);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <YStack gap="$6">
            <YStack>
              <H3 marginBottom="$2">Authentication Method</H3>
              <SizableText size="$3" color="$color11" marginBottom="$4">
                Choose how you want to authenticate with {integrationName}
              </SizableText>
            </YStack>

            <YStack gap="$3">
              <TamaguiButton
                unstyled
                width="100%"
                padding="$4"
                borderWidth={2}
                borderRadius="$4"
                textAlign="left"
                backgroundColor={
                  settings.authMethod === 'api_key' ? '$blue2' : 'transparent'
                }
                borderColor={
                  settings.authMethod === 'api_key' ? '$blue9' : '$borderColor'
                }
                hoverStyle={{
                  borderColor: '$blue7',
                }}
                onPress={() =>
                  setSettings({ ...settings, authMethod: 'api_key' })
                }
              >
                <XStack alignItems="center" gap="$3">
                  <Key
                    color={
                      settings.authMethod === 'api_key'
                        ? '$blue9'
                        : '$color10'
                    }
                    size={20}
                  />
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$color12">
                      API Key
                    </Text>
                    <SizableText size="$3" color="$color11">
                      Use an API key for authentication
                    </SizableText>
                  </YStack>
                </XStack>
              </TamaguiButton>

              <TamaguiButton
                unstyled
                width="100%"
                padding="$4"
                borderWidth={2}
                borderRadius="$4"
                textAlign="left"
                backgroundColor={
                  settings.authMethod === 'oauth' ? '$blue2' : 'transparent'
                }
                borderColor={
                  settings.authMethod === 'oauth' ? '$blue9' : '$borderColor'
                }
                hoverStyle={{
                  borderColor: '$blue7',
                }}
                onPress={() =>
                  setSettings({ ...settings, authMethod: 'oauth' })
                }
              >
                <XStack alignItems="center" gap="$3">
                  <Lock
                    color={
                      settings.authMethod === 'oauth' ? '$blue9' : '$color10'
                    }
                    size={20}
                  />
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$color12">
                      OAuth 2.0
                    </Text>
                    <SizableText size="$3" color="$color11">
                      Secure OAuth authentication
                    </SizableText>
                  </YStack>
                </XStack>
              </TamaguiButton>

              <TamaguiButton
                unstyled
                width="100%"
                padding="$4"
                borderWidth={2}
                borderRadius="$4"
                textAlign="left"
                backgroundColor={
                  settings.authMethod === 'username_password'
                    ? '$blue2'
                    : 'transparent'
                }
                borderColor={
                  settings.authMethod === 'username_password'
                    ? '$blue9'
                    : '$borderColor'
                }
                hoverStyle={{
                  borderColor: '$blue7',
                }}
                onPress={() =>
                  setSettings({ ...settings, authMethod: 'username_password' })
                }
              >
                <XStack alignItems="center" gap="$3">
                  <Lock
                    color={
                      settings.authMethod === 'username_password'
                        ? '$blue9'
                        : '$color10'
                    }
                    size={20}
                  />
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$color12">
                      Username & Password
                    </Text>
                    <SizableText size="$3" color="$color11">
                      Use your account credentials
                    </SizableText>
                  </YStack>
                </XStack>
              </Button>
            </YStack>

            {/* API Key Input */}
            {settings.authMethod === 'api_key' && (
              <YStack gap="$4" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                <Input
                  label="API Key"
                  type="password"
                  value={settings.apiKey || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, apiKey: e.target.value })
                  }
                  placeholder="Enter your API key"
                  fullWidth
                  required
                />
                <SizableText size="$1" color="$color10">
                  Find your API key in your {integrationName} account settings
                </SizableText>
              </YStack>
            )}

            {/* Username/Password Inputs */}
            {settings.authMethod === 'username_password' && (
              <YStack gap="$4" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                <Input
                  label="Username"
                  value={settings.username || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, username: e.target.value })
                  }
                  placeholder="Enter your username"
                  fullWidth
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={settings.password || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  fullWidth
                  required
                />
              </YStack>
            )}

            {/* OAuth Button */}
            {settings.authMethod === 'oauth' && (
              <YStack paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
                <Button
                  variant="primary"
                  onPress={handleOAuthConnect}
                  disabled={loading}
                  width="100%"
                >
                  {loading ? 'Connecting...' : 'Authorize with OAuth'}
                </Button>
                <SizableText size="$1" color="$color10" marginTop="$2" textAlign="center">
                  You will be redirected to {integrationName} to authorize the
                  connection
                </SizableText>
              </YStack>
            )}
          </YStack>
        );

      case 2:
        return (
          <YStack gap="$6">
            <YStack>
              <H3 marginBottom="$2">Sync Settings</H3>
              <SizableText size="$3" color="$color11" marginBottom="$4">
                Configure what data to sync and how often
              </SizableText>
            </YStack>

            <YStack gap="$4">
              <YStack>
                <SizableText size="$3" fontWeight="500" color="$color12" marginBottom="$3">
                  Data Types to Sync
                </SizableText>
                <YStack gap="$2">
                  {[
                    { id: 'projects', label: 'Projects', icon: Database },
                    { id: 'documents', label: 'Documents', icon: Database },
                    { id: 'payments', label: 'Payments', icon: Database },
                    { id: 'contacts', label: 'Contacts', icon: Database },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = settings.syncDataTypes.includes(type.id);
                    return (
                      <TamaguiButton
                        key={type.id}
                        unstyled
                        flexDirection="row"
                        alignItems="center"
                        gap="$3"
                        padding="$3"
                        borderWidth={1}
                        borderRadius="$4"
                        cursor="pointer"
                        backgroundColor={
                          isSelected ? '$blue2' : 'transparent'
                        }
                        borderColor={
                          isSelected ? '$blue9' : '$borderColor'
                        }
                        hoverStyle={{
                          borderColor: '$blue7',
                        }}
                        onPress={() => {
                          if (isSelected) {
                            setSettings({
                              ...settings,
                              syncDataTypes: settings.syncDataTypes.filter(
                                (t) => t !== type.id
                              ),
                            });
                          } else {
                            setSettings({
                              ...settings,
                              syncDataTypes: [
                                ...settings.syncDataTypes,
                                type.id,
                              ],
                            });
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ display: 'none' }}
                        />
                        <Icon
                          size={18}
                          color={isSelected ? '$blue9' : '$color10'}
                        />
                        <Text
                          flex={1}
                          color={isSelected ? '$blue11' : '$color12'}
                          fontWeight={isSelected ? '500' : 'normal'}
                        >
                          {type.label}
                        </Text>
                      </TamaguiButton>
                    );
                  })}
                </YStack>
              </YStack>

              <Select
                label="Sync Frequency"
                value={settings.syncFrequency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    syncFrequency: e.target.value as SyncFrequency,
                  })
                }
                options={[
                  { value: 'real_time', label: 'Real-time' },
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'manual', label: 'Manual' },
                ]}
                fullWidth
              />

              <TamaguiButton
                unstyled
                flexDirection="row"
                alignItems="center"
                gap="$3"
                padding="$3"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                cursor="pointer"
                onPress={() =>
                  setSettings({
                    ...settings,
                    initialSync: !settings.initialSync,
                  })
                }
              >
                <input
                  type="checkbox"
                  checked={settings.initialSync}
                  onChange={() => {}}
                  style={{ display: 'none' }}
                />
                <YStack>
                  <Text fontWeight="500" color="$color12">
                    Perform initial sync
                  </Text>
                  <SizableText size="$3" color="$color11">
                    Import existing data from {integrationName} now
                  </SizableText>
                </YStack>
              </TamaguiButton>
            </YStack>
          </YStack>
        );

      case 3:
        return (
          <YStack gap="$6" alignItems="center">
            <XStack justifyContent="center">
              <XStack
                width={64}
                height={64}
                backgroundColor="$green2"
                borderRadius={9999}
                alignItems="center"
                justifyContent="center"
              >
                <CheckCircle color="$green9" size={32} />
              </XStack>
            </XStack>
            <YStack alignItems="center">
              <H3 marginBottom="$2">Connection Successful!</H3>
              <SizableText size="$3" color="$color11">
                {integrationName} has been successfully connected
              </SizableText>
            </YStack>
            {connectionStatus === 'active' && (
              <YStack
                backgroundColor="$green2"
                borderWidth={1}
                borderColor="$green5"
                borderRadius="$4"
                padding="$4"
              >
                <XStack alignItems="center" justifyContent="center" gap="$2">
                  <XStack
                    width={8}
                    height={8}
                    backgroundColor="$green9"
                    borderRadius={9999}
                  />
                  <SizableText size="$3" fontWeight="500" color="$green11">
                    Connection Active
                  </SizableText>
                </XStack>
              </YStack>
            )}
            <YStack gap="$2" width="100%">
              <XStack justifyContent="space-between">
                <SizableText size="$3" color="$color11">
                  Sync Frequency:
                </SizableText>
                <SizableText size="$3" fontWeight="500" color="$color12">
                  {settings.syncFrequency}
                </SizableText>
              </XStack>
              <XStack justifyContent="space-between">
                <SizableText size="$3" color="$color11">
                  Data Types:
                </SizableText>
                <SizableText size="$3" fontWeight="500" color="$color12">
                  {settings.syncDataTypes.length} selected
                </SizableText>
              </XStack>
            </YStack>
          </YStack>
        );

      case 4:
        return (
          <YStack gap="$6">
            <YStack alignItems="center">
              <H3 marginBottom="$2">Initial Sync in Progress</H3>
              <SizableText size="$3" color="$color11">
                Importing data from {integrationName}...
              </SizableText>
            </YStack>
            <YStack gap="$2">
              <YStack
                width="100%"
                backgroundColor="$color4"
                borderRadius={9999}
                height={12}
                overflow="hidden"
              >
                <YStack
                  backgroundColor="$blue9"
                  height={12}
                  borderRadius={9999}
                  width={`${initialSyncProgress}%`}
                />
              </YStack>
              <XStack justifyContent="space-between">
                <SizableText size="$1" color="$color11">
                  {Math.round(initialSyncProgress)}% complete
                </SizableText>
                <SizableText size="$1" color="$color11">
                  This may take a few minutes
                </SizableText>
              </XStack>
            </YStack>
          </YStack>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Connect ${integrationName}`}
      size="md"
    >
      <YStack gap="$6">
        {/* Progress Steps */}
        <XStack alignItems="center" justifyContent="space-between">
          {[1, 2, 3].map((step) => (
            <XStack key={step} alignItems="center" flex={1}>
              <XStack alignItems="center">
                <XStack
                  width={32}
                  height={32}
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={
                    currentStep >= step ? '$blue9' : '$color4'
                  }
                >
                  {currentStep > step ? (
                    <CheckCircle size={16} color="white" />
                  ) : (
                    <Text
                      size="$3"
                      fontWeight="500"
                      color={currentStep >= step ? 'white' : '$color10'}
                    >
                      {step}
                    </Text>
                  )}
                </XStack>
                <SizableText
                  size="$1"
                  fontWeight="500"
                  color="$color11"
                  marginLeft="$2"
                  $sm={{ display: 'none' }}
                >
                  {step === 1 ? 'Auth' : step === 2 ? 'Sync' : 'Done'}
                </SizableText>
              </XStack>
              {step < 3 && (
                <YStack
                  flex={1}
                  height={2}
                  marginHorizontal="$2"
                  backgroundColor={
                    currentStep > step ? '$blue9' : '$color4'
                  }
                />
              )}
            </XStack>
          ))}
        </XStack>

        {/* Error Message */}
        {error && (
          <XStack
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red5"
            borderRadius="$4"
            padding="$4"
            alignItems="center"
            gap="$3"
          >
            <AlertCircle color="$red9" size={20} />
            <SizableText size="$3" color="$red11">
              {error}
            </SizableText>
          </XStack>
        )}

        {/* Step Content */}
        <YStack minHeight={300}>{renderStep()}</YStack>

        {/* Actions */}
        {currentStep < 3 && currentStep !== 4 && (
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingTop="$4"
            borderTopWidth={1}
            borderColor="$borderColor"
          >
            <Button
              variant="secondary"
              onPress={currentStep === 1 ? handleClose : handleBack}
              disabled={loading}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {currentStep === 1 && settings.authMethod !== 'oauth' ? (
              <Button
                variant="primary"
                onPress={handleNext}
                disabled={loading}
              >
                Next
              </Button>
            ) : currentStep === 2 ? (
              <Button
                variant="primary"
                onPress={handleConnect}
                disabled={loading || settings.syncDataTypes.length === 0}
              >
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            ) : null}
          </XStack>
        )}

        {currentStep === 3 && (
          <XStack justifyContent="flex-end" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
            <Button variant="primary" onPress={handleClose}>
              Done
            </Button>
          </XStack>
        )}
      </YStack>
    </Modal>
  );
}
