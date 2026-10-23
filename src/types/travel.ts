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
  notes?: string;
  created_at?: string;
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
  created_at?: string;
  updated_at?: string;
  stops?: Stop[];
  expenses?: Expense[];
  // Aggregated summary fields
  total_spent?: number;
  destinations_count?: number;
  user_name?: string;
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
