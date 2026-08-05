export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      custom_oauth_providers: {
        Row: {
          acceptable_client_ids: string[]
          attribute_mapping: Json
          authorization_params: Json
          authorization_url: string | null
          cached_discovery: Json | null
          client_id: string
          client_secret: string
          created_at: string
          discovery_cached_at: string | null
          discovery_url: string | null
          email_optional: boolean
          enabled: boolean
          id: string
          identifier: string
          issuer: string | null
          jwks_uri: string | null
          name: string
          pkce_enabled: boolean
          provider_type: string
          scopes: string[]
          skip_nonce_check: boolean
          token_url: string | null
          updated_at: string
          userinfo_url: string | null
        }
        Insert: {
          acceptable_client_ids?: string[]
          attribute_mapping?: Json
          authorization_params?: Json
          authorization_url?: string | null
          cached_discovery?: Json | null
          client_id: string
          client_secret: string
          created_at?: string
          discovery_cached_at?: string | null
          discovery_url?: string | null
          email_optional?: boolean
          enabled?: boolean
          id?: string
          identifier: string
          issuer?: string | null
          jwks_uri?: string | null
          name: string
          pkce_enabled?: boolean
          provider_type: string
          scopes?: string[]
          skip_nonce_check?: boolean
          token_url?: string | null
          updated_at?: string
          userinfo_url?: string | null
        }
        Update: {
          acceptable_client_ids?: string[]
          attribute_mapping?: Json
          authorization_params?: Json
          authorization_url?: string | null
          cached_discovery?: Json | null
          client_id?: string
          client_secret?: string
          created_at?: string
          discovery_cached_at?: string | null
          discovery_url?: string | null
          email_optional?: boolean
          enabled?: boolean
          id?: string
          identifier?: string
          issuer?: string | null
          jwks_uri?: string | null
          name?: string
          pkce_enabled?: boolean
          provider_type?: string
          scopes?: string[]
          skip_nonce_check?: boolean
          token_url?: string | null
          updated_at?: string
          userinfo_url?: string | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string | null
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string | null
          email_optional: boolean
          id: string
          invite_token: string | null
          linking_target_id: string | null
          oauth_client_state_id: string | null
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          referrer: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id?: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          last_webauthn_challenge_data: Json | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          nonce?: string | null
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_client_states: {
        Row: {
          code_verifier: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Insert: {
          code_verifier?: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string
          id?: string
          provider_type?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method?: string
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          oauth_client_id: string | null
          refresh_token_counter: number | null
          refresh_token_hmac_key: string | null
          refreshed_at: string | null
          scopes: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          expires_at: string
          id: string
          session_data: Json
          user_id: string | null
        }
        Insert: {
          challenge_type: string
          created_at?: string
          expires_at: string
          id?: string
          session_data: Json
          user_id?: string | null
        }
        Update: {
          challenge_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_data?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_credentials: {
        Row: {
          aaguid: string | null
          attestation_type: string
          backed_up: boolean
          backup_eligible: boolean
          created_at: string
          credential_id: string
          friendly_name: string
          id: string
          last_used_at: string | null
          public_key: string
          sign_count: number
          transports: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          attestation_type?: string
          backed_up?: boolean
          backup_eligible?: boolean
          created_at?: string
          credential_id: string
          friendly_name?: string
          id?: string
          last_used_at?: string | null
          public_key: string
          sign_count?: number
          transports?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          aaguid?: string | null
          attestation_type?: string
          backed_up?: boolean
          backup_eligible?: boolean
          created_at?: string
          credential_id?: string
          friendly_name?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          sign_count?: number
          transports?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: { Args: never; Returns: string }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      uid: { Args: never; Returns: string }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  community: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          is_pinned: boolean
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          industry_id: string | null
          is_active: boolean
          member_count: number
          name: string
          post_count: number
          slug: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          member_count?: number
          name: string
          post_count?: number
          slug: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          member_count?: number
          name?: string
          post_count?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      karma_gifts: {
        Row: {
          amount: number
          created_at: string
          giver_id: string
          id: string
          message: string | null
          receiver_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          giver_id: string
          id?: string
          message?: string | null
          receiver_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          giver_id?: string
          id?: string
          message?: string | null
          receiver_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          community_id: string
          id: string
          is_verified: boolean
          joined_at: string
          user_id: string
          verification_data: Json
        }
        Insert: {
          community_id: string
          id?: string
          is_verified?: boolean
          joined_at?: string
          user_id: string
          verification_data?: Json
        }
        Update: {
          community_id?: string
          id?: string
          is_verified?: boolean
          joined_at?: string
          user_id?: string
          verification_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      post_ratings: {
        Row: {
          base_rating: number
          created_at: string
          creativity_rating: number | null
          id: string
          post_id: string
          quality_rating: number | null
          rater_id: string
          technique_rating: number | null
          updated_at: string
        }
        Insert: {
          base_rating: number
          created_at?: string
          creativity_rating?: number | null
          id?: string
          post_id: string
          quality_rating?: number | null
          rater_id: string
          technique_rating?: number | null
          updated_at?: string
        }
        Update: {
          base_rating?: number
          created_at?: string
          creativity_rating?: number | null
          id?: string
          post_id?: string
          quality_rating?: number | null
          rater_id?: string
          technique_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_feedback_summary: string | null
          ai_summary_updated_at: string | null
          author_id: string
          body: string | null
          comment_count: number
          community_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_published: boolean
          media_thumbnails: string[]
          media_urls: string[]
          moderation_metadata: Json | null
          moderation_result:
            | Database["community"]["Enums"]["moderation_result"]
            | null
          post_type: Database["community"]["Enums"]["post_type"]
          published_at: string | null
          rating_avg: number | null
          rating_count: number
          skill_tags: string[]
          status: Database["community"]["Enums"]["post_status"]
          title: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          ai_feedback_summary?: string | null
          ai_summary_updated_at?: string | null
          author_id: string
          body?: string | null
          comment_count?: number
          community_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          media_thumbnails?: string[]
          media_urls?: string[]
          moderation_metadata?: Json | null
          moderation_result?:
            | Database["community"]["Enums"]["moderation_result"]
            | null
          post_type: Database["community"]["Enums"]["post_type"]
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          skill_tags?: string[]
          status?: Database["community"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          ai_feedback_summary?: string | null
          ai_summary_updated_at?: string | null
          author_id?: string
          body?: string | null
          comment_count?: number
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          media_thumbnails?: string[]
          media_urls?: string[]
          moderation_metadata?: Json | null
          moderation_result?:
            | Database["community"]["Enums"]["moderation_result"]
            | null
          post_type?: Database["community"]["Enums"]["post_type"]
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          skill_tags?: string[]
          status?: Database["community"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_events: {
        Row: {
          action: Database["community"]["Enums"]["reputation_action"]
          created_at: string
          delta: number
          id: string
          reason: string | null
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          action: Database["community"]["Enums"]["reputation_action"]
          created_at?: string
          delta: number
          id?: string
          reason?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          action?: Database["community"]["Enums"]["reputation_action"]
          created_at?: string
          delta?: number
          id?: string
          reason?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scaffold_scores: {
        Row: {
          karma_bank: number
          score: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          karma_bank?: number
          score?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          karma_bank?: number
          score?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_taxonomy: {
        Row: {
          community_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          tier: number
          tsv: unknown
          updated_at: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          tier: number
          tsv?: unknown
          updated_at?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          tier?: number
          tsv?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_taxonomy_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_taxonomy_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "skill_taxonomy"
            referencedColumns: ["id"]
          },
        ]
      }
      upvotes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_skill_ancestors: { Args: { p_skill_id: string }; Returns: string[] }
      gift_karma: {
        Args: {
          p_amount: number
          p_giver_id: string
          p_message?: string
          p_receiver_id: string
        }
        Returns: boolean
      }
      search_skill_taxonomy: {
        Args: { p_community_id?: string; p_limit?: number; p_query: string }
        Returns: {
          community_id: string
          id: string
          name: string
          parent_chain: Json
          parent_id: string
          rank: number
          slug: string
          tier: number
        }[]
      }
      update_scaffold_score: {
        Args: {
          p_action: Database["community"]["Enums"]["reputation_action"]
          p_delta: number
          p_reason?: string
          p_source_id?: string
          p_source_type?: string
          p_user_id: string
        }
        Returns: {
          karma_bank: number
          score: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "scaffold_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      moderation_result:
        | "approved"
        | "rejected_off_topic"
        | "rejected_spam"
        | "rejected_non_trade"
        | "rejected_inappropriate"
        | "manual_review"
      post_status:
        | "draft"
        | "pending_moderation"
        | "published"
        | "flagged"
        | "removed"
      post_type: "advice" | "critique" | "showcase"
      reputation_action:
        | "post_published"
        | "post_published_full_taxonomy"
        | "comment_created"
        | "rating_given_base"
        | "rating_given_detailed"
        | "rating_received"
        | "upvote_received"
        | "karma_gifted"
        | "karma_received"
        | "post_unpublished"
        | "post_deleted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  core: {
    Tables: {
      account_credits: {
        Row: {
          balance_cents: number
          created_at: string
          currency: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_credits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      account_deletions: {
        Row: {
          completed_at: string | null
          compliance_log: Json
          created_at: string
          deleted_organization_id: string | null
          deleted_user_id: string | null
          deletion_type: string
          error_message: string | null
          id: string
          metadata: Json
          payment_data_anonymized: boolean
          payment_data_anonymized_at: string | null
          reason: string | null
          requested_at: string
          requested_by_user_id: string | null
          status: string
          stripe_cleanup_errors: string[] | null
          stripe_customer_deleted: boolean
          stripe_customer_deleted_at: string | null
          stripe_payment_methods_deleted: boolean
          stripe_payment_methods_deleted_at: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          compliance_log?: Json
          created_at?: string
          deleted_organization_id?: string | null
          deleted_user_id?: string | null
          deletion_type: string
          error_message?: string | null
          id?: string
          metadata?: Json
          payment_data_anonymized?: boolean
          payment_data_anonymized_at?: string | null
          reason?: string | null
          requested_at?: string
          requested_by_user_id?: string | null
          status?: string
          stripe_cleanup_errors?: string[] | null
          stripe_customer_deleted?: boolean
          stripe_customer_deleted_at?: string | null
          stripe_payment_methods_deleted?: boolean
          stripe_payment_methods_deleted_at?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          compliance_log?: Json
          created_at?: string
          deleted_organization_id?: string | null
          deleted_user_id?: string | null
          deletion_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          payment_data_anonymized?: boolean
          payment_data_anonymized_at?: string | null
          reason?: string | null
          requested_at?: string
          requested_by_user_id?: string | null
          status?: string
          stripe_cleanup_errors?: string[] | null
          stripe_customer_deleted?: boolean
          stripe_customer_deleted_at?: string | null
          stripe_payment_methods_deleted?: boolean
          stripe_payment_methods_deleted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_deletions_deleted_organization_id_fkey"
            columns: ["deleted_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address: Json
          created_at: string | null
          geo: unknown
          id: string
          metadata: Json | null
          property_type: Database["core"]["Enums"]["property_type"] | null
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          address: Json
          created_at?: string | null
          geo?: unknown
          id?: string
          metadata?: Json | null
          property_type?: Database["core"]["Enums"]["property_type"] | null
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json
          created_at?: string | null
          geo?: unknown
          id?: string
          metadata?: Json | null
          property_type?: Database["core"]["Enums"]["property_type"] | null
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key_usage: {
        Row: {
          api_key_id: string
          endpoint: string
          id: string
          ip_address: unknown
          method: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          endpoint: string
          id?: string
          ip_address?: unknown
          method: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          endpoint?: string
          id?: string
          ip_address?: unknown
          method?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          rate_limit_tier: string | null
          scopes: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          rate_limit_tier?: string | null
          scopes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          rate_limit_tier?: string | null
          scopes?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_activity: {
        Row: {
          actor_user_id: string | null
          application_id: string
          created_at: string
          details: Json | null
          event_type: string
          id: string
          organization_id: string
        }
        Insert: {
          actor_user_id?: string | null
          application_id: string
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          organization_id: string
        }
        Update: {
          actor_user_id?: string | null
          application_id?: string
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_assignment_history: {
        Row: {
          application_id: string
          assigned_at: string
          assigned_by: string | null
          assigned_to: string | null
          id: string
          metadata: Json
          source: string
          team_id: string
        }
        Insert: {
          application_id: string
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          id?: string
          metadata?: Json
          source?: string
          team_id: string
        }
        Update: {
          application_id?: string
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          id?: string
          metadata?: Json
          source?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_assignment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assignment_history_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assignment_history_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assignment_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      application_inquiries: {
        Row: {
          additional_notes: string | null
          application_id: string
          created_at: string
          created_by: string | null
          employment_dates_negotiable: boolean | null
          employment_end_date: string | null
          employment_start_date: string | null
          employment_type: string | null
          employment_type_negotiable: boolean | null
          endurance_required: boolean | null
          has_drivers_license: boolean | null
          id: string
          rate_max_cents: number | null
          rate_min_cents: number | null
          rate_negotiable: boolean | null
          rate_type: string | null
          schedule_shifts: boolean | null
          sent_at: string | null
          status: string | null
          terms: Json | null
          travel_distance_miles: number | null
          updated_at: string
          willing_to_travel: boolean | null
          willing_to_work_overtime: boolean | null
          work_schedule: string | null
          work_schedule_negotiable: boolean | null
          workdays: string[] | null
          workdays_negotiable: boolean | null
          working_hours_end: string | null
          working_hours_negotiable: boolean | null
          working_hours_start: string | null
          working_hours_timezone: string | null
        }
        Insert: {
          additional_notes?: string | null
          application_id: string
          created_at?: string
          created_by?: string | null
          employment_dates_negotiable?: boolean | null
          employment_end_date?: string | null
          employment_start_date?: string | null
          employment_type?: string | null
          employment_type_negotiable?: boolean | null
          endurance_required?: boolean | null
          has_drivers_license?: boolean | null
          id?: string
          rate_max_cents?: number | null
          rate_min_cents?: number | null
          rate_negotiable?: boolean | null
          rate_type?: string | null
          schedule_shifts?: boolean | null
          sent_at?: string | null
          status?: string | null
          terms?: Json | null
          travel_distance_miles?: number | null
          updated_at?: string
          willing_to_travel?: boolean | null
          willing_to_work_overtime?: boolean | null
          work_schedule?: string | null
          work_schedule_negotiable?: boolean | null
          workdays?: string[] | null
          workdays_negotiable?: boolean | null
          working_hours_end?: string | null
          working_hours_negotiable?: boolean | null
          working_hours_start?: string | null
          working_hours_timezone?: string | null
        }
        Update: {
          additional_notes?: string | null
          application_id?: string
          created_at?: string
          created_by?: string | null
          employment_dates_negotiable?: boolean | null
          employment_end_date?: string | null
          employment_start_date?: string | null
          employment_type?: string | null
          employment_type_negotiable?: boolean | null
          endurance_required?: boolean | null
          has_drivers_license?: boolean | null
          id?: string
          rate_max_cents?: number | null
          rate_min_cents?: number | null
          rate_negotiable?: boolean | null
          rate_type?: string | null
          schedule_shifts?: boolean | null
          sent_at?: string | null
          status?: string | null
          terms?: Json | null
          travel_distance_miles?: number | null
          updated_at?: string
          willing_to_travel?: boolean | null
          willing_to_work_overtime?: boolean | null
          work_schedule?: string | null
          work_schedule_negotiable?: boolean | null
          workdays?: string[] | null
          workdays_negotiable?: boolean | null
          working_hours_end?: string | null
          working_hours_negotiable?: boolean | null
          working_hours_start?: string | null
          working_hours_timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_inquiries_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_messages: {
        Row: {
          application_id: string
          author_user_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          author_user_id: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_messages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_messages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          answers: Json | null
          archived_at: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          attachment_metadata: Json | null
          completed_steps: string[] | null
          cover_letter_url: string | null
          created_at: string
          current_step: string | null
          id: string
          is_shortlisted: boolean | null
          job_id: string
          reject_meta: Json | null
          reject_reasons: string[] | null
          rejected_at: string | null
          resume_url: string | null
          score_breakdown: Json | null
          score_calculated_at: string | null
          score_total: number | null
          screening_answers: Json | null
          source: string | null
          stage_changed_at: string | null
          status: string
          union_status: Json | null
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          answers?: Json | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachment_metadata?: Json | null
          completed_steps?: string[] | null
          cover_letter_url?: string | null
          created_at?: string
          current_step?: string | null
          id?: string
          is_shortlisted?: boolean | null
          job_id: string
          reject_meta?: Json | null
          reject_reasons?: string[] | null
          rejected_at?: string | null
          resume_url?: string | null
          score_breakdown?: Json | null
          score_calculated_at?: string | null
          score_total?: number | null
          screening_answers?: Json | null
          source?: string | null
          stage_changed_at?: string | null
          status?: string
          union_status?: Json | null
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          answers?: Json | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          attachment_metadata?: Json | null
          completed_steps?: string[] | null
          cover_letter_url?: string | null
          created_at?: string
          current_step?: string | null
          id?: string
          is_shortlisted?: boolean | null
          job_id?: string
          reject_meta?: Json | null
          reject_reasons?: string[] | null
          rejected_at?: string | null
          resume_url?: string | null
          score_breakdown?: Json | null
          score_calculated_at?: string | null
          score_total?: number | null
          screening_answers?: Json | null
          source?: string | null
          stage_changed_at?: string | null
          status?: string
          union_status?: Json | null
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      archetypes: {
        Row: {
          created_at: string | null
          description: string
          growth_areas: string[]
          id: string
          mapping_rules: Json
          name: string
          strengths: string[]
          team_dynamics: string
          work_styles: string
        }
        Insert: {
          created_at?: string | null
          description: string
          growth_areas: string[]
          id?: string
          mapping_rules: Json
          name: string
          strengths: string[]
          team_dynamics: string
          work_styles: string
        }
        Update: {
          created_at?: string | null
          description?: string
          growth_areas?: string[]
          id?: string
          mapping_rules?: Json
          name?: string
          strengths?: string[]
          team_dynamics?: string
          work_styles?: string
        }
        Relationships: []
      }
      archived_external_jobs: {
        Row: {
          archived_at: string
          external_job_id: string
          feed_id: string
          id: string
          payload: Json
          retention_days: number
        }
        Insert: {
          archived_at?: string
          external_job_id: string
          feed_id: string
          id?: string
          payload: Json
          retention_days: number
        }
        Update: {
          archived_at?: string
          external_job_id?: string
          feed_id?: string
          id?: string
          payload?: Json
          retention_days?: number
        }
        Relationships: []
      }
      archived_notifications: {
        Row: {
          archived_at: string
          id: string
          notification_id: string
          payload: Json
          user_id: string
        }
        Insert: {
          archived_at?: string
          id?: string
          notification_id: string
          payload: Json
          user_id: string
        }
        Update: {
          archived_at?: string
          id?: string
          notification_id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      assessment_sessions: {
        Row: {
          assessment_type: string
          completed_at: string | null
          created_at: string | null
          id: string
          next_available_at: string | null
          session_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_type: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          next_available_at?: string | null
          session_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          next_available_at?: string | null
          session_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_access: {
        Row: {
          accessed_by_user_id: string
          background_check_id: string
          created_at: string
          id: string
          organization_id: string
          paid_at: string | null
          payment_intent_id: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          accessed_by_user_id: string
          background_check_id: string
          created_at?: string
          id?: string
          organization_id: string
          paid_at?: string | null
          payment_intent_id: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          accessed_by_user_id?: string
          background_check_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          payment_intent_id?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_check_access_accessed_by_user_id_fkey"
            columns: ["accessed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_access_accessed_by_user_id_fkey"
            columns: ["accessed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_access_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_access_log: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_by_user_id: string
          accessed_fields: string[]
          background_check_id: string
          id: string
          ip_address: unknown
          metadata: Json
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_by_user_id: string
          accessed_fields?: string[]
          background_check_id: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_by_user_id?: string
          accessed_fields?: string[]
          background_check_id?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_check_access_log_accessed_by_user_id_fkey"
            columns: ["accessed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_access_log_accessed_by_user_id_fkey"
            columns: ["accessed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_access_log_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_addons: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          metadata: Json
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      background_check_consent: {
        Row: {
          background_check_id: string
          consent_text: string
          consent_version: string
          consented_at: string
          id: string
          ip_address: unknown
          metadata: Json
          user_agent: string | null
          worker_user_id: string | null
        }
        Insert: {
          background_check_id: string
          consent_text: string
          consent_version: string
          consented_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
          worker_user_id?: string | null
        }
        Update: {
          background_check_id?: string
          consent_text?: string
          consent_version?: string
          consented_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
          worker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_check_consent_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_consent_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_consent_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_disclosures: {
        Row: {
          acknowledged_at: string | null
          background_check_id: string
          delivery_method: string | null
          disclosure_type: string
          id: string
          metadata: Json
          sent_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          background_check_id: string
          delivery_method?: string | null
          disclosure_type: string
          id?: string
          metadata?: Json
          sent_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          background_check_id?: string
          delivery_method?: string | null
          disclosure_type?: string
          id?: string
          metadata?: Json
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_check_disclosures_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_disputes: {
        Row: {
          background_check_id: string
          created_at: string
          dispute_details: string | null
          dispute_reason: string
          id: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          status: Database["core"]["Enums"]["background_check_dispute_status"]
          supporting_documents: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          background_check_id: string
          created_at?: string
          dispute_details?: string | null
          dispute_reason: string
          id?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          status?: Database["core"]["Enums"]["background_check_dispute_status"]
          supporting_documents?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          background_check_id?: string
          created_at?: string
          dispute_details?: string | null
          dispute_reason?: string
          id?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          status?: Database["core"]["Enums"]["background_check_dispute_status"]
          supporting_documents?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_check_disputes_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_disputes_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_disputes_resolved_by_user_id_fkey"
            columns: ["resolved_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_disputes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_disputes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_documents: {
        Row: {
          background_check_id: string
          created_at: string
          delete_after: string | null
          deleted_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          metadata: Json
          mime_type: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by_user_id: string | null
          verified: boolean
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          background_check_id: string
          created_at?: string
          delete_after?: string | null
          deleted_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          background_check_id?: string
          created_at?: string
          delete_after?: string | null
          deleted_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_check_documents_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_documents_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_check_documents_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_events: {
        Row: {
          check_id: string | null
          event_data: Json
          event_type: string
          id: string
          metadata: Json | null
          processed: boolean
          processed_at: string | null
          provider_id: string
          received_at: string
        }
        Insert: {
          check_id?: string | null
          event_data?: Json
          event_type: string
          id?: string
          metadata?: Json | null
          processed?: boolean
          processed_at?: string | null
          provider_id: string
          received_at?: string
        }
        Update: {
          check_id?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          metadata?: Json | null
          processed?: boolean
          processed_at?: string | null
          provider_id?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_check_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "background_check_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      background_check_packages: {
        Row: {
          check_type_ids: string[]
          component_overrides: Json
          created_at: string
          description: string | null
          display_name: string
          estimated_completion_days: number | null
          id: string
          is_active: boolean
          metadata: Json
          platform_cost_cents: number
          provider_package_code: string | null
          retail_cost_cents: number
          slug: string
          updated_at: string
        }
        Insert: {
          check_type_ids?: string[]
          component_overrides?: Json
          created_at?: string
          description?: string | null
          display_name: string
          estimated_completion_days?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          platform_cost_cents: number
          provider_package_code?: string | null
          retail_cost_cents: number
          slug: string
          updated_at?: string
        }
        Update: {
          check_type_ids?: string[]
          component_overrides?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          estimated_completion_days?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          platform_cost_cents?: number
          provider_package_code?: string | null
          retail_cost_cents?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      background_check_providers: {
        Row: {
          api_key_encrypted: string | null
          created_at: string
          created_by: string | null
          default_package: string | null
          display_name: string | null
          id: string
          is_active: boolean
          is_default: boolean
          metadata: Json | null
          organization_id: string
          provider: string
          supported_packages: string[] | null
          updated_at: string
          webhook_secret_encrypted: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string
          created_by?: string | null
          default_package?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          organization_id: string
          provider: string
          supported_packages?: string[] | null
          updated_at?: string
          webhook_secret_encrypted?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string
          created_by?: string | null
          default_package?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          organization_id?: string
          provider?: string
          supported_packages?: string[] | null
          updated_at?: string
          webhook_secret_encrypted?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      background_check_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_name: string
          estimated_completion_days: number | null
          id: string
          metadata: Json
          platform_cost_cents: number
          provider_check_code: string | null
          provider_configuration: Json
          required_documents: Json
          retail_cost_cents: number | null
          slug: string
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          estimated_completion_days?: number | null
          id?: string
          metadata?: Json
          platform_cost_cents: number
          provider_check_code?: string | null
          provider_configuration?: Json
          required_documents?: Json
          retail_cost_cents?: number | null
          slug: string
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          estimated_completion_days?: number | null
          id?: string
          metadata?: Json
          platform_cost_cents?: number
          provider_check_code?: string | null
          provider_configuration?: Json
          required_documents?: Json
          retail_cost_cents?: number | null
          slug?: string
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: []
      }
      background_checks: {
        Row: {
          add_on_ids: string[] | null
          add_ons_price_cents: number | null
          adverse_action_sent_at: string | null
          base_price_cents: number | null
          cancelled_at: string | null
          cancelled_reason: string | null
          check_type_ids: string[]
          completed_at: string | null
          component_statuses: Json
          consent_given_at: string | null
          consent_ip_address: unknown
          consent_signature: string | null
          consent_user_agent: string | null
          cost_cents: number | null
          created_at: string
          custom_configuration: Json
          disclosure_provided_at: string | null
          estimated_completion_date: string | null
          expires_at: string | null
          findings: Json | null
          id: string
          initiated_by: string
          invited_at: string | null
          is_public: boolean
          job_id: string | null
          last_webhook_event_at: string | null
          nationsearch_request_id: string | null
          nationsearch_status: string | null
          notes: string | null
          organization_id: string | null
          package_id: string | null
          paid_at: string | null
          paid_by: Database["core"]["Enums"]["background_check_paid_by"] | null
          payment_id: string | null
          payment_intent_id: string | null
          pre_adverse_action_sent_at: string | null
          processing_started_at: string | null
          provider_check_id: string | null
          provider_reference: Json | null
          requested_by_user_id: string | null
          responded_at: string | null
          results_data_encrypted: string | null
          results_data_encryption_version: number | null
          results_received_at: string | null
          shared_with_org_ids: string[] | null
          status: Database["core"]["Enums"]["background_check_status"]
          status_history: Json
          submitted_at: string | null
          summary: string | null
          summary_of_rights_provided_at: string | null
          tier: string | null
          total_price_cents: number | null
          updated_at: string
          user_id: string | null
          webhook_delivery_attempts: number
        }
        Insert: {
          add_on_ids?: string[] | null
          add_ons_price_cents?: number | null
          adverse_action_sent_at?: string | null
          base_price_cents?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          check_type_ids?: string[]
          completed_at?: string | null
          component_statuses?: Json
          consent_given_at?: string | null
          consent_ip_address?: unknown
          consent_signature?: string | null
          consent_user_agent?: string | null
          cost_cents?: number | null
          created_at?: string
          custom_configuration?: Json
          disclosure_provided_at?: string | null
          estimated_completion_date?: string | null
          expires_at?: string | null
          findings?: Json | null
          id?: string
          initiated_by?: string
          invited_at?: string | null
          is_public?: boolean
          job_id?: string | null
          last_webhook_event_at?: string | null
          nationsearch_request_id?: string | null
          nationsearch_status?: string | null
          notes?: string | null
          organization_id?: string | null
          package_id?: string | null
          paid_at?: string | null
          paid_by?: Database["core"]["Enums"]["background_check_paid_by"] | null
          payment_id?: string | null
          payment_intent_id?: string | null
          pre_adverse_action_sent_at?: string | null
          processing_started_at?: string | null
          provider_check_id?: string | null
          provider_reference?: Json | null
          requested_by_user_id?: string | null
          responded_at?: string | null
          results_data_encrypted?: string | null
          results_data_encryption_version?: number | null
          results_received_at?: string | null
          shared_with_org_ids?: string[] | null
          status?: Database["core"]["Enums"]["background_check_status"]
          status_history?: Json
          submitted_at?: string | null
          summary?: string | null
          summary_of_rights_provided_at?: string | null
          tier?: string | null
          total_price_cents?: number | null
          updated_at?: string
          user_id?: string | null
          webhook_delivery_attempts?: number
        }
        Update: {
          add_on_ids?: string[] | null
          add_ons_price_cents?: number | null
          adverse_action_sent_at?: string | null
          base_price_cents?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          check_type_ids?: string[]
          completed_at?: string | null
          component_statuses?: Json
          consent_given_at?: string | null
          consent_ip_address?: unknown
          consent_signature?: string | null
          consent_user_agent?: string | null
          cost_cents?: number | null
          created_at?: string
          custom_configuration?: Json
          disclosure_provided_at?: string | null
          estimated_completion_date?: string | null
          expires_at?: string | null
          findings?: Json | null
          id?: string
          initiated_by?: string
          invited_at?: string | null
          is_public?: boolean
          job_id?: string | null
          last_webhook_event_at?: string | null
          nationsearch_request_id?: string | null
          nationsearch_status?: string | null
          notes?: string | null
          organization_id?: string | null
          package_id?: string | null
          paid_at?: string | null
          paid_by?: Database["core"]["Enums"]["background_check_paid_by"] | null
          payment_id?: string | null
          payment_intent_id?: string | null
          pre_adverse_action_sent_at?: string | null
          processing_started_at?: string | null
          provider_check_id?: string | null
          provider_reference?: Json | null
          requested_by_user_id?: string | null
          responded_at?: string | null
          results_data_encrypted?: string | null
          results_data_encryption_version?: number | null
          results_received_at?: string | null
          shared_with_org_ids?: string[] | null
          status?: Database["core"]["Enums"]["background_check_status"]
          status_history?: Json
          submitted_at?: string | null
          summary?: string | null
          summary_of_rights_provided_at?: string | null
          tier?: string | null
          total_price_cents?: number | null
          updated_at?: string
          user_id?: string | null
          webhook_delivery_attempts?: number
        }
        Relationships: [
          {
            foreignKeyName: "background_checks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_checks_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "background_check_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_checks_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_checks_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "background_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      cached_news_articles: {
        Row: {
          cached_at: string
          description: string | null
          feed_id: string
          guid: string
          id: string
          image_url: string | null
          industry_id: string | null
          link: string
          pub_date: string
          source_name: string
          title: string
        }
        Insert: {
          cached_at?: string
          description?: string | null
          feed_id: string
          guid: string
          id?: string
          image_url?: string | null
          industry_id?: string | null
          link: string
          pub_date: string
          source_name: string
          title: string
        }
        Update: {
          cached_at?: string
          description?: string | null
          feed_id?: string
          guid?: string
          id?: string
          image_url?: string | null
          industry_id?: string | null
          link?: string
          pub_date?: string
          source_name?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cached_news_articles_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "news_feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cached_news_articles_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "v_news_feed_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cached_news_articles_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token_encrypted: string | null
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          metadata: Json | null
          provider: string
          provider_account_id: string | null
          refresh_token_encrypted: string | null
          sync_enabled: boolean
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          metadata?: Json | null
          provider: string
          provider_account_id?: string | null
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_account_id?: string | null
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ccpa_export_downloads: {
        Row: {
          created_at: string
          download_count: number
          expires_at: string
          file_format: string
          file_size_bytes: number | null
          first_downloaded_at: string | null
          generated_at: string
          id: string
          last_downloaded_at: string | null
          max_downloads: number
          metadata: Json
          request_id: string
          s3_bucket: string
          s3_key: string
          signed_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          expires_at: string
          file_format?: string
          file_size_bytes?: number | null
          first_downloaded_at?: string | null
          generated_at?: string
          id?: string
          last_downloaded_at?: string | null
          max_downloads?: number
          metadata?: Json
          request_id: string
          s3_bucket: string
          s3_key: string
          signed_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          expires_at?: string
          file_format?: string
          file_size_bytes?: number | null
          first_downloaded_at?: string | null
          generated_at?: string
          id?: string
          last_downloaded_at?: string | null
          max_downloads?: number
          metadata?: Json
          request_id?: string
          s3_bucket?: string
          s3_key?: string
          signed_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ccpa_export_downloads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ccpa_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ccpa_oauth_app_registry: {
        Row: {
          app_id: string
          app_name: string
          created_at: string
          data_categories: Json
          id: string
          is_active: boolean
          last_verified_at: string | null
          registered_at: string
          updated_at: string
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          app_id: string
          app_name: string
          created_at?: string
          data_categories?: Json
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          registered_at?: string
          updated_at?: string
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          app_id?: string
          app_name?: string
          created_at?: string
          data_categories?: Json
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          registered_at?: string
          updated_at?: string
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      ccpa_opt_outs: {
        Row: {
          category: Database["core"]["Enums"]["ccpa_opt_out_category"]
          created_at: string
          id: string
          metadata: Json
          opted_out_at: string
          source: Database["core"]["Enums"]["ccpa_opt_out_source"]
          user_id: string
        }
        Insert: {
          category: Database["core"]["Enums"]["ccpa_opt_out_category"]
          created_at?: string
          id?: string
          metadata?: Json
          opted_out_at?: string
          source?: Database["core"]["Enums"]["ccpa_opt_out_source"]
          user_id: string
        }
        Update: {
          category?: Database["core"]["Enums"]["ccpa_opt_out_category"]
          created_at?: string
          id?: string
          metadata?: Json
          opted_out_at?: string
          source?: Database["core"]["Enums"]["ccpa_opt_out_source"]
          user_id?: string
        }
        Relationships: []
      }
      ccpa_request_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          metadata: Json
          notes: string | null
          request_id: string
          status: Database["core"]["Enums"]["ccpa_request_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          request_id: string
          status: Database["core"]["Enums"]["ccpa_request_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          request_id?: string
          status?: Database["core"]["Enums"]["ccpa_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ccpa_request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ccpa_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ccpa_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline_at: string
          denial_reason: string | null
          extended_deadline_at: string | null
          id: string
          metadata: Json
          request_type: Database["core"]["Enums"]["ccpa_request_type"]
          status: Database["core"]["Enums"]["ccpa_request_status"]
          submitted_at: string
          updated_at: string
          user_id: string
          verification_completed_at: string | null
          verification_method: Database["core"]["Enums"]["ccpa_verification_method"]
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline_at: string
          denial_reason?: string | null
          extended_deadline_at?: string | null
          id?: string
          metadata?: Json
          request_type: Database["core"]["Enums"]["ccpa_request_type"]
          status?: Database["core"]["Enums"]["ccpa_request_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
          verification_completed_at?: string | null
          verification_method?: Database["core"]["Enums"]["ccpa_verification_method"]
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline_at?: string
          denial_reason?: string | null
          extended_deadline_at?: string | null
          id?: string
          metadata?: Json
          request_type?: Database["core"]["Enums"]["ccpa_request_type"]
          status?: Database["core"]["Enums"]["ccpa_request_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
          verification_completed_at?: string | null
          verification_method?: Database["core"]["Enums"]["ccpa_verification_method"]
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          issuing_organization: string | null
          metadata: Json | null
          name: string
          renewal_period_months: number | null
          requires_renewal: boolean | null
          slug: string
          typical_duration_days: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          issuing_organization?: string | null
          metadata?: Json | null
          name: string
          renewal_period_months?: number | null
          requires_renewal?: boolean | null
          slug: string
          typical_duration_days?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          issuing_organization?: string | null
          metadata?: Json | null
          name?: string
          renewal_period_months?: number | null
          requires_renewal?: boolean | null
          slug?: string
          typical_duration_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      circumvention_reports: {
        Row: {
          created_at: string
          description: string
          evidence_notes: string | null
          evidence_urls: string[] | null
          hire_agreement_id: string | null
          id: string
          metadata: Json
          organization_id: string | null
          reported_by_user_id: string | null
          resolution_action: string | null
          resolved_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          updated_at: string
          violation_type: string
          worker_user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          evidence_notes?: string | null
          evidence_urls?: string[] | null
          hire_agreement_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          reported_by_user_id?: string | null
          resolution_action?: string | null
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
          violation_type: string
          worker_user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          evidence_notes?: string | null
          evidence_urls?: string[] | null
          hire_agreement_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          reported_by_user_id?: string | null
          resolution_action?: string | null
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
          violation_type?: string
          worker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circumvention_reports_hire_agreement_id_fkey"
            columns: ["hire_agreement_id"]
            isOneToOne: false
            referencedRelation: "hire_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circumvention_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circumvention_reports_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circumvention_reports_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_storage_tokens: {
        Row: {
          access_token_encrypted: string
          created_at: string
          id: string
          is_valid: boolean
          last_error: string | null
          last_used_at: string | null
          provider: string
          provider_email: string | null
          provider_user_id: string | null
          refresh_token_encrypted: string | null
          scopes: string[]
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          id?: string
          is_valid?: boolean
          last_error?: string | null
          last_used_at?: string | null
          provider: string
          provider_email?: string | null
          provider_user_id?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[]
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          id?: string
          is_valid?: boolean
          last_error?: string | null
          last_used_at?: string | null
          provider?: string
          provider_email?: string | null
          provider_user_id?: string | null
          refresh_token_encrypted?: string | null
          scopes?: string[]
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_storage_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_storage_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          addressee_type: string | null
          addressee_user_id: string
          created_at: string
          decided_at: string | null
          id: string
          requester_type: string | null
          requester_user_id: string
          status: string
        }
        Insert: {
          addressee_type?: string | null
          addressee_user_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          requester_type?: string | null
          requester_user_id: string
          status?: string
        }
        Update: {
          addressee_type?: string | null
          addressee_user_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          requester_type?: string | null
          requester_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_user_id_fkey"
            columns: ["addressee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_addressee_user_id_fkey"
            columns: ["addressee_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_projects: {
        Row: {
          archived: boolean
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          location: Json | null
          metadata: Json
          name: string
          organization_id: string
          project_number: string | null
          status: string | null
          updated_at: string
          work_log_entry_type_override: string | null
          work_log_require_approval_to_move_override: boolean | null
          work_log_require_verification_override: boolean | null
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          location?: Json | null
          metadata?: Json
          name: string
          organization_id: string
          project_number?: string | null
          status?: string | null
          updated_at?: string
          work_log_entry_type_override?: string | null
          work_log_require_approval_to_move_override?: boolean | null
          work_log_require_verification_override?: boolean | null
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          location?: Json | null
          metadata?: Json
          name?: string
          organization_id?: string
          project_number?: string | null
          status?: string | null
          updated_at?: string
          work_log_entry_type_override?: string | null
          work_log_require_approval_to_move_override?: boolean | null
          work_log_require_verification_override?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          account_credit_id: string
          amount_cents: number
          background_check_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          direction: string
          id: string
          id_verification_id: string | null
          metadata: Json
          organization_id: string
          payment_transaction_id: string | null
          success_fee_id: string | null
          transaction_type: string
        }
        Insert: {
          account_credit_id: string
          amount_cents: number
          background_check_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          direction: string
          id?: string
          id_verification_id?: string | null
          metadata?: Json
          organization_id: string
          payment_transaction_id?: string | null
          success_fee_id?: string | null
          transaction_type: string
        }
        Update: {
          account_credit_id?: string
          amount_cents?: number
          background_check_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          direction?: string
          id?: string
          id_verification_id?: string | null
          metadata?: Json
          organization_id?: string
          payment_transaction_id?: string | null
          success_fee_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_account_credit_id_fkey"
            columns: ["account_credit_id"]
            isOneToOne: false
            referencedRelation: "account_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_id_verification_id_fkey"
            columns: ["id_verification_id"]
            isOneToOne: false
            referencedRelation: "id_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_id_verification_id_fkey"
            columns: ["id_verification_id"]
            isOneToOne: false
            referencedRelation: "v_id_verification_latest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_success_fee_id_fkey"
            columns: ["success_fee_id"]
            isOneToOne: false
            referencedRelation: "success_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      eeo_reports: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          organization_id: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          status: string | null
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          report_data?: Json
          report_type: string
          status?: string | null
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          status?: string | null
        }
        Relationships: []
      }
      eeo_self_identification: {
        Row: {
          application_id: string
          collected_at: string
          collection_method: string | null
          disability_status: string | null
          ethnicity: string | null
          form_version: string | null
          gender: string | null
          id: string
          metadata: Json | null
          user_id: string
          veteran_status: string | null
        }
        Insert: {
          application_id: string
          collected_at?: string
          collection_method?: string | null
          disability_status?: string | null
          ethnicity?: string | null
          form_version?: string | null
          gender?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
          veteran_status?: string | null
        }
        Update: {
          application_id?: string
          collected_at?: string
          collection_method?: string | null
          disability_status?: string | null
          ethnicity?: string | null
          form_version?: string | null
          gender?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
          veteran_status?: string | null
        }
        Relationships: []
      }
      external_job_feeds: {
        Row: {
          created_at: string | null
          error_count: number | null
          feed_type: string
          fetch_interval_hours: number | null
          id: string
          is_active: boolean | null
          last_cleanup_at: string | null
          last_error: string | null
          last_fetched_at: string | null
          last_success_at: string | null
          name: string
          parser_config: Json | null
          retention_days: number
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          feed_type: string
          fetch_interval_hours?: number | null
          id?: string
          is_active?: boolean | null
          last_cleanup_at?: string | null
          last_error?: string | null
          last_fetched_at?: string | null
          last_success_at?: string | null
          name: string
          parser_config?: Json | null
          retention_days?: number
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          feed_type?: string
          fetch_interval_hours?: number | null
          id?: string
          is_active?: boolean | null
          last_cleanup_at?: string | null
          last_error?: string | null
          last_fetched_at?: string | null
          last_success_at?: string | null
          name?: string
          parser_config?: Json | null
          retention_days?: number
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      external_job_industries: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          external_job_id: string
          industry_id: string
          mapped_by: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          external_job_id: string
          industry_id: string
          mapped_by?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          external_job_id?: string
          industry_id?: string
          mapped_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_job_industries_external_job_id_fkey"
            columns: ["external_job_id"]
            isOneToOne: false
            referencedRelation: "external_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_job_industries_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      external_job_skills: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          external_job_id: string
          extracted_by: string | null
          required_level: number | null
          skill_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          external_job_id: string
          extracted_by?: string | null
          required_level?: number | null
          skill_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          external_job_id?: string
          extracted_by?: string | null
          required_level?: number | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_job_skills_external_job_id_fkey"
            columns: ["external_job_id"]
            isOneToOne: false
            referencedRelation: "external_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      external_jobs: {
        Row: {
          application_url: string | null
          archived_at: string | null
          benefits: string[] | null
          company_headquarters: string | null
          company_logo: string | null
          company_name: string | null
          company_website: string | null
          compensation_currency: string | null
          compensation_max: number | null
          compensation_min: number | null
          compensation_period: string | null
          content_hash: string | null
          created_at: string | null
          description: string | null
          expires_date: string | null
          external_guid: string
          external_url: string | null
          featured: boolean | null
          feed_id: string
          id: string
          is_active: boolean | null
          job_category: string | null
          job_location: string | null
          job_tags: string[] | null
          job_type: string | null
          last_processed_at: string | null
          posted_date: string | null
          raw_data: Json | null
          requirements: string[] | null
          responsibilities: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          application_url?: string | null
          archived_at?: string | null
          benefits?: string[] | null
          company_headquarters?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_website?: string | null
          compensation_currency?: string | null
          compensation_max?: number | null
          compensation_min?: number | null
          compensation_period?: string | null
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          expires_date?: string | null
          external_guid: string
          external_url?: string | null
          featured?: boolean | null
          feed_id: string
          id?: string
          is_active?: boolean | null
          job_category?: string | null
          job_location?: string | null
          job_tags?: string[] | null
          job_type?: string | null
          last_processed_at?: string | null
          posted_date?: string | null
          raw_data?: Json | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          application_url?: string | null
          archived_at?: string | null
          benefits?: string[] | null
          company_headquarters?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_website?: string | null
          compensation_currency?: string | null
          compensation_max?: number | null
          compensation_min?: number | null
          compensation_period?: string | null
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          expires_date?: string | null
          external_guid?: string
          external_url?: string | null
          featured?: boolean | null
          feed_id?: string
          id?: string
          is_active?: boolean | null
          job_category?: string | null
          job_location?: string | null
          job_tags?: string[] | null
          job_type?: string | null
          last_processed_at?: string | null
          posted_date?: string | null
          raw_data?: Json | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_jobs_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "external_job_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          followee_type: string
          follower_id: string
          follower_type: string
          id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          followee_type: string
          follower_id: string
          follower_type: string
          id?: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          followee_type?: string
          follower_id?: string
          follower_type?: string
          id?: string
        }
        Relationships: []
      }
      generic_invitations: {
        Row: {
          accepted_at: string | null
          constraint_blocked: boolean | null
          constraint_reason: string | null
          created_at: string | null
          decline_reason: string | null
          declined_at: string | null
          email_clicked_at: string | null
          email_opened_at: string | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          invitee_email: string
          invitee_name: string | null
          invitee_user_id: string | null
          inviter_id: string
          inviter_organization_id: string | null
          is_referral: boolean | null
          metadata: Json | null
          personal_message: string | null
          project_id: string | null
          referral_code: string | null
          rule_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          constraint_blocked?: boolean | null
          constraint_reason?: string | null
          created_at?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          email_clicked_at?: string | null
          email_opened_at?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email: string
          invitee_name?: string | null
          invitee_user_id?: string | null
          inviter_id: string
          inviter_organization_id?: string | null
          is_referral?: boolean | null
          metadata?: Json | null
          personal_message?: string | null
          project_id?: string | null
          referral_code?: string | null
          rule_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          constraint_blocked?: boolean | null
          constraint_reason?: string | null
          created_at?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          email_clicked_at?: string | null
          email_opened_at?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string
          invitee_name?: string | null
          invitee_user_id?: string | null
          inviter_id?: string
          inviter_organization_id?: string | null
          is_referral?: boolean | null
          metadata?: Json | null
          personal_message?: string | null
          project_id?: string | null
          referral_code?: string | null
          rule_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generic_invitations_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generic_invitations_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generic_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generic_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generic_invitations_inviter_organization_id_fkey"
            columns: ["inviter_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generic_invitations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "invitation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_agreements: {
        Row: {
          agreed_at: string
          agreed_by_user_id: string | null
          agreement_text: string
          agreement_version: string
          anti_circumvention_accepted: boolean
          application_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          status: string
          success_fee_id: string | null
          terms_accepted: boolean
          updated_at: string
          violated_at: string | null
          violation_reason: string | null
          worker_user_id: string
        }
        Insert: {
          agreed_at?: string
          agreed_by_user_id?: string | null
          agreement_text: string
          agreement_version?: string
          anti_circumvention_accepted?: boolean
          application_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          status?: string
          success_fee_id?: string | null
          terms_accepted?: boolean
          updated_at?: string
          violated_at?: string | null
          violation_reason?: string | null
          worker_user_id: string
        }
        Update: {
          agreed_at?: string
          agreed_by_user_id?: string | null
          agreement_text?: string
          agreement_version?: string
          anti_circumvention_accepted?: boolean
          application_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          status?: string
          success_fee_id?: string | null
          terms_accepted?: boolean
          updated_at?: string
          violated_at?: string | null
          violation_reason?: string | null
          worker_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_agreements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_agreements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_agreements_success_fee_id_fkey"
            columns: ["success_fee_id"]
            isOneToOne: false
            referencedRelation: "success_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_agreements_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_agreements_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_project_crew: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          notes: string | null
          project_id: string
          role_id: string | null
          start_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          project_id: string
          role_id?: string | null
          start_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          project_id?: string
          role_id?: string | null
          start_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_project_crew_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hiring_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_project_crew_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "hiring_project_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_project_roles: {
        Row: {
          count: number
          created_at: string
          filled: number
          id: string
          job_id: string | null
          pay_rate_max_cents: number | null
          pay_rate_min_cents: number | null
          pay_rate_type: string | null
          project_id: string
          required_certifications: string[] | null
          required_skills: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          filled?: number
          id?: string
          job_id?: string | null
          pay_rate_max_cents?: number | null
          pay_rate_min_cents?: number | null
          pay_rate_type?: string | null
          project_id: string
          required_certifications?: string[] | null
          required_skills?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          filled?: number
          id?: string
          job_id?: string | null
          pay_rate_max_cents?: number | null
          pay_rate_min_cents?: number | null
          pay_rate_type?: string | null
          project_id?: string
          required_certifications?: string[] | null
          required_skills?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "hiring_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_projects: {
        Row: {
          budget_cents: number | null
          budget_currency: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          filled_positions: number | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          organization_id: string
          start_date: string | null
          status: string
          total_positions: number | null
          updated_at: string
        }
        Insert: {
          budget_cents?: number | null
          budget_currency?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          filled_positions?: number | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          start_date?: string | null
          status?: string
          total_positions?: number | null
          updated_at?: string
        }
        Update: {
          budget_cents?: number | null
          budget_currency?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          filled_positions?: number | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: string
          total_positions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hris_connections: {
        Row: {
          api_key_encrypted: string | null
          client_id: string | null
          client_secret_encrypted: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          field_mappings: Json | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          metadata: Json | null
          organization_id: string
          provider: string
          sync_frequency: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          client_id?: string | null
          client_secret_encrypted?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          organization_id: string
          provider: string
          sync_frequency?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          client_id?: string | null
          client_secret_encrypted?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          field_mappings?: Json | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          metadata?: Json | null
          organization_id?: string
          provider?: string
          sync_frequency?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      hris_employee_mappings: {
        Row: {
          connection_id: string
          created_at: string
          external_employee_id: string
          id: string
          last_synced_at: string | null
          metadata: Json | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          external_employee_id: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          external_employee_id?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hris_employee_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "hris_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      hris_sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string
          error_details: Json | null
          id: string
          metadata: Json | null
          records_failed: number | null
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "hris_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "hris_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      id_verifications: {
        Row: {
          badge_expires_at: string | null
          badge_status: string
          created_at: string
          id: string
          initiated_by_org_id: string | null
          initiated_by_user_id: string | null
          metadata: Json
          paid_at: string
          payment_intent_id: string
          persona_inquiry_id: string
          persona_status: string | null
          price_cents: number
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by_user_id: string | null
          updated_at: string
          verification_data: Json | null
          verification_level: string | null
          verified_at: string | null
          worker_user_id: string | null
        }
        Insert: {
          badge_expires_at?: string | null
          badge_status?: string
          created_at?: string
          id?: string
          initiated_by_org_id?: string | null
          initiated_by_user_id?: string | null
          metadata?: Json
          paid_at: string
          payment_intent_id: string
          persona_inquiry_id: string
          persona_status?: string | null
          price_cents: number
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by_user_id?: string | null
          updated_at?: string
          verification_data?: Json | null
          verification_level?: string | null
          verified_at?: string | null
          worker_user_id?: string | null
        }
        Update: {
          badge_expires_at?: string | null
          badge_status?: string
          created_at?: string
          id?: string
          initiated_by_org_id?: string | null
          initiated_by_user_id?: string | null
          metadata?: Json
          paid_at?: string
          payment_intent_id?: string
          persona_inquiry_id?: string
          persona_status?: string | null
          price_cents?: number
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by_user_id?: string | null
          updated_at?: string
          verification_data?: Json | null
          verification_level?: string | null
          verified_at?: string | null
          worker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "id_verifications_initiated_by_org_id_fkey"
            columns: ["initiated_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_initiated_by_user_id_fkey"
            columns: ["initiated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_initiated_by_user_id_fkey"
            columns: ["initiated_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_revoked_by_user_id_fkey"
            columns: ["revoked_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_revoked_by_user_id_fkey"
            columns: ["revoked_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inquiry_audit_log: {
        Row: {
          actor_id: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          inquiry_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          inquiry_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          inquiry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_audit_log_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "application_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_capability_responses: {
        Row: {
          capability_name: string
          created_at: string
          id: string
          inquiry_id: string
          response_text: string | null
          response_value: boolean | null
          updated_at: string
        }
        Insert: {
          capability_name: string
          created_at?: string
          id?: string
          inquiry_id: string
          response_text?: string | null
          response_value?: boolean | null
          updated_at?: string
        }
        Update: {
          capability_name?: string
          created_at?: string
          id?: string
          inquiry_id?: string
          response_text?: string | null
          response_value?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_capability_responses_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "application_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          inquiry_id: string
          read_by: string[] | null
          section_name: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          inquiry_id: string
          read_by?: string[] | null
          section_name: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          inquiry_id?: string
          read_by?: string[] | null
          section_name?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_comments_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "application_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_reminders: {
        Row: {
          created_at: string
          id: string
          inquiry_id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquiry_id: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inquiry_id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_reminders_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "application_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_sections: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          id: string
          inquiry_id: string
          section_name: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          id?: string
          inquiry_id: string
          section_name: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string
          section_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_sections_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "application_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          last_used_at: string | null
          name: string
          organization_id: string
          template_data: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          name: string
          organization_id: string
          template_data: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          name?: string
          organization_id?: string
          template_data?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_bookings: {
        Row: {
          application_id: string
          booked_at: string
          calendar_event_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          candidate_id: string
          confirmed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          reminder_sent_at: string | null
          slot_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          booked_at?: string
          calendar_event_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          candidate_id: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reminder_sent_at?: string | null
          slot_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          booked_at?: string
          calendar_event_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          candidate_id?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reminder_sent_at?: string | null
          slot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "interview_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_slots: {
        Row: {
          application_id: string
          created_at: string
          id: string
          location_details: string | null
          location_type: string
          meeting_link: string | null
          metadata: Json | null
          notes: string | null
          organization_id: string
          proposed_by: string
          slot_end: string
          slot_start: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          location_details?: string | null
          location_type?: string
          meeting_link?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          proposed_by: string
          slot_end: string
          slot_start: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          location_details?: string | null
          location_type?: string
          meeting_link?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          proposed_by?: string
          slot_end?: string
          slot_start?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      invitation_rules: {
        Row: {
          allow_referral_only: boolean | null
          constraint_message: string | null
          created_at: string | null
          description: string | null
          email_template_id: string | null
          id: string
          is_active: boolean | null
          name: string
          relationship_type: string
          requires_project: boolean | null
          source_role: string
          target_role: string
          updated_at: string | null
        }
        Insert: {
          allow_referral_only?: boolean | null
          constraint_message?: string | null
          created_at?: string | null
          description?: string | null
          email_template_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          relationship_type: string
          requires_project?: boolean | null
          source_role: string
          target_role: string
          updated_at?: string | null
        }
        Update: {
          allow_referral_only?: boolean | null
          constraint_message?: string | null
          created_at?: string | null
          description?: string | null
          email_template_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          relationship_type?: string
          requires_project?: boolean | null
          source_role?: string
          target_role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          invitee_email: string
          issuer_user_id: string
          message: string | null
          metadata: Json
          organization_id: string | null
          personal_note: string | null
          resent_count: number
          role_name: string | null
          status: string
          target_id: string
          target_type: string
          token: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_email: string
          issuer_user_id: string
          message?: string | null
          metadata?: Json
          organization_id?: string | null
          personal_note?: string | null
          resent_count?: number
          role_name?: string | null
          status?: string
          target_id: string
          target_type: string
          token: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_email?: string
          issuer_user_id?: string
          message?: string | null
          metadata?: Json
          organization_id?: string | null
          personal_note?: string | null
          resent_count?: number
          role_name?: string | null
          status?: string
          target_id?: string
          target_type?: string
          token?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_issuer_user_id_fkey"
            columns: ["issuer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_issuer_user_id_fkey"
            columns: ["issuer_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ipip_share_tokens: {
        Row: {
          assessment_id: string
          created_at: string | null
          expires_at: string | null
          is_revoked: boolean | null
          token: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          expires_at?: string | null
          is_revoked?: boolean | null
          token?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          expires_at?: string | null
          is_revoked?: boolean | null
          token?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      job_certifications: {
        Row: {
          certification_id: string
          created_at: string | null
          id: string
          is_required: boolean | null
          job_id: string
        }
        Insert: {
          certification_id: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          job_id: string
        }
        Update: {
          certification_id?: string
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_certifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_match_scores: {
        Row: {
          abilities_score: number | null
          algorithm_version: string | null
          calculated_at: string
          experience_score: number | null
          id: string
          job_id: string
          match_breakdown: Json | null
          match_reasons: string[] | null
          metadata: Json | null
          riasec_score: number | null
          skills_score: number | null
          total_score: number | null
          user_id: string
          work_values_score: number | null
        }
        Insert: {
          abilities_score?: number | null
          algorithm_version?: string | null
          calculated_at?: string
          experience_score?: number | null
          id?: string
          job_id: string
          match_breakdown?: Json | null
          match_reasons?: string[] | null
          metadata?: Json | null
          riasec_score?: number | null
          skills_score?: number | null
          total_score?: number | null
          user_id: string
          work_values_score?: number | null
        }
        Update: {
          abilities_score?: number | null
          algorithm_version?: string | null
          calculated_at?: string
          experience_score?: number | null
          id?: string
          job_id?: string
          match_breakdown?: Json | null
          match_reasons?: string[] | null
          metadata?: Json | null
          riasec_score?: number | null
          skills_score?: number | null
          total_score?: number | null
          user_id?: string
          work_values_score?: number | null
        }
        Relationships: []
      }
      job_occupation_mappings: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          job_id: string
          mapped_by: string | null
          onet_code: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          job_id: string
          mapped_by?: string | null
          onet_code: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          job_id?: string
          mapped_by?: string | null
          onet_code?: string
        }
        Relationships: []
      }
      job_skills: {
        Row: {
          created_at: string | null
          csi_skill_id: string | null
          id: string
          is_required: boolean | null
          job_id: string
          metadata: Json | null
          onet_occupation_id: string | null
          priority_order: number | null
          required_level: number | null
          skill_taxonomy: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          csi_skill_id?: string | null
          id?: string
          is_required?: boolean | null
          job_id: string
          metadata?: Json | null
          onet_occupation_id?: string | null
          priority_order?: number | null
          required_level?: number | null
          skill_taxonomy: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          csi_skill_id?: string | null
          id?: string
          is_required?: boolean | null
          job_id?: string
          metadata?: Json | null
          onet_occupation_id?: string | null
          priority_order?: number | null
          required_level?: number | null
          skill_taxonomy?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_team_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          is_primary: boolean
          job_id: string
          metadata: Json
          organization_id: string
          role_key: string
          team_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          is_primary?: boolean
          job_id: string
          metadata?: Json
          organization_id: string
          role_key?: string
          team_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          is_primary?: boolean
          job_id?: string
          metadata?: Json
          organization_id?: string
          role_key?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_team_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_team_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_team_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_team_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: Json | null
          affirmative_action_plan: boolean | null
          application_deadline: string | null
          application_expiry_days: number | null
          assessment_details: string | null
          assigned_team_id: string | null
          auto_reject_criteria: Json | null
          background_check_type: string | null
          benefits_summary: string | null
          bonus_details: string | null
          closes_at: string | null
          compensation: Json | null
          cost_center: string | null
          created_at: string
          created_by_user_id: string | null
          custom_application_questions: Json | null
          department: string | null
          description: Json | null
          drivers_license_type: string | null
          eeo_job_category: string | null
          employment_type: string | null
          enable_auto_reject: boolean | null
          equity_details: string | null
          estimated_application_time_minutes: number | null
          estimated_hire_date: string | null
          external_application_url: string | null
          featured_until: string | null
          geo: unknown
          has_bonus_structure: boolean | null
          has_equity: boolean | null
          has_relocation_package: boolean | null
          hiring_manager_id: string | null
          id: string
          inquiry_capability_questions: Json | null
          internal_job_code: string | null
          is_confidential: boolean | null
          is_disability_friendly: boolean | null
          is_featured: boolean | null
          is_veteran_friendly: boolean | null
          job_category: string | null
          language_requirements: Json | null
          location: string | null
          min_reputation: number | null
          minimum_education_level: string | null
          minimum_score: number | null
          minimum_years_experience: number | null
          number_of_openings: number | null
          organization_id: string
          overtime_eligible: boolean | null
          pay_frequency: string | null
          pay_range_max_cents: number | null
          pay_range_min_cents: number | null
          pay_range_type: string | null
          physical_requirements: Json | null
          position_level: string | null
          posted_at: string | null
          posting_channels: Json | null
          prevailing_wage_job: boolean | null
          priority_level: string | null
          recruiter_id: string | null
          relocation_assistance_details: string | null
          relocation_assistance_offered: boolean | null
          relocation_package_details: string | null
          remote_option: string | null
          require_background_check: boolean | null
          require_current_location: boolean | null
          require_drivers_license: boolean | null
          require_drug_test: boolean | null
          require_earliest_start_date: boolean | null
          require_relocation_willingness: boolean | null
          require_work_authorization: boolean | null
          required_attachments: Json | null
          required_soft_skills: Json
          requires_assessment: boolean | null
          requires_union_membership: boolean | null
          requires_video_interview: boolean | null
          requisition_number: string | null
          scheduled_publish_at: string | null
          search_tsv: unknown
          security_clearance_required: string | null
          seo_keywords: string[] | null
          shift_requirements: string | null
          show_team_on_posting: boolean | null
          sign_on_bonus_cents: number | null
          slug: string | null
          source_tracking_enabled: boolean | null
          status: string
          target_start_date: string | null
          team_id: string | null
          team_ids: string[] | null
          team_visibility: string | null
          timezone: string | null
          title: string
          travel_percentage: number | null
          union_local_preference: string | null
          updated_at: string
          utm_parameters: Json | null
          visibility: string | null
          work_locations: Json | null
          work_schedule_details: string | null
        }
        Insert: {
          address?: Json | null
          affirmative_action_plan?: boolean | null
          application_deadline?: string | null
          application_expiry_days?: number | null
          assessment_details?: string | null
          assigned_team_id?: string | null
          auto_reject_criteria?: Json | null
          background_check_type?: string | null
          benefits_summary?: string | null
          bonus_details?: string | null
          closes_at?: string | null
          compensation?: Json | null
          cost_center?: string | null
          created_at?: string
          created_by_user_id?: string | null
          custom_application_questions?: Json | null
          department?: string | null
          description?: Json | null
          drivers_license_type?: string | null
          eeo_job_category?: string | null
          employment_type?: string | null
          enable_auto_reject?: boolean | null
          equity_details?: string | null
          estimated_application_time_minutes?: number | null
          estimated_hire_date?: string | null
          external_application_url?: string | null
          featured_until?: string | null
          geo?: unknown
          has_bonus_structure?: boolean | null
          has_equity?: boolean | null
          has_relocation_package?: boolean | null
          hiring_manager_id?: string | null
          id?: string
          inquiry_capability_questions?: Json | null
          internal_job_code?: string | null
          is_confidential?: boolean | null
          is_disability_friendly?: boolean | null
          is_featured?: boolean | null
          is_veteran_friendly?: boolean | null
          job_category?: string | null
          language_requirements?: Json | null
          location?: string | null
          min_reputation?: number | null
          minimum_education_level?: string | null
          minimum_score?: number | null
          minimum_years_experience?: number | null
          number_of_openings?: number | null
          organization_id: string
          overtime_eligible?: boolean | null
          pay_frequency?: string | null
          pay_range_max_cents?: number | null
          pay_range_min_cents?: number | null
          pay_range_type?: string | null
          physical_requirements?: Json | null
          position_level?: string | null
          posted_at?: string | null
          posting_channels?: Json | null
          prevailing_wage_job?: boolean | null
          priority_level?: string | null
          recruiter_id?: string | null
          relocation_assistance_details?: string | null
          relocation_assistance_offered?: boolean | null
          relocation_package_details?: string | null
          remote_option?: string | null
          require_background_check?: boolean | null
          require_current_location?: boolean | null
          require_drivers_license?: boolean | null
          require_drug_test?: boolean | null
          require_earliest_start_date?: boolean | null
          require_relocation_willingness?: boolean | null
          require_work_authorization?: boolean | null
          required_attachments?: Json | null
          required_soft_skills?: Json
          requires_assessment?: boolean | null
          requires_union_membership?: boolean | null
          requires_video_interview?: boolean | null
          requisition_number?: string | null
          scheduled_publish_at?: string | null
          search_tsv?: unknown
          security_clearance_required?: string | null
          seo_keywords?: string[] | null
          shift_requirements?: string | null
          show_team_on_posting?: boolean | null
          sign_on_bonus_cents?: number | null
          slug?: string | null
          source_tracking_enabled?: boolean | null
          status?: string
          target_start_date?: string | null
          team_id?: string | null
          team_ids?: string[] | null
          team_visibility?: string | null
          timezone?: string | null
          title: string
          travel_percentage?: number | null
          union_local_preference?: string | null
          updated_at?: string
          utm_parameters?: Json | null
          visibility?: string | null
          work_locations?: Json | null
          work_schedule_details?: string | null
        }
        Update: {
          address?: Json | null
          affirmative_action_plan?: boolean | null
          application_deadline?: string | null
          application_expiry_days?: number | null
          assessment_details?: string | null
          assigned_team_id?: string | null
          auto_reject_criteria?: Json | null
          background_check_type?: string | null
          benefits_summary?: string | null
          bonus_details?: string | null
          closes_at?: string | null
          compensation?: Json | null
          cost_center?: string | null
          created_at?: string
          created_by_user_id?: string | null
          custom_application_questions?: Json | null
          department?: string | null
          description?: Json | null
          drivers_license_type?: string | null
          eeo_job_category?: string | null
          employment_type?: string | null
          enable_auto_reject?: boolean | null
          equity_details?: string | null
          estimated_application_time_minutes?: number | null
          estimated_hire_date?: string | null
          external_application_url?: string | null
          featured_until?: string | null
          geo?: unknown
          has_bonus_structure?: boolean | null
          has_equity?: boolean | null
          has_relocation_package?: boolean | null
          hiring_manager_id?: string | null
          id?: string
          inquiry_capability_questions?: Json | null
          internal_job_code?: string | null
          is_confidential?: boolean | null
          is_disability_friendly?: boolean | null
          is_featured?: boolean | null
          is_veteran_friendly?: boolean | null
          job_category?: string | null
          language_requirements?: Json | null
          location?: string | null
          min_reputation?: number | null
          minimum_education_level?: string | null
          minimum_score?: number | null
          minimum_years_experience?: number | null
          number_of_openings?: number | null
          organization_id?: string
          overtime_eligible?: boolean | null
          pay_frequency?: string | null
          pay_range_max_cents?: number | null
          pay_range_min_cents?: number | null
          pay_range_type?: string | null
          physical_requirements?: Json | null
          position_level?: string | null
          posted_at?: string | null
          posting_channels?: Json | null
          prevailing_wage_job?: boolean | null
          priority_level?: string | null
          recruiter_id?: string | null
          relocation_assistance_details?: string | null
          relocation_assistance_offered?: boolean | null
          relocation_package_details?: string | null
          remote_option?: string | null
          require_background_check?: boolean | null
          require_current_location?: boolean | null
          require_drivers_license?: boolean | null
          require_drug_test?: boolean | null
          require_earliest_start_date?: boolean | null
          require_relocation_willingness?: boolean | null
          require_work_authorization?: boolean | null
          required_attachments?: Json | null
          required_soft_skills?: Json
          requires_assessment?: boolean | null
          requires_union_membership?: boolean | null
          requires_video_interview?: boolean | null
          requisition_number?: string | null
          scheduled_publish_at?: string | null
          search_tsv?: unknown
          security_clearance_required?: string | null
          seo_keywords?: string[] | null
          shift_requirements?: string | null
          show_team_on_posting?: boolean | null
          sign_on_bonus_cents?: number | null
          slug?: string | null
          source_tracking_enabled?: boolean | null
          status?: string
          target_start_date?: string | null
          team_id?: string | null
          team_ids?: string[] | null
          team_visibility?: string | null
          timezone?: string | null
          title?: string
          travel_percentage?: number | null
          union_local_preference?: string | null
          updated_at?: string
          utm_parameters?: Json | null
          visibility?: string | null
          work_locations?: Json | null
          work_schedule_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          created_at: string
          doc_type: string
          effective_at: string
          id: string
          is_current: boolean
          title: string | null
          url: string
          version: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          effective_at?: string
          id?: string
          is_current?: boolean
          title?: string | null
          url: string
          version: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          effective_at?: string
          id?: string
          is_current?: boolean
          title?: string | null
          url?: string
          version?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          stage: string
          updated_at: string | null
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          stage?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          stage?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_feeds: {
        Row: {
          category: string | null
          created_at: string
          feed_type: string
          id: string
          industry_id: string | null
          is_active: boolean
          last_error_message: string | null
          last_fetch_status: string | null
          last_fetched_at: string | null
          name: string
          region: string | null
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          feed_type?: string
          id?: string
          industry_id?: string | null
          is_active?: boolean
          last_error_message?: string | null
          last_fetch_status?: string | null
          last_fetched_at?: string | null
          name: string
          region?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          feed_type?: string
          id?: string
          industry_id?: string | null
          is_active?: boolean
          last_error_message?: string | null
          last_fetch_status?: string | null
          last_fetched_at?: string | null
          name?: string
          region?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_feeds_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempts: number
          channel: Database["core"]["Enums"]["notification_channel"]
          created_at: string
          id: number
          last_error: string | null
          metadata: Json
          next_attempt_at: string | null
          notification_id: string
          provider: string | null
          provider_msg_id: string | null
          status: Database["core"]["Enums"]["notification_delivery_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: Database["core"]["Enums"]["notification_channel"]
          created_at?: string
          id?: number
          last_error?: string | null
          metadata?: Json
          next_attempt_at?: string | null
          notification_id: string
          provider?: string | null
          provider_msg_id?: string | null
          status?: Database["core"]["Enums"]["notification_delivery_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: Database["core"]["Enums"]["notification_channel"]
          created_at?: string
          id?: number
          last_error?: string | null
          metadata?: Json
          next_attempt_at?: string | null
          notification_id?: string
          provider?: string | null
          provider_msg_id?: string | null
          status?: Database["core"]["Enums"]["notification_delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_devices: {
        Row: {
          created_at: string
          id: number
          last_seen_at: string | null
          metadata: Json
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          last_seen_at?: string | null
          metadata?: Json
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          last_seen_at?: string | null
          metadata?: Json
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_digest_queue: {
        Row: {
          bucket: string
          channels: Database["core"]["Enums"]["notification_channel"][]
          count: number
          created_at: string
          examples: Json
          id: number
          last_event_at: string
          processed_at: string | null
          type: Database["core"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bucket: string
          channels?: Database["core"]["Enums"]["notification_channel"][]
          count?: number
          created_at?: string
          examples?: Json
          id?: number
          last_event_at?: string
          processed_at?: string | null
          type: Database["core"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bucket?: string
          channels?: Database["core"]["Enums"]["notification_channel"][]
          count?: number
          created_at?: string
          examples?: Json
          id?: number
          last_event_at?: string
          processed_at?: string | null
          type?: Database["core"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_digest_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_digest_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          channel: Database["core"]["Enums"]["notification_channel"] | null
          delivery_id: number | null
          event: Database["core"]["Enums"]["notification_event_kind"]
          id: number
          meta: Json | null
          notification_id: string | null
          occurred_at: string
        }
        Insert: {
          channel?: Database["core"]["Enums"]["notification_channel"] | null
          delivery_id?: number | null
          event: Database["core"]["Enums"]["notification_event_kind"]
          id?: number
          meta?: Json | null
          notification_id?: string | null
          occurred_at?: string
        }
        Update: {
          channel?: Database["core"]["Enums"]["notification_channel"] | null
          delivery_id?: number | null
          event?: Database["core"]["Enums"]["notification_event_kind"]
          id?: number
          meta?: Json | null
          notification_id?: string | null
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "notification_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel_enabled: Json
          created_at: string
          digest_frequency: Database["core"]["Enums"]["notification_frequency"]
          global_enabled: boolean
          quiet_hours: Json | null
          type_overrides: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_enabled?: Json
          created_at?: string
          digest_frequency?: Database["core"]["Enums"]["notification_frequency"]
          global_enabled?: boolean
          quiet_hours?: Json | null
          type_overrides?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_enabled?: Json
          created_at?: string
          digest_frequency?: Database["core"]["Enums"]["notification_frequency"]
          global_enabled?: boolean
          quiet_hours?: Json | null
          type_overrides?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          archived_at: string | null
          body: Json
          created_at: string | null
          cta_label: string | null
          cta_url: string | null
          dedupe_key: string | null
          deleted_at: string | null
          id: string
          message: string
          metadata: Json
          preview: string | null
          read: boolean | null
          read_at: string | null
          routed_channels: Database["core"]["Enums"]["notification_channel"][]
          severity: Database["core"]["Enums"]["notification_severity"]
          title: string
          type: Database["core"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          body?: Json
          created_at?: string | null
          cta_label?: string | null
          cta_url?: string | null
          dedupe_key?: string | null
          deleted_at?: string | null
          id?: string
          message: string
          metadata?: Json
          preview?: string | null
          read?: boolean | null
          read_at?: string | null
          routed_channels?: Database["core"]["Enums"]["notification_channel"][]
          severity?: Database["core"]["Enums"]["notification_severity"]
          title: string
          type?: Database["core"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived_at?: string | null
          body?: Json
          created_at?: string | null
          cta_label?: string | null
          cta_url?: string | null
          dedupe_key?: string | null
          deleted_at?: string | null
          id?: string
          message?: string
          metadata?: Json
          preview?: string | null
          read?: boolean | null
          read_at?: string | null
          routed_channels?: Database["core"]["Enums"]["notification_channel"][]
          severity?: Database["core"]["Enums"]["notification_severity"]
          title?: string
          type?: Database["core"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_app_audit_log: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          ip_address: unknown
          oauth_app_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          ip_address?: unknown
          oauth_app_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          ip_address?: unknown
          oauth_app_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_app_audit_log_oauth_app_id_fkey"
            columns: ["oauth_app_id"]
            isOneToOne: false
            referencedRelation: "oauth_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_app_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_app_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_apps: {
        Row: {
          allowed_scopes: string[]
          approved_at: string | null
          approved_by: string | null
          client_id: string
          client_secret_hash: string
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          homepage_url: string | null
          id: string
          logo_url: string | null
          name: string
          owner_email: string | null
          privacy_policy_url: string | null
          redirect_uris: string[]
          requires_approval: boolean | null
          status: string
          terms_of_service_url: string | null
          updated_at: string
        }
        Insert: {
          allowed_scopes?: string[]
          approved_at?: string | null
          approved_by?: string | null
          client_id: string
          client_secret_hash: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          homepage_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_email?: string | null
          privacy_policy_url?: string | null
          redirect_uris?: string[]
          requires_approval?: boolean | null
          status?: string
          terms_of_service_url?: string | null
          updated_at?: string
        }
        Update: {
          allowed_scopes?: string[]
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string
          client_secret_hash?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          homepage_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_email?: string | null
          privacy_policy_url?: string | null
          redirect_uris?: string[]
          requires_approval?: boolean | null
          status?: string
          terms_of_service_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_apps_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_apps_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_apps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_apps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorization_codes: {
        Row: {
          code_challenge: string | null
          code_challenge_method: string | null
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          oauth_app_id: string
          redirect_uri: string
          revoked_at: string | null
          scopes: string[]
          state: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_challenge?: string | null
          code_challenge_method?: string | null
          code_hash: string
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          oauth_app_id: string
          redirect_uri: string
          revoked_at?: string | null
          scopes?: string[]
          state?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_challenge?: string | null
          code_challenge_method?: string | null
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          oauth_app_id?: string
          redirect_uri?: string
          revoked_at?: string | null
          scopes?: string[]
          state?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorization_codes_oauth_app_id_fkey"
            columns: ["oauth_app_id"]
            isOneToOne: false
            referencedRelation: "oauth_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorization_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_scopes: {
        Row: {
          category: string
          created_at: string
          description: string
          display_name: string
          id: string
          is_self_scoped: boolean
          is_sensitive: boolean
          rbac_permissions: string[]
          requires_admin_approval: boolean
          requires_consent: boolean
          scope: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          display_name: string
          id?: string
          is_self_scoped?: boolean
          is_sensitive?: boolean
          rbac_permissions?: string[]
          requires_admin_approval?: boolean
          requires_consent?: boolean
          scope: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          is_self_scoped?: boolean
          is_sensitive?: boolean
          rbac_permissions?: string[]
          requires_admin_approval?: boolean
          requires_consent?: boolean
          scope?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_used_at: string | null
          oauth_app_id: string
          parent_token_id: string | null
          refresh_expires_at: string | null
          refresh_token_hash: string | null
          revoked_at: string | null
          revoked_reason: string | null
          scopes: string[]
          token_hash: string
          token_type: string
          use_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          last_used_at?: string | null
          oauth_app_id: string
          parent_token_id?: string | null
          refresh_expires_at?: string | null
          refresh_token_hash?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scopes?: string[]
          token_hash: string
          token_type?: string
          use_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_used_at?: string | null
          oauth_app_id?: string
          parent_token_id?: string | null
          refresh_expires_at?: string | null
          refresh_token_hash?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scopes?: string[]
          token_hash?: string
          token_type?: string
          use_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_oauth_app_id_fkey"
            columns: ["oauth_app_id"]
            isOneToOne: false
            referencedRelation: "oauth_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_tokens_parent_token_id_fkey"
            columns: ["parent_token_id"]
            isOneToOne: false
            referencedRelation: "oauth_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_user_consents: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_scopes: string[]
          id: string
          oauth_app_id: string
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_scopes?: string[]
          id?: string
          oauth_app_id: string
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_scopes?: string[]
          id?: string
          oauth_app_id?: string
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_user_consents_oauth_app_id_fkey"
            columns: ["oauth_app_id"]
            isOneToOne: false
            referencedRelation: "oauth_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_audit_log: {
        Row: {
          action_type: string
          actor_email: string | null
          actor_role: string | null
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          description: string | null
          id: string
          ip_address: unknown
          metadata: Json
          organization_id: string
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          actor_email?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          actor_email?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id?: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_document_shares: {
        Row: {
          access_token: string | null
          created_at: string
          created_by: string
          document_id: string
          expires_at: string | null
          external_email: string | null
          id: string
          metadata: Json
          organization_id: string
          permission: Database["core"]["Enums"]["organization_document_permission"]
          revoked_at: string | null
          share_type: Database["core"]["Enums"]["organization_document_share_type"]
          target_user_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          created_by: string
          document_id: string
          expires_at?: string | null
          external_email?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          permission?: Database["core"]["Enums"]["organization_document_permission"]
          revoked_at?: string | null
          share_type?: Database["core"]["Enums"]["organization_document_share_type"]
          target_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          created_by?: string
          document_id?: string
          expires_at?: string | null
          external_email?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          permission?: Database["core"]["Enums"]["organization_document_permission"]
          revoked_at?: string | null
          share_type?: Database["core"]["Enums"]["organization_document_share_type"]
          target_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_document_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_shares_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_shares_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_shares_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_shares_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_shares_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_document_versions: {
        Row: {
          checksum: string | null
          created_at: string
          document_id: string
          id: string
          mime_type: string | null
          notes: string | null
          oauth_app_id: string | null
          organization_id: string
          size_bytes: number
          storage_object_path: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          document_id: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          oauth_app_id?: string | null
          organization_id: string
          size_bytes?: number
          storage_object_path: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          checksum?: string | null
          created_at?: string
          document_id?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          oauth_app_id?: string | null
          organization_id?: string
          size_bytes?: number
          storage_object_path?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_versions_oauth_app_id_fkey"
            columns: ["oauth_app_id"]
            isOneToOne: false
            referencedRelation: "oauth_apps"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "organization_document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          category: Database["core"]["Enums"]["organization_document_category"]
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          folder_id: string | null
          id: string
          is_deleted: boolean
          is_template: boolean
          latest_checksum: string | null
          latest_mime_type: string | null
          latest_size_bytes: number
          latest_version_id: string | null
          latest_version_number: number
          metadata: Json
          name: string
          oauth_app_id: string | null
          organization_id: string
          storage_bucket: string
          storage_prefix: string
          tags: string[]
          template_variables: Json
          total_size_bytes: number
          updated_at: string
          updated_by: string | null
          version_count: number
        }
        Insert: {
          category?: Database["core"]["Enums"]["organization_document_category"]
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          is_deleted?: boolean
          is_template?: boolean
          latest_checksum?: string | null
          latest_mime_type?: string | null
          latest_size_bytes?: number
          latest_version_id?: string | null
          latest_version_number?: number
          metadata?: Json
          name: string
          oauth_app_id?: string | null
          organization_id: string
          storage_bucket?: string
          storage_prefix?: string
          tags?: string[]
          template_variables?: Json
          total_size_bytes?: number
          updated_at?: string
          updated_by?: string | null
          version_count?: number
        }
        Update: {
          category?: Database["core"]["Enums"]["organization_document_category"]
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          is_deleted?: boolean
          is_template?: boolean
          latest_checksum?: string | null
          latest_mime_type?: string | null
          latest_size_bytes?: number
          latest_version_id?: string | null
          latest_version_number?: number
          metadata?: Json
          name?: string
          oauth_app_id?: string | null
          organization_id?: string
          storage_bucket?: string
          storage_prefix?: string
          tags?: string[]
          template_variables?: Json
          total_size_bytes?: number
          updated_at?: string
          updated_by?: string | null
          version_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "organization_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_latest_version_id_fkey"
            columns: ["latest_version_id"]
            isOneToOne: false
            referencedRelation: "organization_document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_oauth_app_id_fkey"
            columns: ["oauth_app_id"]
            isOneToOne: false
            referencedRelation: "oauth_apps"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_folders: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          depth: number
          description: string | null
          id: string
          is_deleted: boolean
          metadata: Json
          name: string
          organization_id: string
          parent_folder_id: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          depth?: number
          description?: string | null
          id?: string
          is_deleted?: boolean
          metadata?: Json
          name: string
          organization_id: string
          parent_folder_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          depth?: number
          description?: string | null
          id?: string
          is_deleted?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          parent_folder_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "organization_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_folders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_folders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_limit_overrides: {
        Row: {
          active: boolean
          created_at: string
          file_bytes: number | null
          granted_by_user_id: string | null
          id: string
          member_count: number | null
          metadata: Json
          organization_id: string
          reason: string | null
          storage_bytes: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          file_bytes?: number | null
          granted_by_user_id?: string | null
          id?: string
          member_count?: number | null
          metadata?: Json
          organization_id: string
          reason?: string | null
          storage_bytes?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          file_bytes?: number | null
          granted_by_user_id?: string | null
          id?: string
          member_count?: number | null
          metadata?: Json
          organization_id?: string
          reason?: string | null
          storage_bytes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_limit_overrides_granted_by_user_id_fkey"
            columns: ["granted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_limit_overrides_granted_by_user_id_fkey"
            columns: ["granted_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_limit_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_locations: {
        Row: {
          address: Json
          created_at: string
          created_by: string
          email: string | null
          id: string
          is_active: boolean
          latitude: number | null
          location_type: Database["core"]["Enums"]["organization_location_type"]
          longitude: number | null
          metadata: Json
          name: string
          organization_id: string
          phone: string | null
          timezone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: Json
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_type?: Database["core"]["Enums"]["organization_location_type"]
          longitude?: number | null
          metadata?: Json
          name: string
          organization_id: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: Json
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_type?: Database["core"]["Enums"]["organization_location_type"]
          longitude?: number | null
          metadata?: Json
          name?: string
          organization_id?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_locations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_locations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_locations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_payment_methods: {
        Row: {
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          billing_phone: string | null
          brand: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean
          last4: string | null
          metadata: Json
          organization_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at: string
        }
        Insert: {
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          brand?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          metadata?: Json
          organization_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at?: string
        }
        Update: {
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          brand?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean
          last4?: string | null
          metadata?: Json
          organization_id?: string
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_requests: {
        Row: {
          created_at: string
          created_by_user_id: string
          id: string
          metadata: Json
          name: string
          notes: string | null
          organization_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          slug: string
          status: Database["core"]["Enums"]["organization_request_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          id?: string
          metadata?: Json
          name: string
          notes?: string | null
          organization_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          slug: string
          status?: Database["core"]["Enums"]["organization_request_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          id?: string
          metadata?: Json
          name?: string
          notes?: string | null
          organization_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          slug?: string
          status?: Database["core"]["Enums"]["organization_request_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_requests_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requests_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requests_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requests_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          business_hours: Json
          created_at: string
          created_by: string | null
          default_currency: string
          enforce_mfa: boolean
          holiday_calendar: Json
          ip_allow_list: string[]
          locale: string
          notification_preferences: Json
          organization_id: string
          privacy_preferences: Json
          security_preferences: Json
          session_timeout_minutes: number
          storage_warning_thresholds: number[]
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_hours?: Json
          created_at?: string
          created_by?: string | null
          default_currency?: string
          enforce_mfa?: boolean
          holiday_calendar?: Json
          ip_allow_list?: string[]
          locale?: string
          notification_preferences?: Json
          organization_id: string
          privacy_preferences?: Json
          security_preferences?: Json
          session_timeout_minutes?: number
          storage_warning_thresholds?: number[]
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_hours?: Json
          created_at?: string
          created_by?: string | null
          default_currency?: string
          enforce_mfa?: boolean
          holiday_calendar?: Json
          ip_allow_list?: string[]
          locale?: string
          notification_preferences?: Json
          organization_id?: string
          privacy_preferences?: Json
          security_preferences?: Json
          session_timeout_minutes?: number
          storage_warning_thresholds?: number[]
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_skills: {
        Row: {
          created_at: string | null
          csi_skill_id: string | null
          id: string
          is_core_competency: boolean | null
          metadata: Json | null
          onet_occupation_id: string | null
          organization_id: string
          proficiency_level: number | null
          skill_taxonomy: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          csi_skill_id?: string | null
          id?: string
          is_core_competency?: boolean | null
          metadata?: Json | null
          onet_occupation_id?: string | null
          organization_id: string
          proficiency_level?: number | null
          skill_taxonomy: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          csi_skill_id?: string | null
          id?: string
          is_core_competency?: boolean | null
          metadata?: Json | null
          onet_occupation_id?: string | null
          organization_id?: string
          proficiency_level?: number | null
          skill_taxonomy?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_storage_usage: {
        Row: {
          document_count: number
          organization_id: string
          storage_bytes: number
          updated_at: string
          version_count: number
        }
        Insert: {
          document_count?: number
          organization_id: string
          storage_bytes?: number
          updated_at?: string
          version_count?: number
        }
        Update: {
          document_count?: number
          organization_id?: string
          storage_bytes?: number
          updated_at?: string
          version_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_storage_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          created_at: string
          default_payment_method_id: string | null
          default_project_location_visibility:
            | Database["core"]["Enums"]["location_visibility"]
            | null
          description: Json | null
          geo: unknown
          id: string
          industry_id: string | null
          inquiry_reminder_days: number | null
          inquiry_reminder_enabled: boolean | null
          locations: Json
          logo_url: string | null
          name: string
          owner_user_id: string | null
          search_tsv: unknown
          slug: string
          stripe_customer_id: string | null
          updated_at: string
          visibility: string | null
          website: string | null
          work_log_default_entry_type: string | null
          work_log_require_approval_to_move: boolean | null
          work_log_require_verification: boolean | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          default_payment_method_id?: string | null
          default_project_location_visibility?:
            | Database["core"]["Enums"]["location_visibility"]
            | null
          description?: Json | null
          geo?: unknown
          id?: string
          industry_id?: string | null
          inquiry_reminder_days?: number | null
          inquiry_reminder_enabled?: boolean | null
          locations?: Json
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          search_tsv?: unknown
          slug: string
          stripe_customer_id?: string | null
          updated_at?: string
          visibility?: string | null
          website?: string | null
          work_log_default_entry_type?: string | null
          work_log_require_approval_to_move?: boolean | null
          work_log_require_verification?: boolean | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          default_payment_method_id?: string | null
          default_project_location_visibility?:
            | Database["core"]["Enums"]["location_visibility"]
            | null
          description?: Json | null
          geo?: unknown
          id?: string
          industry_id?: string | null
          inquiry_reminder_days?: number | null
          inquiry_reminder_enabled?: boolean | null
          locations?: Json
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          search_tsv?: unknown
          slug?: string
          stripe_customer_id?: string | null
          updated_at?: string
          visibility?: string | null
          website?: string | null
          work_log_default_entry_type?: string | null
          work_log_require_approval_to_move?: boolean | null
          work_log_require_verification?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_default_payment_method_fk"
            columns: ["default_payment_method_id"]
            isOneToOne: false
            referencedRelation: "organization_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          background_check_access_id: string | null
          background_check_id: string | null
          created_at: string
          currency: string
          failed_at: string | null
          failure_reason: string | null
          id: string
          id_verification_id: string | null
          metadata: Json
          organization_id: string | null
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string
          succeeded_at: string | null
          success_fee_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          background_check_access_id?: string | null
          background_check_id?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          id_verification_id?: string | null
          metadata?: Json
          organization_id?: string | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id: string
          succeeded_at?: string | null
          success_fee_id?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          background_check_access_id?: string | null
          background_check_id?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          id_verification_id?: string | null
          metadata?: Json
          organization_id?: string | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string
          succeeded_at?: string | null
          success_fee_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_background_check_access_id_fkey"
            columns: ["background_check_access_id"]
            isOneToOne: false
            referencedRelation: "background_check_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_background_check_id_fkey"
            columns: ["background_check_id"]
            isOneToOne: false
            referencedRelation: "background_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_id_verification_id_fkey"
            columns: ["id_verification_id"]
            isOneToOne: false
            referencedRelation: "id_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_id_verification_id_fkey"
            columns: ["id_verification_id"]
            isOneToOne: false
            referencedRelation: "v_id_verification_latest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_success_fee_id_fkey"
            columns: ["success_fee_id"]
            isOneToOne: false
            referencedRelation: "success_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_assessments: {
        Row: {
          ai_report: string | null
          ai_report_generated_at: string | null
          completed_at: string | null
          completion_score: number | null
          cooldown_end_time: string | null
          created_at: string | null
          current_domain: string | null
          current_step: string | null
          diary_response: string | null
          diary_response_sentiment: string | null
          id: string
          ipip_answers: Json | null
          ipip_completed_at: string | null
          ipip_current_index: number | null
          ipip_language: string | null
          ipip_scores: Json | null
          last_updated_at: string | null
          luscher1_choices: number[] | null
          luscher1_completed_at: string | null
          luscher2_choices: number[] | null
          luscher2_completed_at: string | null
          luscher2_results: string | null
          next_available_at: string | null
          next_luscher_test_available_at: string | null
          retest_count: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_report?: string | null
          ai_report_generated_at?: string | null
          completed_at?: string | null
          completion_score?: number | null
          cooldown_end_time?: string | null
          created_at?: string | null
          current_domain?: string | null
          current_step?: string | null
          diary_response?: string | null
          diary_response_sentiment?: string | null
          id?: string
          ipip_answers?: Json | null
          ipip_completed_at?: string | null
          ipip_current_index?: number | null
          ipip_language?: string | null
          ipip_scores?: Json | null
          last_updated_at?: string | null
          luscher1_choices?: number[] | null
          luscher1_completed_at?: string | null
          luscher2_choices?: number[] | null
          luscher2_completed_at?: string | null
          luscher2_results?: string | null
          next_available_at?: string | null
          next_luscher_test_available_at?: string | null
          retest_count?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_report?: string | null
          ai_report_generated_at?: string | null
          completed_at?: string | null
          completion_score?: number | null
          cooldown_end_time?: string | null
          created_at?: string | null
          current_domain?: string | null
          current_step?: string | null
          diary_response?: string | null
          diary_response_sentiment?: string | null
          id?: string
          ipip_answers?: Json | null
          ipip_completed_at?: string | null
          ipip_current_index?: number | null
          ipip_language?: string | null
          ipip_scores?: Json | null
          last_updated_at?: string | null
          luscher1_choices?: number[] | null
          luscher1_completed_at?: string | null
          luscher2_choices?: number[] | null
          luscher2_completed_at?: string | null
          luscher2_results?: string | null
          next_available_at?: string | null
          next_luscher_test_available_at?: string | null
          retest_count?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personality_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personality_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string | null
          description: Json | null
          display_order: number | null
          file_path: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: Json | null
          display_order?: number | null
          file_path?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: Json | null
          display_order?: number | null
          file_path?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      preferences: {
        Row: {
          accepted_privacy_policy_at: string | null
          accepted_terms_of_service_at: string | null
          career_assessment_completed_at: string | null
          completion_history: Json | null
          created_at: string
          current_occupation_code: string | null
          import_metadata: Json | null
          notification_preferences: Json | null
          nudge_history: Json | null
          prerequisites_completed_at: string | null
          privacy_policy_version: string | null
          profile_visibility: Json | null
          riasec_scores: Json | null
          target_occupation_codes: string[] | null
          terms_of_service_version: string | null
          ui_preferences: Json | null
          updated_at: string
          user_id: string
          user_types: string[]
          wizard_progress: Json | null
        }
        Insert: {
          accepted_privacy_policy_at?: string | null
          accepted_terms_of_service_at?: string | null
          career_assessment_completed_at?: string | null
          completion_history?: Json | null
          created_at?: string
          current_occupation_code?: string | null
          import_metadata?: Json | null
          notification_preferences?: Json | null
          nudge_history?: Json | null
          prerequisites_completed_at?: string | null
          privacy_policy_version?: string | null
          profile_visibility?: Json | null
          riasec_scores?: Json | null
          target_occupation_codes?: string[] | null
          terms_of_service_version?: string | null
          ui_preferences?: Json | null
          updated_at?: string
          user_id: string
          user_types?: string[]
          wizard_progress?: Json | null
        }
        Update: {
          accepted_privacy_policy_at?: string | null
          accepted_terms_of_service_at?: string | null
          career_assessment_completed_at?: string | null
          completion_history?: Json | null
          created_at?: string
          current_occupation_code?: string | null
          import_metadata?: Json | null
          notification_preferences?: Json | null
          nudge_history?: Json | null
          prerequisites_completed_at?: string | null
          privacy_policy_version?: string | null
          profile_visibility?: Json | null
          riasec_scores?: Json | null
          target_occupation_codes?: string[] | null
          terms_of_service_version?: string | null
          ui_preferences?: Json | null
          updated_at?: string
          user_id?: string
          user_types?: string[]
          wizard_progress?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_data_requests: {
        Row: {
          categories: string[] | null
          completed_at: string | null
          correction_details: string | null
          created_at: string
          deadline_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          processed_by: string | null
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          completed_at?: string | null
          correction_details?: string | null
          created_at?: string
          deadline_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_by?: string | null
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: string[] | null
          completed_at?: string | null
          correction_details?: string | null
          created_at?: string
          deadline_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_by?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_opt_outs: {
        Row: {
          category: string
          created_at: string
          id: string
          opted_out: boolean
          opted_out_at: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          opted_out?: boolean
          opted_out_at?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          opted_out?: boolean
          opted_out_at?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          address: Json | null
          authorized_countries: string[] | null
          availability: string[] | null
          career_level: string | null
          certifications: string[] | null
          contact_prefs: string[] | null
          created_at: string | null
          drivers_license_classes: string[] | null
          education_level: string | null
          first_name: string | null
          geo: unknown
          hourly_rate_cents: number | null
          last_name: string | null
          location: string | null
          military_status: string[] | null
          open_to_travel: boolean | null
          phone: string | null
          phone_os: string[] | null
          preferred_work_locations: string[] | null
          travel_distance_miles: number | null
          travel_mileage: number | null
          updated_at: string | null
          us_passport: boolean | null
          us_resident: boolean | null
          user_id: string
          veteran: boolean | null
        }
        Insert: {
          address?: Json | null
          authorized_countries?: string[] | null
          availability?: string[] | null
          career_level?: string | null
          certifications?: string[] | null
          contact_prefs?: string[] | null
          created_at?: string | null
          drivers_license_classes?: string[] | null
          education_level?: string | null
          first_name?: string | null
          geo?: unknown
          hourly_rate_cents?: number | null
          last_name?: string | null
          location?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
          phone?: string | null
          phone_os?: string[] | null
          preferred_work_locations?: string[] | null
          travel_distance_miles?: number | null
          travel_mileage?: number | null
          updated_at?: string | null
          us_passport?: boolean | null
          us_resident?: boolean | null
          user_id: string
          veteran?: boolean | null
        }
        Update: {
          address?: Json | null
          authorized_countries?: string[] | null
          availability?: string[] | null
          career_level?: string | null
          certifications?: string[] | null
          contact_prefs?: string[] | null
          created_at?: string | null
          drivers_license_classes?: string[] | null
          education_level?: string | null
          first_name?: string | null
          geo?: unknown
          hourly_rate_cents?: number | null
          last_name?: string | null
          location?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
          phone?: string | null
          phone_os?: string[] | null
          preferred_work_locations?: string[] | null
          travel_distance_miles?: number | null
          travel_mileage?: number | null
          updated_at?: string | null
          us_passport?: boolean | null
          us_resident?: boolean | null
          user_id?: string
          veteran?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      project_addresses: {
        Row: {
          address_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          project_id: string
        }
        Insert: {
          address_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id: string
        }
        Update: {
          address_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_addresses_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_addresses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sites: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          project_id: string
          site_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id: string
          site_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          project_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      project_workers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_by_manager: boolean | null
          claimed_by_worker: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          job_id: string | null
          notes: string | null
          project_id: string
          role_on_project: string | null
          start_date: string | null
          status: Database["core"]["Enums"]["project_worker_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_by_manager?: boolean | null
          claimed_by_worker?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          project_id: string
          role_on_project?: string | null
          start_date?: string | null
          status?: Database["core"]["Enums"]["project_worker_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_by_manager?: boolean | null
          claimed_by_worker?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          project_id?: string
          role_on_project?: string | null
          start_date?: string | null
          status?: Database["core"]["Enums"]["project_worker_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_workers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          location_visibility: Database["core"]["Enums"]["location_visibility"]
          location_visibility_override: boolean | null
          name: string
          organization_id: string
          start_date: string | null
          status: Database["core"]["Enums"]["project_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          location_visibility?: Database["core"]["Enums"]["location_visibility"]
          location_visibility_override?: boolean | null
          name: string
          organization_id: string
          start_date?: string | null
          status?: Database["core"]["Enums"]["project_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location_visibility?: Database["core"]["Enums"]["location_visibility"]
          location_visibility_override?: boolean | null
          name?: string
          organization_id?: string
          start_date?: string | null
          status?: Database["core"]["Enums"]["project_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      punchlists: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          name: string
          organization_id: string
          project_id: string | null
          status: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          project_id?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "punchlists_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punchlists_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punchlists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punchlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_uploads: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          parsed_at: string | null
          parsing_errors: Json | null
          parsing_status: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          parsed_at?: string | null
          parsing_errors?: Json | null
          parsing_status?: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          parsed_at?: string | null
          parsing_errors?: Json | null
          parsing_status?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_wizard_state: {
        Row: {
          completed_at: string | null
          completed_steps: number[]
          current_step: number
          errors: Json | null
          id: string
          parsed_data: Json | null
          resume_id: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: number[]
          current_step?: number
          errors?: Json | null
          id?: string
          parsed_data?: Json | null
          resume_id: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: number[]
          current_step?: number
          errors?: Json | null
          id?: string
          parsed_data?: Json | null
          resume_id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_wizard_state_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resume_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      review_aspects: {
        Row: {
          created_at: string
          key: string
          review_id: string
          score: number
        }
        Insert: {
          created_at?: string
          key: string
          review_id: string
          score: number
        }
        Update: {
          created_at?: string
          key?: string
          review_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_aspects_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_category_ratings: {
        Row: {
          category: string
          created_at: string | null
          rating: number
          review_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          rating: number
          review_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          rating?: number
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_category_ratings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_revoked: boolean
          label: string | null
          max_uses: number | null
          subject_user_id: string
          token: string
          updated_at: string
          used_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          label?: string | null
          max_uses?: number | null
          subject_user_id: string
          token: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          label?: string | null
          max_uses?: number | null
          subject_user_id?: string
          token?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_links_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_links_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      review_pins: {
        Row: {
          created_at: string
          position: number
          review_id: string
          subject_user_id: string
        }
        Insert: {
          created_at?: string
          position: number
          review_id: string
          subject_user_id: string
        }
        Update: {
          created_at?: string
          position?: number
          review_id?: string
          subject_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_pins_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_pins_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_pins_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      review_skill_ratings: {
        Row: {
          created_at: string
          review_id: string
          score: number
          skill_id: string
        }
        Insert: {
          created_at?: string
          review_id: string
          score: number
          skill_id: string
        }
        Update: {
          created_at?: string
          review_id?: string
          score?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_skill_ratings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_ratings_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      review_soft_skill_votes: {
        Row: {
          created_at: string | null
          id: string
          is_strength: boolean
          notes: string | null
          rating: number | null
          review_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_strength: boolean
          notes?: string | null
          rating?: number | null
          review_id: string
          skill_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_strength?: boolean
          notes?: string | null
          rating?: number | null
          review_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_soft_skill_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_soft_skill_votes_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "soft_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_user_id: string | null
          body: string | null
          created_at: string
          headline: string | null
          id: string
          kind: string
          metadata: Json | null
          rating: number | null
          subject_id: string
          subject_type: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          body?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          rating?: number | null
          subject_id: string
          subject_type: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          body?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          kind?: string
          metadata?: Json | null
          rating?: number | null
          subject_id?: string
          subject_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      role_assignments: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          scope_org_id: string | null
          scope_team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          scope_org_id?: string | null
          scope_team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          scope_org_id?: string | null
          scope_team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_scope_org_id_fkey"
            columns: ["scope_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_scope_team_id_fkey"
            columns: ["scope_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          scope: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          scope: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          scope?: string
        }
        Relationships: []
      }
      scheduling_links: {
        Row: {
          application_id: string
          created_at: string
          created_by: string
          current_bookings: number | null
          expires_at: string
          id: string
          is_active: boolean
          max_bookings: number | null
          metadata: Json | null
          organization_id: string
          token: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by: string
          current_bookings?: number | null
          expires_at: string
          id?: string
          is_active?: boolean
          max_bookings?: number | null
          metadata?: Json | null
          organization_id: string
          token?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string
          current_bookings?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean
          max_bookings?: number | null
          metadata?: Json | null
          organization_id?: string
          token?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          metadata: Json
          name: string
          price_cents: number
          service_type: string
          tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          price_cents: number
          service_type: string
          tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          price_cents?: number
          service_type?: string
          tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          area_sqft: number | null
          boundary: unknown
          created_at: string | null
          id: string
          jurisdiction: string | null
          metadata: Json | null
          site_identifier: string | null
          updated_at: string | null
          zoning_classification: string | null
        }
        Insert: {
          area_sqft?: number | null
          boundary: unknown
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          metadata?: Json | null
          site_identifier?: string | null
          updated_at?: string | null
          zoning_classification?: string | null
        }
        Update: {
          area_sqft?: number | null
          boundary?: unknown
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          metadata?: Json | null
          site_identifier?: string | null
          updated_at?: string | null
          zoning_classification?: string | null
        }
        Relationships: []
      }
      skill_evidence: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string
          id: string
          metadata: Json | null
          skill_ref_id: string | null
          skill_taxonomy: string | null
          soft_skill_id: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type: string
          id?: string
          metadata?: Json | null
          skill_ref_id?: string | null
          skill_taxonomy?: string | null
          soft_skill_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          id?: string
          metadata?: Json | null
          skill_ref_id?: string | null
          skill_taxonomy?: string | null
          soft_skill_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_evidence_soft_skill_id_fkey"
            columns: ["soft_skill_id"]
            isOneToOne: false
            referencedRelation: "soft_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evidence_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evidence_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_snapshots: {
        Row: {
          created_at: string
          id: string
          snapshot_data: Json
          summary: Json | null
          trigger_id: string | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot_data?: Json
          summary?: Json | null
          trigger_id?: string | null
          trigger_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          snapshot_data?: Json
          summary?: Json | null
          trigger_id?: string | null
          trigger_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          industry_id: string | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          industry_id?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          industry_id?: string | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      slug_change_history: {
        Row: {
          changed_at: string
          id: string
          new_slug: string
          old_slug: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_slug: string
          old_slug?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_slug?: string
          old_slug?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_change_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slug_change_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      soft_skills: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_settings: {
        Row: {
          api_key_secret_id: string | null
          created_at: string
          last_tested_at: string | null
          last_tested_error: string | null
          last_tested_status: string | null
          publishable_key: string | null
          settings_name: string
          test_mode: boolean
          updated_at: string
          updated_by: string | null
          webhook_endpoint_url: string | null
          webhook_secret_id: string | null
        }
        Insert: {
          api_key_secret_id?: string | null
          created_at?: string
          last_tested_at?: string | null
          last_tested_error?: string | null
          last_tested_status?: string | null
          publishable_key?: string | null
          settings_name?: string
          test_mode?: boolean
          updated_at?: string
          updated_by?: string | null
          webhook_endpoint_url?: string | null
          webhook_secret_id?: string | null
        }
        Update: {
          api_key_secret_id?: string | null
          created_at?: string
          last_tested_at?: string | null
          last_tested_error?: string | null
          last_tested_status?: string | null
          publishable_key?: string | null
          settings_name?: string
          test_mode?: boolean
          updated_at?: string
          updated_by?: string | null
          webhook_endpoint_url?: string | null
          webhook_secret_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tier_limits: {
        Row: {
          created_at: string
          description: string | null
          max_file_bytes: number
          max_members: number
          max_storage_bytes: number
          soft_warning_thresholds: number[]
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          max_file_bytes?: number
          max_members?: number
          max_storage_bytes?: number
          soft_warning_thresholds?: number[]
          tier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          max_file_bytes?: number
          max_members?: number
          max_storage_bytes?: number
          soft_warning_thresholds?: number[]
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      success_fee_jobs: {
        Row: {
          created_at: string
          id: string
          job_type: string
          last_error: string | null
          payload: Json
          processed_at: string | null
          processed_by: string | null
          success_fee_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_type: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          processed_by?: string | null
          success_fee_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_type?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          processed_by?: string | null
          success_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_fee_jobs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fee_jobs_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fee_jobs_success_fee_id_fkey"
            columns: ["success_fee_id"]
            isOneToOne: false
            referencedRelation: "success_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      success_fees: {
        Row: {
          adjustment_notes: string | null
          application_id: string | null
          created_at: string
          duration_adjusted: boolean
          fee_percentage: number
          final_amount_cents: number
          final_paid_at: string | null
          final_payment_due_date: string
          final_payment_intent_id: string | null
          final_percentage: number
          hire_confirmed_at: string
          hire_start_date: string
          id: string
          job_duration_days: number | null
          job_id: string | null
          organization_id: string
          original_schedule: string | null
          payment_schedule: string
          status: string
          total_fee_cents: number
          total_hire_value_cents: number
          updated_at: string
          upfront_amount_cents: number
          upfront_paid_at: string | null
          upfront_payment_intent_id: string | null
          upfront_percentage: number
          worker_user_id: string | null
        }
        Insert: {
          adjustment_notes?: string | null
          application_id?: string | null
          created_at?: string
          duration_adjusted?: boolean
          fee_percentage?: number
          final_amount_cents: number
          final_paid_at?: string | null
          final_payment_due_date: string
          final_payment_intent_id?: string | null
          final_percentage: number
          hire_confirmed_at: string
          hire_start_date: string
          id?: string
          job_duration_days?: number | null
          job_id?: string | null
          organization_id: string
          original_schedule?: string | null
          payment_schedule: string
          status?: string
          total_fee_cents: number
          total_hire_value_cents: number
          updated_at?: string
          upfront_amount_cents: number
          upfront_paid_at?: string | null
          upfront_payment_intent_id?: string | null
          upfront_percentage: number
          worker_user_id?: string | null
        }
        Update: {
          adjustment_notes?: string | null
          application_id?: string | null
          created_at?: string
          duration_adjusted?: boolean
          fee_percentage?: number
          final_amount_cents?: number
          final_paid_at?: string | null
          final_payment_due_date?: string
          final_payment_intent_id?: string | null
          final_percentage?: number
          hire_confirmed_at?: string
          hire_start_date?: string
          id?: string
          job_duration_days?: number | null
          job_id?: string | null
          organization_id?: string
          original_schedule?: string | null
          payment_schedule?: string
          status?: string
          total_fee_cents?: number
          total_hire_value_cents?: number
          updated_at?: string
          upfront_amount_cents?: number
          upfront_paid_at?: string | null
          upfront_payment_intent_id?: string | null
          upfront_percentage?: number
          worker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_fees_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fees_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fees_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fees_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_user_id: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: string
          project_id: string | null
          punchlist_id: string | null
          source: string | null
          status: string
          team_slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: string
          project_id?: string | null
          punchlist_id?: string | null
          source?: string | null
          status?: string
          team_slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: string
          project_id?: string | null
          punchlist_id?: string | null
          source?: string | null
          status?: string
          team_slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_punchlist_id_fkey"
            columns: ["punchlist_id"]
            isOneToOne: false
            referencedRelation: "punchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: Database["core"]["Enums"]["team_activity_event_type"]
          id: string
          occurred_at: string
          organization_id: string
          payload: Json
          related_application_id: string | null
          related_job_id: string | null
          related_member_id: string | null
          subject_user_id: string | null
          team_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: Database["core"]["Enums"]["team_activity_event_type"]
          id?: string
          occurred_at?: string
          organization_id: string
          payload?: Json
          related_application_id?: string | null
          related_job_id?: string | null
          related_member_id?: string | null
          subject_user_id?: string | null
          team_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: Database["core"]["Enums"]["team_activity_event_type"]
          id?: string
          occurred_at?: string
          organization_id?: string
          payload?: Json
          related_application_id?: string | null
          related_job_id?: string | null
          related_member_id?: string | null
          subject_user_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_related_application_id_fkey"
            columns: ["related_application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_related_member_id_fkey"
            columns: ["related_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_daily_metrics: {
        Row: {
          applications_active: number
          applications_escalated: number
          applications_reviewed: number
          avg_time_to_first_review_seconds: number | null
          created_at: string
          id: string
          jobs_active: number
          median_time_to_first_review_seconds: number | null
          members_active: number
          members_pending: number
          members_total: number
          metadata: Json
          metric_date: string
          organization_id: string
          pending_invitations: number
          team_id: string
          updated_at: string
          workload_pressure_score: number | null
        }
        Insert: {
          applications_active?: number
          applications_escalated?: number
          applications_reviewed?: number
          avg_time_to_first_review_seconds?: number | null
          created_at?: string
          id?: string
          jobs_active?: number
          median_time_to_first_review_seconds?: number | null
          members_active?: number
          members_pending?: number
          members_total?: number
          metadata?: Json
          metric_date: string
          organization_id: string
          pending_invitations?: number
          team_id: string
          updated_at?: string
          workload_pressure_score?: number | null
        }
        Update: {
          applications_active?: number
          applications_escalated?: number
          applications_reviewed?: number
          avg_time_to_first_review_seconds?: number | null
          created_at?: string
          id?: string
          jobs_active?: number
          median_time_to_first_review_seconds?: number | null
          members_active?: number
          members_pending?: number
          members_total?: number
          metadata?: Json
          metric_date?: string
          organization_id?: string
          pending_invitations?: number
          team_id?: string
          updated_at?: string
          workload_pressure_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_daily_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_daily_metrics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          declined_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          invited_user_id: string | null
          invitee_user_id: string | null
          inviter_user_id: string | null
          last_delivery_channels: string[] | null
          last_delivery_error: string | null
          last_delivery_status: string | null
          metadata: Json
          notification_id: string | null
          organization_id: string
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          role_id: string
          sent_at: string | null
          status: string
          team_id: string
          token_hash: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          declined_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_user_id?: string | null
          invitee_user_id?: string | null
          inviter_user_id?: string | null
          last_delivery_channels?: string[] | null
          last_delivery_error?: string | null
          last_delivery_status?: string | null
          metadata?: Json
          notification_id?: string | null
          organization_id: string
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          role_id: string
          sent_at?: string | null
          status?: string
          team_id: string
          token_hash: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          declined_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          invited_user_id?: string | null
          invitee_user_id?: string | null
          inviter_user_id?: string | null
          last_delivery_channels?: string[] | null
          last_delivery_error?: string | null
          last_delivery_status?: string | null
          metadata?: Json
          notification_id?: string | null
          organization_id?: string
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          role_id?: string
          sent_at?: string | null
          status?: string
          team_id?: string
          token_hash?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invitee_user_id_fkey"
            columns: ["invitee_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_workloads: {
        Row: {
          active_assignments: number
          availability_score: number | null
          captured_at: string
          completed_reviews: number
          id: string
          metadata: Json
          organization_id: string
          overdue_assignments: number
          pending_assignments: number
          team_id: string
          team_member_id: string
          user_id: string
          weekly_capacity: number | null
        }
        Insert: {
          active_assignments?: number
          availability_score?: number | null
          captured_at?: string
          completed_reviews?: number
          id?: string
          metadata?: Json
          organization_id: string
          overdue_assignments?: number
          pending_assignments?: number
          team_id: string
          team_member_id: string
          user_id: string
          weekly_capacity?: number | null
        }
        Update: {
          active_assignments?: number
          availability_score?: number | null
          captured_at?: string
          completed_reviews?: number
          id?: string
          metadata?: Json
          organization_id?: string
          overdue_assignments?: number
          pending_assignments?: number
          team_id?: string
          team_member_id?: string
          user_id?: string
          weekly_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_member_workloads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          invitation_id: string | null
          invited_by: string | null
          joined_at: string
          metadata: Json
          permissions_override: Json
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
          role_id: string
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          invited_by?: string | null
          joined_at?: string
          metadata?: Json
          permissions_override?: Json
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          role_id: string
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          invited_by?: string | null
          joined_at?: string
          metadata?: Json
          permissions_override?: Json
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
          role_id?: string
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "team_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      team_role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_allowed: boolean
          permission: Database["core"]["Enums"]["team_permission"]
          role_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_allowed?: boolean
          permission: Database["core"]["Enums"]["team_permission"]
          role_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_allowed?: boolean
          permission?: Database["core"]["Enums"]["team_permission"]
          role_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_role_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_role_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_role_permissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_role_permissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      team_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_assignable: boolean
          is_default: boolean
          is_system: boolean
          key: string
          level: number
          metadata: Json
          name: string
          organization_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_assignable?: boolean
          is_default?: boolean
          is_system?: boolean
          key: string
          level?: number
          metadata?: Json
          name: string
          organization_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_assignable?: boolean
          is_default?: boolean
          is_system?: boolean
          key?: string
          level?: number
          metadata?: Json
          name?: string
          organization_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_roles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_roles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          allow_self_join: boolean
          analytics_last_refreshed_at: string | null
          analytics_metadata: Json
          analytics_refresh_interval_minutes: number
          archived_at: string | null
          archived_by: string | null
          archived_reason: string | null
          auto_assign_jobs: boolean
          created_at: string
          created_by: string | null
          default_role_id: string
          default_role_key: string
          description: Json | null
          id: string
          image_url: string | null
          invitation_expiration_days: number
          invitation_policy: string
          is_archived: boolean
          metadata: Json
          name: string
          organization_id: string
          parent_team_id: string | null
          purpose: string | null
          settings: Json
          slug: string | null
          updated_at: string
          updated_by: string | null
          visibility: string
          workload_settings: Json
          workload_strategy: string
        }
        Insert: {
          allow_self_join?: boolean
          analytics_last_refreshed_at?: string | null
          analytics_metadata?: Json
          analytics_refresh_interval_minutes?: number
          archived_at?: string | null
          archived_by?: string | null
          archived_reason?: string | null
          auto_assign_jobs?: boolean
          created_at?: string
          created_by?: string | null
          default_role_id: string
          default_role_key?: string
          description?: Json | null
          id?: string
          image_url?: string | null
          invitation_expiration_days?: number
          invitation_policy?: string
          is_archived?: boolean
          metadata?: Json
          name: string
          organization_id: string
          parent_team_id?: string | null
          purpose?: string | null
          settings?: Json
          slug?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: string
          workload_settings?: Json
          workload_strategy?: string
        }
        Update: {
          allow_self_join?: boolean
          analytics_last_refreshed_at?: string | null
          analytics_metadata?: Json
          analytics_refresh_interval_minutes?: number
          archived_at?: string | null
          archived_by?: string | null
          archived_reason?: string | null
          auto_assign_jobs?: boolean
          created_at?: string
          created_by?: string | null
          default_role_id?: string
          default_role_key?: string
          description?: Json | null
          id?: string
          image_url?: string | null
          invitation_expiration_days?: number
          invitation_policy?: string
          is_archived?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          parent_team_id?: string | null
          purpose?: string | null
          settings?: Json
          slug?: string | null
          updated_at?: string
          updated_by?: string | null
          visibility?: string
          workload_settings?: Json
          workload_strategy?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_default_role_id_fkey"
            columns: ["default_role_id"]
            isOneToOne: false
            referencedRelation: "team_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_archetypes: {
        Row: {
          archetype_id: string
          assessment_date: string
          confidence_score: number
          created_at: string | null
          domain_scores: Json
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          archetype_id: string
          assessment_date: string
          confidence_score: number
          created_at?: string | null
          domain_scores: Json
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          archetype_id?: string
          assessment_date?: string
          confidence_score?: number
          created_at?: string | null
          domain_scores?: Json
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_archetypes_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "archetypes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assessment_xp: {
        Row: {
          assessment_type: string
          awarded_at: string | null
          id: string
          user_id: string
          xp_amount: number
          xp_type: string
        }
        Insert: {
          assessment_type: string
          awarded_at?: string | null
          id?: string
          user_id: string
          xp_amount: number
          xp_type: string
        }
        Update: {
          assessment_type?: string
          awarded_at?: string | null
          id?: string
          user_id?: string
          xp_amount?: number
          xp_type?: string
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          certificate_file_path: string | null
          certification_id: string | null
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          description: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          issuing_organization: string | null
          name: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          certificate_file_path?: string | null
          certification_id?: string | null
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization?: string | null
          name?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          certificate_file_path?: string | null
          certification_id?: string | null
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization?: string | null
          name?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_education: {
        Row: {
          created_at: string | null
          degree_type: string | null
          description: Json | null
          end_date: string | null
          expected_graduation_date: string | null
          field_of_study: string | null
          gpa: number | null
          id: string
          institution_name: string | null
          is_current: boolean | null
          is_verified: boolean | null
          location: string | null
          start_date: string | null
          university_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree_type?: string | null
          description?: Json | null
          end_date?: string | null
          expected_graduation_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution_name?: string | null
          is_current?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          start_date?: string | null
          university_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree_type?: string | null
          description?: Json | null
          end_date?: string | null
          expected_graduation_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          id?: string
          institution_name?: string | null
          is_current?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          start_date?: string | null
          university_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_experience: {
        Row: {
          claimed_at: string | null
          company_name: string
          created_at: string | null
          description: Json | null
          employment_type: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          is_remote: boolean | null
          job_title: string
          location: string | null
          location_structured: Json | null
          organization_id: string | null
          source: string
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          company_name: string
          created_at?: string | null
          description?: Json | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          is_remote?: boolean | null
          job_title: string
          location?: string | null
          location_structured?: Json | null
          organization_id?: string | null
          source?: string
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          company_name?: string
          created_at?: string | null
          description?: Json | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          is_remote?: boolean | null
          job_title?: string
          location?: string | null
          location_structured?: Json | null
          organization_id?: string | null
          source?: string
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_experience_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_relationships: {
        Row: {
          created_at: string | null
          id: string
          invitation_id: string | null
          relationship_type: string
          source_organization_id: string | null
          source_user_id: string
          status: string | null
          target_organization_id: string | null
          target_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          relationship_type: string
          source_organization_id?: string | null
          source_user_id: string
          status?: string | null
          target_organization_id?: string | null
          target_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          relationship_type?: string
          source_organization_id?: string | null
          source_user_id?: string
          status?: string | null
          target_organization_id?: string | null
          target_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_relationships_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "generic_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_source_organization_id_fkey"
            columns: ["source_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_target_organization_id_fkey"
            columns: ["target_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          created_at: string | null
          csi_skill_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          onet_occupation_id: string | null
          proficiency_level: number | null
          self_assessed_at: string | null
          skill_taxonomy: string
          soft_skill_id: string | null
          trade_id: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          version: number
          years_experience: number | null
        }
        Insert: {
          created_at?: string | null
          csi_skill_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          onet_occupation_id?: string | null
          proficiency_level?: number | null
          self_assessed_at?: string | null
          skill_taxonomy: string
          soft_skill_id?: string | null
          trade_id?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number
          years_experience?: number | null
        }
        Update: {
          created_at?: string | null
          csi_skill_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          onet_occupation_id?: string | null
          proficiency_level?: number | null
          self_assessed_at?: string | null
          skill_taxonomy?: string
          soft_skill_id?: string | null
          trade_id?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_soft_skill_id_fkey"
            columns: ["soft_skill_id"]
            isOneToOne: false
            referencedRelation: "soft_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_storage_usage: {
        Row: {
          certification_files_bytes: number | null
          portfolio_photos_bytes: number | null
          storage_limit_bytes: number | null
          total_bytes: number | null
          updated_at: string | null
          user_id: string
          work_log_photos_bytes: number | null
        }
        Insert: {
          certification_files_bytes?: number | null
          portfolio_photos_bytes?: number | null
          storage_limit_bytes?: number | null
          total_bytes?: number | null
          updated_at?: string | null
          user_id: string
          work_log_photos_bytes?: number | null
        }
        Update: {
          certification_files_bytes?: number | null
          portfolio_photos_bytes?: number | null
          storage_limit_bytes?: number | null
          total_bytes?: number | null
          updated_at?: string | null
          user_id?: string
          work_log_photos_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_storage_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_storage_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          about: Json | null
          avatar_media_id: string | null
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          created_by_user_id: string | null
          display_name: string | null
          frequency_xp: number
          headline: string | null
          id: string
          industry_id: string | null
          open_to_work: boolean | null
          skills_summary: Json | null
          slug: string | null
          storage_preference:
            | Database["core"]["Enums"]["storage_preference"]
            | null
          tsv: unknown
          updated_at: string | null
          username: string | null
          years_of_experience: number | null
        }
        Insert: {
          about?: Json | null
          avatar_media_id?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          display_name?: string | null
          frequency_xp?: number
          headline?: string | null
          id: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
          storage_preference?:
            | Database["core"]["Enums"]["storage_preference"]
            | null
          tsv?: unknown
          updated_at?: string | null
          username?: string | null
          years_of_experience?: number | null
        }
        Update: {
          about?: Json | null
          avatar_media_id?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          display_name?: string | null
          frequency_xp?: number
          headline?: string | null
          id?: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
          storage_preference?:
            | Database["core"]["Enums"]["storage_preference"]
            | null
          tsv?: unknown
          updated_at?: string | null
          username?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      vanity_url_analytics: {
        Row: {
          country_code: string | null
          created_at: string
          device_type: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_hash: string | null
          referrer: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      work_log_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          reason: string | null
          user_id: string
          work_log_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          user_id: string
          work_log_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          user_id?: string
          work_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_log_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_audit_log_work_log_id_fkey"
            columns: ["work_log_id"]
            isOneToOne: false
            referencedRelation: "work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_log_collaborators: {
        Row: {
          collaborator_user_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          permission_level: string
          work_log_id: string
        }
        Insert: {
          collaborator_user_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          permission_level?: string
          work_log_id: string
        }
        Update: {
          collaborator_user_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          permission_level?: string
          work_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_log_collaborators_collaborator_user_id_fkey"
            columns: ["collaborator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_collaborators_collaborator_user_id_fkey"
            columns: ["collaborator_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_collaborators_work_log_id_fkey"
            columns: ["work_log_id"]
            isOneToOne: false
            referencedRelation: "work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_log_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_system_message: boolean | null
          message: string
          updated_at: string | null
          user_id: string
          work_log_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_system_message?: boolean | null
          message: string
          updated_at?: string | null
          user_id: string
          work_log_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_system_message?: boolean | null
          message?: string
          updated_at?: string | null
          user_id?: string
          work_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_log_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_conversations_work_log_id_fkey"
            columns: ["work_log_id"]
            isOneToOne: false
            referencedRelation: "work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_log_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          exif_data: Json | null
          file_path: string
          file_size_bytes: number
          gps_location: unknown
          id: string
          medium_path: string | null
          photo_type: string | null
          show_on_profile: boolean | null
          taken_at: string | null
          thumbnail_path: string | null
          work_log_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          exif_data?: Json | null
          file_path: string
          file_size_bytes: number
          gps_location?: unknown
          id?: string
          medium_path?: string | null
          photo_type?: string | null
          show_on_profile?: boolean | null
          taken_at?: string | null
          thumbnail_path?: string | null
          work_log_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          exif_data?: Json | null
          file_path?: string
          file_size_bytes?: number
          gps_location?: unknown
          id?: string
          medium_path?: string | null
          photo_type?: string | null
          show_on_profile?: boolean | null
          taken_at?: string | null
          thumbnail_path?: string | null
          work_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_log_photos_work_log_id_fkey"
            columns: ["work_log_id"]
            isOneToOne: false
            referencedRelation: "work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_log_tasks: {
        Row: {
          created_at: string
          task_id: string
          work_log_id: string
        }
        Insert: {
          created_at?: string
          task_id: string
          work_log_id: string
        }
        Update: {
          created_at?: string
          task_id?: string
          work_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_log_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_log_tasks_work_log_id_fkey"
            columns: ["work_log_id"]
            isOneToOne: false
            referencedRelation: "work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_logs: {
        Row: {
          created_at: string | null
          device_type: string | null
          dispute_reason: string | null
          disputed_at: string | null
          entry_type: string
          gps_accuracy_meters: number | null
          gps_captured_at: string | null
          gps_location: unknown
          id: string
          location_permission_status: string | null
          log_date: string
          pending_move_reason: string | null
          pending_move_requested_at: string | null
          pending_move_requested_by: string | null
          pending_move_to_project_id: string | null
          project_id: string
          show_date_range_on_profile: boolean | null
          show_on_profile: boolean | null
          skills_used: string[] | null
          status: string
          submitted_at: string | null
          tasks_completed: string[] | null
          team_id: string | null
          time_entries: Json
          total_hours: number | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          verified_by_user_id: string | null
          visibility: string
          work_description: string
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          entry_type?: string
          gps_accuracy_meters?: number | null
          gps_captured_at?: string | null
          gps_location?: unknown
          id?: string
          location_permission_status?: string | null
          log_date: string
          pending_move_reason?: string | null
          pending_move_requested_at?: string | null
          pending_move_requested_by?: string | null
          pending_move_to_project_id?: string | null
          project_id: string
          show_date_range_on_profile?: boolean | null
          show_on_profile?: boolean | null
          skills_used?: string[] | null
          status?: string
          submitted_at?: string | null
          tasks_completed?: string[] | null
          team_id?: string | null
          time_entries?: Json
          total_hours?: number | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          verified_by_user_id?: string | null
          visibility?: string
          work_description: string
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          entry_type?: string
          gps_accuracy_meters?: number | null
          gps_captured_at?: string | null
          gps_location?: unknown
          id?: string
          location_permission_status?: string | null
          log_date?: string
          pending_move_reason?: string | null
          pending_move_requested_at?: string | null
          pending_move_requested_by?: string | null
          pending_move_to_project_id?: string | null
          project_id?: string
          show_date_range_on_profile?: boolean | null
          show_on_profile?: boolean | null
          skills_used?: string[] | null
          status?: string
          submitted_at?: string | null
          tasks_completed?: string[] | null
          team_id?: string | null
          time_entries?: Json
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
          visibility?: string
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "construction_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_profiles: {
        Row: {
          authorized_countries: string[] | null
          availability: string[] | null
          career_level: string | null
          drivers_license_classes: string[] | null
          education_level: string | null
          hourly_rate: number | null
          id: string | null
          military_status: string[] | null
          open_to_travel: boolean | null
          preferred_work_locations: string[] | null
          travel_distance_miles: number | null
          updated_at: string | null
          us_passport: boolean | null
          us_resident: boolean | null
        }
        Insert: {
          authorized_countries?: string[] | null
          availability?: string[] | null
          career_level?: string | null
          drivers_license_classes?: string[] | null
          education_level?: string | null
          hourly_rate?: number | null
          id?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
          preferred_work_locations?: string[] | null
          travel_distance_miles?: number | null
          updated_at?: string | null
          us_passport?: boolean | null
          us_resident?: boolean | null
        }
        Update: {
          authorized_countries?: string[] | null
          availability?: string[] | null
          career_level?: string | null
          drivers_license_classes?: string[] | null
          education_level?: string | null
          hourly_rate?: number | null
          id?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
          preferred_work_locations?: string[] | null
          travel_distance_miles?: number | null
          updated_at?: string | null
          us_passport?: boolean | null
          us_resident?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_user_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_user_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      v_id_verification_latest: {
        Row: {
          badge_expires_at: string | null
          badge_status: string | null
          id: string | null
          persona_status: string | null
          revocation_reason: string | null
          revoked_at: string | null
          updated_at: string | null
          verified_at: string | null
          worker_user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "id_verifications_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_worker_user_id_fkey"
            columns: ["worker_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      v_news_feed_health: {
        Row: {
          cached_article_count: number | null
          category: string | null
          feed_type: string | null
          health_status: string | null
          hours_since_last_fetch: number | null
          id: string | null
          is_active: boolean | null
          last_error_message: string | null
          last_fetch_status: string | null
          last_fetched_at: string | null
          latest_article_date: string | null
          name: string | null
          oldest_article_date: string | null
          region: string | null
          url: string | null
        }
        Relationships: []
      }
      v_profile_completion_scores: {
        Row: {
          completion_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
      v_profile_search: {
        Row: {
          availability: string[] | null
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string | null
          education_level: string | null
          gamified_score: number | null
          headline: string | null
          hourly_rate_cents: number | null
          id: string | null
          industry_name: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string | null
          open_to_travel: boolean | null
          open_to_work: boolean | null
          skills_summary: Json | null
          travel_mileage: number | null
          updated_at: string | null
          years_of_experience: number | null
        }
        Relationships: []
      }
      v_team_daily_metrics_latest: {
        Row: {
          applications_active: number | null
          applications_escalated: number | null
          applications_reviewed: number | null
          avg_time_to_first_review_seconds: number | null
          created_at: string | null
          id: string | null
          jobs_active: number | null
          median_time_to_first_review_seconds: number | null
          members_active: number | null
          members_pending: number | null
          members_total: number | null
          metadata: Json | null
          metric_date: string | null
          organization_id: string | null
          pending_invitations: number | null
          team_id: string | null
          updated_at: string | null
          workload_pressure_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_daily_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_daily_metrics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      v_team_member_workloads_latest: {
        Row: {
          active_assignments: number | null
          availability_score: number | null
          captured_at: string | null
          completed_reviews: number | null
          id: string | null
          metadata: Json | null
          organization_id: string | null
          overdue_assignments: number | null
          pending_assignments: number | null
          team_id: string | null
          team_member_id: string | null
          user_id: string | null
          weekly_capacity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_member_workloads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_workloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_organization_payment_data: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      anonymize_worker_payment_data: {
        Args: { p_worker_user_id: string }
        Returns: undefined
      }
      apply_credit_transaction: {
        Args: {
          p_amount_cents: number
          p_background_check_id?: string
          p_created_by?: string
          p_description?: string
          p_direction: string
          p_id_verification_id?: string
          p_metadata?: Json
          p_organization_id: string
          p_payment_transaction_id?: string
          p_success_fee_id?: string
          p_transaction_type: string
        }
        Returns: string
      }
      archive_expired_external_jobs: { Args: never; Returns: Json }
      auto_reject_application: {
        Args: { p_application_id: string }
        Returns: boolean
      }
      calculate_application_score: {
        Args: { p_application_id: string }
        Returns: number
      }
      calculate_multi_match_score: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: {
          abilities_score: number
          experience_score: number
          riasec_score: number
          skills_score: number
          total_score: number
          work_values_score: number
        }[]
      }
      calculate_next_attempt: { Args: { p_attempts: number }; Returns: string }
      calculate_time_entries_total_hours: {
        Args: { time_entries: Json }
        Returns: number
      }
      calculate_years_of_experience: {
        Args: { p_user_id: string }
        Returns: number
      }
      can_access_work_log: {
        Args: { target_work_log_id: string }
        Returns: boolean
      }
      check_notification_receipts: { Args: never; Returns: number }
      check_site_overlaps: {
        Args: { p_boundary: unknown; p_site_id: string }
        Returns: {
          overlap_percent: number
          overlapping_site_id: string
        }[]
      }
      cleanup_expired_api_keys: { Args: never; Returns: number }
      cleanup_expired_oauth_codes: { Args: never; Returns: number }
      cleanup_old_notifications: { Args: never; Returns: Json }
      configure_stripe_server: {
        Args: { p_api_key_secret_id: string; p_api_version?: string }
        Returns: undefined
      }
      create_skill_snapshot: {
        Args: {
          p_trigger_id?: string
          p_trigger_type: string
          p_user_id: string
        }
        Returns: string
      }
      decrypt_background_check_results: {
        Args: { p_encrypted: string; p_secret: string }
        Returns: Json
      }
      detect_trade_for_csi_skill: {
        Args: { skill_id: string }
        Returns: string
      }
      encrypt_background_check_results: {
        Args: { p_data: Json; p_secret: string }
        Returns: string
      }
      enqueue_due_success_fees: { Args: never; Returns: number }
      enqueue_duration_check_success_fees: { Args: never; Returns: number }
      extract_tiptap_plain_text: { Args: { content: Json }; Returns: string }
      generate_application_attachment_path: {
        Args: {
          application_id: string
          attachment_type: string
          user_id: string
        }
        Returns: string
      }
      generate_oauth_token: {
        Args: { p_oauth_app_id: string; p_scopes: string[]; p_user_id: string }
        Returns: Json
      }
      get_api_key_stats: {
        Args: { days?: number; org_id: string }
        Returns: Json
      }
      get_current_verification: {
        Args: { p_worker_user_id: string }
        Returns: {
          badge_expires_at: string
          badge_status: string
          id: string
          verification_level: string
          verified_at: string
        }[]
      }
      get_default_hire_agreement_text: { Args: never; Returns: string }
      get_jobs_with_coords: {
        Args: never
        Returns: {
          address: Json
          employment_type: string
          id: string
          latitude: number
          location: string
          longitude: number
          organization_id: string
          organization_name: string
          pay_range_max_cents: number
          pay_range_min_cents: number
          pay_range_type: string
          position_level: string
          remote_option: string
          status: string
          title: string
        }[]
      }
      get_or_create_account_credits: {
        Args: { p_organization_id: string }
        Returns: string
      }
      get_org_id_from_path: { Args: { object_name: string }; Returns: string }
      get_organizations_with_coords: {
        Args: never
        Returns: {
          address: Json
          id: string
          industry_name: string
          latitude: number
          longitude: number
          name: string
          slug: string
        }[]
      }
      get_secret_value: { Args: { p_secret_id: string }; Returns: string }
      has_team_permission: {
        Args: {
          required_permission: Database["core"]["Enums"]["team_permission"]
          target_team_id: string
        }
        Returns: boolean
      }
      import_external_jobs: { Args: never; Returns: Json }
      import_news_articles: { Args: never; Returns: Json }
      is_org_member: {
        Args: { org_id: string; target_user?: string }
        Returns: boolean
      }
      is_team_admin: { Args: { target_team_id: string }; Returns: boolean }
      is_work_log_owner: {
        Args: { target_work_log_id: string }
        Returns: boolean
      }
      jitter_coordinate: {
        Args: { coord: number; max_offset_degrees?: number }
        Returns: number
      }
      jitter_coordinate_deterministic: {
        Args: {
          coord: number
          coord_type?: string
          max_offset_degrees?: number
          user_id: string
        }
        Returns: number
      }
      map_job_to_industry: {
        Args: { p_category: string; p_description: string; p_title: string }
        Returns: string
      }
      notify_admins_of_cron_failure: {
        Args: { p_error_message: string; p_job_name: string }
        Returns: number
      }
      pin_review: {
        Args: { p_position: number; p_review_id: string }
        Returns: undefined
      }
      preview_auto_rejection: {
        Args: { p_application_id: string }
        Returns: Json
      }
      process_daily_digest: { Args: never; Returns: number }
      process_notification_queue: { Args: never; Returns: number }
      process_weekly_digest: { Args: never; Returns: number }
      publish_scheduled_jobs: { Args: never; Returns: Json }
      record_delivery_event: {
        Args: {
          p_channel: string
          p_delivery_id: number
          p_event: string
          p_meta?: Json
          p_notification_id: string
        }
        Returns: undefined
      }
      refresh_all_team_metrics: {
        Args: { p_metric_date?: string }
        Returns: number
      }
      refresh_ghost_profiles: { Args: never; Returns: undefined }
      refresh_stripe_schema: { Args: never; Returns: undefined }
      refresh_team_daily_metrics: {
        Args: {
          p_capture_workloads?: boolean
          p_metric_date?: string
          p_team_id: string
        }
        Returns: {
          applications_active: number
          applications_escalated: number
          applications_reviewed: number
          avg_time_to_first_review_seconds: number | null
          created_at: string
          id: string
          jobs_active: number
          median_time_to_first_review_seconds: number | null
          members_active: number
          members_pending: number
          members_total: number
          metadata: Json
          metric_date: string
          organization_id: string
          pending_invitations: number
          team_id: string
          updated_at: string
          workload_pressure_score: number | null
        }
        SetofOptions: {
          from: "*"
          to: "team_daily_metrics"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_years_of_experience: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      revoke_oauth_app_tokens: {
        Args: { p_oauth_app_id: string }
        Returns: number
      }
      rotate_stripe_secret: {
        Args: { p_secret: string; p_secret_type?: string }
        Returns: string
      }
      search_all_skills: {
        Args: { search_term: string; taxonomy_filter?: string }
        Returns: {
          code: string
          display_code: string
          name: string
          relevance: number
          skill_id: string
          taxonomy: string
        }[]
      }
      send_inquiry_reminders: { Args: never; Returns: Json }
      send_profile_completion_reminders: { Args: never; Returns: number }
      unpin_review: { Args: { p_review_id: string }; Returns: undefined }
      update_stale_applications: { Args: never; Returns: number }
      user_has_any_team_permission: {
        Args: {
          p_permission: Database["core"]["Enums"]["team_permission"]
          p_user_id: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: { p_org_id?: string; p_role_name: string; p_user_id: string }
        Returns: boolean
      }
      validate_address_in_site: {
        Args: { p_address_id: string; p_site_id: string }
        Returns: boolean
      }
      validate_oauth_scope: {
        Args: { p_requested_scopes: string[]; p_user_id: string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "super_admin"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "interviewing"
        | "offer_extended"
        | "hired"
        | "rejected"
        | "withdrawn"
      background_check_dispute_status:
        | "pending"
        | "under_review"
        | "resolved"
        | "upheld"
        | "cancelled"
      background_check_paid_by: "worker" | "organization" | "platform"
      background_check_status:
        | "pending"
        | "invited"
        | "submitted"
        | "in_progress"
        | "under_review"
        | "completed_clear"
        | "completed_consider"
        | "completed_not_clear"
        | "partially_completed"
        | "failed"
        | "cancelled"
        | "disputed"
        | "expired"
        | "refunded"
      ccpa_opt_out_category:
        | "sale"
        | "sharing"
        | "targeted_advertising"
        | "profiling"
      ccpa_opt_out_source: "user_request" | "gpc_signal" | "admin"
      ccpa_request_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "denied"
        | "cancelled"
      ccpa_request_type:
        | "access"
        | "deletion"
        | "correction"
        | "opt_out"
        | "opt_in"
        | "portability"
      ccpa_verification_method: "email" | "enhanced" | "manual"
      location_visibility:
        | "public"
        | "authenticated"
        | "organization_only"
        | "private"
      notification_channel: "in_app" | "email" | "push" | "sms"
      notification_delivery_status:
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "failed"
        | "bounce"
        | "blocked"
      notification_event_kind:
        | "accepted"
        | "delivered"
        | "opened"
        | "clicked"
        | "failed"
        | "bounce"
        | "complaint"
      notification_frequency:
        | "immediate"
        | "digest_daily"
        | "digest_weekly"
        | "mute"
      notification_severity: "info" | "important" | "critical"
      notification_type:
        | "success"
        | "warning"
        | "info"
        | "job.match"
        | "app.submitted"
        | "app.status_changed"
        | "interview.scheduled"
        | "offer.extended"
        | "hiring.decision"
        | "team.invite"
        | "team.assigned"
        | "team.commented"
        | "team.role_changed"
        | "profile.viewed"
        | "profile.unlocked"
        | "review.new"
        | "review.reply"
        | "skill.endorse"
        | "acct.verify"
        | "acct.password_reset"
        | "payment.success"
        | "payment.failed"
        | "sub.renewal"
        | "bgcheck.completed"
        | "profile.reminder"
        | "reengage"
        | "feature.announcement"
        | "platform.update"
        | "message.received"
        | "system.cron_failure"
        | "profile.completion_reminder"
        | "application.status_stale"
        | "system.digest_daily"
        | "system.digest_weekly"
        | "inquiry.created"
        | "inquiry.sent"
        | "inquiry.comment_added"
        | "inquiry.section_accepted"
        | "inquiry.fully_accepted"
        | "inquiry.capability_answered"
        | "inquiry.updated"
        | "inquiry.reminder"
        | "connection.request"
        | "connection.accepted"
        | "community.post_comment"
        | "community.post_rating"
        | "community.reputation_change"
        | "community.new_follower"
        | "community.followed_user_post"
        | "community.karma_received"
      organization_document_category:
        | "contracts"
        | "templates"
        | "compliance"
        | "certifications"
        | "onboarding"
        | "general"
        | "other"
      organization_document_permission: "view" | "edit" | "manage"
      organization_document_share_type: "organization_member" | "external"
      organization_location_type:
        | "headquarters"
        | "branch"
        | "job_site"
        | "remote"
        | "other"
      organization_request_status: "pending" | "approved" | "rejected"
      project_status: "planning" | "active" | "completed" | "on_hold"
      project_worker_status: "pending" | "approved" | "rejected"
      property_type:
        | "residential"
        | "commercial"
        | "industrial"
        | "mixed_use"
        | "other"
      review_status: "pending" | "approved" | "rejected" | "flagged"
      storage_preference: "supabase" | "dropbox" | "google_drive"
      team_activity_event_type:
        | "team.created"
        | "team.updated"
        | "team.archived"
        | "member.invited"
        | "member.joined"
        | "member.removed"
        | "member.role_changed"
        | "job.assigned"
        | "job.unassigned"
        | "application.assigned"
        | "application.reassigned"
        | "application.review_submitted"
        | "workload.rebalanced"
      team_permission:
        | "team.view"
        | "team.manage"
        | "team.settings"
        | "team.invite"
        | "team.remove_member"
        | "team.assign_role"
        | "job.manage"
        | "application.review"
        | "application.manage"
        | "application.comment"
        | "interview.schedule"
        | "offer.manage"
        | "analytics.view"
        | "document.manage"
        | "invitation.manage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  data: {
    Tables: {
      certifications: {
        Row: {
          created_at: string | null
          depth: number
          description: string | null
          hierarchy_path: string
          id: string
          is_active: boolean | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          depth?: number
          description?: string | null
          hierarchy_path: string
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          depth?: number
          description?: string | null
          hierarchy_path?: string
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      masterformat: {
        Row: {
          active: boolean | null
          code: string[]
          code_display: string
          code_key: string
          created_at: string | null
          depth: number
          description: string | null
          id: string
          metadata: Json | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code: string[]
          code_display: string
          code_key: string
          created_at?: string | null
          depth: number
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string[]
          code_display?: string
          code_key?: string
          created_at?: string | null
          depth?: number
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "masterformat_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "masterformat"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string
          csi_divisions: string[] | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          csi_divisions?: string[] | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          csi_divisions?: string[] | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          alpha_two_code: string | null
          country: string
          created_at: string | null
          domains: string[] | null
          id: string
          metadata: Json | null
          name: string
          slug: string
          state_province: string | null
          updated_at: string | null
          web_pages: string[] | null
        }
        Insert: {
          alpha_two_code?: string | null
          country: string
          created_at?: string | null
          domains?: string[] | null
          id?: string
          metadata?: Json | null
          name: string
          slug: string
          state_province?: string | null
          updated_at?: string | null
          web_pages?: string[] | null
        }
        Update: {
          alpha_two_code?: string | null
          country?: string
          created_at?: string | null
          domains?: string[] | null
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string
          state_province?: string | null
          updated_at?: string | null
          web_pages?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_certification_categories: {
        Args: never
        Returns: {
          operation: string
          result: Json
        }[]
      }
      cleanup_deprecated_certifications: {
        Args: never
        Returns: {
          kept_count: number
          removed_count: number
        }[]
      }
      get_masterformat_hierarchy: {
        Args: { code_id: string }
        Returns: {
          code_key: string
          id: string
          level: number
          name: string
        }[]
      }
      identify_duplicate_certifications: {
        Args: never
        Returns: {
          certification_ids: string[]
          depth: number
          duplicate_count: number
          parent_id: string
          title: string
        }[]
      }
      merge_duplicate_certifications: {
        Args: { duplicate_ids: string[]; keep_id: string }
        Returns: undefined
      }
      normalize_certification_titles: { Args: never; Returns: number }
      search_masterformat: {
        Args: { search_term: string }
        Returns: {
          code_display: string
          code_key: string
          depth: number
          id: string
          name: string
          relevance: number
        }[]
      }
      search_universities: {
        Args: { p_country?: string; p_limit?: number; p_query: string }
        Returns: {
          alpha_two_code: string | null
          country: string
          created_at: string | null
          domains: string[] | null
          id: string
          metadata: Json | null
          name: string
          slug: string
          state_province: string | null
          updated_at: string | null
          web_pages: string[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "universities"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      verify_certification_hierarchy: {
        Args: never
        Returns: {
          invalid_certs: Json
          invalid_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  engagement: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          event_metadata: Json
          event_type: string
          id: string
          occurred_at: string
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_metadata?: Json
          event_type: string
          id?: string
          occurred_at?: string
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_metadata?: Json
          event_type?: string
          id?: string
          occurred_at?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      connection_analytics: {
        Row: {
          connections_count: number
          created_at: string
          followers_count: number
          following_count: number
          last_profile_view_at: string | null
          pending_received_count: number
          pending_sent_count: number
          profile_views_30d: number
          profile_views_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          connections_count?: number
          created_at?: string
          followers_count?: number
          following_count?: number
          last_profile_view_at?: string | null
          pending_received_count?: number
          pending_sent_count?: number
          profile_views_30d?: number
          profile_views_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          connections_count?: number
          created_at?: string
          followers_count?: number
          following_count?: number
          last_profile_view_at?: string | null
          pending_received_count?: number
          pending_sent_count?: number
          profile_views_30d?: number
          profile_views_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_engagement_rollups: {
        Row: {
          count: number
          created_at: string
          date: string
          event_type: string
          id: string
          metadata: Json
          unique_actors: number
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          date: string
          event_type: string
          id?: string
          metadata?: Json
          unique_actors?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          event_type?: string
          id?: string
          metadata?: Json
          unique_actors?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_visibility_rollups: {
        Row: {
          clicks: number
          created_at: string
          date: string
          id: string
          impression_type: string
          impressions: number
          top_queries: Json
          unique_searchers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          date: string
          id?: string
          impression_type: string
          impressions?: number
          top_queries?: Json
          unique_searchers?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks?: number
          created_at?: string
          date?: string
          id?: string
          impression_type?: string
          impressions?: number
          top_queries?: Json
          unique_searchers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          referrer_url: string | null
          session_id: string | null
          updated_at: string
          viewed_at: string
          viewed_user_id: string
          viewer_industry_id: string | null
          viewer_role_type: string | null
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          referrer_url?: string | null
          session_id?: string | null
          updated_at?: string
          viewed_at?: string
          viewed_user_id: string
          viewer_industry_id?: string | null
          viewer_role_type?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          referrer_url?: string | null
          session_id?: string | null
          updated_at?: string
          viewed_at?: string
          viewed_user_id?: string
          viewer_industry_id?: string | null
          viewer_role_type?: string | null
          viewer_user_id?: string | null
        }
        Relationships: []
      }
      search_impressions: {
        Row: {
          clicked: boolean
          created_at: string
          id: string
          impression_type: string
          occurred_at: string
          position: number | null
          search_filters: Json | null
          search_query: string | null
          searcher_id: string | null
          user_id: string
        }
        Insert: {
          clicked?: boolean
          created_at?: string
          id?: string
          impression_type: string
          occurred_at?: string
          position?: number | null
          search_filters?: Json | null
          search_query?: string | null
          searcher_id?: string | null
          user_id: string
        }
        Update: {
          clicked?: boolean
          created_at?: string
          id?: string
          impression_type?: string
          occurred_at?: string
          position?: number | null
          search_filters?: Json | null
          search_query?: string | null
          searcher_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rollup_daily_analytics: {
        Args: { target_date: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  onet: {
    Tables: {
      abilities: {
        Row: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound: number | null
          n: number | null
          not_relevant: string | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          upper_ci_bound: number | null
        }
        Insert: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Update: {
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "abilities_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "abilities_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "abilities_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      abilities_to_work_activities: {
        Row: {
          abilities_element_id: string
          work_activities_element_id: string
        }
        Insert: {
          abilities_element_id: string
          work_activities_element_id: string
        }
        Update: {
          abilities_element_id?: string
          work_activities_element_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abilities_to_work_activities_abilities_element_id_fkey"
            columns: ["abilities_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "abilities_to_work_activities_work_activities_element_id_fkey"
            columns: ["work_activities_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      abilities_to_work_context: {
        Row: {
          abilities_element_id: string
          work_context_element_id: string
        }
        Insert: {
          abilities_element_id: string
          work_context_element_id: string
        }
        Update: {
          abilities_element_id?: string
          work_context_element_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abilities_to_work_context_abilities_element_id_fkey"
            columns: ["abilities_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "abilities_to_work_context_work_context_element_id_fkey"
            columns: ["work_context_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      alternate_titles: {
        Row: {
          alternate_title: string
          onetsoc_code: string
          short_title: string | null
          sources: string
        }
        Insert: {
          alternate_title: string
          onetsoc_code: string
          short_title?: string | null
          sources: string
        }
        Update: {
          alternate_title?: string
          onetsoc_code?: string
          short_title?: string | null
          sources?: string
        }
        Relationships: [
          {
            foreignKeyName: "alternate_titles_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      basic_interests_to_riasec: {
        Row: {
          basic_interests_element_id: string
          riasec_element_id: string
        }
        Insert: {
          basic_interests_element_id: string
          riasec_element_id: string
        }
        Update: {
          basic_interests_element_id?: string
          riasec_element_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "basic_interests_to_riasec_basic_interests_element_id_fkey"
            columns: ["basic_interests_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "basic_interests_to_riasec_riasec_element_id_fkey"
            columns: ["riasec_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      content_model_reference: {
        Row: {
          description: string
          element_id: string
          element_name: string
        }
        Insert: {
          description: string
          element_id: string
          element_name: string
        }
        Update: {
          description?: string
          element_id?: string
          element_name?: string
        }
        Relationships: []
      }
      dwa_reference: {
        Row: {
          dwa_id: string
          dwa_title: string
          element_id: string
          iwa_id: string
        }
        Insert: {
          dwa_id: string
          dwa_title: string
          element_id: string
          iwa_id: string
        }
        Update: {
          dwa_id?: string
          dwa_title?: string
          element_id?: string
          iwa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dwa_reference_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "dwa_reference_iwa_id_fkey"
            columns: ["iwa_id"]
            isOneToOne: false
            referencedRelation: "iwa_reference"
            referencedColumns: ["iwa_id"]
          },
        ]
      }
      education_training_experience: {
        Row: {
          category: number | null
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound: number | null
          n: number | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          upper_ci_bound: number | null
        }
        Insert: {
          category?: number | null
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound?: number | null
          n?: number | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Update: {
          category?: number | null
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          lower_ci_bound?: number | null
          n?: number | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "education_training_experience_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "education_training_experience_element_id_scale_id_category_fkey"
            columns: ["element_id", "scale_id", "category"]
            isOneToOne: false
            referencedRelation: "ete_categories"
            referencedColumns: ["element_id", "scale_id", "category"]
          },
          {
            foreignKeyName: "education_training_experience_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "education_training_experience_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      emerging_tasks: {
        Row: {
          category: string
          date_updated: string
          domain_source: string
          onetsoc_code: string
          original_task_id: number | null
          task: string
        }
        Insert: {
          category: string
          date_updated: string
          domain_source: string
          onetsoc_code: string
          original_task_id?: number | null
          task: string
        }
        Update: {
          category?: string
          date_updated?: string
          domain_source?: string
          onetsoc_code?: string
          original_task_id?: number | null
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "emerging_tasks_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "emerging_tasks_original_task_id_fkey"
            columns: ["original_task_id"]
            isOneToOne: false
            referencedRelation: "task_statements"
            referencedColumns: ["task_id"]
          },
        ]
      }
      ete_categories: {
        Row: {
          category: number
          category_description: string
          element_id: string
          scale_id: string
        }
        Insert: {
          category: number
          category_description: string
          element_id: string
          scale_id: string
        }
        Update: {
          category?: number
          category_description?: string
          element_id?: string
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ete_categories_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "ete_categories_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      interests: {
        Row: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          onetsoc_code: string
          scale_id: string
        }
        Insert: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          onetsoc_code: string
          scale_id: string
        }
        Update: {
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          onetsoc_code?: string
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "interests_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "interests_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      interests_illus_activities: {
        Row: {
          activity: string
          element_id: string
          interest_type: string
        }
        Insert: {
          activity: string
          element_id: string
          interest_type: string
        }
        Update: {
          activity?: string
          element_id?: string
          interest_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_illus_activities_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      interests_illus_occupations: {
        Row: {
          element_id: string
          interest_type: string
          onetsoc_code: string
        }
        Insert: {
          element_id: string
          interest_type: string
          onetsoc_code: string
        }
        Update: {
          element_id?: string
          interest_type?: string
          onetsoc_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_illus_occupations_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "interests_illus_occupations_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      iwa_reference: {
        Row: {
          element_id: string
          iwa_id: string
          iwa_title: string
        }
        Insert: {
          element_id: string
          iwa_id: string
          iwa_title: string
        }
        Update: {
          element_id?: string
          iwa_id?: string
          iwa_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "iwa_reference_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      job_zone_reference: {
        Row: {
          education: string
          examples: string
          experience: string
          job_training: string
          job_zone: number
          name: string
          svp_range: string
        }
        Insert: {
          education: string
          examples: string
          experience: string
          job_training: string
          job_zone: number
          name: string
          svp_range: string
        }
        Update: {
          education?: string
          examples?: string
          experience?: string
          job_training?: string
          job_zone?: number
          name?: string
          svp_range?: string
        }
        Relationships: []
      }
      job_zones: {
        Row: {
          date_updated: string
          domain_source: string
          job_zone: number
          onetsoc_code: string
        }
        Insert: {
          date_updated: string
          domain_source: string
          job_zone: number
          onetsoc_code: string
        }
        Update: {
          date_updated?: string
          domain_source?: string
          job_zone?: number
          onetsoc_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_zones_job_zone_fkey"
            columns: ["job_zone"]
            isOneToOne: false
            referencedRelation: "job_zone_reference"
            referencedColumns: ["job_zone"]
          },
          {
            foreignKeyName: "job_zones_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      knowledge: {
        Row: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound: number | null
          n: number | null
          not_relevant: string | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          upper_ci_bound: number | null
        }
        Insert: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Update: {
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "knowledge_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "knowledge_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      level_scale_anchors: {
        Row: {
          anchor_description: string
          anchor_value: number
          element_id: string
          scale_id: string
        }
        Insert: {
          anchor_description: string
          anchor_value: number
          element_id: string
          scale_id: string
        }
        Update: {
          anchor_description?: string
          anchor_value?: number
          element_id?: string
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_scale_anchors_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "level_scale_anchors_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      occupation_data: {
        Row: {
          description: string
          onetsoc_code: string
          title: string
        }
        Insert: {
          description: string
          onetsoc_code: string
          title: string
        }
        Update: {
          description?: string
          onetsoc_code?: string
          title?: string
        }
        Relationships: []
      }
      occupation_level_metadata: {
        Row: {
          date_updated: string
          item: string
          n: number | null
          onetsoc_code: string
          percent: number | null
          response: string | null
        }
        Insert: {
          date_updated: string
          item: string
          n?: number | null
          onetsoc_code: string
          percent?: number | null
          response?: string | null
        }
        Update: {
          date_updated?: string
          item?: string
          n?: number | null
          onetsoc_code?: string
          percent?: number | null
          response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupation_level_metadata_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      related_occupations: {
        Row: {
          onetsoc_code: string
          related_index: number
          related_onetsoc_code: string
          relatedness_tier: string
        }
        Insert: {
          onetsoc_code: string
          related_index: number
          related_onetsoc_code: string
          relatedness_tier: string
        }
        Update: {
          onetsoc_code?: string
          related_index?: number
          related_onetsoc_code?: string
          relatedness_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_occupations_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "related_occupations_related_onetsoc_code_fkey"
            columns: ["related_onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      riasec_keywords: {
        Row: {
          element_id: string
          keyword: string
          keyword_type: string
        }
        Insert: {
          element_id: string
          keyword: string
          keyword_type: string
        }
        Update: {
          element_id?: string
          keyword?: string
          keyword_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "riasec_keywords_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      sample_of_reported_titles: {
        Row: {
          onetsoc_code: string
          reported_job_title: string
          shown_in_my_next_move: string
        }
        Insert: {
          onetsoc_code: string
          reported_job_title: string
          shown_in_my_next_move: string
        }
        Update: {
          onetsoc_code?: string
          reported_job_title?: string
          shown_in_my_next_move?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_of_reported_titles_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      scales_reference: {
        Row: {
          maximum: number
          minimum: number
          scale_id: string
          scale_name: string
        }
        Insert: {
          maximum: number
          minimum: number
          scale_id: string
          scale_name: string
        }
        Update: {
          maximum?: number
          minimum?: number
          scale_id?: string
          scale_name?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound: number | null
          n: number | null
          not_relevant: string | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          upper_ci_bound: number | null
        }
        Insert: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Update: {
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "skills_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "skills_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      skills_to_work_activities: {
        Row: {
          skills_element_id: string
          work_activities_element_id: string
        }
        Insert: {
          skills_element_id: string
          work_activities_element_id: string
        }
        Update: {
          skills_element_id?: string
          work_activities_element_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_to_work_activities_skills_element_id_fkey"
            columns: ["skills_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "skills_to_work_activities_work_activities_element_id_fkey"
            columns: ["work_activities_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      skills_to_work_context: {
        Row: {
          skills_element_id: string
          work_context_element_id: string
        }
        Insert: {
          skills_element_id: string
          work_context_element_id: string
        }
        Update: {
          skills_element_id?: string
          work_context_element_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_to_work_context_skills_element_id_fkey"
            columns: ["skills_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "skills_to_work_context_work_context_element_id_fkey"
            columns: ["work_context_element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
        ]
      }
      survey_booklet_locations: {
        Row: {
          element_id: string
          scale_id: string
          survey_item_number: string
        }
        Insert: {
          element_id: string
          scale_id: string
          survey_item_number: string
        }
        Update: {
          element_id?: string
          scale_id?: string
          survey_item_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_booklet_locations_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "survey_booklet_locations_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      task_categories: {
        Row: {
          category: number
          category_description: string
          scale_id: string
        }
        Insert: {
          category: number
          category_description: string
          scale_id: string
        }
        Update: {
          category?: number
          category_description?: string
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_categories_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      task_ratings: {
        Row: {
          category: number | null
          data_value: number
          date_updated: string
          domain_source: string
          lower_ci_bound: number | null
          n: number | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          task_id: number
          upper_ci_bound: number | null
        }
        Insert: {
          category?: number | null
          data_value: number
          date_updated: string
          domain_source: string
          lower_ci_bound?: number | null
          n?: number | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          task_id: number
          upper_ci_bound?: number | null
        }
        Update: {
          category?: number | null
          data_value?: number
          date_updated?: string
          domain_source?: string
          lower_ci_bound?: number | null
          n?: number | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          task_id?: number
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_ratings_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "task_ratings_scale_id_category_fkey"
            columns: ["scale_id", "category"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["scale_id", "category"]
          },
          {
            foreignKeyName: "task_ratings_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
          {
            foreignKeyName: "task_ratings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_statements"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_statements: {
        Row: {
          date_updated: string
          domain_source: string
          incumbents_responding: number | null
          onetsoc_code: string
          task: string
          task_id: number
          task_type: string | null
        }
        Insert: {
          date_updated: string
          domain_source: string
          incumbents_responding?: number | null
          onetsoc_code: string
          task: string
          task_id: number
          task_type?: string | null
        }
        Update: {
          date_updated?: string
          domain_source?: string
          incumbents_responding?: number | null
          onetsoc_code?: string
          task?: string
          task_id?: number
          task_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_statements_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      tasks_to_dwas: {
        Row: {
          date_updated: string
          domain_source: string
          dwa_id: string
          onetsoc_code: string
          task_id: number
        }
        Insert: {
          date_updated: string
          domain_source: string
          dwa_id: string
          onetsoc_code: string
          task_id: number
        }
        Update: {
          date_updated?: string
          domain_source?: string
          dwa_id?: string
          onetsoc_code?: string
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_to_dwas_dwa_id_fkey"
            columns: ["dwa_id"]
            isOneToOne: false
            referencedRelation: "dwa_reference"
            referencedColumns: ["dwa_id"]
          },
          {
            foreignKeyName: "tasks_to_dwas_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "tasks_to_dwas_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_statements"
            referencedColumns: ["task_id"]
          },
        ]
      }
      technology_skills: {
        Row: {
          commodity_code: number
          example: string
          hot_technology: string
          in_demand: string
          onetsoc_code: string
        }
        Insert: {
          commodity_code: number
          example: string
          hot_technology: string
          in_demand: string
          onetsoc_code: string
        }
        Update: {
          commodity_code?: number
          example?: string
          hot_technology?: string
          in_demand?: string
          onetsoc_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "technology_skills_commodity_code_fkey"
            columns: ["commodity_code"]
            isOneToOne: false
            referencedRelation: "unspsc_reference"
            referencedColumns: ["commodity_code"]
          },
          {
            foreignKeyName: "technology_skills_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      tools_used: {
        Row: {
          commodity_code: number
          example: string
          onetsoc_code: string
        }
        Insert: {
          commodity_code: number
          example: string
          onetsoc_code: string
        }
        Update: {
          commodity_code?: number
          example?: string
          onetsoc_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_used_commodity_code_fkey"
            columns: ["commodity_code"]
            isOneToOne: false
            referencedRelation: "unspsc_reference"
            referencedColumns: ["commodity_code"]
          },
          {
            foreignKeyName: "tools_used_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
        ]
      }
      unspsc_reference: {
        Row: {
          class_code: number
          class_title: string
          commodity_code: number
          commodity_title: string
          family_code: number
          family_title: string
          segment_code: number
          segment_title: string
        }
        Insert: {
          class_code: number
          class_title: string
          commodity_code: number
          commodity_title: string
          family_code: number
          family_title: string
          segment_code: number
          segment_title: string
        }
        Update: {
          class_code?: number
          class_title?: string
          commodity_code?: number
          commodity_title?: string
          family_code?: number
          family_title?: string
          segment_code?: number
          segment_title?: string
        }
        Relationships: []
      }
      work_activities: {
        Row: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound: number | null
          n: number | null
          not_relevant: string | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          upper_ci_bound: number | null
        }
        Insert: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Update: {
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_activities_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "work_activities_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "work_activities_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      work_context: {
        Row: {
          category: number | null
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound: number | null
          n: number | null
          not_relevant: string | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          upper_ci_bound: number | null
        }
        Insert: {
          category?: number | null
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Update: {
          category?: number | null
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          lower_ci_bound?: number | null
          n?: number | null
          not_relevant?: string | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_context_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "work_context_element_id_scale_id_category_fkey"
            columns: ["element_id", "scale_id", "category"]
            isOneToOne: false
            referencedRelation: "work_context_categories"
            referencedColumns: ["element_id", "scale_id", "category"]
          },
          {
            foreignKeyName: "work_context_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "work_context_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      work_context_categories: {
        Row: {
          category: number
          category_description: string
          element_id: string
          scale_id: string
        }
        Insert: {
          category: number
          category_description: string
          element_id: string
          scale_id: string
        }
        Update: {
          category?: number
          category_description?: string
          element_id?: string
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_context_categories_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "work_context_categories_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      work_styles: {
        Row: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound: number | null
          n: number | null
          onetsoc_code: string
          recommend_suppress: string | null
          scale_id: string
          standard_error: number | null
          upper_ci_bound: number | null
        }
        Insert: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          lower_ci_bound?: number | null
          n?: number | null
          onetsoc_code: string
          recommend_suppress?: string | null
          scale_id: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Update: {
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          lower_ci_bound?: number | null
          n?: number | null
          onetsoc_code?: string
          recommend_suppress?: string | null
          scale_id?: string
          standard_error?: number | null
          upper_ci_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_styles_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "work_styles_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "work_styles_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
      work_values: {
        Row: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          onetsoc_code: string
          scale_id: string
        }
        Insert: {
          data_value: number
          date_updated: string
          domain_source: string
          element_id: string
          onetsoc_code: string
          scale_id: string
        }
        Update: {
          data_value?: number
          date_updated?: string
          domain_source?: string
          element_id?: string
          onetsoc_code?: string
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_values_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "content_model_reference"
            referencedColumns: ["element_id"]
          },
          {
            foreignKeyName: "work_values_onetsoc_code_fkey"
            columns: ["onetsoc_code"]
            isOneToOne: false
            referencedRelation: "occupation_data"
            referencedColumns: ["onetsoc_code"]
          },
          {
            foreignKeyName: "work_values_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "scales_reference"
            referencedColumns: ["scale_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_occupations: {
        Args: { max_results?: number; search_query: string }
        Returns: {
          description: string
          onetsoc_code: string
          similarity_score: number
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          archived_at: string | null
          category: string
          changed_fields: string[] | null
          city: string | null
          country_code: string | null
          created_at: string
          current_hash: string
          error_message: string | null
          id: string
          impersonated_by_user_id: string | null
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          operation: string | null
          organization_id: string | null
          previous_hash: string | null
          purge_after: string | null
          record_id: string | null
          region: string | null
          request_id: string | null
          resource_name: string | null
          resource_type: string | null
          retention_period: string | null
          session_id: string | null
          severity: string
          signature: string | null
          status: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          archived_at?: string | null
          category: string
          changed_fields?: string[] | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          current_hash: string
          error_message?: string | null
          id?: string
          impersonated_by_user_id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string | null
          organization_id?: string | null
          previous_hash?: string | null
          purge_after?: string | null
          record_id?: string | null
          region?: string | null
          request_id?: string | null
          resource_name?: string | null
          resource_type?: string | null
          retention_period?: string | null
          session_id?: string | null
          severity: string
          signature?: string | null
          status?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          archived_at?: string | null
          category?: string
          changed_fields?: string[] | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          current_hash?: string
          error_message?: string | null
          id?: string
          impersonated_by_user_id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string | null
          organization_id?: string | null
          previous_hash?: string | null
          purge_after?: string | null
          record_id?: string | null
          region?: string | null
          request_id?: string | null
          resource_name?: string | null
          resource_type?: string | null
          retention_period?: string | null
          session_id?: string | null
          severity?: string
          signature?: string | null
          status?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_log_archive_index: {
        Row: {
          checksum: string
          created_at: string
          end_date: string
          file_path: string
          file_size_bytes: number
          id: string
          record_count: number
          start_date: string
          storage_tier: string
        }
        Insert: {
          checksum: string
          created_at?: string
          end_date: string
          file_path: string
          file_size_bytes: number
          id?: string
          record_count: number
          start_date: string
          storage_tier: string
        }
        Update: {
          checksum?: string
          created_at?: string
          end_date?: string
          file_path?: string
          file_size_bytes?: number
          id?: string
          record_count?: number
          start_date?: string
          storage_tier?: string
        }
        Relationships: []
      }
      auth_sessions: {
        Row: {
          access_token_encrypted: string | null
          access_token_secret_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          last_used_at: string
          refresh_token_encrypted: string | null
          refresh_token_secret_id: string | null
          scaffald_user_id: string
          session_expires_at: string
          supabase_user_id: string | null
          token_expires_at: string
          user_agent: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          access_token_secret_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          last_used_at?: string
          refresh_token_encrypted?: string | null
          refresh_token_secret_id?: string | null
          scaffald_user_id: string
          session_expires_at?: string
          supabase_user_id?: string | null
          token_expires_at: string
          user_agent?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          access_token_secret_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          last_used_at?: string
          refresh_token_encrypted?: string | null
          refresh_token_secret_id?: string | null
          scaffald_user_id?: string
          session_expires_at?: string
          supabase_user_id?: string | null
          token_expires_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      breach_notifications: {
        Row: {
          affected_california_residents: number
          affected_user_count: number
          attack_vector: string | null
          breach_number: string
          breach_type: string
          california_ag_notified: boolean
          california_ag_notified_at: string | null
          contained_at: string | null
          containment_actions: string | null
          created_at: string
          created_by_user_id: string
          cyber_insurance_claim_filed: boolean
          cyber_insurance_claim_number: string | null
          data_types_exposed: string[]
          discovered_at: string
          id: string
          impact_description: string | null
          last_modified_by_user_id: string | null
          law_enforcement_agency: string | null
          law_enforcement_case_number: string | null
          law_enforcement_notified: boolean
          lessons_learned: string | null
          metadata: Json | null
          notification_deadline: string | null
          notification_required: boolean
          other_regulators_notified: string[] | null
          post_incident_review_completed: boolean
          post_incident_review_date: string | null
          preventive_measures: string | null
          remediation_notes: string | null
          remediation_status: string | null
          reported_externally_at: string | null
          reported_internally_at: string | null
          root_cause: string | null
          sensitive_data_exposed: boolean
          severity: string
          systems_compromised: string[] | null
          updated_at: string
          user_notification_method: string | null
          user_notification_sent: boolean
          user_notification_sent_at: string | null
        }
        Insert: {
          affected_california_residents?: number
          affected_user_count?: number
          attack_vector?: string | null
          breach_number: string
          breach_type: string
          california_ag_notified?: boolean
          california_ag_notified_at?: string | null
          contained_at?: string | null
          containment_actions?: string | null
          created_at?: string
          created_by_user_id: string
          cyber_insurance_claim_filed?: boolean
          cyber_insurance_claim_number?: string | null
          data_types_exposed: string[]
          discovered_at: string
          id?: string
          impact_description?: string | null
          last_modified_by_user_id?: string | null
          law_enforcement_agency?: string | null
          law_enforcement_case_number?: string | null
          law_enforcement_notified?: boolean
          lessons_learned?: string | null
          metadata?: Json | null
          notification_deadline?: string | null
          notification_required?: boolean
          other_regulators_notified?: string[] | null
          post_incident_review_completed?: boolean
          post_incident_review_date?: string | null
          preventive_measures?: string | null
          remediation_notes?: string | null
          remediation_status?: string | null
          reported_externally_at?: string | null
          reported_internally_at?: string | null
          root_cause?: string | null
          sensitive_data_exposed?: boolean
          severity: string
          systems_compromised?: string[] | null
          updated_at?: string
          user_notification_method?: string | null
          user_notification_sent?: boolean
          user_notification_sent_at?: string | null
        }
        Update: {
          affected_california_residents?: number
          affected_user_count?: number
          attack_vector?: string | null
          breach_number?: string
          breach_type?: string
          california_ag_notified?: boolean
          california_ag_notified_at?: string | null
          contained_at?: string | null
          containment_actions?: string | null
          created_at?: string
          created_by_user_id?: string
          cyber_insurance_claim_filed?: boolean
          cyber_insurance_claim_number?: string | null
          data_types_exposed?: string[]
          discovered_at?: string
          id?: string
          impact_description?: string | null
          last_modified_by_user_id?: string | null
          law_enforcement_agency?: string | null
          law_enforcement_case_number?: string | null
          law_enforcement_notified?: boolean
          lessons_learned?: string | null
          metadata?: Json | null
          notification_deadline?: string | null
          notification_required?: boolean
          other_regulators_notified?: string[] | null
          post_incident_review_completed?: boolean
          post_incident_review_date?: string | null
          preventive_measures?: string | null
          remediation_notes?: string | null
          remediation_status?: string | null
          reported_externally_at?: string | null
          reported_internally_at?: string | null
          root_cause?: string | null
          sensitive_data_exposed?: boolean
          severity?: string
          systems_compromised?: string[] | null
          updated_at?: string
          user_notification_method?: string | null
          user_notification_sent?: boolean
          user_notification_sent_at?: string | null
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          consent_given: boolean
          consent_method: string
          consent_scope: Json | null
          consent_text: string | null
          consent_type: string
          consent_version: string
          created_at: string
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          location_country: string | null
          location_region: string | null
          metadata: Json | null
          organization_id: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_given: boolean
          consent_method: string
          consent_scope?: Json | null
          consent_text?: string | null
          consent_type: string
          consent_version: string
          created_at?: string
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          location_country?: string | null
          location_region?: string | null
          metadata?: Json | null
          organization_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_method?: string
          consent_scope?: Json | null
          consent_text?: string | null
          consent_type?: string
          consent_version?: string
          created_at?: string
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          location_country?: string | null
          location_region?: string | null
          metadata?: Json | null
          organization_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      data_processing_agreements: {
        Row: {
          audit_rights: boolean
          breach_notification_sla_hours: number | null
          ccpa_compliant: boolean
          created_at: string
          created_by_user_id: string
          data_location_countries: string[] | null
          data_retention_period: string | null
          data_types_processed: string[] | null
          dpa_document_url: string | null
          dpa_expiration_date: string | null
          dpa_signed_date: string | null
          dpa_status: string
          gdpr_compliant: boolean | null
          hipaa_compliant: boolean | null
          id: string
          iso27001_certified: boolean | null
          last_audit_date: string | null
          last_modified_by_user_id: string | null
          last_review_date: string | null
          metadata: Json | null
          next_review_date: string | null
          processing_purposes: string[] | null
          risk_level: string | null
          risk_notes: string | null
          soc2_certified: boolean | null
          subprocessors: Json | null
          updated_at: string
          vendor_contact_email: string
          vendor_contact_phone: string | null
          vendor_name: string
          vendor_type: string
        }
        Insert: {
          audit_rights?: boolean
          breach_notification_sla_hours?: number | null
          ccpa_compliant?: boolean
          created_at?: string
          created_by_user_id: string
          data_location_countries?: string[] | null
          data_retention_period?: string | null
          data_types_processed?: string[] | null
          dpa_document_url?: string | null
          dpa_expiration_date?: string | null
          dpa_signed_date?: string | null
          dpa_status?: string
          gdpr_compliant?: boolean | null
          hipaa_compliant?: boolean | null
          id?: string
          iso27001_certified?: boolean | null
          last_audit_date?: string | null
          last_modified_by_user_id?: string | null
          last_review_date?: string | null
          metadata?: Json | null
          next_review_date?: string | null
          processing_purposes?: string[] | null
          risk_level?: string | null
          risk_notes?: string | null
          soc2_certified?: boolean | null
          subprocessors?: Json | null
          updated_at?: string
          vendor_contact_email: string
          vendor_contact_phone?: string | null
          vendor_name: string
          vendor_type: string
        }
        Update: {
          audit_rights?: boolean
          breach_notification_sla_hours?: number | null
          ccpa_compliant?: boolean
          created_at?: string
          created_by_user_id?: string
          data_location_countries?: string[] | null
          data_retention_period?: string | null
          data_types_processed?: string[] | null
          dpa_document_url?: string | null
          dpa_expiration_date?: string | null
          dpa_signed_date?: string | null
          dpa_status?: string
          gdpr_compliant?: boolean | null
          hipaa_compliant?: boolean | null
          id?: string
          iso27001_certified?: boolean | null
          last_audit_date?: string | null
          last_modified_by_user_id?: string | null
          last_review_date?: string | null
          metadata?: Json | null
          next_review_date?: string | null
          processing_purposes?: string[] | null
          risk_level?: string | null
          risk_notes?: string | null
          soc2_certified?: boolean | null
          subprocessors?: Json | null
          updated_at?: string
          vendor_contact_email?: string
          vendor_contact_phone?: string | null
          vendor_name?: string
          vendor_type?: string
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          assigned_to_user_id: string | null
          completed_date: string | null
          created_at: string
          created_by_user_id: string | null
          deletion_completed_date: string | null
          deletion_scheduled_date: string | null
          deletion_scope: Json | null
          denial_reason: string | null
          due_date: string
          export_expires_at: string | null
          export_file_size: number | null
          export_file_url: string | null
          export_format: string | null
          export_generated_at: string | null
          extended_due_date: string | null
          extension_reason: string | null
          id: string
          ip_address: unknown
          last_modified_by_user_id: string | null
          metadata: Json | null
          priority: string | null
          request_description: string | null
          request_number: string
          request_type: string
          requested_data_categories: string[] | null
          requester_email: string
          requester_name: string
          requester_phone: string | null
          response_method: string | null
          response_notes: string | null
          scope: string | null
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          verification_date: string | null
          verification_method: string | null
          verification_notes: string | null
          verification_status: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          completed_date?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deletion_completed_date?: string | null
          deletion_scheduled_date?: string | null
          deletion_scope?: Json | null
          denial_reason?: string | null
          due_date: string
          export_expires_at?: string | null
          export_file_size?: number | null
          export_file_url?: string | null
          export_format?: string | null
          export_generated_at?: string | null
          extended_due_date?: string | null
          extension_reason?: string | null
          id?: string
          ip_address?: unknown
          last_modified_by_user_id?: string | null
          metadata?: Json | null
          priority?: string | null
          request_description?: string | null
          request_number: string
          request_type: string
          requested_data_categories?: string[] | null
          requester_email: string
          requester_name: string
          requester_phone?: string | null
          response_method?: string | null
          response_notes?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_date?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_status?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          completed_date?: string | null
          created_at?: string
          created_by_user_id?: string | null
          deletion_completed_date?: string | null
          deletion_scheduled_date?: string | null
          deletion_scope?: Json | null
          denial_reason?: string | null
          due_date?: string
          export_expires_at?: string | null
          export_file_size?: number | null
          export_file_url?: string | null
          export_format?: string | null
          export_generated_at?: string | null
          extended_due_date?: string | null
          extension_reason?: string | null
          id?: string
          ip_address?: unknown
          last_modified_by_user_id?: string | null
          metadata?: Json | null
          priority?: string | null
          request_description?: string | null
          request_number?: string
          request_type?: string
          requested_data_categories?: string[] | null
          requester_email?: string
          requester_name?: string
          requester_phone?: string | null
          response_method?: string | null
          response_notes?: string | null
          scope?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_date?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          event_data: Json
          event_id: string
          event_type: string
          id: string
          next_retry_at: string | null
          request_body: Json
          request_headers: Json | null
          request_signature: string | null
          response_body: string | null
          response_headers: Json | null
          response_status_code: number | null
          response_time_ms: number | null
          retry_count: number
          status: string
          webhook_id: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_data: Json
          event_id: string
          event_type: string
          id?: string
          next_retry_at?: string | null
          request_body: Json
          request_headers?: Json | null
          request_signature?: string | null
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          response_time_ms?: number | null
          retry_count?: number
          status?: string
          webhook_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          event_data?: Json
          event_id?: string
          event_type?: string
          id?: string
          next_retry_at?: string | null
          request_body?: Json
          request_headers?: Json | null
          request_signature?: string | null
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          response_time_ms?: number | null
          retry_count?: number
          status?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_data: Json
          event_id: string
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string
          webhooks_failed: number
          webhooks_succeeded: number
          webhooks_triggered: number
        }
        Insert: {
          created_at?: string
          event_data: Json
          event_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          webhooks_failed?: number
          webhooks_succeeded?: number
          webhooks_triggered?: number
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          webhooks_failed?: number
          webhooks_succeeded?: number
          webhooks_triggered?: number
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          events: string[]
          failed_deliveries: number
          id: string
          is_active: boolean
          last_delivery_at: string | null
          last_failure_at: string | null
          last_success_at: string | null
          metadata: Json | null
          organization_id: string
          rate_limit_per_minute: number | null
          retry_backoff_seconds: number[]
          retry_max_attempts: number
          secret: string
          successful_deliveries: number
          timeout_ms: number
          total_deliveries: number
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          failed_deliveries?: number
          id?: string
          is_active?: boolean
          last_delivery_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          organization_id: string
          rate_limit_per_minute?: number | null
          retry_backoff_seconds?: number[]
          retry_max_attempts?: number
          secret: string
          successful_deliveries?: number
          timeout_ms?: number
          total_deliveries?: number
          updated_at?: string
          updated_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          failed_deliveries?: number
          id?: string
          is_active?: boolean
          last_delivery_at?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          organization_id?: string
          rate_limit_per_minute?: number | null
          retry_backoff_seconds?: number[]
          retry_max_attempts?: number
          secret?: string
          successful_deliveries?: number
          timeout_ms?: number
          total_deliveries?: number
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      v_active_cron_jobs: {
        Row: {
          active: boolean | null
          command: string | null
          database: string | null
          jobid: number | null
          jobname: string | null
          nodename: string | null
          nodeport: number | null
          schedule: string | null
          username: string | null
        }
        Insert: {
          active?: boolean | null
          command?: string | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          nodeport?: number | null
          schedule?: string | null
          username?: string | null
        }
        Update: {
          active?: boolean | null
          command?: string | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          nodeport?: number | null
          schedule?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_audit_hash: {
        Args: {
          p_action: string
          p_category: string
          p_created_at: string
          p_id: string
          p_metadata: Json
          p_record_id: string
          p_user_id: string
        }
        Returns: string
      }
      calculate_years_of_experience: {
        Args: { p_user_id: string }
        Returns: number
      }
      cleanup_expired_auth_sessions: { Args: never; Returns: number }
      create_auth_session: {
        Args: {
          p_access_token: string
          p_ip_address?: unknown
          p_refresh_token: string
          p_scaffald_user_id: string
          p_supabase_user_id: string
          p_token_expires_at: string
          p_user_agent?: string
        }
        Returns: string
      }
      dearmor: { Args: { "": string }; Returns: string }
      delete_auth_session: { Args: { p_session_id: string }; Returns: boolean }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      gen_random_uuid: { Args: never; Returns: string }
      gen_salt: { Args: { "": string }; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_auth_session: {
        Args: { p_session_id: string }
        Returns: {
          access_token: string
          last_used_at: string
          refresh_token: string
          scaffald_user_id: string
          session_expires_at: string
          session_id: string
          supabase_user_id: string
          token_expires_at: string
        }[]
      }
      get_encryption_key: { Args: never; Returns: string }
      get_jobs_with_coords: {
        Args: never
        Returns: {
          address: Json
          employment_type: string
          id: string
          latitude: number
          location: string
          longitude: number
          organization_id: string
          organization_name: string
          pay_range_max_cents: number
          pay_range_min_cents: number
          pay_range_type: string
          position_level: string
          remote_option: string
          status: string
          title: string
        }[]
      }
      get_organizations_with_coords: {
        Args: never
        Returns: {
          address: Json
          id: string
          industry_name: string
          latitude: number
          longitude: number
          name: string
          slug: string
        }[]
      }
      get_pending_webhook_deliveries: {
        Args: never
        Returns: {
          attempt_number: number
          delivery_id: string
          event_type: string
          request_body: Json
          retry_count: number
          webhook_id: string
          webhook_secret: string
          webhook_url: string
        }[]
      }
      get_skill_children: {
        Args: { p_parent_id: string }
        Returns: {
          active: boolean
          csi_code: string[]
          csi_display: string
          depth: number
          hierarchy_path: string
          leaf_node: boolean
          parent_id: string
          skill_id: string
          skill_name: string
        }[]
      }
      get_skill_details: {
        Args: { p_skill_id: string }
        Returns: {
          active: boolean
          created_at: string
          csi_code: string[]
          csi_display: string
          hierarchy_ids: string[]
          hierarchy_path: string
          industry_id: string
          industry_name: string
          parent_id: string
          skill_id: string
          skill_name: string
        }[]
      }
      get_skill_parent_ids: { Args: { p_skill_id: string }; Returns: string[] }
      get_webhooks_for_event: {
        Args: { p_event_type: string; p_organization_id: string }
        Returns: {
          retry_backoff_seconds: number[]
          retry_max_attempts: number
          secret: string
          timeout_ms: number
          url: string
          webhook_id: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      is_vault_available: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      search_parent_skills: {
        Args: {
          p_industry_id: string
          p_limit?: number
          p_query: string
          p_taxonomy?: string
        }
        Returns: {
          active: boolean
          child_count: number
          csi_code: string[]
          csi_display: string
          depth: number
          hierarchy_path: string
          parent_id: string
          parent_name: string
          skill_id: string
          skill_name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_auth_session_tokens: {
        Args: {
          p_access_token: string
          p_refresh_token: string
          p_session_id: string
          p_token_expires_at: string
        }
        Returns: boolean
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      uuid_generate_v1: { Args: never; Returns: string }
      uuid_generate_v1mc: { Args: never; Returns: string }
      uuid_generate_v3: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_generate_v4: { Args: never; Returns: string }
      uuid_generate_v5: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_nil: { Args: never; Returns: string }
      uuid_ns_dns: { Args: never; Returns: string }
      uuid_ns_oid: { Args: never; Returns: string }
      uuid_ns_url: { Args: never; Returns: string }
      uuid_ns_x500: { Args: never; Returns: string }
      verify_audit_log_hash_chain: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          error_count: number
          errors: string[]
          valid: boolean
          verified_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  community: {
    Enums: {
      moderation_result: [
        "approved",
        "rejected_off_topic",
        "rejected_spam",
        "rejected_non_trade",
        "rejected_inappropriate",
        "manual_review",
      ],
      post_status: [
        "draft",
        "pending_moderation",
        "published",
        "flagged",
        "removed",
      ],
      post_type: ["advice", "critique", "showcase"],
      reputation_action: [
        "post_published",
        "post_published_full_taxonomy",
        "comment_created",
        "rating_given_base",
        "rating_given_detailed",
        "rating_received",
        "upvote_received",
        "karma_gifted",
        "karma_received",
        "post_unpublished",
        "post_deleted",
      ],
    },
  },
  core: {
    Enums: {
      app_role: ["user", "moderator", "admin", "super_admin"],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "interviewing",
        "offer_extended",
        "hired",
        "rejected",
        "withdrawn",
      ],
      background_check_dispute_status: [
        "pending",
        "under_review",
        "resolved",
        "upheld",
        "cancelled",
      ],
      background_check_paid_by: ["worker", "organization", "platform"],
      background_check_status: [
        "pending",
        "invited",
        "submitted",
        "in_progress",
        "under_review",
        "completed_clear",
        "completed_consider",
        "completed_not_clear",
        "partially_completed",
        "failed",
        "cancelled",
        "disputed",
        "expired",
        "refunded",
      ],
      ccpa_opt_out_category: [
        "sale",
        "sharing",
        "targeted_advertising",
        "profiling",
      ],
      ccpa_opt_out_source: ["user_request", "gpc_signal", "admin"],
      ccpa_request_status: [
        "pending",
        "in_progress",
        "completed",
        "denied",
        "cancelled",
      ],
      ccpa_request_type: [
        "access",
        "deletion",
        "correction",
        "opt_out",
        "opt_in",
        "portability",
      ],
      ccpa_verification_method: ["email", "enhanced", "manual"],
      location_visibility: [
        "public",
        "authenticated",
        "organization_only",
        "private",
      ],
      notification_channel: ["in_app", "email", "push", "sms"],
      notification_delivery_status: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "bounce",
        "blocked",
      ],
      notification_event_kind: [
        "accepted",
        "delivered",
        "opened",
        "clicked",
        "failed",
        "bounce",
        "complaint",
      ],
      notification_frequency: [
        "immediate",
        "digest_daily",
        "digest_weekly",
        "mute",
      ],
      notification_severity: ["info", "important", "critical"],
      notification_type: [
        "success",
        "warning",
        "info",
        "job.match",
        "app.submitted",
        "app.status_changed",
        "interview.scheduled",
        "offer.extended",
        "hiring.decision",
        "team.invite",
        "team.assigned",
        "team.commented",
        "team.role_changed",
        "profile.viewed",
        "profile.unlocked",
        "review.new",
        "review.reply",
        "skill.endorse",
        "acct.verify",
        "acct.password_reset",
        "payment.success",
        "payment.failed",
        "sub.renewal",
        "bgcheck.completed",
        "profile.reminder",
        "reengage",
        "feature.announcement",
        "platform.update",
        "message.received",
        "system.cron_failure",
        "profile.completion_reminder",
        "application.status_stale",
        "system.digest_daily",
        "system.digest_weekly",
        "inquiry.created",
        "inquiry.sent",
        "inquiry.comment_added",
        "inquiry.section_accepted",
        "inquiry.fully_accepted",
        "inquiry.capability_answered",
        "inquiry.updated",
        "inquiry.reminder",
        "connection.request",
        "connection.accepted",
        "community.post_comment",
        "community.post_rating",
        "community.reputation_change",
        "community.new_follower",
        "community.followed_user_post",
        "community.karma_received",
      ],
      organization_document_category: [
        "contracts",
        "templates",
        "compliance",
        "certifications",
        "onboarding",
        "general",
        "other",
      ],
      organization_document_permission: ["view", "edit", "manage"],
      organization_document_share_type: ["organization_member", "external"],
      organization_location_type: [
        "headquarters",
        "branch",
        "job_site",
        "remote",
        "other",
      ],
      organization_request_status: ["pending", "approved", "rejected"],
      project_status: ["planning", "active", "completed", "on_hold"],
      project_worker_status: ["pending", "approved", "rejected"],
      property_type: [
        "residential",
        "commercial",
        "industrial",
        "mixed_use",
        "other",
      ],
      review_status: ["pending", "approved", "rejected", "flagged"],
      storage_preference: ["supabase", "dropbox", "google_drive"],
      team_activity_event_type: [
        "team.created",
        "team.updated",
        "team.archived",
        "member.invited",
        "member.joined",
        "member.removed",
        "member.role_changed",
        "job.assigned",
        "job.unassigned",
        "application.assigned",
        "application.reassigned",
        "application.review_submitted",
        "workload.rebalanced",
      ],
      team_permission: [
        "team.view",
        "team.manage",
        "team.settings",
        "team.invite",
        "team.remove_member",
        "team.assign_role",
        "job.manage",
        "application.review",
        "application.manage",
        "application.comment",
        "interview.schedule",
        "offer.manage",
        "analytics.view",
        "document.manage",
        "invitation.manage",
      ],
    },
  },
  data: {
    Enums: {},
  },
  engagement: {
    Enums: {},
  },
  onet: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

