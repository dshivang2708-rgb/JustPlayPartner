// These types mirror /supabase/schema.sql. Once you've run that schema in
// your real Supabase project, regenerate this file properly with:
//   npx supabase gen types typescript --project-id guhfzzykoepmeqekbyxj > src/lib/database.types.ts
// which will stay in sync automatically as the schema evolves. This
// hand-written version exists so the app compiles before that CLI step.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'partner' | 'customer';
          full_name: string;
          phone: string | null;
          location: string | null;
          organisation_name: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; full_name: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      venues: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          address: string;
          sports: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['venues']['Row']> & { owner_id: string; name: string; address: string };
        Update: Partial<Database['public']['Tables']['venues']['Row']>;
      };
      courts: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          sport: string;
          base_price: number;
          min_price: number;
          max_price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['courts']['Row']> & {
          venue_id: string;
          name: string;
          sport: string;
          base_price: number;
          min_price: number;
          max_price: number;
        };
        Update: Partial<Database['public']['Tables']['courts']['Row']>;
      };
      bookings: {
        Row: {
          id: string;
          court_id: string;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string | null;
          slot_range: string;
          amount: number;
          status: 'confirmed' | 'cancelled' | 'completed';
          payment_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['bookings']['Row']> & {
          court_id: string;
          customer_name: string;
          slot_range: string;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string | null;
          venue_id: string;
          amount: number;
          method: 'UPI' | 'Card' | 'Cash' | 'Netbanking';
          status: 'pending' | 'success' | 'failed' | 'refunded';
          gateway_payment_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & {
          venue_id: string;
          amount: number;
          method: 'UPI' | 'Card' | 'Cash' | 'Netbanking';
        };
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      membership_plans: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          price: number;
          billing_cycle: string;
          sport: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['membership_plans']['Row']> & {
          venue_id: string;
          name: string;
          price: number;
          billing_cycle: string;
          sport: string;
        };
        Update: Partial<Database['public']['Tables']['membership_plans']['Row']>;
      };
      equipment_items: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          category: string;
          stock: number;
          low_stock_threshold: number;
          rental_price: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['equipment_items']['Row']> & {
          venue_id: string;
          name: string;
          category: string;
          rental_price: number;
        };
        Update: Partial<Database['public']['Tables']['equipment_items']['Row']>;
      };
    };
  };
};