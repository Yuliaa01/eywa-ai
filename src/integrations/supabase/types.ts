export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_suggestions: {
        Row: {
          accepted: boolean | null
          category: Database["public"]["Enums"]["activity_category"]
          completed_at: string | null
          context: Json | null
          created_at: string
          date: string
          duration_min: number | null
          id: string
          reasoning: string | null
          title: string
          user_id: string
        }
        Insert: {
          accepted?: boolean | null
          category: Database["public"]["Enums"]["activity_category"]
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          date: string
          duration_min?: number | null
          id?: string
          reasoning?: string | null
          title: string
          user_id: string
        }
        Update: {
          accepted?: boolean | null
          category?: Database["public"]["Enums"]["activity_category"]
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          date?: string
          duration_min?: number | null
          id?: string
          reasoning?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_feedback_unified: {
        Row: {
          generated_at: string
          id: string
          next_best_actions: Json | null
          period: Database["public"]["Enums"]["feedback_period"]
          risk_signals: Json | null
          summary_md: string | null
          user_id: string
          version: number
          wins: Json | null
        }
        Insert: {
          generated_at?: string
          id?: string
          next_best_actions?: Json | null
          period: Database["public"]["Enums"]["feedback_period"]
          risk_signals?: Json | null
          summary_md?: string | null
          user_id: string
          version?: number
          wins?: Json | null
        }
        Update: {
          generated_at?: string
          id?: string
          next_best_actions?: Json | null
          period?: Database["public"]["Enums"]["feedback_period"]
          risk_signals?: Json | null
          summary_md?: string | null
          user_id?: string
          version?: number
          wins?: Json | null
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          actions: Json | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["ai_insight_kind"]
          priority: Database["public"]["Enums"]["insight_priority"]
          rationale: string | null
          source_agent: Database["public"]["Enums"]["ai_agent_type"] | null
          summary: string | null
          title: string
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          actions?: Json | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["ai_insight_kind"]
          priority?: Database["public"]["Enums"]["insight_priority"]
          rationale?: string | null
          source_agent?: Database["public"]["Enums"]["ai_agent_type"] | null
          summary?: string | null
          title: string
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          actions?: Json | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["ai_insight_kind"]
          priority?: Database["public"]["Enums"]["insight_priority"]
          rationale?: string | null
          source_agent?: Database["public"]["Enums"]["ai_agent_type"] | null
          summary?: string | null
          title?: string
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string
          after: Json | null
          at: string
          before: Json | null
          id: string
          resource: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor: string
          after?: Json | null
          at?: string
          before?: Json | null
          id?: string
          resource: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor?: string
          after?: Json | null
          at?: string
          before?: Json | null
          id?: string
          resource?: string
          user_id?: string | null
        }
        Relationships: []
      }
      biomarker_scores: {
        Row: {
          created_at: string
          domain: Database["public"]["Enums"]["biomarker_domain"]
          explanation: string | null
          id: string
          inputs: Json | null
          method: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: Database["public"]["Enums"]["biomarker_domain"]
          explanation?: string | null
          id?: string
          inputs?: Json | null
          method?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: Database["public"]["Enums"]["biomarker_domain"]
          explanation?: string | null
          id?: string
          inputs?: Json | null
          method?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          data_scope: string
          granted_at: string
          id: string
          purpose: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          data_scope: string
          granted_at?: string
          id?: string
          purpose: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          data_scope?: string
          granted_at?: string
          id?: string
          purpose?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_access_grants: {
        Row: {
          expires_at: string | null
          granted_at: string
          id: string
          notes: string | null
          partner_id: string
          revoked_at: string | null
          scope: Json
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          revoked_at?: string | null
          scope?: Json
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          revoked_at?: string | null
          scope?: Json
          user_id?: string
        }
        Relationships: []
      }
      doctor_prompts: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          output_schema: Json | null
          prompt_template: string
          version: number
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          output_schema?: Json | null
          prompt_template: string
          version?: number
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          output_schema?: Json | null
          prompt_template?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_prompts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reviews: {
        Row: {
          doctor_id: string
          generated_at: string
          id: string
          inputs_ref: Json | null
          output_json: Json | null
          summary_md: string | null
          user_id: string
        }
        Insert: {
          doctor_id: string
          generated_at?: string
          id?: string
          inputs_ref?: Json | null
          output_json?: Json | null
          summary_md?: string | null
          user_id: string
        }
        Update: {
          doctor_id?: string
          generated_at?: string
          id?: string
          inputs_ref?: Json | null
          output_json?: Json | null
          summary_md?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean | null
          bio_short: string | null
          created_at: string
          focus_areas: string[] | null
          id: string
          name: string
          role_group: Database["public"]["Enums"]["doctor_role_group"]
          specialty: Database["public"]["Enums"]["doctor_specialty"]
          subspecialty: string | null
        }
        Insert: {
          active?: boolean | null
          bio_short?: string | null
          created_at?: string
          focus_areas?: string[] | null
          id?: string
          name: string
          role_group: Database["public"]["Enums"]["doctor_role_group"]
          specialty: Database["public"]["Enums"]["doctor_specialty"]
          subspecialty?: string | null
        }
        Update: {
          active?: boolean | null
          bio_short?: string | null
          created_at?: string
          focus_areas?: string[] | null
          id?: string
          name?: string
          role_group?: Database["public"]["Enums"]["doctor_role_group"]
          specialty?: Database["public"]["Enums"]["doctor_specialty"]
          subspecialty?: string | null
        }
        Relationships: []
      }
      ehr_records: {
        Row: {
          fhir_id: string | null
          fhir_resource_type: string | null
          id: string
          ingested_at: string
          raw_json: Json
          user_id: string
        }
        Insert: {
          fhir_id?: string | null
          fhir_resource_type?: string | null
          id?: string
          ingested_at?: string
          raw_json: Json
          user_id: string
        }
        Update: {
          fhir_id?: string | null
          fhir_resource_type?: string | null
          id?: string
          ingested_at?: string
          raw_json?: Json
          user_id?: string
        }
        Relationships: []
      }
      fasting_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          fasting_window_id: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          fasting_window_id: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          fasting_window_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fasting_logs_fasting_window_id_fkey"
            columns: ["fasting_window_id"]
            isOneToOne: false
            referencedRelation: "fasting_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      fasting_windows: {
        Row: {
          actual_end_at: string | null
          created_at: string
          end_at: string | null
          id: string
          is_paused: boolean | null
          notes: string | null
          protocol: string | null
          start_at: string
          user_id: string
        }
        Insert: {
          actual_end_at?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          protocol?: string | null
          start_at: string
          user_id: string
        }
        Update: {
          actual_end_at?: string | null
          created_at?: string
          end_at?: string | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          protocol?: string | null
          start_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fitness_app_connections: {
        Row: {
          access_token: string | null
          app_name: string
          connected_at: string
          created_at: string
          id: string
          last_synced_at: string | null
          metadata: Json | null
          refresh_token: string | null
          scope: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          app_name: string
          connected_at?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          refresh_token?: string | null
          scope?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          app_name?: string
          connected_at?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          refresh_token?: string | null
          scope?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grocery_list_items: {
        Row: {
          category: string | null
          checked: boolean
          created_at: string
          id: string
          ingredient: string
          quantity: string | null
          source_meal_plan_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          checked?: boolean
          created_at?: string
          id?: string
          ingredient: string
          quantity?: string | null
          source_meal_plan_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          checked?: boolean
          created_at?: string
          id?: string
          ingredient?: string
          quantity?: string | null
          source_meal_plan_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_issues: {
        Row: {
          category: Database["public"]["Enums"]["health_issue_category"]
          created_at: string
          details: string | null
          id: string
          resolved_at: string | null
          severity: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["health_issue_category"]
          created_at?: string
          details?: string | null
          id?: string
          resolved_at?: string | null
          severity?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["health_issue_category"]
          created_at?: string
          details?: string | null
          id?: string
          resolved_at?: string | null
          severity?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string
          error_msg: string | null
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          params: Json | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_msg?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          params?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_msg?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          params?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          collected_at: string | null
          created_at: string
          id: string
          provenance: Json | null
          reference_high: number | null
          reference_low: number | null
          reference_text: string | null
          reported_at: string
          source: Database["public"]["Enums"]["data_source"]
          specimen: Database["public"]["Enums"]["specimen_type"] | null
          test_code: string
          units: string | null
          user_id: string
          value_num: number | null
          value_text: string | null
        }
        Insert: {
          collected_at?: string | null
          created_at?: string
          id?: string
          provenance?: Json | null
          reference_high?: number | null
          reference_low?: number | null
          reference_text?: string | null
          reported_at?: string
          source: Database["public"]["Enums"]["data_source"]
          specimen?: Database["public"]["Enums"]["specimen_type"] | null
          test_code: string
          units?: string | null
          user_id: string
          value_num?: number | null
          value_text?: string | null
        }
        Update: {
          collected_at?: string | null
          created_at?: string
          id?: string
          provenance?: Json | null
          reference_high?: number | null
          reference_low?: number | null
          reference_text?: string | null
          reported_at?: string
          source?: Database["public"]["Enums"]["data_source"]
          specimen?: Database["public"]["Enums"]["specimen_type"] | null
          test_code?: string
          units?: string | null
          user_id?: string
          value_num?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_test_code_fkey"
            columns: ["test_code"]
            isOneToOne: false
            referencedRelation: "tests_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      local_venues: {
        Row: {
          address: string | null
          created_at: string
          geo: unknown
          id: string
          menu_json: Json | null
          name: string
          type: Database["public"]["Enums"]["venue_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          geo?: unknown
          id?: string
          menu_json?: Json | null
          name: string
          type: Database["public"]["Enums"]["venue_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          geo?: unknown
          id?: string
          menu_json?: Json | null
          name?: string
          type?: Database["public"]["Enums"]["venue_type"]
          updated_at?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          date: string
          id: string
          meal_type: string
          recipe_data: Json
          recipe_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meal_type: string
          recipe_data: Json
          recipe_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meal_type?: string
          recipe_data?: Json
          recipe_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "saved_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          items: Json
          notes: string | null
          nutrition_totals: Json | null
          photo_url: string | null
          source: Database["public"]["Enums"]["meal_source"]
          timestamp: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          items: Json
          notes?: string | null
          nutrition_totals?: Json | null
          photo_url?: string | null
          source?: Database["public"]["Enums"]["meal_source"]
          timestamp?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          nutrition_totals?: Json | null
          photo_url?: string | null
          source?: Database["public"]["Enums"]["meal_source"]
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      menstrual_cycles: {
        Row: {
          created_at: string
          cycle_length: number | null
          flow_intensity: string | null
          id: string
          notes: string | null
          period_end_date: string | null
          period_start_date: string
          symptoms: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_length?: number | null
          flow_intensity?: string | null
          id?: string
          notes?: string | null
          period_end_date?: string | null
          period_start_date: string
          symptoms?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_length?: number | null
          flow_intensity?: string | null
          id?: string
          notes?: string | null
          period_end_date?: string | null
          period_start_date?: string
          symptoms?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          active_diets: string[] | null
          allergy_flags: string[] | null
          created_at: string
          daily_calories_target: number | null
          id: string
          macros_target: Json | null
          micros_focus: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_diets?: string[] | null
          allergy_flags?: string[] | null
          created_at?: string
          daily_calories_target?: number | null
          id?: string
          macros_target?: Json | null
          micros_focus?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_diets?: string[] | null
          allergy_flags?: string[] | null
          created_at?: string
          daily_calories_target?: number | null
          id?: string
          macros_target?: Json | null
          micros_focus?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_category: string
          metric_title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_category: string
          metric_title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_category?: string
          metric_title?: string
          user_id?: string
        }
        Relationships: []
      }
      priorities: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location_coords: unknown
          location_name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["priority_status"]
          target_metric: string | null
          target_value: number | null
          time_scope: string | null
          title: string
          type: Database["public"]["Enums"]["priority_type"]
          units: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location_coords?: unknown
          location_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["priority_status"]
          target_metric?: string | null
          target_value?: number | null
          time_scope?: string | null
          title: string
          type: Database["public"]["Enums"]["priority_type"]
          units?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location_coords?: unknown
          location_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["priority_status"]
          target_metric?: string | null
          target_value?: number | null
          time_scope?: string | null
          title?: string
          type?: Database["public"]["Enums"]["priority_type"]
          units?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number
          carbs: number
          category: string
          created_at: string | null
          description: string
          fat: number
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          is_default: boolean | null
          name: string
          prep_time: string
          protein: number
          servings: number
          tags: string[]
          updated_at: string | null
        }
        Insert: {
          calories: number
          carbs: number
          category: string
          created_at?: string | null
          description: string
          fat: number
          id?: string
          image_url?: string | null
          ingredients: Json
          instructions: Json
          is_default?: boolean | null
          name: string
          prep_time: string
          protein: number
          servings: number
          tags: string[]
          updated_at?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string
          created_at?: string | null
          description?: string
          fat?: number
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_default?: boolean | null
          name?: string
          prep_time?: string
          protein?: number
          servings?: number
          tags?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          requirement_type: string
          requirement_value: number
          tier: string
          xp_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          requirement_type: string
          requirement_value: number
          tier: string
          xp_value?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
          tier?: string
          xp_value?: number
        }
        Relationships: []
      }
      saved_doctors: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_recipes: {
        Row: {
          created_at: string
          id: string
          image_data: string | null
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_data?: string | null
          recipe_data: Json
          recipe_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_data?: string | null
          recipe_data?: Json
          recipe_name?: string
          user_id?: string
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          created_at: string
          id: string
          supplement_id: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplement_id: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplement_id?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          created_at: string
          deleted_at: string | null
          dosage: string | null
          form: Database["public"]["Enums"]["supplement_form"] | null
          id: string
          name: string
          notes: string | null
          schedule: Json | null
          source: Database["public"]["Enums"]["supplement_source"]
          units: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dosage?: string | null
          form?: Database["public"]["Enums"]["supplement_form"] | null
          id?: string
          name: string
          notes?: string | null
          schedule?: Json | null
          source?: Database["public"]["Enums"]["supplement_source"]
          units?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dosage?: string | null
          form?: Database["public"]["Enums"]["supplement_form"] | null
          id?: string
          name?: string
          notes?: string | null
          schedule?: Json | null
          source?: Database["public"]["Enums"]["supplement_source"]
          units?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      synced_fitness_activities: {
        Row: {
          activity_name: string | null
          activity_type: string
          app_name: string
          avg_heart_rate: number | null
          calories_burned: number | null
          connection_id: string
          created_at: string
          distance_meters: number | null
          duration_seconds: number | null
          elevation_gain_meters: number | null
          external_id: string
          id: string
          max_heart_rate: number | null
          raw_data: Json | null
          start_time: string
          synced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_name?: string | null
          activity_type: string
          app_name: string
          avg_heart_rate?: number | null
          calories_burned?: number | null
          connection_id: string
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          elevation_gain_meters?: number | null
          external_id: string
          id?: string
          max_heart_rate?: number | null
          raw_data?: Json | null
          start_time: string
          synced_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_name?: string | null
          activity_type?: string
          app_name?: string
          avg_heart_rate?: number | null
          calories_burned?: number | null
          connection_id?: string
          created_at?: string
          distance_meters?: number | null
          duration_seconds?: number | null
          elevation_gain_meters?: number | null
          external_id?: string
          id?: string
          max_heart_rate?: number | null
          raw_data?: Json | null
          start_time?: string
          synced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_fitness_activities_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "fitness_app_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      test_set_items: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          test_code: string
          test_set_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          test_code: string
          test_set_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          test_code?: string
          test_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_set_items_test_set_id_fkey"
            columns: ["test_set_id"]
            isOneToOne: false
            referencedRelation: "test_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sets: {
        Row: {
          base_price: number
          biomarker_domain_focus: string[]
          category: Database["public"]["Enums"]["test_set_category"]
          created_at: string
          description: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          priority_match_keywords: string[]
          recommended_for: string[]
          updated_at: string
        }
        Insert: {
          base_price: number
          biomarker_domain_focus?: string[]
          category: Database["public"]["Enums"]["test_set_category"]
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          priority_match_keywords?: string[]
          recommended_for?: string[]
          updated_at?: string
        }
        Update: {
          base_price?: number
          biomarker_domain_focus?: string[]
          category?: Database["public"]["Enums"]["test_set_category"]
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          priority_match_keywords?: string[]
          recommended_for?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      tests_catalog: {
        Row: {
          ai_feature_mapping: string[] | null
          analyte_type: Database["public"]["Enums"]["analyte_type"]
          code: string
          created_at: string
          domain: Database["public"]["Enums"]["biomarker_domain"]
          id: string
          interpretation_notes: string | null
          name: string
          primary_purpose: string | null
          reference_notes: string | null
          reference_range_high: number | null
          reference_range_low: number | null
          source_api: string | null
          specimen: Database["public"]["Enums"]["specimen_type"] | null
          suggested_cadence: string | null
          units: string | null
        }
        Insert: {
          ai_feature_mapping?: string[] | null
          analyte_type: Database["public"]["Enums"]["analyte_type"]
          code: string
          created_at?: string
          domain: Database["public"]["Enums"]["biomarker_domain"]
          id?: string
          interpretation_notes?: string | null
          name: string
          primary_purpose?: string | null
          reference_notes?: string | null
          reference_range_high?: number | null
          reference_range_low?: number | null
          source_api?: string | null
          specimen?: Database["public"]["Enums"]["specimen_type"] | null
          suggested_cadence?: string | null
          units?: string | null
        }
        Update: {
          ai_feature_mapping?: string[] | null
          analyte_type?: Database["public"]["Enums"]["analyte_type"]
          code?: string
          created_at?: string
          domain?: Database["public"]["Enums"]["biomarker_domain"]
          id?: string
          interpretation_notes?: string | null
          name?: string
          primary_purpose?: string | null
          reference_notes?: string | null
          reference_range_high?: number | null
          reference_range_low?: number | null
          source_api?: string | null
          specimen?: Database["public"]["Enums"]["specimen_type"] | null
          suggested_cadence?: string | null
          units?: string | null
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          created_at: string
          error_message: string | null
          folder_id: string | null
          id: string
          name: string
          parsed_at: string | null
          size: number
          status: string
          storage_path: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          folder_id?: string | null
          id?: string
          name: string
          parsed_at?: string | null
          size: number
          status?: string
          storage_path: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          folder_id?: string | null
          id?: string
          name?: string
          parsed_at?: string | null
          size?: number
          status?: string
          storage_path?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "file_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          allergies: string[] | null
          biological_age_estimate: number | null
          chronic_conditions: string[] | null
          created_at: string
          cycle_preferences: Json | null
          diet_preferences: string[] | null
          dob: string | null
          fasting_pref: Json | null
          first_name: string | null
          food_avoidances: string[] | null
          height_cm: number | null
          id: string
          last_name: string | null
          locale: string | null
          medications: string[] | null
          onboarding_completed: boolean | null
          push_notifications_enabled: boolean | null
          religious_diet: string[] | null
          sex_at_birth: Database["public"]["Enums"]["sex_at_birth"] | null
          sleep_schedule_notes: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          view_mode: string | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string[] | null
          biological_age_estimate?: number | null
          chronic_conditions?: string[] | null
          created_at?: string
          cycle_preferences?: Json | null
          diet_preferences?: string[] | null
          dob?: string | null
          fasting_pref?: Json | null
          first_name?: string | null
          food_avoidances?: string[] | null
          height_cm?: number | null
          id?: string
          last_name?: string | null
          locale?: string | null
          medications?: string[] | null
          onboarding_completed?: boolean | null
          push_notifications_enabled?: boolean | null
          religious_diet?: string[] | null
          sex_at_birth?: Database["public"]["Enums"]["sex_at_birth"] | null
          sleep_schedule_notes?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          view_mode?: string | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string[] | null
          biological_age_estimate?: number | null
          chronic_conditions?: string[] | null
          created_at?: string
          cycle_preferences?: Json | null
          diet_preferences?: string[] | null
          dob?: string | null
          fasting_pref?: Json | null
          first_name?: string | null
          food_avoidances?: string[] | null
          height_cm?: number | null
          id?: string
          last_name?: string | null
          locale?: string | null
          medications?: string[] | null
          onboarding_completed?: boolean | null
          push_notifications_enabled?: boolean | null
          religious_diet?: string[] | null
          sex_at_birth?: Database["public"]["Enums"]["sex_at_birth"] | null
          sleep_schedule_notes?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          view_mode?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          earned_at: string
          id: string
          reward_id: string
          trigger_data: Json | null
          user_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          reward_id: string
          trigger_data?: Json | null
          user_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          reward_id?: string
          trigger_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_count: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_count?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_count?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_test_orders: {
        Row: {
          bundle_price: number | null
          collection_kit: boolean | null
          created_at: string
          id: string
          lab_partner: string | null
          ordering_context: string | null
          shipping_tracking: Json | null
          status: Database["public"]["Enums"]["test_order_status"]
          test_code: string
          test_set_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bundle_price?: number | null
          collection_kit?: boolean | null
          created_at?: string
          id?: string
          lab_partner?: string | null
          ordering_context?: string | null
          shipping_tracking?: Json | null
          status?: Database["public"]["Enums"]["test_order_status"]
          test_code: string
          test_set_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bundle_price?: number | null
          collection_kit?: boolean | null
          created_at?: string
          id?: string
          lab_partner?: string | null
          ordering_context?: string | null
          shipping_tracking?: Json | null
          status?: Database["public"]["Enums"]["test_order_status"]
          test_code?: string
          test_set_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_test_orders_test_code_fkey"
            columns: ["test_code"]
            isOneToOne: false
            referencedRelation: "tests_catalog"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_test_orders_test_set_id_fkey"
            columns: ["test_set_id"]
            isOneToOne: false
            referencedRelation: "test_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_interactions: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          liked: boolean
          saved: boolean
          shared: boolean
          updated_at: string
          user_id: string
          video_id: string
          watched_seconds: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          liked?: boolean
          saved?: boolean
          shared?: boolean
          updated_at?: string
          user_id: string
          video_id: string
          watched_seconds?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          liked?: boolean
          saved?: boolean
          shared?: boolean
          updated_at?: string
          user_id?: string
          video_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_video_interactions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_content"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vitamin_orders: {
        Row: {
          bundle_id: string | null
          created_at: string
          dosage_selected: string | null
          id: string
          notes: string | null
          quantity: number
          shipping_address: Json | null
          status: Database["public"]["Enums"]["vitamin_order_status"]
          total_price: number
          tracking_info: Json | null
          unit_price: number
          updated_at: string
          user_id: string
          vitamin_id: string | null
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string
          dosage_selected?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["vitamin_order_status"]
          total_price: number
          tracking_info?: Json | null
          unit_price: number
          updated_at?: string
          user_id: string
          vitamin_id?: string | null
        }
        Update: {
          bundle_id?: string | null
          created_at?: string
          dosage_selected?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["vitamin_order_status"]
          total_price?: number
          tracking_info?: Json | null
          unit_price?: number
          updated_at?: string
          user_id?: string
          vitamin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_vitamin_orders_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "vitamin_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vitamin_orders_vitamin_id_fkey"
            columns: ["vitamin_id"]
            isOneToOne: false
            referencedRelation: "vitamins_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      video_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon_name: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      video_content: {
        Row: {
          category_id: string | null
          content_type: Database["public"]["Enums"]["video_content_type"]
          created_at: string
          creator_avatar_url: string | null
          creator_name: string
          description: string | null
          difficulty_level: string
          duration_seconds: number
          health_domains: string[]
          id: string
          is_active: boolean
          is_featured: boolean
          is_premium: boolean
          likes_count: number
          saves_count: number
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          views_count: number
        }
        Insert: {
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["video_content_type"]
          created_at?: string
          creator_avatar_url?: string | null
          creator_name: string
          description?: string | null
          difficulty_level?: string
          duration_seconds?: number
          health_domains?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_premium?: boolean
          likes_count?: number
          saves_count?: number
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          views_count?: number
        }
        Update: {
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["video_content_type"]
          created_at?: string
          creator_avatar_url?: string | null
          creator_name?: string
          description?: string | null
          difficulty_level?: string
          duration_seconds?: number
          health_domains?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_premium?: boolean
          likes_count?: number
          saves_count?: number
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      video_playlists: {
        Row: {
          created_at: string
          description: string | null
          health_goal: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          thumbnail_url: string | null
          updated_at: string
          video_ids: string[]
        }
        Insert: {
          created_at?: string
          description?: string | null
          health_goal?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          video_ids?: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          health_goal?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_ids?: string[]
        }
        Relationships: []
      }
      vitals_stream: {
        Row: {
          created_at: string
          id: string
          metric: Database["public"]["Enums"]["vital_metric"]
          recorded_at: string
          source: Database["public"]["Enums"]["data_source"]
          units: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: Database["public"]["Enums"]["vital_metric"]
          recorded_at: string
          source: Database["public"]["Enums"]["data_source"]
          units?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: Database["public"]["Enums"]["vital_metric"]
          recorded_at?: string
          source?: Database["public"]["Enums"]["data_source"]
          units?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      vitamin_bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          dosage_selected: string | null
          id: string
          vitamin_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          dosage_selected?: string | null
          id?: string
          vitamin_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          dosage_selected?: string | null
          id?: string
          vitamin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vitamin_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "vitamin_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitamin_bundle_items_vitamin_id_fkey"
            columns: ["vitamin_id"]
            isOneToOne: false
            referencedRelation: "vitamins_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      vitamin_bundles: {
        Row: {
          base_price: number
          category: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          priority_match_keywords: string[]
          recommended_for: string[]
          updated_at: string
        }
        Insert: {
          base_price: number
          category: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          priority_match_keywords?: string[]
          recommended_for?: string[]
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          priority_match_keywords?: string[]
          recommended_for?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      vitamins_catalog: {
        Row: {
          base_price: number
          benefits: string[]
          biomarker_targets: string[]
          brand: string | null
          category: Database["public"]["Enums"]["vitamin_category"]
          created_at: string
          description: string
          display_order: number
          dosage_options: Json
          form: Database["public"]["Enums"]["vitamin_form"]
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          suggested_for: string[]
          updated_at: string
        }
        Insert: {
          base_price: number
          benefits?: string[]
          biomarker_targets?: string[]
          brand?: string | null
          category: Database["public"]["Enums"]["vitamin_category"]
          created_at?: string
          description: string
          display_order?: number
          dosage_options?: Json
          form: Database["public"]["Enums"]["vitamin_form"]
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          suggested_for?: string[]
          updated_at?: string
        }
        Update: {
          base_price?: number
          benefits?: string[]
          biomarker_targets?: string[]
          brand?: string | null
          category?: Database["public"]["Enums"]["vitamin_category"]
          created_at?: string
          description?: string
          display_order?: number
          dosage_options?: Json
          form?: Database["public"]["Enums"]["vitamin_form"]
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          suggested_for?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          block_name: string
          created_at: string
          id: string
          microcycle_week: number | null
          sessions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_name: string
          created_at?: string
          id?: string
          microcycle_week?: number | null
          sessions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_name?: string
          created_at?: string
          id?: string
          microcycle_week?: number | null
          sessions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_partner_safe_profile: {
        Args: { _partner_id: string; _target_user_id: string }
        Returns: {
          first_name: string
          locale: string
          onboarding_completed: boolean
          timezone: string
          user_id: string
        }[]
      }
      has_partner_access: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      has_partner_access_for_table: {
        Args: { _partner_id: string; _table_name: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_partner_access: {
        Args: {
          _action?: string
          _partner_id: string
          _resource: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_category:
        | "walk"
        | "mobility"
        | "sport"
        | "strength"
        | "cardio"
        | "yoga"
        | "hiit"
        | "recovery"
        | "movement"
        | "nutrition"
        | "sleep"
        | "mindset"
        | "medical"
      activity_context: "home" | "outdoor" | "gym"
      ai_agent_type:
        | "planner"
        | "analysis"
        | "meal_coach"
        | "fitness_coach"
        | "longevity_agent"
        | "safety_agent"
      ai_insight_kind:
        | "meal"
        | "supplement"
        | "training"
        | "sleep"
        | "stress"
        | "risk_flag"
        | "education"
        | "longevity"
      analyte_type: "lab" | "sensor" | "imaging" | "questionnaire"
      app_role: "user" | "provider" | "admin" | "system" | "partner"
      biomarker_domain:
        | "vitamins"
        | "minerals"
        | "hormones"
        | "metabolic_lipids"
        | "inflammation_immunity"
        | "organ_function"
        | "bone_health"
        | "gi_microbiome"
        | "cardio_resp"
        | "sleep_recovery"
        | "neuro_cognitive"
        | "female_health"
        | "urinalysis"
        | "genetics"
      data_source:
        | "apple_health"
        | "fitbit"
        | "oura"
        | "whoop"
        | "garmin"
        | "dexcom"
        | "withings"
        | "manual"
        | "clinic"
        | "home_kit"
        | "fhir"
        | "google_fit"
        | "samsung_health"
      doctor_role_group:
        | "primary_care"
        | "specialist"
        | "fitness"
        | "longevity"
        | "mental_health"
        | "clinical"
        | "lifestyle"
        | "research"
      doctor_specialty:
        | "primary_care"
        | "cardiology"
        | "endocrinology"
        | "gastroenterology"
        | "neurology"
        | "pulmonology"
        | "psychiatry"
        | "rheumatology"
        | "dermatology"
        | "allergy_immunology"
        | "urology"
        | "ophthalmology"
        | "orthopedics"
        | "oncology"
        | "ent"
        | "nephrology"
        | "dietitian"
        | "health_coach"
        | "geriatrics"
        | "functional_integrative"
        | "biogerontology"
        | "internal_medicine"
        | "pediatrics"
      feedback_period: "daily" | "weekly" | "monthly"
      health_issue_category:
        | "anxiety"
        | "symptom"
        | "concern"
        | "pain"
        | "sleep"
        | "digestion"
        | "other"
      insight_priority: "low" | "medium" | "high" | "critical"
      job_status: "queued" | "running" | "succeeded" | "failed"
      meal_source: "manual" | "barcode" | "photo_ai"
      priority_status: "planned" | "in_progress" | "completed" | "paused"
      priority_type:
        | "global_goal"
        | "temporary_goal"
        | "wish"
        | "plan_trip"
        | "plan_event"
      sex_at_birth: "male" | "female" | "intersex" | "unknown"
      specimen_type:
        | "serum"
        | "plasma"
        | "whole_blood"
        | "urine"
        | "stool"
        | "saliva"
        | "breath"
        | "imaging"
        | "wearable"
      supplement_form: "tablet" | "capsule" | "liquid" | "powder" | "gummy"
      supplement_source: "doctor" | "ai" | "user"
      test_order_status: "ordered" | "collected" | "reported" | "canceled"
      test_set_category:
        | "metabolic"
        | "hormonal"
        | "cardiovascular"
        | "performance"
        | "preventive"
      user_status: "active" | "paused" | "deleted"
      venue_type: "cafe" | "restaurant" | "grocery" | "delivery"
      video_content_type: "reel" | "education" | "tutorial"
      vital_metric:
        | "hr"
        | "hrv_rmssd"
        | "rhr"
        | "spo2"
        | "resp_rate"
        | "temp"
        | "steps"
        | "vo2max_est"
        | "bp_sys"
        | "bp_dia"
        | "glucose"
        | "weight"
        | "body_fat"
        | "bmi"
        | "sleep_duration"
        | "sleep_deep"
        | "sleep_rem"
        | "calories_burned"
        | "active_energy"
        | "skeletal_muscle_mass"
        | "waist_circumference"
        | "visceral_fat"
        | "body_water"
        | "body_protein"
        | "minerals"
        | "metabolic_rate"
      vitamin_category:
        | "vitamins"
        | "minerals"
        | "amino_acids"
        | "herbs"
        | "probiotics"
        | "omega_fatty_acids"
        | "specialty"
      vitamin_form:
        | "capsule"
        | "tablet"
        | "softgel"
        | "powder"
        | "liquid"
        | "gummy"
      vitamin_order_status:
        | "pending"
        | "ordered"
        | "shipped"
        | "delivered"
        | "canceled"
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
      activity_category: [
        "walk",
        "mobility",
        "sport",
        "strength",
        "cardio",
        "yoga",
        "hiit",
        "recovery",
        "movement",
        "nutrition",
        "sleep",
        "mindset",
        "medical",
      ],
      activity_context: ["home", "outdoor", "gym"],
      ai_agent_type: [
        "planner",
        "analysis",
        "meal_coach",
        "fitness_coach",
        "longevity_agent",
        "safety_agent",
      ],
      ai_insight_kind: [
        "meal",
        "supplement",
        "training",
        "sleep",
        "stress",
        "risk_flag",
        "education",
        "longevity",
      ],
      analyte_type: ["lab", "sensor", "imaging", "questionnaire"],
      app_role: ["user", "provider", "admin", "system", "partner"],
      biomarker_domain: [
        "vitamins",
        "minerals",
        "hormones",
        "metabolic_lipids",
        "inflammation_immunity",
        "organ_function",
        "bone_health",
        "gi_microbiome",
        "cardio_resp",
        "sleep_recovery",
        "neuro_cognitive",
        "female_health",
        "urinalysis",
        "genetics",
      ],
      data_source: [
        "apple_health",
        "fitbit",
        "oura",
        "whoop",
        "garmin",
        "dexcom",
        "withings",
        "manual",
        "clinic",
        "home_kit",
        "fhir",
        "google_fit",
        "samsung_health",
      ],
      doctor_role_group: [
        "primary_care",
        "specialist",
        "fitness",
        "longevity",
        "mental_health",
        "clinical",
        "lifestyle",
        "research",
      ],
      doctor_specialty: [
        "primary_care",
        "cardiology",
        "endocrinology",
        "gastroenterology",
        "neurology",
        "pulmonology",
        "psychiatry",
        "rheumatology",
        "dermatology",
        "allergy_immunology",
        "urology",
        "ophthalmology",
        "orthopedics",
        "oncology",
        "ent",
        "nephrology",
        "dietitian",
        "health_coach",
        "geriatrics",
        "functional_integrative",
        "biogerontology",
        "internal_medicine",
        "pediatrics",
      ],
      feedback_period: ["daily", "weekly", "monthly"],
      health_issue_category: [
        "anxiety",
        "symptom",
        "concern",
        "pain",
        "sleep",
        "digestion",
        "other",
      ],
      insight_priority: ["low", "medium", "high", "critical"],
      job_status: ["queued", "running", "succeeded", "failed"],
      meal_source: ["manual", "barcode", "photo_ai"],
      priority_status: ["planned", "in_progress", "completed", "paused"],
      priority_type: [
        "global_goal",
        "temporary_goal",
        "wish",
        "plan_trip",
        "plan_event",
      ],
      sex_at_birth: ["male", "female", "intersex", "unknown"],
      specimen_type: [
        "serum",
        "plasma",
        "whole_blood",
        "urine",
        "stool",
        "saliva",
        "breath",
        "imaging",
        "wearable",
      ],
      supplement_form: ["tablet", "capsule", "liquid", "powder", "gummy"],
      supplement_source: ["doctor", "ai", "user"],
      test_order_status: ["ordered", "collected", "reported", "canceled"],
      test_set_category: [
        "metabolic",
        "hormonal",
        "cardiovascular",
        "performance",
        "preventive",
      ],
      user_status: ["active", "paused", "deleted"],
      venue_type: ["cafe", "restaurant", "grocery", "delivery"],
      video_content_type: ["reel", "education", "tutorial"],
      vital_metric: [
        "hr",
        "hrv_rmssd",
        "rhr",
        "spo2",
        "resp_rate",
        "temp",
        "steps",
        "vo2max_est",
        "bp_sys",
        "bp_dia",
        "glucose",
        "weight",
        "body_fat",
        "bmi",
        "sleep_duration",
        "sleep_deep",
        "sleep_rem",
        "calories_burned",
        "active_energy",
        "skeletal_muscle_mass",
        "waist_circumference",
        "visceral_fat",
        "body_water",
        "body_protein",
        "minerals",
        "metabolic_rate",
      ],
      vitamin_category: [
        "vitamins",
        "minerals",
        "amino_acids",
        "herbs",
        "probiotics",
        "omega_fatty_acids",
        "specialty",
      ],
      vitamin_form: [
        "capsule",
        "tablet",
        "softgel",
        "powder",
        "liquid",
        "gummy",
      ],
      vitamin_order_status: [
        "pending",
        "ordered",
        "shipped",
        "delivered",
        "canceled",
      ],
    },
  },
} as const
