/**
 * BrokerOnboarding - Brokerage onboarding form
 * REQ-285: Broker Onboarding Form Improvements
 * TASK-1: Update Brokerage Details Form Section
 * TASK-2: Implement Administrator Setup Flow
 * TASK-3: Build Team Member Invitation Flow
 *
 * Collects brokerage details and administrator account information:
 * - Brokerage name, location, license number
 * - Administrator: name, email, phone, password (becomes main contact with admin role)
 * - Team member invitations: list of emails to invite
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, X, User, Building2, Phone, Mail, MapPin, FileText, Lock, Eye, EyeOff, Shield, Users, Plus, Trash2 } from 'lucide-react';
import { Stack, Row, Text, H1, H2, Card, Input, Button } from '@unicornlove/beyond-ui';
import ForsuredLogo from '../Common/ForsuredLogo';
import { useAuth } from '../../contexts/AuthContext';

interface BrokerageFormData {
  brokerageName: string;
  licenseNumber: string;
  location: string;
  administrator: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  };
}

export default function BrokerOnboarding() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BrokerageFormData>({
    brokerageName: '',
    licenseNumber: '',
    location: '',
    administrator: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Team member invitation state
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [teamEmailError, setTeamEmailError] = useState<string | null>(null);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format (basic)
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Validate password format (8+ chars, at least one number and one special char)
  const isValidPassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasNumber && hasSpecialChar;
  };

  // Get password validation message
  const getPasswordValidationMessage = (password: string): string => {
    const issues: string[] = [];
    if (password.length < 8) issues.push('at least 8 characters');
    if (!/\d/.test(password)) issues.push('a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) issues.push('a special character');
    return `Password must contain ${issues.join(', ')}`;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brokerageName.trim()) {
      newErrors.brokerageName = 'Brokerage name is required';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.administrator.name.trim()) {
      newErrors.adminName = 'Administrator name is required';
    }

    if (!formData.administrator.email.trim()) {
      newErrors.adminEmail = 'Administrator email is required';
    } else if (!isValidEmail(formData.administrator.email)) {
      newErrors.adminEmail = 'Please enter a valid email address';
    }

    if (!formData.administrator.phone.trim()) {
      newErrors.adminPhone = 'Administrator phone is required';
    } else if (!isValidPhone(formData.administrator.phone)) {
      newErrors.adminPhone = 'Please enter a valid phone number';
    }

    if (!formData.administrator.password.trim()) {
      newErrors.adminPassword = 'Password is required';
    } else if (!isValidPassword(formData.administrator.password)) {
      newErrors.adminPassword = getPasswordValidationMessage(formData.administrator.password);
    }

    if (!formData.administrator.confirmPassword.trim()) {
      newErrors.adminConfirmPassword = 'Please confirm your password';
    } else if (formData.administrator.password !== formData.administrator.confirmPassword) {
      newErrors.adminConfirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add team member email to the list
  const handleAddTeamEmail = () => {
    const email = newTeamEmail.trim().toLowerCase();

    if (!email) {
      setTeamEmailError('Please enter an email address');
      return;
    }

    if (!isValidEmail(email)) {
      setTeamEmailError('Please enter a valid email address');
      return;
    }

    if (teamEmails.includes(email)) {
      setTeamEmailError('This email has already been added');
      return;
    }

    if (email === formData.administrator.email.toLowerCase()) {
      setTeamEmailError('This email is already used for the administrator account');
      return;
    }

    setTeamEmails((prev) => [...prev, email]);
    setNewTeamEmail('');
    setTeamEmailError(null);
  };

  // Remove team member email from the list
  const handleRemoveTeamEmail = (emailToRemove: string) => {
    setTeamEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  // Handle enter key in team email input
  const handleTeamEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTeamEmail();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Prepare data for API submission
    const submissionData = {
      brokerage: {
        name: formData.brokerageName,
        licenseNumber: formData.licenseNumber,
        location: formData.location,
      },
      administrator: {
        name: formData.administrator.name,
        email: formData.administrator.email,
        phone: formData.administrator.phone,
        password: formData.administrator.password,
        role: 'admin' as const,
      },
      teamInvitations: teamEmails,
    };

    try {
      // Mark onboarding as complete with form data
      await updateProfile({
        onboarding_completed: true,
        onboarding_data: submissionData,
        onboarding_completed_at: new Date().toISOString(),
      });
      console.log('Broker onboarding data:', submissionData);
      // TODO: Submit to API - creates brokerage and admin user in single transaction
      // The administrator will be linked to the brokerage as the main contact
      // Team invitations will be sent via email with signup links containing invitation tokens
      if (teamEmails.length > 0) {
        console.log(`Sending ${teamEmails.length} team invitation(s)`);
      }
      navigate('/broker/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      // Still redirect even on error
      navigate('/broker/dashboard');
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
      navigate('/broker/dashboard');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      // Still redirect even on error
      navigate('/broker/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.brokerageName &&
    formData.licenseNumber &&
    formData.location &&
    formData.administrator.name &&
    formData.administrator.email &&
    formData.administrator.phone &&
    formData.administrator.password &&
    formData.administrator.confirmPassword;

  return (
    <Stack
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background-hover)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Stack style={{ width: '100%', maxWidth: 600, position: 'relative' }}>
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
            <Text>Skip for now</Text>
            <X size={18} />
          </Row>
        </Button>

        <Stack style={{ alignItems: 'center', marginBottom: 32 }}>
          <Stack style={{ marginBottom: 24 }}>
            <ForsuredLogo />
          </Stack>
          <H1 style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--color-text)', marginBottom: 8 }}>
            Welcome, Insurance Broker
          </H1>
          <Text style={{ color: 'var(--color-text-secondary)' }}>Set up your brokerage profile</Text>
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
          <Row
            style={{
              width: 64,
              height: 64,
              backgroundColor: 'var(--color-green-3)',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
            }}
          >
            <Briefcase color="var(--color-green-9)" size={32} />
          </Row>

          <form onSubmit={handleSubmit}>
            <Stack style={{ gap: 32 }}>
              {/* Brokerage Details Section */}
              <Stack>
                <Row style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Building2 size={20} color="var(--color-blue-9)" style={{ marginRight: 8 }} />
                  <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
                    Brokerage Details
                  </H2>
                </Row>

                <Stack style={{ gap: 16 }}>
                  <Stack>
                    <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8 }}>
                      Brokerage Name <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                    </Text>
                    <Input
                      type="text"
                      required
                      style={{
                        width: '100%',
                        border: `1px solid ${errors.brokerageName ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                        borderRadius: 16,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                      placeholder="Enter your brokerage name"
                      value={formData.brokerageName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brokerageName: e.target.value,
                        }))
                      }
                    />
                    {errors.brokerageName && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.brokerageName}</Text>
                    )}
                  </Stack>

                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <FileText size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        License Number <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                      </Text>
                    </Row>
                    <Input
                      type="text"
                      required
                      style={{
                        width: '100%',
                        border: `1px solid ${errors.licenseNumber ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                        borderRadius: 16,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                      placeholder="Enter license number"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          licenseNumber: e.target.value,
                        }))
                      }
                    />
                    {errors.licenseNumber && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.licenseNumber}</Text>
                    )}
                  </Stack>

                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <MapPin size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Location <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                      </Text>
                    </Row>
                    <Input
                      type="text"
                      required
                      style={{
                        width: '100%',
                        border: `1px solid ${errors.location ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                        borderRadius: 16,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                      placeholder="City, State"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, location: e.target.value }))
                      }
                    />
                    {errors.location && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.location}</Text>
                    )}
                  </Stack>
                </Stack>
              </Stack>

              {/* Administrator Account Section */}
              <Stack>
                <Row style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Shield size={20} color="var(--color-blue-9)" style={{ marginRight: 8 }} />
                  <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
                    Administrator Account
                  </H2>
                </Row>
                <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                  You will be the administrator and main contact for this brokerage.
                </Text>

                <Stack style={{ gap: 16 }}>
                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <User size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Full Name <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                      </Text>
                    </Row>
                    <Input
                      type="text"
                      required
                      style={{
                        width: '100%',
                        border: `1px solid ${errors.adminName ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                        borderRadius: 16,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                      placeholder="Enter your full name"
                      value={formData.administrator.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          administrator: { ...prev.administrator, name: e.target.value },
                        }))
                      }
                    />
                    {errors.adminName && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.adminName}</Text>
                    )}
                  </Stack>

                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <Mail size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Email Address <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                      </Text>
                    </Row>
                    <Input
                      type="email"
                      required
                      style={{
                        width: '100%',
                        border: `1px solid ${errors.adminEmail ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                        borderRadius: 16,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                      placeholder="Enter your email address"
                      value={formData.administrator.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          administrator: { ...prev.administrator, email: e.target.value },
                        }))
                      }
                    />
                    {errors.adminEmail && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.adminEmail}</Text>
                    )}
                  </Stack>

                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <Phone size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Phone Number <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                      </Text>
                    </Row>
                    <Input
                      type="tel"
                      required
                      style={{
                        width: '100%',
                        border: `1px solid ${errors.adminPhone ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                        borderRadius: 16,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 12,
                        paddingBottom: 12,
                      }}
                      placeholder="(555) 123-4567"
                      value={formData.administrator.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          administrator: { ...prev.administrator, phone: e.target.value },
                        }))
                      }
                    />
                    {errors.adminPhone && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.adminPhone}</Text>
                    )}
                  </Stack>

                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <Lock size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Password <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                      </Text>
                    </Row>
                    <Row style={{ position: 'relative', width: '100%' }}>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        required
                        style={{
                          width: '100%',
                          border: `1px solid ${errors.adminPassword ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                          borderRadius: 16,
                          paddingLeft: 16,
                          paddingRight: 48,
                          paddingTop: 12,
                          paddingBottom: 12,
                        }}
                        placeholder="Create a password"
                        value={formData.administrator.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            administrator: { ...prev.administrator, password: e.target.value },
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </Button>
                    </Row>
                    <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      Must be at least 8 characters with a number and special character
                    </Text>
                    {errors.adminPassword && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.adminPassword}</Text>
                    )}
                  </Stack>

                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <Lock size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Confirm Password <Text style={{ color: 'var(--color-red-9)' }}>*</Text>
                      </Text>
                    </Row>
                    <Row style={{ position: 'relative', width: '100%' }}>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        style={{
                          width: '100%',
                          border: `1px solid ${errors.adminConfirmPassword ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                          borderRadius: 16,
                          paddingLeft: 16,
                          paddingRight: 48,
                          paddingTop: 12,
                          paddingBottom: 12,
                        }}
                        placeholder="Confirm your password"
                        value={formData.administrator.confirmPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            administrator: { ...prev.administrator, confirmPassword: e.target.value },
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </Button>
                    </Row>
                    {errors.adminConfirmPassword && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{errors.adminConfirmPassword}</Text>
                    )}
                  </Stack>
                </Stack>
              </Stack>

              {/* Team Members Invitation Section */}
              <Stack>
                <Row style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Users size={20} color="var(--color-blue-9)" style={{ marginRight: 8 }} />
                  <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
                    Invite Team Members
                  </H2>
                  <Text style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>(Optional)</Text>
                </Row>
                <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                  Invite colleagues to join your brokerage. They will receive an email with a signup link.
                </Text>

                <Stack style={{ gap: 16 }}>
                  {/* Input for adding new team member email */}
                  <Stack>
                    <Row style={{ alignItems: 'center', marginBottom: 8 }}>
                      <Mail size={16} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Team Member Email
                      </Text>
                    </Row>
                    <Row style={{ gap: 8 }}>
                      <Input
                        type="email"
                        style={{
                          flex: 1,
                          border: `1px solid ${teamEmailError ? 'var(--color-red-9)' : 'var(--color-border)'}`,
                          borderRadius: 16,
                          paddingLeft: 16,
                          paddingRight: 16,
                          paddingTop: 12,
                          paddingBottom: 12,
                        }}
                        placeholder="colleague@example.com"
                        value={newTeamEmail}
                        onChange={(e) => {
                          setNewTeamEmail(e.target.value);
                          setTeamEmailError(null);
                        }}
                        onKeyDown={handleTeamEmailKeyPress}
                      />
                      <Button
                        type="button"
                        onPress={handleAddTeamEmail}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingLeft: 16,
                          paddingRight: 16,
                          paddingTop: 12,
                          paddingBottom: 12,
                          backgroundColor: 'var(--color-blue-3)',
                          color: 'var(--color-blue-9)',
                          borderRadius: 16,
                        }}
                      >
                        <Plus size={20} />
                      </Button>
                    </Row>
                    {teamEmailError && (
                      <Text style={{ color: 'var(--color-red-9)', fontSize: 14, marginTop: 4 }}>{teamEmailError}</Text>
                    )}
                  </Stack>

                  {/* List of added team members */}
                  {teamEmails.length > 0 && (
                    <Stack style={{ gap: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                        Pending Invitations ({teamEmails.length})
                      </Text>
                      <Stack style={{ gap: 8 }}>
                        {teamEmails.map((email) => (
                          <Row
                            key={email}
                            style={{
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: 'var(--color-gray-2)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 16,
                              paddingLeft: 16,
                              paddingRight: 16,
                              paddingTop: 8,
                              paddingBottom: 8,
                            }}
                          >
                            <Row style={{ alignItems: 'center', gap: 8 }}>
                              <Mail size={16} color="var(--color-text-secondary)" />
                              <Text style={{ fontSize: 14, color: 'var(--color-text)' }}>{email}</Text>
                            </Row>
                            <Button
                              type="button"
                              onPress={() => handleRemoveTeamEmail(email)}
                              variant="ghost"
                              style={{ color: 'var(--color-red-9)' }}
                            >
                              <Trash2 size={18} />
                            </Button>
                          </Row>
                        ))}
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Stack>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                variant="primary"
                onPress={(e) => {
                  e?.preventDefault?.();
                  handleSubmit(e as any);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: 'var(--color-blue-9)',
                  color: 'white',
                  paddingLeft: 24,
                  paddingRight: 24,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderRadius: 16,
                  opacity: !isValid || isSubmitting ? 0.5 : 1,
                  cursor: !isValid || isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                <Text>Continue to Dashboard</Text>
                <ArrowRight size={18} />
              </Button>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Stack>
  );
}
