export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: [
          {
            foreignKeyName: "certifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
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
  private: {
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
        Relationships: []
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
          riasec_scores?: Json | null
          target_occupation_codes?: string[] | null
          terms_of_service_version?: string | null
          ui_preferences?: Json | null
          updated_at?: string
          user_id?: string
          user_types?: string[]
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
          geo: unknown | null
          hourly_rate_cents: number | null
          last_name: string | null
          location: string | null
          military_status: string[] | null
          open_to_travel: boolean | null
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
          geo?: unknown | null
          hourly_rate_cents?: number | null
          last_name?: string | null
          location?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
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
          geo?: unknown | null
          hourly_rate_cents?: number | null
          last_name?: string | null
          location?: string | null
          military_status?: string[] | null
          open_to_travel?: boolean | null
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
        Relationships: []
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
        Relationships: []
      }
      user_education: {
        Row: {
          created_at: string | null
          degree_type: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          institution_name: string | null
          is_current: boolean | null
          location: string | null
          start_date: string | null
          university_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution_name?: string | null
          is_current?: boolean | null
          location?: string | null
          start_date?: string | null
          university_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution_name?: string | null
          is_current?: boolean | null
          location?: string | null
          start_date?: string | null
          university_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_experience: {
        Row: {
          company_name: string
          created_at: string | null
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
  public: {
    Tables: {
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
          description: string | null
          employment_type: string | null
          geo: unknown | null
          id: string
          location: string | null
          min_reputation: number | null
          organization_id: string
          position_level: string | null
          posted_at: string | null
          remote_option: string | null
          search_tsv: unknown | null
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
          description?: string | null
          employment_type?: string | null
          geo?: unknown | null
          id?: string
          location?: string | null
          min_reputation?: number | null
          organization_id: string
          position_level?: string | null
          posted_at?: string | null
          remote_option?: string | null
          search_tsv?: unknown | null
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
          description?: string | null
          employment_type?: string | null
          geo?: unknown | null
          id?: string
          location?: string | null
          min_reputation?: number | null
          organization_id?: string
          position_level?: string | null
          posted_at?: string | null
          remote_option?: string | null
          search_tsv?: unknown | null
          slug?: string | null
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string | null
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
          description: string | null
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
          website: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          description?: string | null
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
          website?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          description?: string | null
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
          about: string | null
          avatar_media_id: string | null
          avatar_path: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          headline: string | null
          id: string
          industry_id: string | null
          open_to_work: boolean | null
          skills_summary: Json | null
          slug: string
          tsv: unknown | null
          updated_at: string | null
          username: string
          years_of_experience: number | null
        }
        Insert: {
          about?: string | null
          avatar_media_id?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          headline?: string | null
          id: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug: string
          tsv?: unknown | null
          updated_at?: string | null
          username: string
          years_of_experience?: number | null
        }
        Update: {
          about?: string | null
          avatar_media_id?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          headline?: string | null
          id?: string
          industry_id?: string | null
          open_to_work?: boolean | null
          skills_summary?: Json | null
          slug?: string
          tsv?: unknown | null
          updated_at?: string | null
          username?: string
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
      get_organizations_with_coords: {
        Args: Record<PropertyKey, never>
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
      [_ in never]: never
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
  data: {
    Enums: {},
  },
  onet: {
    Enums: {},
  },
  private: {
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

