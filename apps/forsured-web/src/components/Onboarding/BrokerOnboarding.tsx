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
          <YStack marginBottom="$6">
            <ForsuredLogo />
          </YStack>
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

                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <Lock size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Password <Text color="$red9">*</Text>
                    </Text>
                  </XStack>
                  <XStack position="relative" width="100%">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      width="100%"
                      borderWidth={1}
                      borderRadius="$4"
                      paddingHorizontal="$4"
                      paddingVertical="$3"
                      paddingRight="$12"
                      borderColor={errors.adminPassword ? "$red9" : "$borderColor"}
                      placeholder="Create a password"
                      value={formData.administrator.password}
                      onChangeText={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          administrator: { ...prev.administrator, password: value },
                        }))
                      }
                    />
                    <TamaguiButton
                      type="button"
                      position="absolute"
                      right="$3"
                      top="50%"
                      transform={[{ translateY: -10 }]}
                      variant="ghost"
                      color="$color11"
                      hoverStyle={{ color: "$color12" }}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </TamaguiButton>
                  </XStack>
                  <Text fontSize="$1" color="$color11" marginTop="$1">
                    Must be at least 8 characters with a number and special character
                  </Text>
                  {errors.adminPassword && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.adminPassword}</Text>
                  )}
                </YStack>

                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <Lock size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Confirm Password <Text color="$red9">*</Text>
                    </Text>
                  </XStack>
                  <XStack position="relative" width="100%">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      width="100%"
                      borderWidth={1}
                      borderRadius="$4"
                      paddingHorizontal="$4"
                      paddingVertical="$3"
                      paddingRight="$12"
                      borderColor={errors.adminConfirmPassword ? "$red9" : "$borderColor"}
                      placeholder="Confirm your password"
                      value={formData.administrator.confirmPassword}
                      onChangeText={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          administrator: { ...prev.administrator, confirmPassword: value },
                        }))
                      }
                    />
                    <TamaguiButton
                      type="button"
                      position="absolute"
                      right="$3"
                      top="50%"
                      transform={[{ translateY: -10 }]}
                      variant="ghost"
                      color="$color11"
                      hoverStyle={{ color: "$color12" }}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </TamaguiButton>
                  </XStack>
                  {errors.adminConfirmPassword && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{errors.adminConfirmPassword}</Text>
                  )}
                </YStack>
              </YStack>
            </YStack>

            {/* Team Members Invitation Section */}
            <YStack>
              <XStack alignItems="center" marginBottom="$4">
                <Users size={20} color="$blue9" marginRight="$2" />
                <H2 fontSize="$6" fontWeight="600" color="$color12">
                  Invite Team Members
                </H2>
                <Text marginLeft="$2" fontSize="$1" color="$color11">(Optional)</Text>
              </XStack>
              <Text fontSize="$3" color="$color11" marginBottom="$4">
                Invite colleagues to join your brokerage. They will receive an email with a signup link.
              </Text>

              <YStack gap="$4">
                {/* Input for adding new team member email */}
                <YStack>
                  <XStack alignItems="center" marginBottom="$2">
                    <Mail size={16} marginRight="$1" />
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Team Member Email
                    </Text>
                  </XStack>
                  <XStack gap="$2">
                    <Input
                      type="email"
                      flex={1}
                      borderWidth={1}
                      borderRadius="$4"
                      paddingHorizontal="$4"
                      paddingVertical="$3"
                      borderColor={teamEmailError ? "$red9" : "$borderColor"}
                      placeholder="colleague@example.com"
                      value={newTeamEmail}
                      onChangeText={(value) => {
                        setNewTeamEmail(value);
                        setTeamEmailError(null);
                      }}
                      onKeyPress={handleTeamEmailKeyPress}
                    />
                    <TamaguiButton
                      type="button"
                      onPress={handleAddTeamEmail}
                      alignItems="center"
                      justifyContent="center"
                      paddingHorizontal="$4"
                      paddingVertical="$3"
                      backgroundColor="$blue3"
                      color="$blue9"
                      borderRadius="$4"
                      hoverStyle={{ backgroundColor: "$blue4" }}
                    >
                      <Plus size={20} />
                    </TamaguiButton>
                  </XStack>
                  {teamEmailError && (
                    <Text color="$red9" fontSize="$3" marginTop="$1">{teamEmailError}</Text>
                  )}
                </YStack>

                {/* List of added team members */}
                {teamEmails.length > 0 && (
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Pending Invitations ({teamEmails.length})
                    </Text>
                    <YStack gap="$2">
                      {teamEmails.map((email) => (
                        <XStack
                          key={email}
                          alignItems="center"
                          justifyContent="space-between"
                          backgroundColor="$gray2"
                          borderWidth={1}
                          borderColor="$borderColor"
                          borderRadius="$4"
                          paddingHorizontal="$4"
                          paddingVertical="$2"
                        >
                          <XStack alignItems="center" gap="$2">
                            <Mail size={16} color="$color11" />
                            <Text fontSize="$3" color="$color12">{email}</Text>
                          </XStack>
                          <TamaguiButton
                            type="button"
                            onPress={() => handleRemoveTeamEmail(email)}
                            variant="ghost"
                            color="$red9"
                            hoverStyle={{ color: "$red10" }}
                          >
                            <Trash2 size={18} />
                          </TamaguiButton>
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>
                )}
              </YStack>
            </YStack>

            <TamaguiButton
              type="submit"
              disabled={!isValid || isSubmitting}
              width="100%"
              alignItems="center"
              justifyContent="center"
              gap="$2"
              backgroundColor="$blue9"
              color="white"
              paddingHorizontal="$6"
              paddingVertical="$3"
              borderRadius="$4"
              hoverStyle={{ backgroundColor: "$blue10" }}
              opacity={!isValid || isSubmitting ? 0.5 : 1}
              cursor={!isValid || isSubmitting ? "not-allowed" : "pointer"}
              fontWeight="500"
              onPress={(e) => {
                e?.preventDefault?.();
                handleSubmit(e as any);
              }}
            >
              <Text>Continue to Dashboard</Text>
              <ArrowRight size={18} />
            </TamaguiButton>
          </YStack>
        </Card>
      </YStack>
    </YStack>
  );
}
