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
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
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
          refreshed_at: string | null
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
          refreshed_at?: string | null
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
          refreshed_at?: string | null
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
  cms: {
    Tables: {
      welcome_slides: {
        Row: {
          background_image_url: string
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          background_image_url: string
          created_at?: string
          description: string
          display_order: number
          icon_name: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          background_image_url?: string
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  core: {
    Tables: {
      application_inquiries: {
        Row: {
          application_id: string
          created_at: string
          id: string
          status: string | null
          terms: Json | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          status?: string | null
          terms?: Json | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          status?: string | null
          terms?: Json | null
          updated_at?: string
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
          cover_letter_url: string | null
          created_at: string
          id: string
          is_shortlisted: boolean | null
          job_id: string
          reject_meta: Json | null
          reject_reasons: string[] | null
          rejected_at: string | null
          resume_url: string | null
          stage_changed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          archived_at?: string | null
          cover_letter_url?: string | null
          created_at?: string
          id?: string
          is_shortlisted?: boolean | null
          job_id: string
          reject_meta?: Json | null
          reject_reasons?: string[] | null
          rejected_at?: string | null
          resume_url?: string | null
          stage_changed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          archived_at?: string | null
          cover_letter_url?: string | null
          created_at?: string
          id?: string
          is_shortlisted?: boolean | null
          job_id?: string
          reject_meta?: Json | null
          reject_reasons?: string[] | null
          rejected_at?: string | null
          resume_url?: string | null
          stage_changed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
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
      external_job_feeds: {
        Row: {
          created_at: string | null
          error_count: number | null
          feed_type: string
          fetch_interval_hours: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_fetched_at: string | null
          last_success_at: string | null
          name: string
          parser_config: Json | null
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
          last_error?: string | null
          last_fetched_at?: string | null
          last_success_at?: string | null
          name: string
          parser_config?: Json | null
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
          last_error?: string | null
          last_fetched_at?: string | null
          last_success_at?: string | null
          name?: string
          parser_config?: Json | null
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
      invites: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          invitee_email: string
          issuer_user_id: string
          role_name: string | null
          status: string
          target_id: string
          target_type: string
          token: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_email: string
          issuer_user_id: string
          role_name?: string | null
          status?: string
          target_id: string
          target_type: string
          token: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_email?: string
          issuer_user_id?: string
          role_name?: string | null
          status?: string
          target_id?: string
          target_type?: string
          token?: string
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
        ]
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
      jobs: {
        Row: {
          address: Json | null
          closes_at: string | null
          compensation: Json | null
          created_at: string
          created_by_user_id: string | null
          description: Json | null
          employment_type: string | null
          geo: unknown
          id: string
          location: string | null
          min_reputation: number | null
          organization_id: string
          pay_range_max_cents: number | null
          pay_range_min_cents: number | null
          pay_range_type: string | null
          position_level: string | null
          posted_at: string | null
          remote_option: string | null
          search_tsv: unknown
          slug: string | null
          status: string
          team_id: string | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          address?: Json | null
          closes_at?: string | null
          compensation?: Json | null
          created_at?: string
          created_by_user_id?: string | null
          description?: Json | null
          employment_type?: string | null
          geo?: unknown
          id?: string
          location?: string | null
          min_reputation?: number | null
          organization_id: string
          pay_range_max_cents?: number | null
          pay_range_min_cents?: number | null
          pay_range_type?: string | null
          position_level?: string | null
          posted_at?: string | null
          remote_option?: string | null
          search_tsv?: unknown
          slug?: string | null
          status?: string
          team_id?: string | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          address?: Json | null
          closes_at?: string | null
          compensation?: Json | null
          created_at?: string
          created_by_user_id?: string | null
          description?: Json | null
          employment_type?: string | null
          geo?: unknown
          id?: string
          location?: string | null
          min_reputation?: number | null
          organization_id?: string
          pay_range_max_cents?: number | null
          pay_range_min_cents?: number | null
          pay_range_type?: string | null
          position_level?: string | null
          posted_at?: string | null
          remote_option?: string | null
          search_tsv?: unknown
          slug?: string | null
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
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
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      notifications: {
        Row: {
          archived_at: string | null
          body: Json
          created_at: string | null
          cta_label: string | null
          cta_url: string | null
          dedupe_key: string | null
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
          count: number
          created_at: string
          examples: Json
          id: number
          last_event_at: string
          processed_at: string | null
          type: Database["core"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
          channels: Database["core"]["Enums"]["notification_channel"][]
        }
        Insert: {
          bucket: string
          count?: number
          created_at?: string
          examples?: Json
          id?: number
          last_event_at?: string
          processed_at?: string | null
          type: Database["core"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
          channels?: Database["core"]["Enums"]["notification_channel"][]
        }
        Update: {
          bucket?: string
          count?: number
          created_at?: string
          examples?: Json
          id?: number
          last_event_at?: string
          processed_at?: string | null
          type?: Database["core"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
          channels?: Database["core"]["Enums"]["notification_channel"][]
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
          created_at: string | null
          digest_frequency: Database["core"]["Enums"]["notification_frequency"]
          global_enabled: boolean
          quiet_hours: Json | null
          type_overrides: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_enabled?: Json
          created_at?: string | null
          digest_frequency?: Database["core"]["Enums"]["notification_frequency"]
          global_enabled?: boolean
          quiet_hours?: Json | null
          type_overrides?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_enabled?: Json
          created_at?: string | null
          digest_frequency?: Database["core"]["Enums"]["notification_frequency"]
          global_enabled?: boolean
          quiet_hours?: Json | null
          type_overrides?: Json
          updated_at?: string | null
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
      organizations: {
        Row: {
          address: Json | null
          created_at: string
          description: Json | null
          geo: unknown
          id: string
          industry_id: string | null
          logo_url: string | null
          name: string
          owner_user_id: string | null
          search_tsv: unknown
          slug: string
          updated_at: string
          visibility: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          description?: Json | null
          geo?: unknown
          id?: string
          industry_id?: string | null
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          search_tsv?: unknown
          slug: string
          updated_at?: string
          visibility?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          description?: Json | null
          geo?: unknown
          id?: string
          industry_id?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          search_tsv?: unknown
          slug?: string
          updated_at?: string
          visibility?: string | null
          website?: string | null
        }
        Relationships: [
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
      personality_assessments: {
        Row: {
          ai_report: string | null
          ai_report_generated_at: string | null
          completed_at: string | null
          completion_score: number | null
          cooldown_end_time: string | null
          created_at: string | null
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
          next_luscher_test_available_at: string | null
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
          next_luscher_test_available_at?: string | null
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
          next_luscher_test_available_at?: string | null
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
          created_at: string
          current_occupation_code: string | null
          notification_preferences: Json | null
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
        }
        Insert: {
          accepted_privacy_policy_at?: string | null
          accepted_terms_of_service_at?: string | null
          career_assessment_completed_at?: string | null
          created_at?: string
          current_occupation_code?: string | null
          notification_preferences?: Json | null
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
        }
        Update: {
          accepted_privacy_policy_at?: string | null
          accepted_terms_of_service_at?: string | null
          career_assessment_completed_at?: string | null
          created_at?: string
          current_occupation_code?: string | null
          notification_preferences?: Json | null
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
          author_user_id: string
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
          author_user_id: string
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
          author_user_id?: string
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
      team_members: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
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
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          name: string
          organization_id: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          name: string
          organization_id: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organization_id?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certifications: {
        Row: {
          certificate_file_path: string | null
          certification_id: string
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          description: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          certificate_file_path?: string | null
          certification_id: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          certificate_file_path?: string | null
          certification_id?: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
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
          organization_id: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
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
          organization_id?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
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
          organization_id?: string | null
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
      user_skills: {
        Row: {
          created_at: string | null
          csi_skill_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          onet_occupation_id: string | null
          proficiency_level: number | null
          skill_taxonomy: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
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
          skill_taxonomy: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
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
          skill_taxonomy?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          years_experience?: number | null
        }
        Relationships: [
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
    }
    Views: {
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
    }
    Functions: {
      extract_tiptap_plain_text: { Args: { content: Json }; Returns: string }
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
      user_has_role: {
        Args: { p_org_id?: string; p_role_name: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_type: "success" | "warning" | "info"
      notification_channel: ["in_app", "email", "push", "sms"]
      notification_delivery_status: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "bounce",
        "blocked",
      ]
      notification_event_kind: [
        "accepted",
        "delivered",
        "opened",
        "clicked",
        "failed",
        "bounce",
        "complaint",
      ]
      notification_frequency: ["immediate", "digest_daily", "digest_weekly", "mute"]
      notification_severity: ["info", "important", "critical"]
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
      get_masterformat_hierarchy: {
        Args: { code_id: string }
        Returns: {
          code_key: string
          id: string
          level: number
          name: string
        }[]
      }
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
      [_ in never]: never
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
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
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
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
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
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
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
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
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
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
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
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
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
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
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
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
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
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
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
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
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
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
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
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
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
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
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
      review_status: "pending" | "approved" | "rejected" | "flagged"
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
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_bucket_id_fkey"
            columns: ["bucket_id"]
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
          level: number | null
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
          level?: number | null
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
          level?: number | null
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
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
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
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
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
      search_legacy_v1: {
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
      search_v1_optimised: {
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
      buckettype: "STANDARD" | "ANALYTICS"
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
  cms: {
    Enums: {},
  },
  core: {
    Enums: {
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
      notification_frequency: ["immediate", "digest_daily", "digest_weekly", "mute"],
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
      ],
    },
  },
  data: {
    Enums: {},
  },
  onet: {
    Enums: {},
  },
  public: {
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
      review_status: ["pending", "approved", "rejected", "flagged"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const

