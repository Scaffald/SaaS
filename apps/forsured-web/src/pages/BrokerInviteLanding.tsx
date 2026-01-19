/**
 * Broker Invitation Landing Page
 * REQ-13: Contractor Invitation Email with Insurance Document Upload
 *
 * Landing page for brokers to upload insurance documents on behalf of contractors.
 * Accessible via referral link: /broker/invite/:referralCode
 *
 * Features:
 * - Display contractor context
 * - File upload with validation (2MB limit, PDF/DOCX/images)
 * - Broker info form (name, email, phone, company)
 * - Optional account creation
 * - Success/error states
 */

import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Stack, Row, Text, Button, Card, H1, H2, Spinner, Input, Checkbox } from '@unicornlove/beyond-ui';
import {
  Upload,
  X,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  User,
  Mail,
  Phone,
  Building,
  AlertTriangle,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trpc } from '../lib/trpc';

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
];
const ALLOWED_EXTENSIONS = '.pdf,.docx,.jpg,.jpeg,.png,.gif';

interface FileItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface BrokerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  createAccount: boolean;
}

export default function BrokerInviteLandingPage() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState<BrokerFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    createAccount: false,
  });
  const [formErrors, setFormErrors] = useState<Partial<BrokerFormData>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch referral info by code
  const {
    data: referralInfo,
    isLoading,
    error,
  } = trpc.brokerInvitation.getByReferralCode.useQuery(
    { code: referralCode || '' },
    { enabled: !!referralCode, retry: false }
  );

  // Submit mutation
  const submitMutation = trpc.brokerInvitation.submitDocuments.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(
        `Successfully uploaded ${data.filesUploaded} document(s) for ${referralInfo?.contractorName || 'the contractor'}!`
      );
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to upload documents');
    },
  });

  // File validation
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File "${file.name}" exceeds 2MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        };
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: `File type "${file.type}" not allowed. Use PDF, DOCX, JPEG, PNG, or GIF`,
        };
      }
      return { valid: true };
    },
    []
  );

  // File handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const filesArray = Array.from(newFiles);
      const newItems: FileItem[] = [];

      filesArray.forEach((file) => {
        const validation = validateFile(file);
        if (validation.valid) {
          newItems.push({
            file,
            id: `file-${Date.now()}-${Math.random()}`,
            status: 'pending',
          });
        } else {
          setErrorMessage(validation.error || 'Invalid file');
        }
      });

      setFiles((prev) => [...prev, ...newItems]);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Form handlers
  const validateForm = (): boolean => {
    const errors: Partial<BrokerFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    if (files.length === 0) {
      setErrorMessage('Please upload at least one document');
      return;
    }

    if (!referralCode) {
      setErrorMessage('Invalid referral code');
      return;
    }

    // Convert files to base64 for upload
    const fileData = await Promise.all(
      files.map(async (f) => {
        const buffer = await f.file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        return {
          name: f.file.name,
          type: f.file.type,
          size: f.file.size,
          data: base64,
        };
      })
    );

    submitMutation.mutate({
      referralCode,
      brokerInfo: {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        createAccount: formData.createAccount,
      },
      files: fileData,
    });
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-gray-2)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <Card style={{ padding: 'var(--space-8)', maxWidth: 500, width: '100%' }}>
          <Stack style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
            <Spinner size="lg" />
            <Text style={{ fontSize: 'var(--font-size-4)', color: 'var(--color-gray-11)' }}>
              Loading invitation...
            </Text>
          </Stack>
        </Card>
      </Stack>
    );
  }

  // Referral not found
  if (error || !referralInfo) {
    return (
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-gray-2)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <Card style={{ padding: 'var(--space-8)', maxWidth: 500, width: '100%' }}>
          <Stack style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
            <Stack
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'var(--color-red-3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={32} color="var(--color-red-10)" />
            </Stack>
            <H2 style={{ textAlign: 'center' }}>Invitation Not Found</H2>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                color: 'var(--color-gray-11)',
                textAlign: 'center',
              }}
            >
              This invitation may have expired, been cancelled, or the link is invalid.
            </Text>
            <Button onPress={() => navigate('/')} style={{ marginTop: 'var(--space-4)' }}>
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <ArrowRight size={16} />
                <Text>Go to Home</Text>
              </Row>
            </Button>
          </Stack>
        </Card>
      </Stack>
    );
  }

  // Success state
  if (successMessage) {
    return (
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-gray-2)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <Card style={{ padding: 'var(--space-8)', maxWidth: 500, width: '100%' }}>
          <Stack style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
            <Stack
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'var(--color-green-3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={32} color="var(--color-green-10)" />
            </Stack>
            <H2 style={{ textAlign: 'center' }}>Documents Uploaded!</H2>
            <Text
              style={{
                fontSize: 'var(--font-size-3)',
                color: 'var(--color-gray-11)',
                textAlign: 'center',
              }}
            >
              {successMessage}
            </Text>
            {formData.createAccount && (
              <Stack
                style={{
                  backgroundColor: 'var(--color-blue-2)',
                  border: '1px solid var(--color-blue-6)',
                  borderRadius: 'var(--radius-4)',
                  padding: 'var(--space-4)',
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    fontSize: 'var(--font-size-3)',
                    color: 'var(--color-blue-11)',
                    textAlign: 'center',
                  }}
                >
                  Check your email for instructions to complete your ForSured account setup.
                </Text>
              </Stack>
            )}
            <Button onPress={() => navigate('/')} style={{ marginTop: 'var(--space-4)' }}>
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <ArrowRight size={16} />
                <Text>Go to Home</Text>
              </Row>
            </Button>
          </Stack>
        </Card>
      </Stack>
    );
  }

  // If user is already authenticated as a broker, show simplified flow
  const isAuthenticatedBroker = user && profile?.user_type === 'broker';

  // Main form
  return (
    <Stack
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-gray-2)',
        padding: 'var(--space-8)',
      }}
    >
      <Stack
        style={{
          maxWidth: 600,
          width: '100%',
          margin: '0 auto',
          gap: 'var(--space-6)',
        }}
      >
        {/* Header */}
        <Card style={{ padding: 'var(--space-6)' }}>
          <Stack style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
            <Stack
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'var(--color-teal-3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={32} color="var(--color-teal-10)" />
            </Stack>
            <H1 style={{ textAlign: 'center', fontSize: 'var(--font-size-7)' }}>
              Insurance Document Upload
            </H1>
            <Text
              style={{
                fontSize: 'var(--font-size-4)',
                color: 'var(--color-gray-11)',
                textAlign: 'center',
              }}
            >
              <Text as="span" style={{ fontWeight: 600, color: 'var(--color-gray-12)' }}>
                {referralInfo.contractorName}
              </Text>{' '}
              has invited you to upload their insurance documents to ForSured.
            </Text>
          </Stack>
        </Card>

        {/* Error message */}
        {errorMessage && (
          <Card
            style={{
              backgroundColor: 'var(--color-red-2)',
              border: '1px solid var(--color-red-6)',
              padding: 'var(--space-4)',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
              <AlertTriangle size={20} color="var(--color-red-10)" />
              <Text style={{ color: 'var(--color-red-11)', flex: 1 }}>{errorMessage}</Text>
              <button
                onClick={() => setErrorMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <X size={16} color="var(--color-red-10)" />
              </button>
            </Row>
          </Card>
        )}

        {/* Benefits Section */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <Text
              style={{
                fontSize: 'var(--font-size-4)',
                fontWeight: 600,
                color: 'var(--color-gray-12)',
              }}
            >
              Why ForSured?
            </Text>
            <Stack style={{ gap: 'var(--space-3)' }}>
              <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <CheckCircle size={18} color="var(--color-teal-10)" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>
                  Securely store and manage insurance certificates
                </Text>
              </Row>
              <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <CheckCircle size={18} color="var(--color-teal-10)" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>
                  Automatic expiration tracking and renewal reminders
                </Text>
              </Row>
              <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <CheckCircle size={18} color="var(--color-teal-10)" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>
                  Simplified compliance verification for contractors
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Card>

        {/* File Upload Section */}
        <Card style={{ padding: 'var(--space-5)' }}>
          <Stack style={{ gap: 'var(--space-4)' }}>
            <Text
              style={{
                fontSize: 'var(--font-size-4)',
                fontWeight: 600,
                color: 'var(--color-gray-12)',
              }}
            >
              Upload Documents
            </Text>

            {/* Drop zone */}
            <div
              data-testid="drop-zone"
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-teal-9)' : 'var(--color-gray-6)'}`,
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: isDragging ? 'var(--color-teal-2)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS}
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                aria-label="Browse files"
              />
              <Stack style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                <Upload size={40} color="var(--color-gray-10)" />
                <Row style={{ gap: 'var(--space-2)' }}>
                  <Text style={{ fontWeight: 500, color: 'var(--color-teal-10)' }}>
                    Browse files
                  </Text>
                  <Text style={{ color: 'var(--color-gray-11)' }}>or drag and drop here</Text>
                </Row>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-10)' }}>
                  PDF, DOCX, JPEG, PNG, GIF - Max 2MB each
                </Text>
              </Stack>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <Stack style={{ gap: 'var(--space-2)' }}>
                {files.map((item) => (
                  <Card
                    key={item.id}
                    style={{
                      padding: 'var(--space-3)',
                      border: '1px solid var(--color-gray-6)',
                    }}
                  >
                    <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Row style={{ alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                        <FileText size={20} color="var(--color-gray-10)" />
                        <Stack style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{
                              fontSize: 'var(--font-size-3)',
                              fontWeight: 500,
                              color: 'var(--color-gray-12)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.file.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 'var(--font-size-1)',
                              color: 'var(--color-gray-10)',
                            }}
                          >
                            {(item.file.size / 1024).toFixed(1)} KB
                          </Text>
                        </Stack>
                      </Row>
                      <button
                        onClick={() => removeFile(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 'var(--space-1)',
                          color: 'var(--color-gray-9)',
                        }}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X size={18} />
                      </button>
                    </Row>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Broker Info Form - only show if not authenticated as broker */}
        {!isAuthenticatedBroker && (
          <Card style={{ padding: 'var(--space-5)' }}>
            <Stack style={{ gap: 'var(--space-4)' }}>
              <Text
                style={{
                  fontSize: 'var(--font-size-4)',
                  fontWeight: 600,
                  color: 'var(--color-gray-12)',
                }}
              >
                Your Information
              </Text>

              {/* Name */}
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <User size={16} color="var(--color-gray-10)" />
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      fontWeight: 500,
                      color: 'var(--color-gray-12)',
                    }}
                  >
                    Name <span style={{ color: 'var(--color-red-10)' }}>*</span>
                  </Text>
                </Row>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  error={formErrors.name}
                />
              </Stack>

              {/* Email */}
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Mail size={16} color="var(--color-gray-10)" />
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      fontWeight: 500,
                      color: 'var(--color-gray-12)',
                    }}
                  >
                    Email <span style={{ color: 'var(--color-red-10)' }}>*</span>
                  </Text>
                </Row>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@company.com"
                  error={formErrors.email}
                />
              </Stack>

              {/* Phone */}
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Phone size={16} color="var(--color-gray-10)" />
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      fontWeight: 500,
                      color: 'var(--color-gray-12)',
                    }}
                  >
                    Phone (optional)
                  </Text>
                </Row>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </Stack>

              {/* Company */}
              <Stack style={{ gap: 'var(--space-2)' }}>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Building size={16} color="var(--color-gray-10)" />
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      fontWeight: 500,
                      color: 'var(--color-gray-12)',
                    }}
                  >
                    Insurance Agency (optional)
                  </Text>
                </Row>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Your agency name"
                />
              </Stack>

              {/* Create Account Option */}
              <Stack
                style={{
                  backgroundColor: 'var(--color-blue-2)',
                  border: '1px solid var(--color-blue-6)',
                  borderRadius: 'var(--radius-4)',
                  padding: 'var(--space-4)',
                }}
              >
                <Checkbox
                  checked={formData.createAccount}
                  onChange={(checked) =>
                    setFormData((prev) => ({ ...prev, createAccount: checked }))
                  }
                  label="Create a ForSured broker account"
                />
                <Text
                  style={{
                    fontSize: 'var(--font-size-2)',
                    color: 'var(--color-blue-11)',
                    marginTop: 'var(--space-2)',
                    marginLeft: 'var(--space-6)',
                  }}
                >
                  Get access to manage insurance documents for all your clients in one place.
                </Text>
              </Stack>
            </Stack>
          </Card>
        )}

        {/* Authenticated broker notice */}
        {isAuthenticatedBroker && (
          <Card
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-green-2)',
              border: '1px solid var(--color-green-6)',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
              <CheckCircle size={20} color="var(--color-green-10)" />
              <Stack style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 'var(--font-size-3)',
                    fontWeight: 500,
                    color: 'var(--color-green-11)',
                  }}
                >
                  Logged in as {profile?.full_name || profile?.email}
                </Text>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-10)' }}>
                  Documents will be uploaded under your broker account
                </Text>
              </Stack>
            </Row>
          </Card>
        )}

        {/* Submit button */}
        <Button
          onPress={handleSubmit}
          disabled={submitMutation.isPending || files.length === 0}
          size="lg"
          style={{ width: '100%' }}
        >
          <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            {submitMutation.isPending ? (
              <>
                <Spinner size="sm" />
                <Text>Uploading...</Text>
              </>
            ) : (
              <>
                <Upload size={18} />
                <Text>Upload Documents</Text>
              </>
            )}
          </Row>
        </Button>

        {/* Already have an account? */}
        {!isAuthenticatedBroker && (
          <Row style={{ justifyContent: 'center' }}>
            <Link
              to={`/?redirect=/broker/invite/${referralCode}`}
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--color-blue-10)',
              }}
            >
              <LogIn size={16} />
              <Text style={{ fontSize: 'var(--font-size-3)' }}>Already have an account? Sign in</Text>
            </Link>
          </Row>
        )}

        {/* Footer */}
        <Text
          style={{
            fontSize: 'var(--font-size-2)',
            color: 'var(--color-gray-10)',
            textAlign: 'center',
          }}
        >
          By uploading documents, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </Stack>
    </Stack>
  );
}
