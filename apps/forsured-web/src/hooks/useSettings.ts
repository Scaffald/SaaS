// src/hooks/useSettings.ts
// REQ-126: Settings management with database integration
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { forsured } from '../lib/supabase';

// Types matching database schema
export interface UserSettings {
  id: string;
  user_id: string;
  notification_preferences: Record<string, boolean>;
  ui_preferences: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface GCSettings {
  id: string;
  organization_id: string;
  default_insurance_requirements: Record<string, unknown>;
  require_additional_insured: boolean;
  require_waiver_of_subrogation: boolean;
  auto_send_reminders: boolean;
  reminder_days_before: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContractorSettings {
  id: string;
  organization_id: string;
  auto_share_documents: boolean;
  insurance_agent_info: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface BrokerSettings {
  id: string;
  broker_id: string;
  agency_info: Record<string, unknown>;
  auto_assign_clients: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SettingsState {
  userSettings: UserSettings | null;
  gcSettings: GCSettings | null;
  contractorSettings: ContractorSettings | null;
  brokerSettings: BrokerSettings | null;
  isLoading: boolean;
  error: Error | null;
  isSaving: boolean;
}

const initialState: SettingsState = {
  userSettings: null,
  gcSettings: null,
  contractorSettings: null,
  brokerSettings: null,
  isLoading: true,
  error: null,
  isSaving: false,
};

export function useSettings() {
  const { profile, user, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SettingsState>(initialState);

  const fetchSettings = useCallback(async () => {
    if (authLoading || !profile) {
      return;
    }

    setSettings(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const fetchedSettings: SettingsState = {
        ...initialState,
        isLoading: false,
      };

      // Fetch user settings (common to all user types)
      const { data: userSettingsData, error: userSettingsError } = await forsured('user_settings')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (userSettingsError) {
        console.error('[useSettings] Error fetching user settings:', userSettingsError);
      } else if (userSettingsData) {
        fetchedSettings.userSettings = userSettingsData as UserSettings;
      }

      // Fetch type-specific settings
      const userType = profile.user_type;

      if (userType === 'gc' && user?.organization_id) {
        const { data: gcData, error: gcError } = await forsured('gc_settings')
          .select('*')
          .eq('organization_id', user.organization_id)
          .maybeSingle();

        if (gcError) {
          console.error('[useSettings] Error fetching GC settings:', gcError);
        } else if (gcData) {
          fetchedSettings.gcSettings = gcData as GCSettings;
        }
      } else if (userType === 'contractor' && user?.organization_id) {
        const { data: contractorData, error: contractorError } = await forsured('contractor_settings')
          .select('*')
          .eq('organization_id', user.organization_id)
          .maybeSingle();

        if (contractorError) {
          console.error('[useSettings] Error fetching contractor settings:', contractorError);
        } else if (contractorData) {
          fetchedSettings.contractorSettings = contractorData as ContractorSettings;
        }
      } else if (userType === 'broker') {
        const { data: brokerData, error: brokerError } = await forsured('broker_settings')
          .select('*')
          .eq('broker_id', profile.id)
          .maybeSingle();

        if (brokerError) {
          console.error('[useSettings] Error fetching broker settings:', brokerError);
        } else if (brokerData) {
          fetchedSettings.brokerSettings = brokerData as BrokerSettings;
        }
      }

      setSettings(fetchedSettings);
    } catch (err) {
      console.error('[useSettings] Unexpected error:', err);
      setSettings(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to fetch settings'),
        isLoading: false,
      }));
    }
  }, [profile, user, authLoading]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Update user settings (notification/UI preferences)
   */
  const updateUserSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!profile) return;

    setSettings(prev => ({ ...prev, isSaving: true }));

    try {
      // Upsert user settings
      const { data, error } = await forsured('user_settings')
        .upsert({
          user_id: profile.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        userSettings: data as UserSettings,
        isSaving: false,
      }));

      return data;
    } catch (err) {
      console.error('[useSettings] Error updating user settings:', err);
      setSettings(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to update settings'),
        isSaving: false,
      }));
      throw err;
    }
  }, [profile]);

  /**
   * Update GC settings
   */
  const updateGCSettings = useCallback(async (updates: Partial<GCSettings>) => {
    if (!user?.organization_id) return;

    setSettings(prev => ({ ...prev, isSaving: true }));

    try {
      const { data, error } = await forsured('gc_settings')
        .upsert({
          organization_id: user.organization_id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        gcSettings: data as GCSettings,
        isSaving: false,
      }));

      return data;
    } catch (err) {
      console.error('[useSettings] Error updating GC settings:', err);
      setSettings(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to update settings'),
        isSaving: false,
      }));
      throw err;
    }
  }, [user]);

  /**
   * Update contractor settings
   */
  const updateContractorSettings = useCallback(async (updates: Partial<ContractorSettings>) => {
    if (!user?.organization_id) return;

    setSettings(prev => ({ ...prev, isSaving: true }));

    try {
      const { data, error } = await forsured('contractor_settings')
        .upsert({
          organization_id: user.organization_id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        contractorSettings: data as ContractorSettings,
        isSaving: false,
      }));

      return data;
    } catch (err) {
      console.error('[useSettings] Error updating contractor settings:', err);
      setSettings(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to update settings'),
        isSaving: false,
      }));
      throw err;
    }
  }, [user]);

  /**
   * Update broker settings
   */
  const updateBrokerSettings = useCallback(async (updates: Partial<BrokerSettings>) => {
    if (!profile) return;

    setSettings(prev => ({ ...prev, isSaving: true }));

    try {
      const { data, error } = await forsured('broker_settings')
        .upsert({
          broker_id: profile.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'broker_id' })
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        brokerSettings: data as BrokerSettings,
        isSaving: false,
      }));

      return data;
    } catch (err) {
      console.error('[useSettings] Error updating broker settings:', err);
      setSettings(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to update settings'),
        isSaving: false,
      }));
      throw err;
    }
  }, [profile]);

  /**
   * Refresh all settings from database
   */
  const refreshSettings = useCallback(() => {
    return fetchSettings();
  }, [fetchSettings]);

  return {
    ...settings,
    updateUserSettings,
    updateGCSettings,
    updateContractorSettings,
    updateBrokerSettings,
    refreshSettings,
  };
}
