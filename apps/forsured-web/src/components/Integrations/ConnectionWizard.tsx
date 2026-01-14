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
import { Stack, Row, Text, Spinner } from '@unicornlove/beyond-ui';
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
          <Stack style={{ gap: 'var(--space-6)' }}>
            <Stack>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Authentication Method</h3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
                Choose how you want to authenticate with {integrationName}
              </Text>
            </Stack>

            <Stack style={{ gap: 'var(--space-3)' }}>
              <button
                style={{
                  width: '100%',
                  padding: 'var(--space-4)',
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderRadius: 'var(--radius-4)',
                  textAlign: 'left',
                  backgroundColor:
                    settings.authMethod === 'api_key' ? 'var(--color-blue-2)' : 'transparent',
                  borderColor:
                    settings.authMethod === 'api_key' ? 'var(--color-blue-9)' : 'var(--color-border)',
                  cursor: 'pointer',
                }}
                onPress={() =>
                  setSettings({ ...settings, authMethod: 'api_key' })
                }
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Key
                    color={
                      settings.authMethod === 'api_key'
                        ? 'var(--color-blue-9)'
                        : 'var(--color-text-secondary)'
                    }
                    size={20}
                  />
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      API Key
                    </Text>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                      Use an API key for authentication
                    </Text>
                  </Stack>
                </Row>
              </button>

              <button
                style={{
                  width: '100%',
                  padding: 'var(--space-4)',
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderRadius: 'var(--radius-4)',
                  textAlign: 'left',
                  backgroundColor:
                    settings.authMethod === 'oauth' ? 'var(--color-blue-2)' : 'transparent',
                  borderColor:
                    settings.authMethod === 'oauth' ? 'var(--color-blue-9)' : 'var(--color-border)',
                  cursor: 'pointer',
                }}
                onPress={() =>
                  setSettings({ ...settings, authMethod: 'oauth' })
                }
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Lock
                    color={
                      settings.authMethod === 'oauth' ? 'var(--color-blue-9)' : 'var(--color-text-secondary)'
                    }
                    size={20}
                  />
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      OAuth 2.0
                    </Text>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                      Secure OAuth authentication
                    </Text>
                  </Stack>
                </Row>
              </button>

              <button
                style={{
                  width: '100%',
                  padding: 'var(--space-4)',
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderRadius: 'var(--radius-4)',
                  textAlign: 'left',
                  backgroundColor:
                    settings.authMethod === 'username_password'
                      ? 'var(--color-blue-2)'
                      : 'transparent',
                  borderColor:
                    settings.authMethod === 'username_password'
                      ? 'var(--color-blue-9)'
                      : 'var(--color-border)',
                  cursor: 'pointer',
                }}
                onPress={() =>
                  setSettings({ ...settings, authMethod: 'username_password' })
                }
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Lock
                    color={
                      settings.authMethod === 'username_password'
                        ? 'var(--color-blue-9)'
                        : 'var(--color-text-secondary)'
                    }
                    size={20}
                  />
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                      Username & Password
                    </Text>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                      Use your account credentials
                    </Text>
                  </Stack>
                </Row>
              </button>
            </Stack>

            {/* API Key Input */}
            {settings.authMethod === 'api_key' && (
              <Stack style={{ gap: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
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
                <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-secondary)' }}>
                  Find your API key in your {integrationName} account settings
                </Text>
              </Stack>
            )}

            {/* Username/Password Inputs */}
            {settings.authMethod === 'username_password' && (
              <Stack style={{ gap: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
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
              </Stack>
            )}

            {/* OAuth Button */}
            {settings.authMethod === 'oauth' && (
              <Stack style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                <Button
                  variant="primary"
                  onPress={handleOAuthConnect}
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Connecting...' : 'Authorize with OAuth'}
                </Button>
                <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', textAlign: 'center' }}>
                  You will be redirected to {integrationName} to authorize the
                  connection
                </Text>
              </Stack>
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack style={{ gap: 'var(--space-6)' }}>
            <Stack>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Sync Settings</h3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
                Configure what data to sync and how often
              </Text>
            </Stack>

            <Stack style={{ gap: 'var(--space-4)' }}>
              <Stack>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
                  Data Types to Sync
                </Text>
                <Stack style={{ gap: 'var(--space-2)' }}>
                  {[
                    { id: 'projects', label: 'Projects', icon: Database },
                    { id: 'documents', label: 'Documents', icon: Database },
                    { id: 'payments', label: 'Payments', icon: Database },
                    { id: 'contacts', label: 'Contacts', icon: Database },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = settings.syncDataTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-3)',
                          borderWidth: 1,
                          borderStyle: 'solid',
                          borderRadius: 'var(--radius-4)',
                          cursor: 'pointer',
                          backgroundColor:
                            isSelected ? 'var(--color-blue-2)' : 'transparent',
                          borderColor:
                            isSelected ? 'var(--color-blue-9)' : 'var(--color-border)',
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
                          color={isSelected ? 'var(--color-blue-9)' : 'var(--color-text-secondary)'}
                        />
                        <Text
                          style={{
                            flex: 1,
                            color: isSelected ? 'var(--color-blue-11)' : 'var(--color-text-primary)',
                            fontWeight: isSelected ? '500' : 'normal',
                          }}
                        >
                          {type.label}
                        </Text>
                      </button>
                    );
                  })}
                </Stack>
              </Stack>

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

              <button
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-4)',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
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
                <Stack>
                  <Text style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                    Perform initial sync
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                    Import existing data from {integrationName} now
                  </Text>
                </Stack>
              </button>
            </Stack>
          </Stack>
        );

      case 3:
        return (
          <Stack style={{ gap: 'var(--space-6)', alignItems: 'center' }}>
            <Row style={{ justifyContent: 'center' }}>
              <Row
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: 'var(--color-green-2)',
                  borderRadius: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle color="var(--color-green-9)" size={32} />
              </Row>
            </Row>
            <Stack style={{ alignItems: 'center' }}>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Connection Successful!</h3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                {integrationName} has been successfully connected
              </Text>
            </Stack>
            {connectionStatus === 'active' && (
              <Stack
                style={{
                  backgroundColor: 'var(--color-green-2)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-green-5)',
                  borderRadius: 'var(--radius-4)',
                  padding: 'var(--space-4)',
                }}
              >
                <Row style={{ alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: 'var(--color-green-9)',
                      borderRadius: 9999,
                    }}
                  />
                  <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '500', color: 'var(--color-green-11)' }}>
                    Connection Active
                  </Text>
                </Row>
              </Stack>
            )}
            <Stack style={{ gap: 'var(--space-2)', width: '100%' }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                  Sync Frequency:
                </Text>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                  {settings.syncFrequency}
                </Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                  Data Types:
                </Text>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                  {settings.syncDataTypes.length} selected
                </Text>
              </Row>
            </Stack>
          </Stack>
        );

      case 4:
        return (
          <Stack style={{ gap: 'var(--space-6)' }}>
            <Stack style={{ alignItems: 'center' }}>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>Initial Sync in Progress</h3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                Importing data from {integrationName}...
              </Text>
            </Stack>
            <Stack style={{ gap: 'var(--space-2)' }}>
              <div
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-background-tertiary)',
                  borderRadius: 9999,
                  height: 12,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--color-blue-9)',
                    height: 12,
                    borderRadius: 9999,
                    width: `${initialSyncProgress}%`,
                  }}
                />
              </div>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-tertiary)' }}>
                  {Math.round(initialSyncProgress)}% complete
                </Text>
                <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-tertiary)' }}>
                  This may take a few minutes
                </Text>
              </Row>
            </Stack>
          </Stack>
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
      size="medium"
    >
      <Stack style={{ gap: 'var(--space-6)' }}>
        {/* Progress Steps */}
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          {[1, 2, 3].map((step) => (
            <Row key={step} style={{ alignItems: 'center', flex: 1 }}>
              <Row style={{ alignItems: 'center' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      currentStep >= step ? 'var(--color-blue-9)' : 'var(--color-background-tertiary)',
                  }}
                >
                  {currentStep > step ? (
                    <CheckCircle size={16} color="white" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 'var(--font-size-3)',
                        fontWeight: '500',
                        color: currentStep >= step ? 'white' : 'var(--color-text-secondary)',
                      }}
                    >
                      {step}
                    </Text>
                  )}
                </div>
                <Text
                  style={{
                    fontSize: 'var(--font-size-1)',
                    fontWeight: '500',
                    color: 'var(--color-text-tertiary)',
                    marginLeft: 'var(--space-2)',
                  }}
                >
                  {step === 1 ? 'Auth' : step === 2 ? 'Sync' : 'Done'}
                </Text>
              </Row>
              {step < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    marginLeft: 'var(--space-2)',
                    marginRight: 'var(--space-2)',
                    backgroundColor:
                      currentStep > step ? 'var(--color-blue-9)' : 'var(--color-background-tertiary)',
                  }}
                />
              )}
            </Row>
          ))}
        </Row>

        {/* Error Message */}
        {error && (
          <Row
            style={{
              backgroundColor: 'var(--color-red-2)',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-red-5)',
              borderRadius: 'var(--radius-4)',
              padding: 'var(--space-4)',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <AlertCircle color="var(--color-red-9)" size={20} />
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-red-11)' }}>
              {error}
            </Text>
          </Row>
        )}

        {/* Step Content */}
        <Stack style={{ minHeight: 300 }}>{renderStep()}</Stack>

        {/* Actions */}
        {currentStep < 3 && currentStep !== 4 && (
          <Row
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--color-border)',
            }}
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
          </Row>
        )}

        {currentStep === 3 && (
          <Row style={{ justifyContent: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="primary" onPress={handleClose}>
              Done
            </Button>
          </Row>
        )}
      </Stack>
    </Modal>
  );
}
