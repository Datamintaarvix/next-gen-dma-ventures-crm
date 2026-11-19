export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          course_code: string;
          course_name: string;
          category: string;
          description: string | null;
          duration: string | null;
          duration_weeks: number;
          total_fee: number;
          syllabus: Json;
          instructor: string | null;
          instructor_bio: string | null;
          status: string;
          level: string | null;
          mode: string | null;
          max_capacity: number;
          image_url: string | null;
          enrolled_students_count: number;
          active_batches_count: number;
          active_batches_list: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          id: string;
          course_code: string;
          course_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
      };
      batches: {
        Row: {
          id: string;
          batch_code: string;
          batch_name: string;
          course_name: string;
          trainer: string;
          start_date: string;
          end_date: string;
          class_days: string;
          class_timings: string;
          max_capacity: number;
          enrolled_count: number;
          available_seats: number;
          status: string;
          classroom: string | null;
          description: string | null;
          student_ids: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["batches"]["Row"]> & {
          id: string;
          batch_code: string;
          batch_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["batches"]["Row"]>;
      };
      staff: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone_number: string;
          avatar_url: string | null;
          address: string;
          department: string;
          designation: string;
          role: string;
          employment_type: string;
          joining_date: string;
          reporting_manager: string;
          employment_status: string;
          emergency_contact: Json | null;
          notes: string | null;
          permissions: Json;
          audit_history: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
      };
      leads: {
        Row: {
          id: string;
          lead_code: string;
          student_name: string;
          phone_number: string;
          email: string | null;
          interested_course: string;
          lead_source: string;
          status: string;
          assigned_counselor: string;
          follow_up_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          id: string;
          lead_code: string;
          student_name: string;
          phone_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
      };
      enquiries: {
        Row: {
          id: string;
          enquiry_code: string;
          student_name: string;
          phone_number: string;
          email: string | null;
          interested_course: string;
          enquiry_source: string;
          enquiry_date: string;
          enquiry_message: string;
          assigned_counsellor: string;
          status: string;
          next_follow_up_date: string;
          converted_to_lead_id: string | null;
          converted_lead_code: string | null;
          converted_at: string | null;
          interactions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enquiries"]["Row"]> & {
          id: string;
          enquiry_code: string;
          student_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["enquiries"]["Row"]>;
      };
      follow_ups: {
        Row: {
          id: string;
          follow_up_code: string;
          student_name: string;
          related_type: string;
          related_id: string | null;
          related_code: string | null;
          contact_number: string;
          follow_up_date: string;
          follow_up_time: string;
          type: string;
          assigned_counsellor: string;
          priority: string;
          status: string;
          notes: string | null;
          completion_notes: string | null;
          completed_at: string | null;
          rescheduled_to_date: string | null;
          rescheduled_to_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]> & {
          id: string;
          follow_up_code: string;
          student_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]>;
      };
      students: {
        Row: {
          id: string;
          student_code: string;
          full_name: string;
          phone_number: string;
          email: string;
          date_of_birth: string;
          gender: string;
          address: string;
          guardian_name: string;
          guardian_phone: string;
          guardian_relation: string;
          course: string;
          batch_code: string;
          batch_name: string;
          admission_date: string;
          joining_date: string;
          status: string;
          photo_url: string | null;
          avatar_color: string | null;
          total_fee: number;
          paid_amount: number;
          pending_amount: number;
          payment_status: string;
          attendance_percentage: number;
          total_classes: number;
          attended_classes: number;
          payments: Json;
          recent_attendance: Json;
          linked_lead_id: string | null;
          linked_lead_code: string | null;
          linked_enquiry_id: string | null;
          linked_enquiry_code: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          id: string;
          student_code: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
      };
      admissions: {
        Row: {
          id: string;
          admission_code: string;
          student_id: string;
          student_code: string;
          student_name: string;
          student_phone: string;
          student_email: string;
          student_gender: string | null;
          course_name: string;
          course_code: string | null;
          batch_code: string;
          batch_name: string;
          admission_date: string;
          counsellor: string;
          total_fee: number;
          discount_amount: number;
          discount_reason: string | null;
          final_fee: number;
          paid_amount: number;
          pending_amount: number;
          payment_status: string;
          status: string;
          payment_method: string;
          notes: string | null;
          documents: Json;
          timeline: Json;
          payment_history: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admissions"]["Row"]> & {
          id: string;
          admission_code: string;
          student_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["admissions"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          receipt_no: string;
          student_id: string;
          student_code: string;
          student_name: string;
          student_phone: string | null;
          student_email: string | null;
          admission_id: string;
          admission_code: string;
          course_name: string;
          course_code: string | null;
          batch_code: string;
          batch_name: string | null;
          total_fee: number;
          discount_amount: number;
          final_fee: number;
          amount: number;
          cumulative_paid: number;
          outstanding_balance: number;
          payment_date: string;
          payment_method: string;
          transaction_ref: string;
          received_by: string;
          type: string;
          status: string;
          installment_number: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          id: string;
          receipt_no: string;
          student_id: string;
          admission_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      installments: {
        Row: {
          id: string;
          admission_id: string;
          admission_code: string;
          student_id: string;
          student_name: string;
          course_name: string;
          total_fee: number;
          final_fee: number;
          paid_amount: number;
          pending_amount: number;
          installments: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["installments"]["Row"]> & {
          id: string;
          admission_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["installments"]["Row"]>;
      };
      attendance_sessions: {
        Row: {
          id: string;
          course_name: string;
          batch_code: string;
          batch_name: string;
          date: string;
          session_title: string;
          trainer: string;
          recorded_by: string;
          total_students: number;
          present_count: number;
          absent_count: number;
          late_count: number;
          excused_count: number;
          attendance_percentage: number;
          notes: string | null;
          records: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance_sessions"]["Row"]> & {
          id: string;
          batch_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_sessions"]["Row"]>;
      };
      attendance_records: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          student_code: string;
          student_name: string;
          course_name: string;
          batch_code: string;
          batch_name: string;
          date: string;
          session_title: string;
          status: string;
          check_in_time: string | null;
          remarks: string | null;
          recorded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance_records"]["Row"]> & {
          id: string;
          session_id: string;
          student_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Row"]>;
      };
      counselling_sessions: {
        Row: {
          id: string;
          session_code: string;
          participant_type: string;
          participant_id: string | null;
          participant_code: string | null;
          person_name: string;
          contact_number: string;
          email: string | null;
          interested_course: string;
          assigned_counsellor: string;
          counselling_date: string;
          start_time: string;
          end_time: string;
          session_type: string;
          purpose: string;
          location_or_link: string | null;
          priority: string;
          status: string;
          notes: string | null;
          is_converted_to_admission: boolean;
          outcome_summary: string | null;
          recommendations: string | null;
          action_plan: Json;
          audit_trail: Json;
          last_modified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["counselling_sessions"]["Row"]> & {
          id: string;
          session_code: string;
          person_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["counselling_sessions"]["Row"]>;
      };
      placement_companies: {
        Row: {
          id: string;
          name: string;
          industry: string;
          website: string | null;
          contact_person: string;
          contact_email: string;
          contact_number: string;
          address: string;
          partnership_status: string;
          notes: string | null;
          active_opportunities_count: number;
          total_hired_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["placement_companies"]["Row"]> & {
          id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["placement_companies"]["Row"]>;
      };
      placement_jobs: {
        Row: {
          id: string;
          company_id: string;
          company_name: string;
          job_title: string;
          job_description: string;
          required_skills: Json;
          eligibility_criteria: string;
          openings: number;
          filled_openings: number;
          salary_min_lpa: number | null;
          salary_max_lpa: number | null;
          salary_range_display: string | null;
          job_location: string;
          job_type: string;
          application_deadline: string;
          status: string;
          total_applications: number;
          shortlisted_count: number;
          selected_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["placement_jobs"]["Row"]> & {
          id: string;
          company_id: string;
          job_title: string;
        };
        Update: Partial<Database["public"]["Tables"]["placement_jobs"]["Row"]>;
      };
      placement_profiles: {
        Row: {
          student_id: string;
          student_code: string;
          student_name: string;
          email: string;
          phone_number: string;
          course_name: string;
          batch_code: string;
          batch_name: string;
          attendance_percentage: number;
          skills: Json;
          resume_url: string | null;
          portfolio_url: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          expected_salary_lpa: number | null;
          placement_eligibility: string;
          placement_status: string;
          total_applications: number;
          total_interviews: number;
          active_offers_count: number;
          placed_company: string | null;
          placed_job_title: string | null;
          placed_salary_lpa: number | null;
          placed_date: string | null;
          notes: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["placement_profiles"]["Row"]> & {
          student_id: string;
          student_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["placement_profiles"]["Row"]>;
      };
      placement_applications: {
        Row: {
          id: string;
          job_id: string;
          job_title: string;
          company_id: string;
          company_name: string;
          student_id: string;
          student_code: string;
          student_name: string;
          student_email: string;
          student_phone: string;
          course_name: string;
          batch_code: string;
          applied_date: string;
          status: string;
          resume_url: string | null;
          portfolio_url: string | null;
          interviews: Json;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["placement_applications"]["Row"]> & {
          id: string;
          job_id: string;
          student_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["placement_applications"]["Row"]>;
      };
      placement_offers: {
        Row: {
          id: string;
          application_id: string | null;
          job_id: string | null;
          student_id: string;
          student_code: string;
          student_name: string;
          course_name: string;
          batch_code: string;
          company_name: string;
          job_title: string;
          offered_salary_lpa: number;
          offered_salary_display: string | null;
          offer_date: string;
          joining_date: string;
          offer_letter_ref: string | null;
          status: string;
          acceptance_date: string | null;
          notes: string | null;
          recorded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["placement_offers"]["Row"]> & {
          id: string;
          student_id: string;
          company_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["placement_offers"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          type: string;
          priority: string;
          status: string;
          is_important: boolean;
          recipient_role: string | null;
          recipient_name: string | null;
          related_module: string | null;
          related_id: string | null;
          link_url: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          id: string;
          title: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      notification_settings: {
        Row: {
          id: string;
          settings: Json;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notification_settings"]["Row"]> & {
          id?: string;
          settings: Json;
        };
        Update: Partial<Database["public"]["Tables"]["notification_settings"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          timestamp: string;
          user_name: string;
          user_email: string;
          action: string;
          category: string;
          details: string;
          ip_address: string;
          affected_record_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          id: string;
          action: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
      system_settings: {
        Row: {
          id: string;
          company: Json;
          general: Json;
          departments: Json;
          course_batch: Json;
          security: Json;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["system_settings"]["Row"]> & {
          id?: string;
          company: Json;
          general: Json;
        };
        Update: Partial<Database["public"]["Tables"]["system_settings"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
