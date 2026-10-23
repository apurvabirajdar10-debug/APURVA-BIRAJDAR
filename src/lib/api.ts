import { Trip, User, Stop, Activity, Expense, CatalogItem, OptimizationResult, AIItineraryPlan } from '../types/travel';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('gt_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('gt_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('gt_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-user-id'] = token;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ user: User; token: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  signup: (data: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string; message: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    request<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string; tempResetCode?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  updateProfile: (profile: Partial<User>) =>
    request<{ user: User; message: string }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  // Trips
  getTrips: () =>
    request<{ trips: Trip[] }>('/trips'),

  getTrip: (id: number) =>
    request<{ trip: Trip }>(`/trips/${id}`),

  getTripBySlug: (slug: string) =>
    request<{ trip: Trip }>(`/trips/slug/${slug}`),

  createTrip: (tripData: Partial<Trip>) =>
    request<{ trip: Trip; message: string }>('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    }),

  updateTrip: (id: number, tripData: Partial<Trip>) =>
    request<{ trip: Trip; message: string }>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    }),

  deleteTrip: (id: number) =>
    request<{ success: boolean; message: string }>(`/trips/${id}`, {
      method: 'DELETE',
    }),

  copyTrip: (id: number) =>
    request<{ trip: Trip; message: string }>(`/trips/${id}/copy`, {
      method: 'POST',
    }),

  // Stops
  addStop: (tripId: number, stopData: Partial<Stop>) =>
    request<{ stop: Stop; trip: Trip; message: string }>(`/trips/${tripId}/stops`, {
      method: 'POST',
      body: JSON.stringify(stopData),
    }),

  updateStop: (stopId: number, stopData: Partial<Stop>) =>
    request<{ stop: Stop; trip: Trip; message: string }>(`/stops/${stopId}`, {
      method: 'PUT',
      body: JSON.stringify(stopData),
    }),

  deleteStop: (stopId: number) =>
    request<{ success: boolean; message: string }>(`/stops/${stopId}`, {
      method: 'DELETE',
    }),

  reorderStops: (tripId: number, orderedStopIds: number[]) =>
    request<{ trip: Trip; message: string }>(`/trips/${tripId}/stops/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedStopIds }),
    }),

  // Activities
  addActivity: (tripId: number, activityData: Partial<Activity>) =>
    request<{ activity: Activity; trip: Trip; message: string }>(`/trips/${tripId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    }),

  updateActivity: (activityId: number, activityData: Partial<Activity>) =>
    request<{ activity: Activity; trip: Trip; message: string }>(`/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    }),

  deleteActivity: (activityId: number) =>
    request<{ success: boolean; message: string }>(`/activities/${activityId}`, {
      method: 'DELETE',
    }),

  // Expenses
  getExpenses: (tripId: number) =>
    request<{ summary: any; budget_total: number; expenses: Expense[] }>(`/trips/${tripId}/expenses`),

  addExpense: (tripId: number, expenseData: Partial<Expense>) =>
    request<{ expense: Expense; trip: Trip; summary: any; message: string }>(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  updateExpense: (expenseId: number, expenseData: Partial<Expense>) =>
    request<{ expense: Expense; summary: any; message: string }>(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  deleteExpense: (expenseId: number) =>
    request<{ success: boolean; message: string }>(`/expenses/${expenseId}`, {
      method: 'DELETE',
    }),

  // Catalog
  searchCatalog: (filters: { query?: string; country?: string; category?: string; cost_index?: string; max_duration?: number; scope?: 'national' | 'international' }) => {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.country) params.set('country', filters.country);
    if (filters.category) params.set('category', filters.category);
    if (filters.cost_index) params.set('cost_index', filters.cost_index);
    if (filters.max_duration) params.set('max_duration', String(filters.max_duration));
    if (filters.scope) params.set('scope', filters.scope);
    return request<{ items: CatalogItem[]; countries: string[]; total: number }>(`/catalog/search?${params.toString()}`);
  },

  // AI features
  generateItinerary: (params: { destination: string; duration_days: number; budget_level: string; interests: string; travel_party?: string; start_date?: string }) =>
    request<{ itinerary: AIItineraryPlan; note?: string }>('/ai/generate-itinerary', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  optimizeItinerary: (tripId: number) =>
    request<{ optimization: OptimizationResult }>('/ai/optimize-itinerary', {
      method: 'POST',
      body: JSON.stringify({ trip_id: tripId }),
    }),

  sendTripChat: (tripId: number | undefined, message: string, history: { role: string; content: string }[]) =>
    request<{ reply: string }>('/ai/trip-chat', {
      method: 'POST',
      body: JSON.stringify({ trip_id: tripId, message, history }),
    }),
};
