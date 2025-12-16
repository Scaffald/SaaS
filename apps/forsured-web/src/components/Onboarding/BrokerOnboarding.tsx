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
import { YStack, XStack, Text, H1, H2, H3, Card, Input, Button as TamaguiButton } from 'tamagui';
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
    <YStack minHeight="100vh" backgroundColor="$backgroundHover" alignItems="center" justifyContent="center" padding="$4">
      <YStack width="100%" maxWidth={600} position="relative">
        <TamaguiButton
          onPress={handleSkip}
          disabled={isSubmitting}
          position="absolute"
          top="$6"
          right="$6"
          variant="ghost"
          color="$color11"
          hoverStyle={{ color: "$color12" }}
          alignItems="center"
          gap="$2"
          fontSize="$3"
          opacity={isSubmitting ? 0.5 : 1}
        >
          <Text>Skip for now</Text>
          <X size={18} />
        </TamaguiButton>

        <YStack alignItems="center" marginBottom="$8">
          <XStack justifyContent="center" marginBottom="$6">
            <ForsuredLogo className="h-8" />
          </XStack>
          <H1 fontSize="$8" fontWeight="bold" color="$color12" marginBottom="$2">
            Welcome, Insurance Broker
          </H1>
          <Text color="$color11">Set up your brokerage profile</Text>
        </YStack>

        <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$8">
          <XStack alignItems="center" justifyContent="center" width={64} height={64} backgroundColor="$green3" borderRadius={9999} marginX="auto" marginBottom="$6">
            <Briefcase color="$green9" size={32} />
          </XStack>

          <YStack as="form" onSubmit={handleSubmit} gap="$8">
            {/* Brokerage Details Section */}
            <YStack>
              <XStack alignItems="center" marginBottom="$4">
                <Building2 size={20} color="$blue9" marginRight="$2" />
                <H2 fontSize="$6" fontWeight="600" color="$color12">
                  Brokerage Details
                </H2>
              </XStack>

              <YStack gap="$4">
                <YStack>
                  <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                    Brokerage Name <Text color="$red9">*</Text>
                  </Text>
                  <Input
                    type="text"
                    required
                    width="100%"
                    borderWidth={1}
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderColor={errors.brokerageName ? "$red9" : "$borderColor"}
                    placeholder="Enter your brokerage name"
                    value={formData.brokerageName}
                    onChangeText={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        brokerageName: value,
                      }))
                    }
                  />
                  {errors.brokerageName && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.brokerageName}</Text>
                  )}
                </YStack>

                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <FileText size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      License Number <Text color="$red9">*</Text>
                    </Text>
                  </XStack>
                  <Input
                    type="text"
                    required
                    width="100%"
                    borderWidth={1}
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderColor={errors.licenseNumber ? "$red9" : "$borderColor"}
                    placeholder="Enter license number"
                    value={formData.licenseNumber}
                    onChangeText={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        licenseNumber: value,
                      }))
                    }
                  />
                  {errors.licenseNumber && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.licenseNumber}</Text>
                  )}
                </YStack>

                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <MapPin size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Location <Text color="$red9">*</Text>
                    </Text>
                  </XStack>
                  <Input
                    type="text"
                    required
                    width="100%"
                    borderWidth={1}
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderColor={errors.location ? "$red9" : "$borderColor"}
                    placeholder="City, State"
                    value={formData.location}
                    onChangeText={(value) =>
                      setFormData((prev) => ({ ...prev, location: value }))
                    }
                  />
                  {errors.location && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.location}</Text>
                  )}
                </YStack>
              </YStack>
            </YStack>

            {/* Administrator Account Section */}
            <YStack>
              <XStack alignItems="center" marginBottom="$4">
                <Shield size={20} color="$blue9" marginRight="$2" />
                <H2 fontSize="$6" fontWeight="600" color="$color12">
                  Administrator Account
                </H2>
              </XStack>
              <Text fontSize="$3" color="$color11" marginBottom="$4">
                You will be the administrator and main contact for this brokerage.
              </Text>

              <YStack gap="$4">
                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <User size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Full Name <Text color="$red9">*</Text>
                    </Text>
                  </XStack>
                  <Input
                    type="text"
                    required
                    width="100%"
                    borderWidth={1}
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderColor={errors.adminName ? "$red9" : "$borderColor"}
                    placeholder="Enter your full name"
                    value={formData.administrator.name}
                    onChangeText={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        administrator: { ...prev.administrator, name: value },
                      }))
                    }
                  />
                  {errors.adminName && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.adminName}</Text>
                  )}
                </YStack>

                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <Mail size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Email Address <Text color="$red9">*</Text>
                    </Text>
                  </XStack>
                  <Input
                    type="email"
                    required
                    width="100%"
                    borderWidth={1}
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderColor={errors.adminEmail ? "$red9" : "$borderColor"}
                    placeholder="Enter your email address"
                    value={formData.administrator.email}
                    onChangeText={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        administrator: { ...prev.administrator, email: value },
                      }))
                    }
                  />
                  {errors.adminEmail && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.adminEmail}</Text>
                  )}
                </YStack>

                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <Phone size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Phone Number <Text color="$red9">*</Text>
                    </Text>
                  </XStack>
                  <Input
                    type="tel"
                    required
                    width="100%"
                    borderWidth={1}
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderColor={errors.adminPhone ? "$red9" : "$borderColor"}
                    placeholder="(555) 123-4567"
                    value={formData.administrator.phone}
                    onChangeText={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        administrator: { ...prev.administrator, phone: value },
                      }))
                    }
                  />
                  {errors.adminPhone && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.adminPhone}</Text>
                  )}
                </YStack>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-1" />
                      Password <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className={`w-full border rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.adminPassword ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="Create a password"
                      value={formData.administrator.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          administrator: { ...prev.administrator, password: e.target.value },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Must be at least 8 characters with a number and special character
                  </p>
                  {errors.adminPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.adminPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-1" />
                      Confirm Password <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={`w-full border rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.adminConfirmPassword ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="Confirm your password"
                      value={formData.administrator.confirmPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          administrator: { ...prev.administrator, confirmPassword: e.target.value },
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.adminConfirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.adminConfirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Members Invitation Section */}
            <div>
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 text-primary-500 mr-2" />
                <h2 className="text-lg font-semibold text-text-primary">
                  Invite Team Members
                </h2>
                <span className="ml-2 text-xs text-text-secondary">(Optional)</span>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Invite colleagues to join your brokerage. They will receive an email with a signup link.
              </p>

              <div className="space-y-4">
                {/* Input for adding new team member email */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Team Member Email
                    </div>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      className={`flex-1 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        teamEmailError ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="colleague@example.com"
                      value={newTeamEmail}
                      onChange={(e) => {
                        setNewTeamEmail(e.target.value);
                        setTeamEmailError(null);
                      }}
                      onKeyPress={handleTeamEmailKeyPress}
                    />
                    <button
                      type="button"
                      onClick={handleAddTeamEmail}
                      className="flex items-center justify-center px-4 py-3 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors"
                      aria-label="Add team member"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {teamEmailError && (
                    <p className="text-red-500 text-sm mt-1">{teamEmailError}</p>
                  )}
                </div>

                {/* List of added team members */}
                {teamEmails.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-primary">
                      Pending Invitations ({teamEmails.length})
                    </p>
                    <div className="space-y-2">
                      {teamEmails.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between bg-neutral-50 border border-border rounded-lg px-4 py-2"
                        >
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-text-secondary" />
                            <span className="text-sm text-text-primary">{email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamEmail(email)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label={`Remove ${email}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed font-medium"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
