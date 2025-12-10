import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, X } from 'lucide-react';
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
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={handleSkip}
          disabled={isSubmitting}
          className="absolute top-6 right-6 text-text-secondary hover:text-text-primary transition-colors flex items-center space-x-2 text-sm disabled:opacity-50"
        >
          <span>Skip for now</span>
          <X size={18} />
        </button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <ForsuredLogo className="h-8" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Welcome, General Contractor
          </h1>
          <p className="text-text-secondary">Let's get your company set up</p>
        </div>

        <div className="bg-surface rounded-lg shadow-lg border border-border p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mx-auto mb-6">
            <Building className="text-primary-600" size={32} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Company Name
              </label>
              <input
                type="text"
                required
                className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Company Size
              </label>
              <select
                required
                className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.companySize}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    companySize: e.target.value,
                  }))
                }
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201+">201+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Primary Location
              </label>
              <input
                type="text"
                required
                className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="City, State"
                value={formData.primaryLocation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    primaryLocation: e.target.value,
                  }))
                }
              />
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
