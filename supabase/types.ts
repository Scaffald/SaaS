export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      affiliates: {
        Row: {
          affiliate_code: string | null
          affiliate_url: string
          commission_terms: string | null
          created_at: string
          cta_label: string | null
          description: string | null
          id: string
          industry_id: string | null
          is_active: boolean
          metadata: Json
          name: string
          program_type: string | null
          type: Database['public']['Enums']['affiliate_type']
          updated_at: string
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_url: string
          commission_terms?: string | null
          created_at?: string
          cta_label?: string | null
          description?: string | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          metadata?: Json
          name: string
          program_type?: string | null
          type?: Database['public']['Enums']['affiliate_type']
          updated_at?: string
        }
        Update: {
          affiliate_code?: string | null
          affiliate_url?: string
          commission_terms?: string | null
          created_at?: string
          cta_label?: string | null
          description?: string | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          metadata?: Json
          name?: string
          program_type?: string | null
          type?: Database['public']['Enums']['affiliate_type']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'affiliates_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
        ]
      }
      achievements: {
        Row: {
          created_at: string
          goal: number
          id: string
          name: string
          profile_id: string | null
          progress: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal: number
          id?: string
          name: string
          profile_id?: string | null
          progress: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal?: number
          id?: string
          name?: string
          profile_id?: string | null
          progress?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'achievements_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          name: string
          profile_id: string | null
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          name: string
          profile_id?: string | null
          start_time?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          name?: string
          profile_id?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_user_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      installs: {
        Row: {
          expo_tokens: string[] | null
          user_id: string
        }
        Insert: {
          expo_tokens?: string[] | null
          user_id: string
        }
        Update: {
          expo_tokens?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'installs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      posts: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          profile_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          profile_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          profile_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      industries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: Json | null
          annual_revenue_range: string | null
          created_at: string
          description: string | null
          employee_count_range: string | null
          geo: unknown | null
          id: string
          industry_id: string | null
          logo_url: string | null
          name: string
          owner_user_id: string | null
          slug: string
          updated_at: string
          visibility: 'public' | 'private'
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          annual_revenue_range?: string | null
          created_at?: string
          description?: string | null
          employee_count_range?: string | null
          geo?: unknown | null
          id?: string
          industry_id?: string | null
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          slug: string
          updated_at?: string
          visibility?: 'public' | 'private'
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          annual_revenue_range?: string | null
          created_at?: string
          description?: string | null
          employee_count_range?: string | null
          geo?: unknown | null
          id?: string
          industry_id?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          slug?: string
          updated_at?: string
          visibility?: 'public' | 'private'
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organizations_owner_user_id_fkey'
            columns: ['owner_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          id: string
          name: string | null
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          id: string
          name?: string | null
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      profile_verifications: {
        Row: {
          field: string
          id: string
          notes: string | null
          revoked_at: string | null
          source: string | null
          subject_id: string
          subject_type: Database['public']['Enums']['profile_verification_subject']
          verified_at: string
          verified_by: string
        }
        Insert: {
          field: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          source?: string | null
          subject_id: string
          subject_type: Database['public']['Enums']['profile_verification_subject']
          verified_at?: string
          verified_by: string
        }
        Update: {
          field?: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          source?: string | null
          subject_id?: string
          subject_type?: Database['public']['Enums']['profile_verification_subject']
          verified_at?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_verifications_verified_by_fkey'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_private: {
        Row: {
          address: Json | null
          availability: string[] | null
          certifications: string[] | null
          contact_prefs: string[] | null
          created_at: string
          education_level: string | null
          email: string | null
          geo: unknown
          hourly_rate_cents: number | null
          location: string | null
          open_to_travel: boolean | null
          phone: string | null
          phone_os: string | null
          drivers_license_class: string | null
          travel_mileage: number | null
          updated_at: string
          us_passport: boolean | null
          us_resident: boolean | null
          user_id: string
          veteran: boolean | null
        }
        Insert: {
          address?: Json | null
          availability?: string[] | null
          certifications?: string[] | null
          contact_prefs?: string[] | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          geo?: unknown
          hourly_rate_cents?: number | null
          location?: string | null
          open_to_travel?: boolean | null
          phone?: string | null
          phone_os?: string | null
          drivers_license_class?: string | null
          travel_mileage?: number | null
          updated_at?: string
          us_passport?: boolean | null
          us_resident?: boolean | null
          user_id: string
          veteran?: boolean | null
        }
        Update: {
          address?: Json | null
          availability?: string[] | null
          certifications?: string[] | null
          contact_prefs?: string[] | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          geo?: unknown
          hourly_rate_cents?: number | null
          location?: string | null
          open_to_travel?: boolean | null
          phone?: string | null
          phone_os?: string | null
          drivers_license_class?: string | null
          travel_mileage?: number | null
          updated_at?: string
          us_passport?: boolean | null
          us_resident?: boolean | null
          user_id?: string
          veteran?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_private_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          number_of_days: number | null
          paid_project: boolean | null
          profile_id: string | null
          project_type: string | null
          street: string | null
          updated_at: string
          us_zip_code: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          number_of_days?: number | null
          paid_project?: boolean | null
          profile_id?: string | null
          project_type?: string | null
          street?: string | null
          updated_at?: string
          us_zip_code?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          number_of_days?: number | null
          paid_project?: boolean | null
          profile_id?: string | null
          project_type?: string | null
          street?: string | null
          updated_at?: string
          us_zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'projects_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          scope: 'platform' | 'organization' | 'team'
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scope: 'platform' | 'organization' | 'team'
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scope?: 'platform' | 'organization' | 'team'
        }
        Relationships: []
      }
      role_assignments: {
        Row: {
          created_at: string
          id: string
          role_id: string | null
          scope_org_id: string | null
          scope_team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role_id?: string | null
          scope_org_id?: string | null
          scope_team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string | null
          scope_org_id?: string | null
          scope_team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'role_assignments_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'role_assignments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string | null
          referrer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'referrals_referred_id_fkey'
            columns: ['referred_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referrals_referrer_id_fkey'
            columns: ['referrer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      role_assignments: {
        Row: {
          created_at: string
          id: string
          role_id: string | null
          scope_org_id: string | null
          scope_team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role_id?: string | null
          scope_org_id?: string | null
          scope_team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string | null
          scope_org_id?: string | null
          scope_team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'role_assignments_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'role_assignments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          scope: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scope: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scope?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_media_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          headline: string | null
          id: string
          industry_id: string | null
          open_to_work: boolean | null
          skills_summary: Json | null
          slug: string | null
          updated_at: string
          username: string | null
          years_of_experience: number | null
        }
        Insert: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
          updated_at?: string
          username?: string | null
          years_of_experience?: number | null
        }
        Update: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id?: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
          updated_at?: string
          username?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'users_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
        ]
      }
      user_stats: {
        Row: {
          arr: number | null
          created_at: string
          id: string
          mrr: number | null
          profile_id: string | null
          updated_at: string
          weekly_post_views: number | null
        }
        Insert: {
          arr?: number | null
          created_at?: string
          id?: string
          mrr?: number | null
          profile_id?: string | null
          updated_at?: string
          weekly_post_views?: number | null
        }
        Update: {
          arr?: number | null
          created_at?: string
          id?: string
          mrr?: number | null
          profile_id?: string | null
          updated_at?: string
          weekly_post_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_stats_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_media_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          headline: string | null
          id: string
          industry_id: string | null
          open_to_work: boolean | null
          skills_summary: Json | null
          slug: string | null
          updated_at: string
          username: string | null
          years_of_experience: number | null
        }
        Insert: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
          updated_at?: string
          username?: string | null
          years_of_experience?: number | null
        }
        Update: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id?: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
          updated_at?: string
          username?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'users_industry_id_fkey'
            columns: ['industry_id']
            isOneToOne: false
            referencedRelation: 'industries'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      v_user_private: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          address: Json | null
          geo: unknown
          contact_prefs: string[] | null
          veteran: boolean | null
          us_resident: boolean | null
          us_passport: boolean | null
          travel_mileage: number | null
          education_level: string | null
          hourly_rate_cents: number | null
          location: string | null
          open_to_travel: boolean | null
          drivers_license_class: string | null
          phone_os: string | null
          availability: string[] | null
          certifications: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      v_user_search: {
        Row: {
          avatar_media_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          headline: string | null
          id: string
          industry_id: string | null
          open_to_work: boolean | null
          skills_summary: Json | null
          slug: string | null
          updated_at: string
          username: string | null
          years_of_experience: number | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      v_organization_memberships: {
        Row: {
          address: Json | null
          annual_revenue_range: string | null
          assignment_id: string
          employee_count_range: string | null
          industry_id: string | null
          is_admin: boolean
          is_owner: boolean
          organization_created_at: string
          organization_description: string | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          organization_updated_at: string
          owner_user_id: string | null
          role_id: string | null
          role_name: string | null
          user_id: string | null
          visibility: 'public' | 'private'
          website_url: string | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      profile_verifications_revoke_fields: {
        Args: {
          p_subject_type: Database['public']['Enums']['profile_verification_subject']
          p_subject_id: string
          p_fields: string[] | null
          p_notes?: string | null
          p_revoked_at?: string | null
        }
        Returns: void
      }
      revoke_profile_field: {
        Args: {
          p_actor_id: string | null
          p_subject_type: Database['public']['Enums']['profile_verification_subject']
          p_subject_id: string
          p_field: string
          p_notes?: string | null
          p_revoked_at?: string | null
        }
        Returns: Database['public']['Tables']['profile_verifications']['Row'][]
      }
      user_has_role: {
        Args: {
          p_user_id: string
          p_role_name: string
          p_org_id?: string | null
        }
        Returns: boolean
      }
      verify_profile_field: {
        Args: {
          p_actor_id: string
          p_subject_type: Database['public']['Enums']['profile_verification_subject']
          p_subject_id: string
          p_field: string
          p_source?: string | null
          p_notes?: string | null
          p_verified_at?: string | null
        }
        Returns: Database['public']['Tables']['profile_verifications']['Row']
      }
      create_organization: {
        Args: {
          p_name: string
          p_slug?: string | null
          p_website_url?: string | null
          p_industry_id?: string | null
          p_employee_count_range?: string | null
          p_annual_revenue_range?: string | null
          p_description?: string | null
          p_address?: Json | null
          p_visibility?: 'public' | 'private' | null
        }
        Returns: Database['public']['Tables']['organizations']['Row']
      }
    }
    Enums: {
      affiliate_type: 'education' | 'certification' | 'training' | 'resource'
      profile_verification_subject: 'profile' | 'user' | 'user_private' | 'project'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
