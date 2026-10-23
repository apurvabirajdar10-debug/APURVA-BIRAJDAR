import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { initDatabase, dbOps, hashPassword, signJwt, verifyJwt } from './src/server/db.ts';
import { getDistributedAttractionsForCity } from './src/data/cityAttractions.ts';

dotenv.config();

const app = express();
// Runtime Environment requires dev server to run on port 3000
const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize SQLite Relational Database with tables, foreign keys, and seed data
initDatabase();

// Initialize server-side Google GenAI SDK (gemini-api skill guidelines)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Middleware for signed session / JWT auth (Never defaults to user 1 for unauthenticated requests)
function getUserIdFromReq(req: express.Request): number | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyJwt(token);
    if (payload && payload.userId) return payload.userId;
  }
  return null;
}

/* ==========================================================================
   AUTH & USER API ROUTES
   ========================================================================== */

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = dbOps.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const hashed = hashPassword(password);
    if (user.password_hash !== hashed) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = dbOps.getUserById(user.id);
    const token = signJwt({ userId: user.id, email: user.email });

    return res.json({
      user: safeUser,
      token,
      message: 'Logged in successfully',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to process login' });
  }
});

// POST /api/auth/signup
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = dbOps.getUserByEmail(trimmedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashed = hashPassword(password);
    const newUser = dbOps.createUser(name.trim(), trimmedEmail, hashed);
    const token = signJwt({ userId: newUser.id, email: newUser.email });

    return res.status(201).json({
      user: newUser,
      token,
      message: 'Account created successfully',
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = dbOps.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// POST /api/auth/forgot-password (removes temporary password and reset codes for security)
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    // Return standard generic message without exposing internal codes or temp passwords
    return res.json({
      message: 'If this email exists in our records, a password reset link has been dispatched.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process password reset' });
  }
});

// PUT /api/user/profile
app.put('/api/user/profile', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { name, photo_url, language, currency, saved_destinations } = req.body;
    const updated = dbOps.updateUserProfile(userId, { name, photo_url, language, currency, saved_destinations });
    return res.json({ user: updated, message: 'Profile updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

/* ==========================================================================
   TRIP API ROUTES
   ========================================================================== */

// GET /api/trips (list all trips for current user including group trips)
app.get('/api/trips', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const trips = dbOps.getTripsByUser(userId);
    return res.json({ trips });
  } catch (err: any) {
    console.error('Fetch trips error:', err);
    return res.status(500).json({ error: 'Failed to load trips' });
  }
});

// POST /api/trips (create new trip)
app.post('/api/trips', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { name, start_date, end_date, description, cover_image, budget_total, is_public } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Trip name is required' });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'End date cannot precede start date' });
    }

    const trip = dbOps.createTrip(userId, {
      name: name.trim(),
      start_date,
      end_date,
      description,
      cover_image,
      budget_total: Number(budget_total) || 0,
      is_public: Boolean(is_public),
    });

    return res.status(201).json({ trip, message: 'Trip created successfully' });
  } catch (err: any) {
    console.error('Create trip error:', err);
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

// GET /api/trips/:id (get single trip with full stops, activities, expenses, members)
app.get('/api/trips/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid trip ID' });

    const trip = dbOps.getTripById(id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // If trip is private, verify user is owner or member
    if (!trip.is_public) {
      const userId = getUserIdFromReq(req);
      if (!userId || !dbOps.isUserAllowedTrip(id, userId)) {
        return res.status(403).json({ error: 'Access denied to this private itinerary' });
      }
    }

    return res.json({ trip });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load trip' });
  }
});

// PUT /api/trips/:id (update trip)
app.put('/api/trips/:id', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid trip ID' });

    if (!dbOps.isUserAllowedTrip(id, userId)) {
      return res.status(403).json({ error: 'Permission denied to edit this trip' });
    }

    const { name, start_date, end_date, description, cover_image, budget_total, is_public } = req.body;

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'End date cannot precede start date' });
    }

    const updated = dbOps.updateTrip(id, {
      name,
      start_date,
      end_date,
      description,
      cover_image,
      budget_total: budget_total !== undefined ? Number(budget_total) : undefined,
      is_public,
    });

    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    return res.json({ trip: updated, message: 'Trip updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update trip' });
  }
});

// DELETE /api/trips/:id
app.delete('/api/trips/:id', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid trip ID' });

    if (!dbOps.isUserAllowedTrip(id, userId)) {
      return res.status(403).json({ error: 'Permission denied to delete this trip' });
    }

    dbOps.deleteTrip(id);
    return res.json({ success: true, message: 'Trip and associated stops deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// POST /api/trips/:id/copy (clone/copy trip to current user)
app.post('/api/trips/:id/copy', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) return res.status(400).json({ error: 'Invalid trip ID' });

    const cloned = dbOps.duplicateTrip(tripId, userId);
    if (!cloned) return res.status(404).json({ error: 'Original trip not found' });

    return res.status(201).json({ trip: cloned, message: 'Trip cloned into your itinerary list' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to copy trip' });
  }
});

// GET /api/trips/slug/:slug (public read-only itinerary)
app.get('/api/trips/slug/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const trip = dbOps.getTripBySlug(slug);
    if (!trip) {
      return res.status(404).json({ error: 'Public trip not found' });
    }
    return res.json({ trip });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load public trip' });
  }
});

/* ==========================================================================
   GROUP TRIPS: MEMBERS & INVITE ROUTES
   ========================================================================== */

// GET /api/trips/:id/members
app.get('/api/trips/:id/members', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) return res.status(400).json({ error: 'Invalid trip ID' });

    const members = dbOps.getTripMembers(tripId);
    return res.json({ members });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch trip members' });
  }
});

// POST /api/trips/:id/members (invite a member by email)
app.post('/api/trips/:id/members', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) return res.status(400).json({ error: 'Invalid trip ID' });

    if (!dbOps.isUserAllowedTrip(tripId, userId)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const { email, name, role } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const member = dbOps.addTripMember(tripId, {
      email: email.trim(),
      name: name?.trim(),
      role: role || 'editor',
      invited_by: userId,
    });

    const members = dbOps.getTripMembers(tripId);
    return res.status(201).json({ member, members, message: `Invited ${email} to trip` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add trip member' });
  }
});

// DELETE /api/trips/:id/members/:memberId (remove a member)
app.delete('/api/trips/:id/members/:memberId', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const tripId = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);

    if (!dbOps.isUserAllowedTrip(tripId, userId)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    dbOps.removeTripMember(tripId, memberId);
    const members = dbOps.getTripMembers(tripId);
    return res.json({ members, message: 'Member removed from trip' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
});

// GET /api/trips/join/:inviteCode (preview trip by invite code)
app.get('/api/trips/join/:inviteCode', (req, res) => {
  try {
    const { inviteCode } = req.params;
    const trip = dbOps.getTripByInviteCode(inviteCode);
    if (!trip) {
      return res.status(404).json({ error: 'Trip invite code not found or expired' });
    }
    return res.json({
      trip: {
        id: trip.id,
        name: trip.name,
        cover_image: trip.cover_image,
        start_date: trip.start_date,
        end_date: trip.end_date,
        user_name: trip.user_name,
        destinations_count: trip.destinations_count,
        invite_code: trip.invite_code,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to check invite code' });
  }
});

// POST /api/trips/join/:inviteCode (join trip by invite code)
app.post('/api/trips/join/:inviteCode', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to accept the trip invite' });
    }

    const { inviteCode } = req.params;
    const joinedTrip = dbOps.joinTripByInviteCode(inviteCode, userId);
    if (!joinedTrip) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    return res.json({ trip: joinedTrip, message: `Successfully joined ${joinedTrip.name}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to join trip' });
  }
});

/* ==========================================================================
   STOPS & ITINERARY BUILDER API ROUTES
   ========================================================================== */

// POST /api/trips/:id/stops (add city stop)
app.post('/api/trips/:id/stops', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { city_name, country, start_date, end_date, transport_mode, transport_notes, notes, order_index } = req.body;

    if (!city_name || !country || !start_date || !end_date) {
      return res.status(400).json({ error: 'City name, country, arrival and departure dates are required' });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'Departure date cannot precede arrival date' });
    }

    const stop = dbOps.createStop(tripId, {
      city_name: city_name.trim(),
      country: country.trim(),
      start_date,
      end_date,
      transport_mode,
      transport_notes,
      notes,
      order_index,
    });

    // Automatically populate top must-visit spots and key attractions for this city,
    // intelligently distributed across the specified number of days for this stop
    try {
      const sDate = new Date(start_date + 'T00:00:00');
      const eDate = new Date(end_date + 'T00:00:00');
      const dayCount = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const attractions = getDistributedAttractionsForCity(city_name.trim(), country.trim(), dayCount);

      attractions.forEach((attr, idx) => {
        // Distribute activities across the days of this stop
        const dayOffset = Math.min(dayCount - 1, Math.floor(idx / 2));
        const actDateObj = new Date(sDate);
        actDateObj.setDate(actDateObj.getDate() + dayOffset);
        const dateStr = actDateObj.toISOString().split('T')[0];

        dbOps.createActivity({
          stop_id: stop.id,
          trip_id: tripId,
          title: attr.title,
          description: attr.description,
          date: dateStr,
          time_slot: attr.time_slot,
          cost: attr.cost,
          category: attr.category,
          duration_hours: attr.duration_hours,
          location: attr.location,
          booking_status: 'planned',
          order_index: idx,
        });

        // Record expense for non-free attractions to keep budget sync accurate
        if (attr.cost > 0) {
          dbOps.createExpense({
            trip_id: tripId,
            stop_id: stop.id,
            title: `${attr.title} (Ticket/Pass)`,
            category: 'activities',
            amount: attr.cost,
            currency: 'INR',
            date: dateStr,
            paid_by: 'Alex',
            notes: `Auto-scheduled attraction in ${city_name}`,
          });
        }
      });
    } catch (attrErr) {
      console.warn('Could not auto-populate city attractions:', attrErr);
    }

    const refreshedTrip = dbOps.getTripById(tripId);
    return res.status(201).json({ stop, trip: refreshedTrip, message: `Added ${city_name} to itinerary with scheduled attractions` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add stop' });
  }
});

// PUT /api/trips/:id/stops/reorder (reorder stops)
app.put('/api/trips/:id/stops/reorder', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { orderedStopIds } = req.body;

    if (!Array.isArray(orderedStopIds)) {
      return res.status(400).json({ error: 'orderedStopIds array required' });
    }

    dbOps.reorderStops(tripId, orderedStopIds);
    const refreshedTrip = dbOps.getTripById(tripId);
    return res.json({ trip: refreshedTrip, message: 'Stops reordered successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reorder stops' });
  }
});

// PUT /api/stops/:stopId (update stop details)
app.put('/api/stops/:stopId', (req, res) => {
  try {
    const stopId = parseInt(req.params.stopId, 10);
    const updated = dbOps.updateStop(stopId, req.body);
    if (!updated) return res.status(404).json({ error: 'Stop not found' });

    const refreshedTrip = dbOps.getTripById(updated.trip_id);
    return res.json({ stop: updated, trip: refreshedTrip, message: 'Stop updated' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update stop' });
  }
});

// DELETE /api/stops/:stopId (delete city stop)
app.delete('/api/stops/:stopId', (req, res) => {
  try {
    const stopId = parseInt(req.params.stopId, 10);
    dbOps.deleteStop(stopId);
    return res.json({ success: true, message: 'Stop deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete stop' });
  }
});

/* ==========================================================================
   ACTIVITIES API ROUTES
   ========================================================================== */

// POST /api/trips/:id/activities (add activity to stop)
app.post('/api/trips/:id/activities', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { stop_id, title, description, date, time_slot, cost, category, duration_hours, location, booking_status } = req.body;

    if (!stop_id || !title || !date) {
      return res.status(400).json({ error: 'Stop, title, and date are required' });
    }

    const activity = dbOps.createActivity({
      stop_id: Number(stop_id),
      trip_id: tripId,
      title: title.trim(),
      description,
      date,
      time_slot,
      cost: Number(cost) || 0,
      category,
      duration_hours: Number(duration_hours) || 2,
      location,
      booking_status,
    });

    const refreshedTrip = dbOps.getTripById(tripId);
    return res.status(201).json({ activity, trip: refreshedTrip, message: 'Activity added' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add activity' });
  }
});

// PUT /api/activities/:activityId
app.put('/api/activities/:activityId', (req, res) => {
  try {
    const id = parseInt(req.params.activityId, 10);
    const updated = dbOps.updateActivity(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Activity not found' });

    const refreshedTrip = dbOps.getTripById(updated.trip_id);
    return res.json({ activity: updated, trip: refreshedTrip, message: 'Activity updated' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update activity' });
  }
});

// DELETE /api/activities/:activityId
app.delete('/api/activities/:activityId', (req, res) => {
  try {
    const id = parseInt(req.params.activityId, 10);
    dbOps.deleteActivity(id);
    return res.json({ success: true, message: 'Activity deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete activity' });
  }
});

/* ==========================================================================
   EXPENSES & BUDGET API ROUTES
   ========================================================================== */

// GET /api/trips/:id/expenses (get summary & list)
app.get('/api/trips/:id/expenses', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const summary = dbOps.getExpensesSummary(tripId);
    const trip = dbOps.getTripById(tripId);
    return res.json({
      summary,
      budget_total: trip?.budget_total || 0,
      expenses: trip?.expenses || [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load expenses' });
  }
});

// POST /api/trips/:id/expenses (record expense with split details)
app.post('/api/trips/:id/expenses', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { stop_id, title, category, amount, currency, date, paid_by, paid_by_user_id, split_type, splits, notes } = req.body;

    if (!title || !category || amount === undefined || !date) {
      return res.status(400).json({ error: 'Title, category, amount, and date are required' });
    }

    const expense = dbOps.createExpense({
      trip_id: tripId,
      stop_id: stop_id ? Number(stop_id) : null,
      title: title.trim(),
      category,
      amount: Number(amount) || 0,
      currency: currency || 'INR',
      date,
      paid_by,
      paid_by_user_id: paid_by_user_id ? Number(paid_by_user_id) : null,
      split_type: split_type || 'equal',
      splits: splits || [],
      notes,
    });

    const refreshedTrip = dbOps.getTripById(tripId);
    const summary = dbOps.getExpensesSummary(tripId);

    return res.status(201).json({
      expense,
      trip: refreshedTrip,
      summary,
      message: 'Expense recorded successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id
app.put('/api/expenses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = dbOps.updateExpense(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Expense not found' });

    const summary = dbOps.getExpensesSummary(updated.trip_id);
    return res.json({ expense: updated, summary, message: 'Expense updated' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    dbOps.deleteExpense(id);
    return res.json({ success: true, message: 'Expense deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET /api/trips/:id/balances (Member net balances & simplified debt settlements)
app.get('/api/trips/:id/balances', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) return res.status(400).json({ error: 'Invalid trip ID' });

    const balances = dbOps.getTripBalances(tripId);
    if (!balances) return res.status(404).json({ error: 'Trip not found' });

    return res.json(balances);
  } catch (err: any) {
    console.error('Failed to compute balances:', err);
    return res.status(500).json({ error: 'Failed to compute balances' });
  }
});

// POST /api/trips/:id/settlements (Record debt settlement / settle up)
app.post('/api/trips/:id/settlements', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    if (isNaN(tripId)) return res.status(400).json({ error: 'Invalid trip ID' });

    const { from_user_id, from_name, to_user_id, to_name, amount, currency, date, notes } = req.body;
    if (!from_name || !to_name || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ error: 'from_name, to_name, and a valid amount are required' });
    }

    const settlement = dbOps.createSettlement({
      trip_id: tripId,
      from_user_id: from_user_id ? Number(from_user_id) : null,
      from_name: String(from_name).trim(),
      to_user_id: to_user_id ? Number(to_user_id) : null,
      to_name: String(to_name).trim(),
      amount: Number(amount),
      currency: currency || 'INR',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || 'Settled up',
    });

    const balances = dbOps.getTripBalances(tripId);
    return res.status(201).json({ settlement, balances, message: 'Debt settled successfully' });
  } catch (err: any) {
    console.error('Settlement error:', err);
    return res.status(500).json({ error: 'Failed to record settlement' });
  }
});

// DELETE /api/trips/:id/settlements/:settlementId
app.delete('/api/trips/:id/settlements/:settlementId', (req, res) => {
  try {
    const tripId = parseInt(req.params.id, 10);
    const settlementId = parseInt(req.params.settlementId, 10);
    dbOps.deleteSettlement(settlementId);
    const balances = dbOps.getTripBalances(tripId);
    return res.json({ success: true, balances, message: 'Settlement deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete settlement' });
  }
});

/* ==========================================================================
   CITY & ACTIVITY CATALOG SEARCH API
   ========================================================================== */

// GET /api/catalog/search
app.get('/api/catalog/search', (req, res) => {
  try {
    const { query, country, category, cost_index, max_duration, scope } = req.query;
    const items = dbOps.searchCatalog({
      query: query ? String(query) : undefined,
      country: country ? String(country) : undefined,
      category: category ? String(category) : undefined,
      cost_index: cost_index ? String(cost_index) : undefined,
      max_duration: max_duration ? parseFloat(String(max_duration)) : undefined,
      scope: scope === 'national' || scope === 'international' ? scope : undefined,
    });
    const countries = dbOps.getCatalogCountries(scope ? String(scope) : undefined);
    return res.json({ items, countries, total: items.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to search catalog' });
  }
});

/* ==========================================================================
   AI / GENAI INTEGRATION ROUTES (Using gemini-3.8-flash)
   ========================================================================== */

// 1. POST /api/ai/generate-itinerary
app.post('/api/ai/generate-itinerary', async (req, res) => {
  try {
    const { destination, duration_days, budget_level, interests, travel_party, start_date } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination or travel goal is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI unavailable' });
    }

    const duration = parseInt(duration_days, 10) || 7;
    const effectiveStart = start_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const prompt = `
Create a realistic, exciting, and balanced multi-city travel itinerary for:
- Destination(s): ${destination}
- Duration: ${duration} days
- Target start date: ${effectiveStart}
- Budget Style: ${budget_level || 'Moderate'}
- Travel Party: ${travel_party || 'Couple'}
- Specific Interests & Vibe: ${interests || 'Culture, local cuisine, scenic walks, landmarks'}

Requirements:
- Plan 2 to 4 interconnected city stops within this duration.
- For each stop, assign realistic arrival and departure dates starting sequentially from ${effectiveStart}.
- For each stop, recommend 2 to 3 distinct activities per day categorized by time_slot (morning, afternoon, evening), realistic costs in INR, duration, and category (sightseeing, food, culture, adventure, relaxation).
- Specify transport modes between consecutive cities (train, flight, car, bus).
- Provide an estimated total budget target.
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite travel concierge crafting world-class multi-city travel itineraries. Return ONLY valid JSON matching the requested structure.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              estimated_budget: { type: Type.NUMBER },
              cover_image: { type: Type.STRING },
              stops: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    city_name: { type: Type.STRING },
                    country: { type: Type.STRING },
                    start_date: { type: Type.STRING },
                    end_date: { type: Type.STRING },
                    transport_mode: { type: Type.STRING },
                    transport_notes: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          date: { type: Type.STRING },
                          time_slot: { type: Type.STRING },
                          category: { type: Type.STRING },
                          cost: { type: Type.NUMBER },
                          duration_hours: { type: Type.NUMBER },
                          location: { type: Type.STRING },
                        },
                        required: ['title', 'date', 'time_slot', 'cost', 'category'],
                      },
                    },
                  },
                  required: ['city_name', 'country', 'start_date', 'end_date', 'activities'],
                },
              },
            },
            required: ['name', 'description', 'estimated_budget', 'stops'],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (!parsed.cover_image) {
          parsed.cover_image = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';
        }
        return res.json({ itinerary: parsed });
      }
      return res.status(503).json({ error: 'AI unavailable' });
    } catch (geminiErr: any) {
      console.warn('Gemini generateContent error:', geminiErr?.message);
      return res.status(503).json({ error: 'AI unavailable' });
    }
  } catch (err: any) {
    console.error('AI generate itinerary error:', err);
    return res.status(503).json({ error: 'AI unavailable' });
  }
});

// 2. POST /api/ai/optimize-itinerary
app.post('/api/ai/optimize-itinerary', async (req, res) => {
  try {
    const { trip_id } = req.body;
    if (!trip_id) return res.status(400).json({ error: 'trip_id is required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI unavailable' });
    }

    const trip = dbOps.getTripById(Number(trip_id));
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const summaryData = {
      name: trip.name,
      dates: `${trip.start_date} to ${trip.end_date}`,
      budget: trip.budget_total,
      total_spent: trip.total_spent,
      stops: trip.stops?.map((s: any) => ({
        city: s.city_name,
        country: s.country,
        dates: `${s.start_date} to ${s.end_date}`,
        activitiesCount: s.activities?.length || 0,
        activities: s.activities?.map((a: any) => `${a.title} (₹${a.cost})`),
      })),
      expenses: trip.expenses?.map((e: any) => `${e.title}: ₹${e.amount} (${e.category})`),
    };

    try {
      const prompt = `
Analyze this multi-city travel itinerary for efficiency, budget optimization, sequencing, and pacing:
${JSON.stringify(summaryData, null, 2)}

Provide an evaluation in JSON:
- score: overall score 0-100 (e.g., 85)
- summary: 2-3 sentence assessment of the itinerary
- savings_potential: estimated potential savings in INR (₹)
- suggestions: array of items, each with:
  - category: "sequence" | "budget" | "pacing" | "logistics"
  - title: short headline (under 8 words)
  - description: clear, helpful rationale
  - impact: "high" | "medium" | "low"
  - actionable_tip: practical tip the traveler can apply
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert travel optimizer. Return ONLY valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              summary: { type: Type.STRING },
              savings_potential: { type: Type.NUMBER },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    actionable_tip: { type: Type.STRING },
                  },
                  required: ['category', 'title', 'description', 'impact'],
                },
              },
            },
            required: ['score', 'summary', 'suggestions'],
          },
        },
      });

      const text = response.text;
      if (text) {
        return res.json({ optimization: JSON.parse(text) });
      }
      return res.status(503).json({ error: 'AI unavailable' });
    } catch (geminiErr: any) {
      console.warn('Gemini optimization error:', geminiErr?.message);
      return res.status(503).json({ error: 'AI unavailable' });
    }
  } catch (err: any) {
    return res.status(503).json({ error: 'AI unavailable' });
  }
});

// 3. POST /api/ai/trip-chat
app.post('/api/ai/trip-chat', async (req, res) => {
  try {
    const { trip_id, message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI unavailable' });
    }

    let tripContext = '';
    if (trip_id) {
      const trip = dbOps.getTripById(Number(trip_id));
      if (trip) {
        tripContext = `Current Trip Details:
- Name: ${trip.name}
- Dates: ${trip.start_date} to ${trip.end_date}
- Budget: ₹${trip.budget_total} (Spent: ₹${trip.total_spent || 0})
- Stops: ${trip.stops?.map((s: any) => `${s.city_name}, ${s.country} (${s.start_date} to ${s.end_date})`).join(' -> ')}
- Activities: ${trip.stops?.flatMap((s: any) => s.activities?.map((a: any) => `${a.title} in ${s.city_name}`)).join(', ')}`;
      }
    }

    try {
      const systemPrompt = `You are Globe Trotter AI, a friendly, knowledgeable concierge specialized in multi-city travel.
Help the traveler with personalized suggestions, packing recommendations, local dining tips, transit guidance, and day-planning.
Keep answers concise, inspiring, and formatted with clean bullet points when helpful.

${tripContext}`;

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content }],
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const reply = response.text;
      if (reply) {
        return res.json({ reply });
      }
      return res.status(503).json({ error: 'AI unavailable' });
    } catch (geminiErr: any) {
      console.warn('Gemini chat error:', geminiErr?.message);
      return res.status(503).json({ error: 'AI unavailable' });
    }
  } catch (err: any) {
    return res.status(503).json({ error: 'AI unavailable' });
  }
});

/* ==========================================================================
   FRONTEND VITE & STATIC SERVING INTEGRATION
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Globe Trotter server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
