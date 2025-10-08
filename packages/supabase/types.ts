
> scaffald@ supa /Users/clay/Development/SCF-Neue
> dotenv -- pnpx supabase --workdir packages gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          type: Database["public"]["Enums"]["affiliate_type"]
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
          type?: Database["public"]["Enums"]["affiliate_type"]
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
          type?: Database["public"]["Enums"]["affiliate_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: []
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
          {
            foreignKeyName: "application_messages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_messages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_messages_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      application_stage_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_stage_id: string | null
          id: string
          notes: string | null
          reason: string | null
          to_stage_id: string
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_stage_id?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          to_stage_id: string
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_stage_id?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          id: string
          job_id: string
          metadata: Json | null
          notes: Json | null
          pipeline_id: string | null
          pipeline_stage_id: string | null
          resume_path: string | null
          stage_entered_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          notes?: Json | null
          pipeline_id?: string | null
          pipeline_stage_id?: string | null
          resume_path?: string | null
          stage_entered_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          notes?: Json | null
          pipeline_id?: string | null
          pipeline_stage_id?: string | null
          resume_path?: string | null
          stage_entered_at?: string
          status?: string
          updated_at?: string
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
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
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
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_job_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          job_id: string
          notes: string | null
          relationship_type: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          job_id: string
          notes?: string | null
          relationship_type: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          relationship_type?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          category: string | null
          created_at: string
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
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
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
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
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
          updated_at?: string
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
            foreignKeyName: "connections_addressee_user_id_fkey"
            columns: ["addressee_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_addressee_user_id_fkey"
            columns: ["addressee_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_addressee_user_id_fkey"
            columns: ["addressee_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
          {
            foreignKeyName: "connections_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
          {
            foreignKeyName: "external_jobs_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "v_job_import_stats"
            referencedColumns: ["feed_id"]
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
          {
            foreignKeyName: "invites_issuer_user_id_fkey"
            columns: ["issuer_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_issuer_user_id_fkey"
            columns: ["issuer_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_issuer_user_id_fkey"
            columns: ["issuer_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      job_certifications: {
        Row: {
          certification_id: string
          created_at: string
          is_required: boolean | null
          job_id: string
        }
        Insert: {
          certification_id: string
          created_at?: string
          is_required?: boolean | null
          job_id: string
        }
        Update: {
          certification_id?: string
          created_at?: string
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
          {
            foreignKeyName: "job_certifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_certifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      job_pipelines: {
        Row: {
          assigned_by: string | null
          created_at: string
          job_id: string
          pipeline_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          job_id: string
          pipeline_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          job_id?: string
          pipeline_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_pipelines_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pipelines_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          created_at: string
          job_id: string
          required_level: number | null
          skill_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          required_level?: number | null
          skill_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          required_level?: number | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
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
          description: string | null
          drivers_license_type: string | null
          eeo_job_category: string | null
          employment_type: string | null
          enable_auto_reject: boolean | null
          equity_details: string | null
          estimated_application_time_minutes: number | null
          estimated_hire_date: string | null
          external_application_url: string | null
          featured_until: string | null
          geo: unknown | null
          has_bonus_structure: boolean | null
          has_equity: boolean | null
          has_relocation_package: boolean | null
          hiring_manager_id: string | null
          id: string
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
          requires_assessment: boolean | null
          requires_video_interview: boolean | null
          requisition_number: string | null
          search_tsv: unknown | null
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
          team_visibility: string | null
          timezone: string | null
          title: string
          travel_percentage: number | null
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
          description?: string | null
          drivers_license_type?: string | null
          eeo_job_category?: string | null
          employment_type?: string | null
          enable_auto_reject?: boolean | null
          equity_details?: string | null
          estimated_application_time_minutes?: number | null
          estimated_hire_date?: string | null
          external_application_url?: string | null
          featured_until?: string | null
          geo?: unknown | null
          has_bonus_structure?: boolean | null
          has_equity?: boolean | null
          has_relocation_package?: boolean | null
          hiring_manager_id?: string | null
          id?: string
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
          requires_assessment?: boolean | null
          requires_video_interview?: boolean | null
          requisition_number?: string | null
          search_tsv?: unknown | null
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
          team_visibility?: string | null
          timezone?: string | null
          title: string
          travel_percentage?: number | null
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
          description?: string | null
          drivers_license_type?: string | null
          eeo_job_category?: string | null
          employment_type?: string | null
          enable_auto_reject?: boolean | null
          equity_details?: string | null
          estimated_application_time_minutes?: number | null
          estimated_hire_date?: string | null
          external_application_url?: string | null
          featured_until?: string | null
          geo?: unknown | null
          has_bonus_structure?: boolean | null
          has_equity?: boolean | null
          has_relocation_package?: boolean | null
          hiring_manager_id?: string | null
          id?: string
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
          requires_assessment?: boolean | null
          requires_video_interview?: boolean | null
          requisition_number?: string | null
          search_tsv?: unknown | null
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
          team_visibility?: string | null
          timezone?: string | null
          title?: string
          travel_percentage?: number | null
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
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "jobs_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "v_org_directory"
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
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_org_directory"
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
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
      organization_skills: {
        Row: {
          created_at: string
          organization_id: string
          priority: number | null
          required_level: number | null
          skill_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          priority?: number | null
          required_level?: number | null
          skill_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          priority?: number | null
          required_level?: number | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_skills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_org_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
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
          search_tsv: unknown | null
          slug: string
          updated_at: string
          visibility: string | null
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
          search_tsv?: unknown | null
          slug: string
          updated_at?: string
          visibility?: string | null
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
          search_tsv?: unknown | null
          slug?: string
          updated_at?: string
          visibility?: string | null
          website_url?: string | null
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
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          pipeline_id: string
          sla_days: number | null
          stage_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pipeline_id: string
          sla_days?: number | null
          stage_order: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pipeline_id?: string
          sla_days?: number | null
          stage_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_org_directory"
            referencedColumns: ["id"]
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
          subject_type: Database["public"]["Enums"]["profile_verification_subject"]
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
          subject_type: Database["public"]["Enums"]["profile_verification_subject"]
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
          subject_type?: Database["public"]["Enums"]["profile_verification_subject"]
          verified_at?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          avatar_path: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          avatar_path?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          avatar_path?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
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
          created_at: string
          id: string
          rating: number
          review_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          rating: number
          review_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          rating?: number
          review_id?: string
          updated_at?: string
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
      review_flags: {
        Row: {
          created_at: string
          flagged_by_user_id: string
          id: string
          notes: string | null
          reason: string
          review_id: string
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flagged_by_user_id: string
          id?: string
          notes?: string | null
          reason: string
          review_id: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flagged_by_user_id?: string
          id?: string
          notes?: string | null
          reason?: string
          review_id?: string
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_flagged_by_user_id_fkey"
            columns: ["flagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_flagged_by_user_id_fkey"
            columns: ["flagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_flagged_by_user_id_fkey"
            columns: ["flagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_flagged_by_user_id_fkey"
            columns: ["flagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_flagged_by_user_id_fkey"
            columns: ["flagged_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      review_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          last_step_completed: string | null
          review_id: string
          steps_completed: Json
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          last_step_completed?: string | null
          review_id: string
          steps_completed?: Json
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          last_step_completed?: string | null
          review_id?: string
          steps_completed?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_progress_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_skill_proficiency_logs: {
        Row: {
          aggregated_score: number
          created_at: string
          delta: number
          id: string
          new_proficiency: number
          previous_proficiency: number | null
          rating_score: number
          review_id: string
          skill_id: string
          subject_user_id: string
        }
        Insert: {
          aggregated_score: number
          created_at?: string
          delta: number
          id?: string
          new_proficiency: number
          previous_proficiency?: number | null
          rating_score: number
          review_id: string
          skill_id: string
          subject_user_id: string
        }
        Update: {
          aggregated_score?: number
          created_at?: string
          delta?: number
          id?: string
          new_proficiency?: number
          previous_proficiency?: number | null
          rating_score?: number
          review_id?: string
          skill_id?: string
          subject_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_skill_proficiency_logs_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_proficiency_logs_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_proficiency_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_proficiency_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_proficiency_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_proficiency_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_proficiency_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
      review_skill_suggestions: {
        Row: {
          created_at: string
          id: string
          review_id: string
          suggested_label: string | null
          suggested_skill_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          suggested_label?: string | null
          suggested_skill_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          suggested_label?: string | null
          suggested_skill_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_skill_suggestions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_skill_suggestions_suggested_skill_id_fkey"
            columns: ["suggested_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      review_soft_skill_votes: {
        Row: {
          created_at: string
          is_strength: boolean | null
          notes: string | null
          rating: number | null
          review_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string
          is_strength?: boolean | null
          notes?: string | null
          rating?: number | null
          review_id: string
          skill_id: string
        }
        Update: {
          created_at?: string
          is_strength?: boolean | null
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
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_user_id: string
          body: string | null
          comment: string | null
          created_at: string
          headline: string | null
          id: string
          is_comment_public: boolean
          kind: string
          metadata: Json | null
          paired_review_id: string | null
          rating: number | null
          reaction: number | null
          release_after: unknown | null
          revealed_at: string | null
          status: Database["public"]["Enums"]["review_status"]
          subject_id: string
          subject_type: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          author_user_id: string
          body?: string | null
          comment?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_comment_public?: boolean
          kind?: string
          metadata?: Json | null
          paired_review_id?: string | null
          rating?: number | null
          reaction?: number | null
          release_after?: unknown | null
          revealed_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          subject_id: string
          subject_type: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          body?: string | null
          comment?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_comment_public?: boolean
          kind?: string
          metadata?: Json | null
          paired_review_id?: string | null
          rating?: number | null
          reaction?: number | null
          release_after?: unknown | null
          revealed_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          subject_id?: string
          subject_type?: string
          submitted_at?: string | null
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
          {
            foreignKeyName: "reviews_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_paired_review_id_fkey"
            columns: ["paired_review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
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
            foreignKeyName: "role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "v_organization_memberships"
            referencedColumns: ["role_id"]
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
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
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
      skills: {
        Row: {
          active: boolean | null
          created_at: string
          csi_code: string[] | null
          csi_code_key: string | null
          csi_depth: number | null
          csi_display: string | null
          id: string
          industry_id: string | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          csi_code?: string[] | null
          csi_code_key?: string | null
          csi_depth?: number | null
          csi_display?: string | null
          id?: string
          industry_id?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          csi_code?: string[] | null
          csi_code_key?: string | null
          csi_depth?: number | null
          csi_display?: string | null
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
      soft_skills: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          updated_at?: string
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
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          owner_id: string
          owner_type: string
          plan_tier: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          owner_id: string
          owner_type: string
          plan_tier?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          owner_id?: string
          owner_type?: string
          plan_tier?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
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
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_org_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certifications: {
        Row: {
          certificate_file_path: string | null
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          description: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          issuing_organization: string
          name: string
          skills_gained: string[] | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          certificate_file_path?: string | null
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization: string
          name: string
          skills_gained?: string[] | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          certificate_file_path?: string | null
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization?: string
          name?: string
          skills_gained?: string[] | null
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
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_education: {
        Row: {
          activities: string | null
          created_at: string | null
          degree_type: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          gpa: number | null
          honors: string[] | null
          id: string
          institution_name: string
          is_current: boolean | null
          is_verified: boolean | null
          location: string | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities?: string | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          honors?: string[] | null
          id?: string
          institution_name: string
          is_current?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities?: string | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          gpa?: number | null
          honors?: string[] | null
          id?: string
          institution_name?: string
          is_current?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          start_date?: string | null
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
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_experience: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string | null
          description: string | null
          employment_type: string | null
          end_date: string | null
          id: string
          industry: string | null
          is_current: boolean | null
          is_remote: boolean | null
          is_verified: boolean | null
          job_title: string
          key_achievements: string[] | null
          location: string | null
          salary_range: string | null
          skills_used: string[] | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          industry?: string | null
          is_current?: boolean | null
          is_remote?: boolean | null
          is_verified?: boolean | null
          job_title: string
          key_achievements?: string[] | null
          location?: string | null
          salary_range?: string | null
          skills_used?: string[] | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          end_date?: string | null
          id?: string
          industry?: string | null
          is_current?: boolean | null
          is_remote?: boolean | null
          is_verified?: boolean | null
          job_title?: string
          key_achievements?: string[] | null
          location?: string | null
          salary_range?: string | null
          skills_used?: string[] | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          {
            foreignKeyName: "user_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_private: {
        Row: {
          about: string | null
          address: Json | null
          availability: string[] | null
          career_level: string | null
          certifications: string[] | null
          contact_prefs: string[] | null
          created_at: string
          drivers_license_class: string | null
          drivers_license_classes: string[] | null
          education_level: string | null
          email: string | null
          employment_city: string | null
          employment_country: string | null
          employment_state: string | null
          employment_street: string | null
          employment_zip: string | null
          first_name: string | null
          geo: unknown | null
          hourly_rate: number | null
          hourly_rate_cents: number | null
          last_name: string | null
          location: string | null
          military_status: string[] | null
          open_to_travel: boolean | null
          phone: string | null
          phone_os: string | null
          preferred_work_locations: string[] | null
          primary_industry_id: string | null
          residency_countries: string[] | null
          total_years_experience: number | null
          travel_distance_miles: number | null
          travel_mileage: number | null
          updated_at: string
          us_passport: boolean | null
          us_resident: boolean | null
          user_id: string
          veteran: boolean | null
          willing_to_travel: boolean | null
        }
        Insert: {
          about?: string | null
          address?: Json | null
          availability?: string[] | null
          career_level?: string | null
          certifications?: string[] | null
          contact_prefs?: string[] | null
          created_at?: string
          drivers_license_class?: string | null
          drivers_license_classes?: string[] | null
          education_level?: string | null
          email?: string | null
          employment_city?: string | null
          employment_country?: string | null
          employment_state?: string | null
          employment_street?: string | null
          employment_zip?: string | null
          first_name?: string | null
          geo?: unknown | null
          hourly_rate?: number | null
          hourly_rate_cents?: number | null
          last_name?: string | null
          location?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
          phone?: string | null
          phone_os?: string | null
          preferred_work_locations?: string[] | null
          primary_industry_id?: string | null
          residency_countries?: string[] | null
          total_years_experience?: number | null
          travel_distance_miles?: number | null
          travel_mileage?: number | null
          updated_at?: string
          us_passport?: boolean | null
          us_resident?: boolean | null
          user_id: string
          veteran?: boolean | null
          willing_to_travel?: boolean | null
        }
        Update: {
          about?: string | null
          address?: Json | null
          availability?: string[] | null
          career_level?: string | null
          certifications?: string[] | null
          contact_prefs?: string[] | null
          created_at?: string
          drivers_license_class?: string | null
          drivers_license_classes?: string[] | null
          education_level?: string | null
          email?: string | null
          employment_city?: string | null
          employment_country?: string | null
          employment_state?: string | null
          employment_street?: string | null
          employment_zip?: string | null
          first_name?: string | null
          geo?: unknown | null
          hourly_rate?: number | null
          hourly_rate_cents?: number | null
          last_name?: string | null
          location?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
          phone?: string | null
          phone_os?: string | null
          preferred_work_locations?: string[] | null
          primary_industry_id?: string | null
          residency_countries?: string[] | null
          total_years_experience?: number | null
          travel_distance_miles?: number | null
          travel_mileage?: number | null
          updated_at?: string
          us_passport?: boolean | null
          us_resident?: boolean | null
          user_id?: string
          veteran?: boolean | null
          willing_to_travel?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_private_primary_industry_id_fkey"
            columns: ["primary_industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profile_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          created_at: string
          last_verified_at: string | null
          proficiency: number | null
          skill_id: string
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          last_verified_at?: string | null
          proficiency?: number | null
          skill_id: string
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          last_verified_at?: string | null
          proficiency?: number | null
          skill_id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
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
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
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
          search_tsv: unknown | null
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
          search_tsv?: unknown | null
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
          search_tsv?: unknown | null
          skills_summary?: Json | null
          slug?: string | null
          updated_at?: string
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
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      v_applications_with_details: {
        Row: {
          applicant_avatar_path: string | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          applied_at: string | null
          cover_letter: string | null
          employment_type: string | null
          id: string | null
          job_id: string | null
          job_location: string | null
          job_status: string | null
          job_title: string | null
          metadata: Json | null
          notes: Json | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          pay_range_max_cents: number | null
          pay_range_min_cents: number | null
          pay_range_type: string | null
          remote_option: string | null
          resume_path: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
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
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_search"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_with_details"
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
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cron_jobs: {
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
      v_job_import_stats: {
        Row: {
          active_jobs: number | null
          archived_jobs: number | null
          avg_industry_confidence: number | null
          error_count: number | null
          feed_id: string | null
          feed_name: string | null
          feed_type: string | null
          is_active: boolean | null
          last_fetched_at: string | null
          last_success_at: string | null
          mapped_industries: number | null
          most_recent_job_date: string | null
          total_jobs: number | null
          unique_companies: number | null
        }
        Relationships: []
      }
      v_job_search: {
        Row: {
          address: Json | null
          closes_at: string | null
          compensation: Json | null
          description: string | null
          employment_type: string | null
          geo: unknown | null
          id: string | null
          location: string | null
          min_reputation: number | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          position_level: string | null
          posted_at: string | null
          remote_option: string | null
          search_tsv: unknown | null
          skills: string[] | null
          slug: string | null
          status: string | null
          team_id: string | null
          team_name: string | null
          title: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_org_directory"
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
      v_jobs_with_details: {
        Row: {
          address: Json | null
          closes_at: string | null
          compensation: Json | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          employment_type: string | null
          geo: unknown | null
          id: string | null
          location: string | null
          min_reputation: number | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          pay_range_max_cents: number | null
          pay_range_min_cents: number | null
          pay_range_type: string | null
          position_level: string | null
          posted_at: string | null
          remote_option: string | null
          required_certifications: string[] | null
          required_skills: string[] | null
          search_tsv: unknown | null
          slug: string | null
          status: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
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
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_applications_with_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_org_directory"
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
      v_org_directory: {
        Row: {
          address: Json | null
          created_at: string | null
          geo: unknown | null
          id: string | null
          industry_id: string | null
          industry_name: string | null
          name: string | null
          open_jobs: number | null
          search_tsv: unknown | null
          slug: string | null
          team_count: number | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      v_organization_memberships: {
        Row: {
          address: Json | null
          annual_revenue_range: string | null
          assignment_id: string | null
          employee_count_range: string | null
          industry_id: string | null
          is_admin: boolean | null
          is_owner: boolean | null
          organization_created_at: string | null
          organization_description: string | null
          organization_id: string | null
          organization_name: string | null
          organization_slug: string | null
          organization_updated_at: string | null
          owner_user_id: string | null
          role_id: string | null
          role_name: string | null
          user_id: string | null
          visibility: string | null
          website_url: string | null
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
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_search"
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
      v_user_directory: {
        Row: {
          created_at: string | null
          headline: string | null
          id: string | null
          industry_id: string | null
          industry_name: string | null
          name: string | null
          open_to_work: boolean | null
          search_tsv: unknown | null
          slug: string | null
          username: string | null
          years_of_experience: number | null
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
      v_user_private: {
        Row: {
          address: Json | null
          availability: string[] | null
          certifications: string[] | null
          contact_prefs: string[] | null
          created_at: string | null
          drivers_license_class: string | null
          education_level: string | null
          email: string | null
          first_name: string | null
          geo: unknown | null
          hourly_rate_cents: number | null
          id: string | null
          last_name: string | null
          location: string | null
          open_to_travel: boolean | null
          phone: string | null
          phone_os: string | null
          travel_mileage: number | null
          updated_at: string | null
          us_passport: boolean | null
          us_resident: boolean | null
          veteran: boolean | null
        }
        Relationships: []
      }
      v_user_review_summary: {
        Row: {
          areas_to_improve: string[] | null
          last_revealed_at: string | null
          last_submitted_at: string | null
          recommended_skills: string[] | null
          soft_skills: string[] | null
          strengths: string[] | null
          user_id: string | null
        }
        Relationships: []
      }
      v_user_search: {
        Row: {
          avatar_media_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          headline: string | null
          id: string | null
          industry_id: string | null
          open_to_work: boolean | null
          skills_summary: Json | null
          slug: string | null
          updated_at: string | null
          username: string | null
          years_of_experience: number | null
        }
        Insert: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          headline?: string | null
          id?: string | null
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
          updated_at?: string | null
          username?: string | null
          years_of_experience?: number | null
        }
        Update: {
          avatar_media_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          headline?: string | null
          id?: string | null
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string | null
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
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
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
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      apply_profile_revocation_effects: {
        Args: {
          p_fields: string[]
          p_revoked_at: string
          p_subject_id: string
          p_subject_type: Database["public"]["Enums"]["profile_verification_subject"]
        }
        Returns: undefined
      }
      apply_profile_verification_effects: {
        Args: {
          p_field: string
          p_subject_id: string
          p_subject_type: Database["public"]["Enums"]["profile_verification_subject"]
          p_verified_at: string
        }
        Returns: undefined
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_job_content_hash: {
        Args: { p_company: string; p_description: string; p_title: string }
        Returns: string
      }
      check_existing_application: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: boolean
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      create_organization: {
        Args: {
          p_address?: Json
          p_annual_revenue_range?: string
          p_description?: string
          p_employee_count_range?: string
          p_industry_id?: string
          p_name: string
          p_slug?: string
          p_visibility?: string
          p_website_url?: string
        }
        Returns: {
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
          search_tsv: unknown | null
          slug: string
          updated_at: string
          visibility: string | null
          website_url: string | null
        }
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      distance_miles: {
        Args: { a: unknown; b: unknown }
        Returns: number
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      find_csi_skill_by_code: {
        Args: { code_array: string[] }
        Returns: string
      }
      find_similar_jobs: {
        Args: {
          p_company: string
          p_posted_within_days?: number
          p_title: string
        }
        Returns: {
          job_id: string
          similarity_score: number
        }[]
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
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
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_organizations_with_coords: {
        Args: { params?: Json }
        Returns: {
          address: Json
          employee_count_range: string
          id: string
          industry_name: string
          latitude: number
          longitude: number
          name: string
          slug: string
        }[]
      }
      get_parent_skill_info: {
        Args: { p_skill_id: string }
        Returns: {
          active: boolean
          child_count: number
          csi_code: string[]
          csi_display: string
          industry_id: string
          industry_name: string
          skill_id: string
          skill_name: string
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_review_progress_percentage: {
        Args: { p_review_id: string }
        Returns: number
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
      get_skill_hierarchy: {
        Args: { p_skill_id: string }
        Returns: {
          csi_display: string
          depth: number
          hierarchy_ids: string[]
          hierarchy_path: string
          parent_id: string
          skill_id: string
          skill_name: string
        }[]
      }
      get_user_skills_with_parents: {
        Args: { p_user_id: string }
        Returns: {
          csi_display: string
          depth: number
          hierarchy_ids: string[]
          hierarchy_path: string
          is_explicit: boolean
          last_verified_at: string
          proficiency: number
          skill_id: string
          skill_name: string
          source: string
          years_experience: number
        }[]
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_active_subscription: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      jitter_coordinate: {
        Args: { coord: number; max_offset_degrees?: number }
        Returns: number
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      nearby_users: {
        Args: { p_lat: number; p_lon: number; p_radius_miles?: number }
        Returns: {
          headline: string
          id: string
          miles_away: number
          name: string
          years_of_experience: number
        }[]
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
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
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      process_review_submission: {
        Args: { p_review_id: string }
        Returns: undefined
      }
      profile_verifications_revoke_fields: {
        Args: {
          p_fields: string[]
          p_notes?: string
          p_revoked_at?: string
          p_subject_id: string
          p_subject_type: Database["public"]["Enums"]["profile_verification_subject"]
        }
        Returns: undefined
      }
      release_pending_reviews: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      revoke_profile_field: {
        Args: {
          p_actor_id: string
          p_field: string
          p_notes?: string
          p_revoked_at?: string
          p_subject_id: string
          p_subject_type: Database["public"]["Enums"]["profile_verification_subject"]
        }
        Returns: {
          field: string
          id: string
          notes: string | null
          revoked_at: string | null
          source: string | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["profile_verification_subject"]
          verified_at: string
          verified_by: string
        }[]
      }
      search_parent_skills: {
        Args: { p_industry_id: string; p_limit?: number; p_query: string }
        Returns: {
          active: boolean
          child_count: number
          csi_code: string[]
          csi_display: string
          skill_id: string
          skill_name: string
        }[]
      }
      search_users: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          headline: string
          id: string
          name: string
          rank: number
          years_of_experience: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      set_org_context: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
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
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
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
      st_3dperimeter: {
        Args: { "": unknown }
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
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
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
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
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
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
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
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
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
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
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
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
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
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
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
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
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
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
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
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
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
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
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
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
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
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      suggest_industries: {
        Args: { lim?: number; prefix: string }
        Returns: {
          id: string
          name: string
          slug: string
        }[]
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      trigger_job_import: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_review_progress: {
        Args: { p_completed?: boolean; p_review_id: string; p_step: string }
        Returns: undefined
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
      user_has_role: {
        Args: { p_org_id?: string; p_role_name: string; p_user_id: string }
        Returns: boolean
      }
      verify_profile_field: {
        Args: {
          p_actor_id: string
          p_field: string
          p_notes?: string
          p_source?: string
          p_subject_id: string
          p_subject_type: Database["public"]["Enums"]["profile_verification_subject"]
          p_verified_at?: string
        }
        Returns: {
          field: string
          id: string
          notes: string | null
          revoked_at: string | null
          source: string | null
          subject_id: string
          subject_type: Database["public"]["Enums"]["profile_verification_subject"]
          verified_at: string
          verified_by: string
        }
      }
    }
    Enums: {
      affiliate_type: "education" | "certification" | "training" | "resource"
      profile_verification_subject:
        | "profile"
        | "user"
        | "user_private"
        | "project"
      review_status: "draft" | "submitted" | "released"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
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
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
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
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
  public: {
    Enums: {
      affiliate_type: ["education", "certification", "training", "resource"],
      profile_verification_subject: [
        "profile",
        "user",
        "user_private",
        "project",
      ],
      review_status: ["draft", "submitted", "released"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const

