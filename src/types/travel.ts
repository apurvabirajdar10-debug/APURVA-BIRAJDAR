export interface User {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
  language: string;
  currency: string;
  saved_destinations: string[]; // array of destination names or IDs
  created_at: string;
}

export interface Activity {
  id: number;
  stop_id: number;
  trip_id: number;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time_slot: 'morning' | 'afternoon' | 'evening';
  cost: number;
  category: 'sightseeing' | 'food' | 'culture' | 'adventure' | 'relaxation' | 'shopping' | 'transport';
  duration_hours: number;
  location?: string;
  booking_status: 'planned' | 'booked' | 'optional';
  order_index: number;
  created_at?: string;
}

export interface Stop {
  id: number;
  trip_id: number;
  city_name: string;
  country: string;
  order_index: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  transport_mode: 'flight' | 'train' | 'car' | 'bus' | 'ferry' | 'none';
  transport_notes?: string;
  notes?: string;
  created_at?: string;
  activities?: Activity[];
}

export interface TripMember {
  id?: number;
  trip_id: number;
  user_id?: number | null;
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'accepted' | 'invited';
  photo_url?: string;
  created_at?: string;
}

export interface ExpenseSplit {
  userId?: number;
  name: string;
  amount: number;
  percent?: number;
}

export interface Expense {
  id: number;
  trip_id: number;
  stop_id?: number | null;
  title: string;
  category: 'transport' | 'stay' | 'activities' | 'meals' | 'miscellaneous';
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  paid_by?: string;
  paid_by_user_id?: number | null;
  split_type?: 'equal' | 'exact' | 'percent';
  splits?: ExpenseSplit[];
  notes?: string;
  created_at?: string;
}

export interface Settlement {
  id: number;
  trip_id: number;
  from_user_id?: number | null;
  from_name: string;
  to_user_id?: number | null;
  to_name: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  created_at?: string;
}

export interface SimplifiedDebt {
  fromName: string;
  fromUserId?: number;
  toName: string;
  toUserId?: number;
  amount: number;
}

export interface MemberBalanceDetail {
  id?: number;
  user_id?: number;
  name: string;
  email: string;
  role: string;
  photo_url?: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface TripBalancesResponse {
  tripId: number;
  totalExpenses: number;
  members: MemberBalanceDetail[];
  simplifiedDebts: SimplifiedDebt[];
  settlements: Settlement[];
}

export interface Trip {
  id: number;
  user_id: number;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  description?: string;
  cover_image: string;
  budget_total: number;
  is_public: boolean;
  public_slug: string;
  invite_code?: string;
  created_at?: string;
  updated_at?: string;
  stops?: Stop[];
  expenses?: Expense[];
  members?: TripMember[];
  user_role?: 'owner' | 'editor' | 'viewer';
  // Aggregated summary fields
  total_spent?: number;
  destinations_count?: number;
  user_name?: string;
  user_email?: string;
}

export interface CatalogItem {
  id: string;
  city_name: string;
  country: string;
  title: string;
  description: string;
  category: 'sightseeing' | 'food' | 'culture' | 'adventure' | 'relaxation' | 'shopping';
  cost: number;
  cost_index: 'budget' | 'moderate' | 'luxury'; // $, $$, $$$
  duration_hours: number;
  popularity: number; // 1-100
  image_url: string;
  recommended_time: 'morning' | 'afternoon' | 'evening';
  rating?: number;
}

export interface OptimizationSuggestion {
  category: 'sequence' | 'budget' | 'pacing' | 'logistics';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable_tip?: string;
}

export interface OptimizationResult {
  score: number; // 0 - 100
  summary: string;
  suggestions: OptimizationSuggestion[];
  savings_potential?: number;
}

export interface AIItineraryPlan {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  estimated_budget: number;
  cover_image?: string;
  stops: {
    city_name: string;
    country: string;
    start_date: string;
    end_date: string;
    transport_mode: 'flight' | 'train' | 'car' | 'bus' | 'ferry' | 'none';
    transport_notes?: string;
    activities: {
      title: string;
      description: string;
      date: string;
      time_slot: 'morning' | 'afternoon' | 'evening';
      category: 'sightseeing' | 'food' | 'culture' | 'adventure' | 'relaxation' | 'shopping' | 'transport';
      cost: number;
      duration_hours: number;
      location?: string;
    }[];
  }[];
}
