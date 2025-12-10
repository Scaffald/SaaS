import React, { useState } from 'react';
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Authentication Method
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Choose how you want to authenticate with {integrationName}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() =>
                  setSettings({ ...settings, authMethod: 'api_key' })
                }
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  settings.authMethod === 'api_key'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border hover:border-primary-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Key
                    className={
                      settings.authMethod === 'api_key'
                        ? 'text-primary-600'
                        : 'text-text-secondary'
                    }
                    size={20}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">API Key</div>
                    <div className="text-sm text-text-secondary">
                      Use an API key for authentication
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setSettings({ ...settings, authMethod: 'oauth' })
                }
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  settings.authMethod === 'oauth'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border hover:border-primary-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Lock
                    className={
                      settings.authMethod === 'oauth'
                        ? 'text-primary-600'
                        : 'text-text-secondary'
                    }
                    size={20}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">
                      OAuth 2.0
                    </div>
                    <div className="text-sm text-text-secondary">
                      Secure OAuth authentication
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setSettings({ ...settings, authMethod: 'username_password' })
                }
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  settings.authMethod === 'username_password'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border hover:border-primary-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Lock
                    className={
                      settings.authMethod === 'username_password'
                        ? 'text-primary-600'
                        : 'text-text-secondary'
                    }
                    size={20}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">
                      Username & Password
                    </div>
                    <div className="text-sm text-text-secondary">
                      Use your account credentials
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* API Key Input */}
            {settings.authMethod === 'api_key' && (
              <div className="space-y-4 pt-4 border-t border-border">
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
                <p className="text-xs text-text-tertiary">
                  Find your API key in your {integrationName} account settings
                </p>
              </div>
            )}

            {/* Username/Password Inputs */}
            {settings.authMethod === 'username_password' && (
              <div className="space-y-4 pt-4 border-t border-border">
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
              </div>
            )}

            {/* OAuth Button */}
            {settings.authMethod === 'oauth' && (
              <div className="pt-4 border-t border-border">
                <Button
                  variant="primary"
                  onClick={handleOAuthConnect}
                  disabled={loading}
                  leftIcon={loading ? Loader : Lock}
                  fullWidth
                >
                  {loading ? 'Connecting...' : 'Authorize with OAuth'}
                </Button>
                <p className="text-xs text-text-tertiary mt-2 text-center">
                  You will be redirected to {integrationName} to authorize the
                  connection
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Sync Settings
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Configure what data to sync and how often
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Data Types to Sync
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'projects', label: 'Projects', icon: Database },
                    { id: 'documents', label: 'Documents', icon: Database },
                    { id: 'payments', label: 'Payments', icon: Database },
                    { id: 'contacts', label: 'Contacts', icon: Database },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = settings.syncDataTypes.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-border hover:border-primary-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettings({
                                ...settings,
                                syncDataTypes: [
                                  ...settings.syncDataTypes,
                                  type.id,
                                ],
                              });
                            } else {
                              setSettings({
                                ...settings,
                                syncDataTypes: settings.syncDataTypes.filter(
                                  (t) => t !== type.id
                                ),
                              });
                            }
                          }}
                          className="rounded border-border text-primary-600 focus:ring-primary-500"
                        />
                        <Icon
                          size={18}
                          className={
                            isSelected
                              ? 'text-primary-600'
                              : 'text-text-secondary'
                          }
                        />
                        <span
                          className={`flex-1 ${isSelected ? 'text-primary-900 font-medium' : 'text-text-primary'}`}
                        >
                          {type.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

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

              <label className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.initialSync}
                  onChange={(e) =>
                    setSettings({ ...settings, initialSync: e.target.checked })
                  }
                  className="rounded border-border text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium text-text-primary">
                    Perform initial sync
                  </div>
                  <div className="text-sm text-text-secondary">
                    Import existing data from {integrationName} now
                  </div>
                </div>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-success-600" size={32} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Connection Successful!
              </h3>
              <p className="text-sm text-text-secondary">
                {integrationName} has been successfully connected
              </p>
            </div>
            {connectionStatus === 'active' && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-success-700">
                  <div className="w-2 h-2 bg-success-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Connection Active</span>
                </div>
              </div>
            )}
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>Sync Frequency:</span>
                <span className="font-medium text-text-primary">
                  {settings.syncFrequency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Data Types:</span>
                <span className="font-medium text-text-primary">
                  {settings.syncDataTypes.length} selected
                </span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Initial Sync in Progress
              </h3>
              <p className="text-sm text-text-secondary">
                Importing data from {integrationName}...
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-full bg-bg-tertiary rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${initialSyncProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>{Math.round(initialSyncProgress)}% complete</span>
                <span>This may take a few minutes</span>
              </div>
            </div>
          </div>
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
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-primary-600 text-white'
                      : 'bg-bg-tertiary text-text-tertiary'
                  }`}
                >
                  {currentStep > step ? <CheckCircle size={16} /> : step}
                </div>
                <span className="ml-2 text-xs font-medium text-text-secondary hidden sm:block">
                  {step === 1 ? 'Auth' : step === 2 ? 'Sync' : 'Done'}
                </span>
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-primary-600' : 'bg-bg-tertiary'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="text-error-600" size={20} />
            <span className="text-sm text-error-700">{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="min-h-[300px]">{renderStep()}</div>

        {/* Actions */}
        {currentStep < 3 && currentStep !== 4 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="secondary"
              onClick={currentStep === 1 ? handleClose : handleBack}
              disabled={loading}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            {currentStep === 1 && settings.authMethod !== 'oauth' ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={loading}
                rightIcon={ArrowRight}
              >
                Next
              </Button>
            ) : currentStep === 2 ? (
              <Button
                variant="primary"
                onClick={handleConnect}
                disabled={loading || settings.syncDataTypes.length === 0}
                leftIcon={loading ? Loader : CheckCircle}
              >
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            ) : null}
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
