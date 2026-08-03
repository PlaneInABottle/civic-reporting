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
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: Database["public"]["Enums"]["actor_type"]
          correlation_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          organization_id: string | null
          summary: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: Database["public"]["Enums"]["actor_type"]
          correlation_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          organization_id?: string | null
          summary: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: Database["public"]["Enums"]["actor_type"]
          correlation_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          organization_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          emergency_exclusion: string
          id: string
          is_active: boolean
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          emergency_exclusion: string
          id?: string
          is_active?: boolean
          key: string
          name: string
        }
        Update: {
          created_at?: string
          emergency_exclusion?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          actor_id: string | null
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string
          operation: string
          organization_id: string | null
          request_hash: string
          result_entity_id: string | null
          result_payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key: string
          operation: string
          organization_id?: string | null
          request_hash: string
          result_entity_id?: string | null
          result_payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          operation?: string
          organization_id?: string | null
          request_hash?: string
          result_entity_id?: string | null
          result_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_deliveries: {
        Row: {
          attempt_count: number
          correlation_id: string
          created_at: string
          endpoint_id: string
          id: string
          last_error_code: string | null
          next_attempt_at: string | null
          organization_id: string
          report_id: string
          state: Database["public"]["Enums"]["delivery_state"]
          updated_at: string
          version: number
        }
        Insert: {
          attempt_count?: number
          correlation_id: string
          created_at?: string
          endpoint_id: string
          id?: string
          last_error_code?: string | null
          next_attempt_at?: string | null
          organization_id: string
          report_id: string
          state?: Database["public"]["Enums"]["delivery_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          attempt_count?: number
          correlation_id?: string
          created_at?: string
          endpoint_id?: string
          id?: string
          last_error_code?: string | null
          next_attempt_at?: string | null
          organization_id?: string
          report_id?: string
          state?: Database["public"]["Enums"]["delivery_state"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "integration_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "integration_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_deliveries_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_endpoints: {
        Row: {
          configuration_state: string
          created_at: string
          destination_kind: string
          id: string
          is_active: boolean
          organization_id: string
          redacted_destination_label: string
          updated_at: string
        }
        Insert: {
          configuration_state: string
          created_at?: string
          destination_kind: string
          id?: string
          is_active?: boolean
          organization_id: string
          redacted_destination_label: string
          updated_at?: string
        }
        Update: {
          configuration_state?: string
          created_at?: string
          destination_kind?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          redacted_destination_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_versions: {
        Row: {
          active_from: string
          boundary: unknown
          created_at: string
          id: string
          jurisdiction_id: string
          policy_label: string
          retired_at: string | null
          version: number
        }
        Insert: {
          active_from: string
          boundary?: unknown
          created_at?: string
          id?: string
          jurisdiction_id: string
          policy_label: string
          retired_at?: string | null
          version: number
        }
        Update: {
          active_from?: string
          boundary?: unknown
          created_at?: string
          id?: string
          jurisdiction_id?: string
          policy_label?: string
          retired_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_versions_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdictions: {
        Row: {
          created_at: string
          id: string
          is_synthetic: boolean
          name: string
          organization_id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_synthetic?: boolean
          name: string
          organization_id: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_synthetic?: boolean
          name?: string
          organization_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdictions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_access_grants: {
        Row: {
          approved_by_user_id: string
          created_at: string
          expires_at: string
          grantee_user_id: string
          id: string
          moderation_case_id: string
          reason: string
          revoked_at: string | null
        }
        Insert: {
          approved_by_user_id: string
          created_at?: string
          expires_at: string
          grantee_user_id: string
          id?: string
          moderation_case_id: string
          reason: string
          revoked_at?: string | null
        }
        Update: {
          approved_by_user_id?: string
          created_at?: string
          expires_at?: string
          grantee_user_id?: string
          id?: string
          moderation_case_id?: string
          reason?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_access_grants_moderation_case_id_fkey"
            columns: ["moderation_case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          actor_id: string
          correlation_id: string
          created_at: string
          id: string
          moderation_case_id: string
          new_state: Database["public"]["Enums"]["moderation_state"]
          previous_state: Database["public"]["Enums"]["moderation_state"]
          reason: string
        }
        Insert: {
          actor_id: string
          correlation_id: string
          created_at?: string
          id?: string
          moderation_case_id: string
          new_state: Database["public"]["Enums"]["moderation_state"]
          previous_state: Database["public"]["Enums"]["moderation_state"]
          reason: string
        }
        Update: {
          actor_id?: string
          correlation_id?: string
          created_at?: string
          id?: string
          moderation_case_id?: string
          new_state?: Database["public"]["Enums"]["moderation_state"]
          previous_state?: Database["public"]["Enums"]["moderation_state"]
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderation_case_id_fkey"
            columns: ["moderation_case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_cases: {
        Row: {
          assigned_moderator_id: string | null
          created_at: string
          decision_summary: string | null
          id: string
          last_provider_at: string | null
          last_provider_code: string | null
          organization_id: string
          provider_attempt_count: number
          report_id: string
          state: Database["public"]["Enums"]["moderation_state"]
          updated_at: string
          version: number
        }
        Insert: {
          assigned_moderator_id?: string | null
          created_at?: string
          decision_summary?: string | null
          id?: string
          last_provider_at?: string | null
          last_provider_code?: string | null
          organization_id: string
          provider_attempt_count?: number
          report_id: string
          state?: Database["public"]["Enums"]["moderation_state"]
          updated_at?: string
          version?: number
        }
        Update: {
          assigned_moderator_id?: string | null
          created_at?: string
          decision_summary?: string | null
          id?: string
          last_provider_at?: string | null
          last_provider_code?: string | null
          organization_id?: string
          provider_attempt_count?: number
          report_id?: string
          state?: Database["public"]["Enums"]["moderation_state"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "moderation_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_signals: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          moderation_case_id: string
          signal_code: string
          signal_kind: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          moderation_case_id: string
          signal_code: string
          signal_kind: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          moderation_case_id?: string
          signal_code?: string
          signal_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_signals_moderation_case_id_fkey"
            columns: ["moderation_case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          jurisdiction_id: string
          organization_id: string
          public_location_precision: Database["public"]["Enums"]["location_precision"]
          routing_label: string
          version: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          jurisdiction_id: string
          organization_id: string
          public_location_precision: Database["public"]["Enums"]["location_precision"]
          routing_label: string
          version?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          jurisdiction_id?: string
          organization_id?: string
          public_location_precision?: Database["public"]["Enums"]["location_precision"]
          routing_label?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_categories_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          preset: Database["public"]["Enums"]["membership_preset"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          preset: Database["public"]["Enums"]["membership_preset"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          preset?: Database["public"]["Enums"]["membership_preset"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_pilot: boolean
          is_test_fixture: boolean
          name: string
          slug: string
          synthetic_notice: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pilot?: boolean
          is_test_fixture?: boolean
          name: string
          slug: string
          synthetic_notice: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pilot?: boolean
          is_test_fixture?: boolean
          name?: string
          slug?: string
          synthetic_notice?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_memberships: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          preset: Database["public"]["Enums"]["platform_preset"]
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          preset: Database["public"]["Enums"]["platform_preset"]
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          preset?: Database["public"]["Enums"]["platform_preset"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          public_alias: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          public_alias?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          public_alias?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_assignments: {
        Row: {
          assigned_by: string
          assignee_user_id: string
          created_at: string
          ended_at: string | null
          id: string
          organization_id: string
          report_id: string
        }
        Insert: {
          assigned_by: string
          assignee_user_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id: string
          report_id: string
        }
        Update: {
          assigned_by?: string
          assignee_user_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_assignments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_drafts: {
        Row: {
          created_at: string
          description: string
          exact_address: string | null
          exact_location: unknown
          expires_at: string
          id: string
          jurisdiction_id: string
          organization_category_id: string | null
          organization_id: string
          public_label: string
          public_location: unknown
          public_location_precision: Database["public"]["Enums"]["location_precision"]
          publication_policy_version: number
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          description: string
          exact_address?: string | null
          exact_location: unknown
          expires_at?: string
          id?: string
          jurisdiction_id: string
          organization_category_id?: string | null
          organization_id: string
          public_label: string
          public_location?: unknown
          public_location_precision: Database["public"]["Enums"]["location_precision"]
          publication_policy_version: number
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string
          exact_address?: string | null
          exact_location?: unknown
          expires_at?: string
          id?: string
          jurisdiction_id?: string
          organization_category_id?: string | null
          organization_id?: string
          public_label?: string
          public_location?: unknown
          public_location_precision?: Database["public"]["Enums"]["location_precision"]
          publication_policy_version?: number
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_drafts_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_drafts_organization_category_id_fkey"
            columns: ["organization_category_id"]
            isOneToOne: false
            referencedRelation: "organization_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_duplicate_links: {
        Row: {
          canonical_report_id: string
          created_at: string
          id: string
          linked_by: string
          report_id: string
        }
        Insert: {
          canonical_report_id: string
          created_at?: string
          id?: string
          linked_by: string
          report_id: string
        }
        Update: {
          canonical_report_id?: string
          created_at?: string
          id?: string
          linked_by?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_duplicate_links_canonical_report_id_fkey"
            columns: ["canonical_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_duplicate_links_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exact_locations: {
        Row: {
          captured_at: string
          exact_address: string | null
          exact_location: unknown
          report_id: string
        }
        Insert: {
          captured_at?: string
          exact_address?: string | null
          exact_location: unknown
          report_id: string
        }
        Update: {
          captured_at?: string
          exact_address?: string | null
          exact_location?: unknown
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_exact_locations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_information_requests: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          private_prompt: string
          private_response: string | null
          report_id: string
          requested_by: string
          responded_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          private_prompt: string
          private_response?: string | null
          report_id: string
          requested_by: string
          responded_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          private_prompt?: string
          private_response?: string | null
          report_id?: string
          requested_by?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_information_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_information_requests_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_internal_notes: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          organization_id: string
          report_id: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          organization_id: string
          report_id: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_internal_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_internal_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_public_locations: {
        Row: {
          created_at: string
          policy_version: number
          precision: Database["public"]["Enums"]["location_precision"]
          public_label: string
          public_location: unknown
          report_id: string
        }
        Insert: {
          created_at?: string
          policy_version: number
          precision: Database["public"]["Enums"]["location_precision"]
          public_label: string
          public_location?: unknown
          report_id: string
        }
        Update: {
          created_at?: string
          policy_version?: number
          precision?: Database["public"]["Enums"]["location_precision"]
          public_label?: string
          public_location?: unknown
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_public_locations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_relationships: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["relationship_kind"]
          notification_level: Database["public"]["Enums"]["notification_level"]
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["relationship_kind"]
          notification_level?: Database["public"]["Enums"]["notification_level"]
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["relationship_kind"]
          notification_level?: Database["public"]["Enums"]["notification_level"]
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_relationships_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_status_events: {
        Row: {
          actor_id: string | null
          actor_type: Database["public"]["Enums"]["actor_type"]
          correlation_id: string
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["report_status"]
          organization_id: string
          previous_status: Database["public"]["Enums"]["report_status"] | null
          private_reason: string | null
          public_label: string
          report_id: string
          source: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          actor_id?: string | null
          actor_type: Database["public"]["Enums"]["actor_type"]
          correlation_id: string
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["report_status"]
          organization_id: string
          previous_status?: Database["public"]["Enums"]["report_status"] | null
          private_reason?: string | null
          public_label: string
          report_id: string
          source: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          actor_id?: string | null
          actor_type?: Database["public"]["Enums"]["actor_type"]
          correlation_id?: string
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["report_status"]
          organization_id?: string
          previous_status?: Database["public"]["Enums"]["report_status"] | null
          private_reason?: string | null
          public_label?: string
          report_id?: string
          source?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "report_status_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_status_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reporter_identities: {
        Row: {
          contact_email: string
          created_at: string
          report_id: string
          reporter_user_id: string
          verified_at: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          report_id: string
          reporter_user_id: string
          verified_at: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          report_id?: string
          reporter_user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporter_identities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          accepted_at: string
          close_reason:
            | Database["public"]["Enums"]["report_close_reason"]
            | null
          description: string
          id: string
          jurisdiction_id: string
          jurisdiction_version_id: string
          organization_category_id: string
          organization_id: string
          public_description: string | null
          public_id: string
          public_title: string | null
          publication_state: Database["public"]["Enums"]["publication_state"]
          source_draft_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          status_version: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string
          close_reason?:
            | Database["public"]["Enums"]["report_close_reason"]
            | null
          description: string
          id?: string
          jurisdiction_id: string
          jurisdiction_version_id: string
          organization_category_id: string
          organization_id: string
          public_description?: string | null
          public_id?: string
          public_title?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state"]
          source_draft_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          status_version?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string
          close_reason?:
            | Database["public"]["Enums"]["report_close_reason"]
            | null
          description?: string
          id?: string
          jurisdiction_id?: string
          jurisdiction_version_id?: string
          organization_category_id?: string
          organization_id?: string
          public_description?: string | null
          public_id?: string
          public_title?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state"]
          source_draft_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          status_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_jurisdiction_version_id_fkey"
            columns: ["jurisdiction_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_organization_category_id_fkey"
            columns: ["organization_category_id"]
            isOneToOne: false
            referencedRelation: "organization_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_source_draft_id_fkey"
            columns: ["source_draft_id"]
            isOneToOne: true
            referencedRelation: "report_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_report_events: {
        Row: {
          actor_type: Database["public"]["Enums"]["actor_type"] | null
          created_at: string | null
          new_status: Database["public"]["Enums"]["report_status"] | null
          public_id: string | null
          public_label: string | null
          source: string | null
        }
        Relationships: []
      }
      public_reports: {
        Row: {
          accepted_at: string | null
          category_name: string | null
          close_reason:
            | Database["public"]["Enums"]["report_close_reason"]
            | null
          description: string | null
          public_id: string | null
          public_label: string | null
          public_latitude: number | null
          public_location_precision:
            | Database["public"]["Enums"]["location_precision"]
            | null
          public_longitude: number | null
          status: Database["public"]["Enums"]["report_status"] | null
          support_count: number | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_verified_draft: {
        Args: {
          draft_description: string
          exact_address: string
          exact_latitude: number
          exact_longitude: number
          public_label: string
          public_latitude: number
          public_longitude: number
          publication_policy_version: number
          request_correlation_id: string
          request_idempotency_key: string
          requested_precision: Database["public"]["Enums"]["location_precision"]
          target_organization_category_id: string
        }
        Returns: {
          draft_id: string
          expires_at: string
          version: number
        }[]
      }
      current_aal: { Args: never; Returns: string }
      current_actor_context: { Args: never; Returns: Json }
      finalize_text_moderation: {
        Args: {
          provider_code: string
          request_correlation_id: string
          request_idempotency_key: string
          requested_decision: string
          target_report_id: string
        }
        Returns: {
          publication_state: Database["public"]["Enums"]["publication_state"]
          report_status: Database["public"]["Enums"]["report_status"]
        }[]
      }
      find_duplicate_candidates: {
        Args: {
          public_latitude: number
          public_longitude: number
          result_limit?: number
          target_organization_category_id: string
        }
        Returns: {
          accepted_at: string
          approximate_distance_meters: number
          category_name: string
          public_id: string
          public_label: string
          status: Database["public"]["Enums"]["report_status"]
          title: string
          why_suggested: string
        }[]
      }
      generate_public_report_id: { Args: never; Returns: string }
      get_my_report_relationship: {
        Args: {
          requested_kind: Database["public"]["Enums"]["relationship_kind"]
          target_public_id: string
        }
        Returns: {
          enabled: boolean
          notification_level: Database["public"]["Enums"]["notification_level"]
        }[]
      }
      has_org_preset: {
        Args: {
          required_preset: Database["public"]["Enums"]["membership_preset"]
          target_organization_id: string
        }
        Returns: boolean
      }
      has_platform_preset: {
        Args: {
          required_preset: Database["public"]["Enums"]["platform_preset"]
        }
        Returns: boolean
      }
      is_report_owner: { Args: { target_report_id: string }; Returns: boolean }
      is_verified_user: { Args: never; Returns: boolean }
      record_text_moderation_attempt: {
        Args: { request_correlation_id: string; target_report_id: string }
        Returns: number
      }
      request_fingerprint: { Args: { parts: string[] }; Returns: string }
      set_report_relationship: {
        Args: {
          request_correlation_id: string
          request_idempotency_key: string
          requested_enabled: boolean
          requested_kind: Database["public"]["Enums"]["relationship_kind"]
          requested_notification_level: Database["public"]["Enums"]["notification_level"]
          target_public_id: string
        }
        Returns: {
          enabled: boolean
          notification_level: Database["public"]["Enums"]["notification_level"]
          support_count: number
        }[]
      }
      submit_verified_report: {
        Args: {
          expected_version: number
          request_correlation_id: string
          request_idempotency_key: string
          target_draft_id: string
        }
        Returns: {
          moderation_case_id: string
          moderation_text: string
          public_id: string
          publication_state: Database["public"]["Enums"]["publication_state"]
          report_id: string
          report_status: Database["public"]["Enums"]["report_status"]
        }[]
      }
      transition_delivery: {
        Args: {
          error_code: string
          expected_version: number
          request_correlation_id: string
          request_idempotency_key: string
          requested_state: Database["public"]["Enums"]["delivery_state"]
          target_delivery_id: string
        }
        Returns: {
          new_state: Database["public"]["Enums"]["delivery_state"]
          new_version: number
        }[]
      }
      transition_moderation_case: {
        Args: {
          expected_version: number
          reason: string
          request_correlation_id: string
          request_idempotency_key: string
          requested_state: Database["public"]["Enums"]["moderation_state"]
          target_case_id: string
        }
        Returns: {
          new_state: Database["public"]["Enums"]["moderation_state"]
          new_version: number
        }[]
      }
      transition_report_status: {
        Args: {
          expected_version: number
          private_reason: string
          public_label: string
          request_correlation_id: string
          request_idempotency_key: string
          requested_close_reason: Database["public"]["Enums"]["report_close_reason"]
          requested_status: Database["public"]["Enums"]["report_status"]
          requested_visibility: Database["public"]["Enums"]["event_visibility"]
          target_report_id: string
        }
        Returns: {
          new_status: Database["public"]["Enums"]["report_status"]
          new_version: number
        }[]
      }
      withdraw_verified_draft: {
        Args: {
          expected_version: number
          request_correlation_id: string
          request_idempotency_key: string
          target_draft_id: string
        }
        Returns: string
      }
    }
    Enums: {
      actor_type:
        | "citizen"
        | "operator"
        | "moderator"
        | "organization_admin"
        | "platform_admin"
        | "legal_escalator"
        | "integration"
        | "system"
      delivery_state:
        | "queued"
        | "attempting"
        | "delivered"
        | "acknowledged"
        | "retry_scheduled"
        | "failed"
        | "cancelled"
      event_visibility:
        | "public"
        | "reporter"
        | "staff"
        | "organization_admin"
        | "platform_metadata"
        | "private"
      location_precision: "exact" | "block" | "neighborhood" | "withheld"
      membership_preset: "operator" | "moderator" | "organization_admin"
      moderation_state: "pending" | "approved" | "rejected" | "escalated"
      notification_level: "none" | "status_only" | "all_updates"
      platform_preset: "platform_admin" | "legal_escalator"
      publication_state:
        | "private"
        | "pending"
        | "approved"
        | "published"
        | "rejected"
      relationship_kind: "support" | "follow"
      report_close_reason:
        | "duplicate"
        | "out_of_service_area"
        | "no_action_planned"
        | "content_policy"
        | "withdrawn"
      report_status:
        | "draft"
        | "pending_verification"
        | "pending_moderation"
        | "submitted"
        | "received"
        | "needs_information"
        | "in_progress"
        | "resolved"
        | "closed"
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
      actor_type: [
        "citizen",
        "operator",
        "moderator",
        "organization_admin",
        "platform_admin",
        "legal_escalator",
        "integration",
        "system",
      ],
      delivery_state: [
        "queued",
        "attempting",
        "delivered",
        "acknowledged",
        "retry_scheduled",
        "failed",
        "cancelled",
      ],
      event_visibility: [
        "public",
        "reporter",
        "staff",
        "organization_admin",
        "platform_metadata",
        "private",
      ],
      location_precision: ["exact", "block", "neighborhood", "withheld"],
      membership_preset: ["operator", "moderator", "organization_admin"],
      moderation_state: ["pending", "approved", "rejected", "escalated"],
      notification_level: ["none", "status_only", "all_updates"],
      platform_preset: ["platform_admin", "legal_escalator"],
      publication_state: [
        "private",
        "pending",
        "approved",
        "published",
        "rejected",
      ],
      relationship_kind: ["support", "follow"],
      report_close_reason: [
        "duplicate",
        "out_of_service_area",
        "no_action_planned",
        "content_policy",
        "withdrawn",
      ],
      report_status: [
        "draft",
        "pending_verification",
        "pending_moderation",
        "submitted",
        "received",
        "needs_information",
        "in_progress",
        "resolved",
        "closed",
      ],
    },
  },
} as const
