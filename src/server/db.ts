import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve('globetrotter.db');
const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      photo_url TEXT,
      language TEXT DEFAULT 'en',
      currency TEXT DEFAULT 'INR',
      saved_destinations TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      description TEXT,
      cover_image TEXT NOT NULL,
      budget_total REAL DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      public_slug TEXT UNIQUE NOT NULL,
      invite_code TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      city_name TEXT NOT NULL,
      country TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      transport_mode TEXT DEFAULT 'flight',
      transport_notes TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stop_id INTEGER NOT NULL,
      trip_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time_slot TEXT DEFAULT 'morning',
      cost REAL DEFAULT 0,
      category TEXT DEFAULT 'sightseeing',
      duration_hours REAL DEFAULT 2,
      location TEXT,
      booking_status TEXT DEFAULT 'planned',
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      stop_id INTEGER,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      date TEXT NOT NULL,
      paid_by TEXT,
      paid_by_user_id INTEGER,
      split_type TEXT DEFAULT 'equal',
      splits TEXT DEFAULT '[]',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS trip_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      user_id INTEGER,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'editor',
      status TEXT DEFAULT 'accepted',
      invited_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      from_user_id INTEGER,
      from_name TEXT NOT NULL,
      to_user_id INTEGER,
      to_name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS catalog (
      id TEXT PRIMARY KEY,
      city_name TEXT NOT NULL,
      country TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      cost REAL NOT NULL,
      cost_index TEXT NOT NULL,
      duration_hours REAL NOT NULL,
      popularity INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      recommended_time TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      stop_id INTEGER,
      proposer_user_id INTEGER,
      proposer_name TEXT NOT NULL,
      title TEXT NOT NULL,
      place TEXT NOT NULL,
      cost_per_person REAL DEFAULT 0,
      description TEXT,
      category TEXT DEFAULT 'sightseeing',
      status TEXT DEFAULT 'open',
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS proposal_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER NOT NULL,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      vote TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proposal_id) REFERENCES activity_proposals(id) ON DELETE CASCADE,
      UNIQUE(proposal_id, user_name)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      trip_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      provider TEXT,
      title TEXT NOT NULL,
      subtitle TEXT,
      booking_ref TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      end_date TEXT,
      origin TEXT,
      destination TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      passengers_or_guests TEXT,
      status TEXT DEFAULT 'Confirmed',
      category_label TEXT,
      details TEXT DEFAULT '{}',
      qr_data TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );
  `);

  // Column migrations for existing databases
  try {
    db.exec('ALTER TABLE trips ADD COLUMN invite_code TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE trips ADD COLUMN voting_deadline TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE expenses ADD COLUMN paid_by_user_id INTEGER;');
  } catch {}
  try {
    db.exec("ALTER TABLE expenses ADD COLUMN split_type TEXT DEFAULT 'equal';");
  } catch {}
  try {
    db.exec("ALTER TABLE expenses ADD COLUMN splits TEXT DEFAULT '[]';");
  } catch {}

  // Backfill invite_code for any trips missing it
  const tripsMissingCode = db.prepare("SELECT id, name FROM trips WHERE invite_code IS NULL OR invite_code = ''").all() as any[];
  for (const t of tripsMissingCode) {
    db.prepare('UPDATE trips SET invite_code = ? WHERE id = ?').run(generateInviteCode(), t.id);
  }

  // Ensure owners and demo members are populated in trip_members
  const allTrips = db.prepare('SELECT id, user_id FROM trips').all() as any[];
  for (const tr of allTrips) {
    const owner = db.prepare('SELECT name, email FROM users WHERE id = ?').get(tr.user_id) as any;
    if (owner) {
      const exists = db.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND (user_id = ? OR email = ?)').get(tr.id, tr.user_id, owner.email);
      if (!exists) {
        db.prepare(`
          INSERT INTO trip_members (trip_id, user_id, email, name, role, status)
          VALUES (?, ?, ?, ?, 'owner', 'accepted')
        `).run(tr.id, tr.user_id, owner.email, owner.name);
      }
    }
  }

  seedData();
  seedCatalog();
  seedProposalsAndBookings();
}

// Cryptographic JWT Implementation (HMAC-SHA256)
const JWT_SECRET = process.env.JWT_SECRET || 'globetrotter_secure_jwt_secret_salt_2026';

export function signJwt(payload: { userId: number; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + 30 * 86400 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): { userId: number; email: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp && parsed.exp < now) return null;
    if (!parsed.userId) return null;
    return { userId: Number(parsed.userId), email: String(parsed.email) };
  } catch {
    return null;
  }
}

// Simple password hashing helper
export function hashPassword(password: string): string {
  const salt = 'globetrotter_salt_2026';
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

export function generateInviteCode(): string {
  return 'GT-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

export function generateSlug(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const random = crypto.randomBytes(3).toString('hex');
  return `${clean || 'trip'}-${random}`;
}

function seedData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) return;

  console.log('Seeding initial demo database for Globe Trotter...');

  // 1. Seed default user
  const passwordHash = hashPassword('traveler123');
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, photo_url, language, currency, saved_destinations)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(
    'Alex Morgan',
    'alex@globetrotter.io',
    passwordHash,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'en',
    'INR',
    JSON.stringify(['Paris, France', 'Tokyo, Japan', 'Kyoto, Japan', 'Rome, Italy', 'Zurich, Switzerland', 'Barcelona, Spain'])
  );

  const defaultUser = db.prepare('SELECT id FROM users WHERE email = ?').get('alex@globetrotter.io') as { id: number };
  const userId = defaultUser.id;

  // 2. Seed Trip 1: European Grand Tour
  const insertTrip = db.prepare(`
    INSERT INTO trips (user_id, name, start_date, end_date, description, cover_image, budget_total, is_public, public_slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTrip.run(
    userId,
    'European Grand Tour',
    '2026-06-10',
    '2026-06-22',
    'A classic summer journey through London, Paris, the Swiss Alps, and historic Rome with rail journeys.',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80',
    385000,
    1,
    'european-grand-tour-classic'
  );

  const trip1 = db.prepare('SELECT id FROM trips WHERE public_slug = ?').get('european-grand-tour-classic') as { id: number };
  const trip1Id = trip1.id;

  // Stops for Trip 1
  const insertStop = db.prepare(`
    INSERT INTO stops (trip_id, city_name, country, order_index, start_date, end_date, transport_mode, transport_notes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStop.run(trip1Id, 'London', 'United Kingdom', 0, '2026-06-10', '2026-06-13', 'flight', 'Arrive at Heathrow Airport, take Elizabeth line into central London.', 'Stay near Covent Garden');
  insertStop.run(trip1Id, 'Paris', 'France', 1, '2026-06-13', '2026-06-16', 'train', 'Eurostar high-speed rail from St Pancras to Gare du Nord (2h 15m).', 'Boutique hotel in Le Marais');
  insertStop.run(trip1Id, 'Zurich', 'Switzerland', 2, '2026-06-16', '2026-06-19', 'train', 'TGV Lyria train from Paris Gare de Lyon to Zurich HB (4h).', 'Hotel overlooking Lake Zurich');
  insertStop.run(trip1Id, 'Rome', 'Italy', 3, '2026-06-19', '2026-06-22', 'flight', 'Short 1h 30m hop from Zurich Airport to Fiumicino.', 'Historic center apartment near Trevi');

  const stops = db.prepare('SELECT id, city_name FROM stops WHERE trip_id = ? ORDER BY order_index ASC').all(trip1Id) as { id: number; city_name: string }[];
  const londonStopId = stops.find(s => s.city_name === 'London')!.id;
  const parisStopId = stops.find(s => s.city_name === 'Paris')!.id;
  const zurichStopId = stops.find(s => s.city_name === 'Zurich')!.id;
  const romeStopId = stops.find(s => s.city_name === 'Rome')!.id;

  // Activities for Trip 1 (Costs in INR)
  const insertActivity = db.prepare(`
    INSERT INTO activities (stop_id, trip_id, title, description, date, time_slot, cost, category, duration_hours, location, booking_status, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertActivity.run(londonStopId, trip1Id, 'Tower of London & Crown Jewels', 'Explore medieval fortress and view historical regalia.', '2026-06-11', 'morning', 3400, 'sightseeing', 3, 'Tower Hill', 'booked', 0);
  insertActivity.run(londonStopId, trip1Id, 'Borough Market Street Food Tour', 'Taste artisan cheeses, pies, and pastries alongside Thames.', '2026-06-11', 'afternoon', 2800, 'food', 2.5, 'Southwark', 'planned', 1);
  insertActivity.run(londonStopId, trip1Id, 'West End Musical at Lyceum', 'Evening performance of The Lion King.', '2026-06-12', 'evening', 6800, 'culture', 2.5, 'Covent Garden', 'booked', 2);

  insertActivity.run(parisStopId, trip1Id, 'Louvre Museum Guided Highlights', 'Mona Lisa, Winged Victory, and Venus de Milo tour.', '2026-06-14', 'morning', 4400, 'culture', 3, 'Rue de Rivoli', 'booked', 0);
  insertActivity.run(parisStopId, trip1Id, 'Sunset Seine River Cruise with Champagne', 'Golden hour boat tour past Eiffel Tower and Notre Dame.', '2026-06-14', 'evening', 3600, 'relaxation', 1.5, 'Pont Neuf', 'booked', 1);
  insertActivity.run(parisStopId, trip1Id, 'Montmartre Artists & Sacré-Cœur Walk', 'Wander bohemian cobbled alleys and panoramic city views.', '2026-06-15', 'afternoon', 0, 'sightseeing', 2.5, 'Montmartre', 'planned', 2);

  insertActivity.run(zurichStopId, trip1Id, 'Uetliberg Mountain Hike & Vista', 'Scenic train ride up to summit lookout tower with Alps panorama.', '2026-06-17', 'morning', 1450, 'adventure', 3.5, 'Uetliberg', 'planned', 0);
  insertActivity.run(zurichStopId, trip1Id, 'Lake Zurich Sunset Boat Cruise', 'Peaceful cruise with views of snow-capped mountains.', '2026-06-17', 'evening', 2100, 'relaxation', 1.5, 'Bürkliplatz', 'planned', 1);
  insertActivity.run(zurichStopId, trip1Id, 'Swiss Fondue Dinner at Le Dézaley', 'Traditional Vaudois cheese fondue with local wine.', '2026-06-18', 'evening', 5200, 'food', 2, 'Old Town', 'planned', 2);

  insertActivity.run(romeStopId, trip1Id, 'Colosseum & Roman Forum VIP Access', 'Priority access to underground arena and ancient senate.', '2026-06-20', 'morning', 5500, 'sightseeing', 3.5, 'Piazza del Colosseo', 'booked', 0);
  insertActivity.run(romeStopId, trip1Id, 'Trastevere Culinary Stroll & Gelato', 'Handmade cacio e pepe pasta and award-winning pistachio gelato.', '2026-06-20', 'evening', 4000, 'food', 3, 'Trastevere', 'planned', 1);
  insertActivity.run(romeStopId, trip1Id, 'Vatican Museums & Sistine Chapel', 'Michelangelo frescoes and St. Peter Basilica tour.', '2026-06-21', 'morning', 4950, 'culture', 4, 'Vatican City', 'booked', 2);

  // Expenses for Trip 1 (In INR)
  const insertExpense = db.prepare(`
    INSERT INTO expenses (trip_id, stop_id, title, category, amount, currency, date, paid_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExpense.run(trip1Id, londonStopId, 'Eurostar Train London to Paris', 'transport', 11500, 'INR', '2026-06-13', 'Alex', 'Standard Premier class ticket');
  insertExpense.run(trip1Id, londonStopId, 'Covent Garden Hotel (3 Nights)', 'stay', 56000, 'INR', '2026-06-10', 'Alex', 'Includes breakfast');
  insertExpense.run(trip1Id, parisStopId, 'Le Marais Boutique Hotel (3 Nights)', 'stay', 62000, 'INR', '2026-06-13', 'Alex', 'Reserved through direct booking');
  insertExpense.run(trip1Id, parisStopId, 'TGV Lyria Paris to Zurich', 'transport', 9500, 'INR', '2026-06-16', 'Alex', 'High speed rail');
  insertExpense.run(trip1Id, zurichStopId, 'Zurich Lakeview Hotel (3 Nights)', 'stay', 74000, 'INR', '2026-06-16', 'Alex', 'Swiss standard rate');
  insertExpense.run(trip1Id, zurichStopId, 'Zurich to Rome Flight', 'transport', 10800, 'INR', '2026-06-19', 'Alex', 'Swiss Air flight with checked bag');
  insertExpense.run(trip1Id, romeStopId, 'Trevi Heritage Apartment (3 Nights)', 'stay', 43000, 'INR', '2026-06-19', 'Alex', 'Centrally located');
  insertExpense.run(trip1Id, londonStopId, 'Tower of London & West End Tickets', 'activities', 10200, 'INR', '2026-06-11', 'Alex', 'Pre-booked online');
  insertExpense.run(trip1Id, parisStopId, 'Louvre & Seine Cruise Tickets', 'activities', 8000, 'INR', '2026-06-14', 'Alex', 'Combined ticket vouchers');
  insertExpense.run(trip1Id, romeStopId, 'Colosseum & Vatican Entry Fees', 'activities', 10450, 'INR', '2026-06-20', 'Alex', 'Official skip-the-line passes');
  insertExpense.run(trip1Id, null, 'Daily Dining & Local Cafes (Estimated)', 'meals', 48000, 'INR', '2026-06-15', 'Alex', 'Budget allocation for 12 days');

  // 3. Seed Trip 2: Japan Golden Route
  insertTrip.run(
    userId,
    'Japan Golden Route: Tokyo to Osaka',
    '2026-10-04',
    '2026-10-14',
    'Autumn foliage, ultra-modern skylines, ancient shrines, and world-renowned gastronomy.',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    320000,
    0,
    'japan-golden-route-autumn'
  );

  const trip2 = db.prepare('SELECT id FROM trips WHERE public_slug = ?').get('japan-golden-route-autumn') as { id: number };
  const trip2Id = trip2.id;

  insertStop.run(trip2Id, 'Tokyo', 'Japan', 0, '2026-10-04', '2026-10-08', 'flight', 'Fly into Haneda Airport, Tokyo Monorail into city.', 'Shinjuku hotel base');
  insertStop.run(trip2Id, 'Kyoto', 'Japan', 1, '2026-10-08', '2026-10-11', 'train', 'Tokaido Shinkansen bullet train Nozomi (2h 15m).', 'Traditional Ryokan in Gion');
  insertStop.run(trip2Id, 'Osaka', 'Japan', 2, '2026-10-11', '2026-10-14', 'train', 'JR Special Rapid train from Kyoto to Osaka (28m).', 'Namba nightlife area');

  const trip2Stops = db.prepare('SELECT id, city_name FROM stops WHERE trip_id = ? ORDER BY order_index ASC').all(trip2Id) as { id: number; city_name: string }[];
  const tokyoStopId = trip2Stops.find(s => s.city_name === 'Tokyo')!.id;
  const kyotoStopId = trip2Stops.find(s => s.city_name === 'Kyoto')!.id;
  const osakaStopId = trip2Stops.find(s => s.city_name === 'Osaka')!.id;

  insertActivity.run(tokyoStopId, trip2Id, 'Shibuya Sky & Harajuku Vintage', '360 degree panoramic view of Tokyo followed by Cat Street shopping.', '2026-10-05', 'morning', 1800, 'sightseeing', 3, 'Shibuya', 'booked', 0);
  insertActivity.run(tokyoStopId, trip2Id, 'Tsukiji Outer Market Food Crawl', 'Fresh tamagoyaki, wagyu skewers, and fresh sashimi bowls.', '2026-10-06', 'morning', 3200, 'food', 2.5, 'Chuo City', 'planned', 1);
  insertActivity.run(tokyoStopId, trip2Id, 'teamLab Borderless Digital Art Museum', 'Immersive digital projection light installations.', '2026-10-06', 'afternoon', 2600, 'culture', 3, 'Azabudai Hills', 'booked', 2);

  insertActivity.run(kyotoStopId, trip2Id, 'Fushimi Inari Early Morning Hike', 'Hike through 10,000 vermilion torii gates at sunrise before crowds.', '2026-10-09', 'morning', 0, 'adventure', 3, 'Fushimi Ward', 'planned', 0);
  insertActivity.run(kyotoStopId, trip2Id, 'Authentic Matcha Tea Ceremony', 'Traditional matcha preparation with wagashi sweets in historic teahouse.', '2026-10-09', 'afternoon', 3600, 'culture', 1.5, 'Higashiyama', 'booked', 1);
  insertActivity.run(kyotoStopId, trip2Id, 'Arashiyama Bamboo Grove & Monkey Park', 'Towering bamboo stalks followed by Tenryu-ji Zen garden.', '2026-10-10', 'morning', 950, 'sightseeing', 3, 'Ukyo Ward', 'planned', 2);

  insertActivity.run(osakaStopId, trip2Id, 'Osaka Castle & Park Grounds', 'Historic 16th century samurai fortress with panoramic museum.', '2026-10-12', 'morning', 1200, 'sightseeing', 2.5, 'Chuo Ward', 'planned', 0);
  insertActivity.run(osakaStopId, trip2Id, 'Dotonbori Street Food Odyssey', 'Takoyaki octopus balls, okonomiyaki savory pancakes, and Glico sign.', '2026-10-12', 'evening', 2800, 'food', 3, 'Namba', 'planned', 1);

  insertExpense.run(trip2Id, tokyoStopId, 'JR 7-Day Rail Pass', 'transport', 27500, 'INR', '2026-10-04', 'Alex', 'Nationwide Shinkansen pass');
  insertExpense.run(trip2Id, tokyoStopId, 'Hotel Gracery Shinjuku (4 Nights)', 'stay', 51000, 'INR', '2026-10-04', 'Alex', 'Heart of Shinjuku');
  insertExpense.run(trip2Id, kyotoStopId, 'Gion Ryokan with Kaiseki (3 Nights)', 'stay', 69000, 'INR', '2026-10-08', 'Alex', 'Includes multi-course dinner');
  insertExpense.run(trip2Id, osakaStopId, 'Cross Hotel Osaka (3 Nights)', 'stay', 33500, 'INR', '2026-10-11', 'Alex', 'Steps from Dotonbori');
  insertExpense.run(trip2Id, tokyoStopId, 'TeamLab & Shibuya Sky Tickets', 'activities', 4400, 'INR', '2026-10-05', 'Alex', 'Booked via app');
  insertExpense.run(trip2Id, null, 'Meals & Dining Budget', 'meals', 41000, 'INR', '2026-10-07', 'Alex', 'Mid-trip dining allocation');
}

// 4. Catalog of Global Activities & Cities for Search (Costs in INR)
const CATALOG_ITEMS = [
    { id: 'cat-1', city_name: 'Paris', country: 'France', title: 'Eiffel Tower Summit by Night', description: 'Take the elevator to the top of Paris for breathtaking views of the illuminated City of Light.', category: 'sightseeing', cost: 2800, cost_index: 'moderate', duration_hours: 2.5, popularity: 99, image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-2', city_name: 'Paris', country: 'France', title: 'Pastry & Croissant Baking Masterclass', description: 'Learn secret French techniques to roll and bake flaky butter croissants from a master baker.', category: 'food', cost: 7600, cost_index: 'luxury', duration_hours: 3.0, popularity: 92, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-3', city_name: 'Tokyo', country: 'Japan', title: 'Akihabara Retro Gaming & Anime Tour', description: 'Delve into multi-story arcade centers, rare vintage cartridges, and otaku culture with a local guide.', category: 'culture', cost: 3200, cost_index: 'moderate', duration_hours: 3.0, popularity: 88, image_url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80', recommended_time: 'afternoon' },
    { id: 'cat-4', city_name: 'Tokyo', country: 'Japan', title: 'Omakase Sushi Counter Experience', description: '16-course seasonal nigiri tasting guided by a 3rd-generation sushi master in Ginza.', category: 'food', cost: 12800, cost_index: 'luxury', duration_hours: 2.0, popularity: 96, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-5', city_name: 'Rome', country: 'Italy', title: 'Appian Way Electric Bike Exploration', description: 'Pedal along ancient Roman basalt cobblestones past aqueducts, catacombs, and rolling pine hills.', category: 'adventure', cost: 3600, cost_index: 'moderate', duration_hours: 3.5, popularity: 86, image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-6', city_name: 'Rome', country: 'Italy', title: 'Handmade Pasta & Tiramisu Cooking Lab', description: 'Make tagliatelle and ravioli from scratch in a 17th-century palazzo accompanied by Chianti wine.', category: 'food', cost: 6000, cost_index: 'moderate', duration_hours: 3.0, popularity: 94, image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80', recommended_time: 'afternoon' },
    { id: 'cat-7', city_name: 'Kyoto', country: 'Japan', title: 'Zen Meditation at Kennin-ji Temple', description: 'Practice seated zazen meditation followed by peaceful green tea overlooking gravel rock gardens.', category: 'relaxation', cost: 1600, cost_index: 'budget', duration_hours: 1.5, popularity: 85, image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-8', city_name: 'Zurich', country: 'Switzerland', title: 'Thermal Baths & Spa Above the City', description: 'Bathe in mineral-rich rooftop thermal infinity pools overlooking the spire towers of Zurich.', category: 'relaxation', cost: 3400, cost_index: 'moderate', duration_hours: 3.0, popularity: 90, image_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80', recommended_time: 'afternoon' },
    { id: 'cat-9', city_name: 'London', country: 'United Kingdom', title: 'Sky Garden Sunrise & Breakfast', description: 'Marvel at 360-degree city skyline views from lush indoor landscaped gardens 35 stories up.', category: 'sightseeing', cost: 1200, cost_index: 'budget', duration_hours: 2.0, popularity: 91, image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-10', city_name: 'London', country: 'United Kingdom', title: 'Secret Speakeasy & Cocktails in Soho', description: 'Discover hidden bookshelf doors and craft mixology cocktails in London bohemian entertainment hub.', category: 'food', cost: 4000, cost_index: 'moderate', duration_hours: 2.5, popularity: 87, image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-11', city_name: 'Barcelona', country: 'Spain', title: 'Sagrada Familia Tower Climb & Crypt', description: 'Gaudí architectural crown jewel with stained-glass rainbow light and nativity tower elevator access.', category: 'culture', cost: 3100, cost_index: 'moderate', duration_hours: 2.5, popularity: 98, image_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-12', city_name: 'Barcelona', country: 'Spain', title: 'Gothic Quarter Tapas & Vermouth Crawl', description: 'Savor patatas bravas, Iberian bellota ham, and traditional red vermouth in medieval squares.', category: 'food', cost: 3600, cost_index: 'moderate', duration_hours: 3.0, popularity: 93, image_url: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-13', city_name: 'New York', country: 'United States', title: 'High Line & Chelsea Market Walk', description: 'Stroll on a converted elevated railroad trestle filled with wildflowers, public art, and artisan eateries.', category: 'sightseeing', cost: 0, cost_index: 'budget', duration_hours: 2.0, popularity: 95, image_url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-14', city_name: 'New York', country: 'United States', title: 'Broadway Night VIP Orchestra Seating', description: 'Experience premiere musical theater on the legendary Great White Way in Midtown Manhattan.', category: 'culture', cost: 11500, cost_index: 'luxury', duration_hours: 3.0, popularity: 97, image_url: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-15', city_name: 'Bangkok', country: 'Thailand', title: 'Grand Palace & Emerald Buddha Temple', description: 'Golden spires, intricate mother-of-pearl mosaics, and sacred royal courtyards along the Chao Phraya.', category: 'culture', cost: 1300, cost_index: 'budget', duration_hours: 3.0, popularity: 96, image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-16', city_name: 'Bangkok', country: 'Thailand', title: 'Chinatown Yaowarat Midnight Food Tuk-Tuk', description: 'Zoom on neon tuk-tuks between Michelin Bib Gourmand street stalls for crab fried rice and mango sticky rice.', category: 'adventure', cost: 2800, cost_index: 'budget', duration_hours: 3.5, popularity: 94, image_url: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-17', city_name: 'Sydney', country: 'Australia', title: 'Sydney Opera House Architectural Tour', description: 'Discover the engineering marvels and legendary concert acoustic halls designed by Jørn Utzon.', category: 'sightseeing', cost: 2600, cost_index: 'moderate', duration_hours: 1.5, popularity: 93, image_url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80', recommended_time: 'afternoon' },
    { id: 'cat-18', city_name: 'Sydney', country: 'Australia', title: 'Bondi to Coogee Coastal Cliff Walk', description: 'Dramatic ocean cliff pathway featuring turquoise ocean swimming baths, dolphin lookouts, and beaches.', category: 'adventure', cost: 0, cost_index: 'budget', duration_hours: 2.5, popularity: 91, image_url: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },

    // National (India) Catalog Items
    { id: 'cat-19', city_name: 'New Delhi', country: 'India', title: 'Old Delhi Heritage Food & Spice Trail', description: 'Explore historic Chandni Chowk alleyways, sampling legendary parathas, jalebis, and Asia’s largest spice market.', category: 'food', cost: 1800, cost_index: 'budget', duration_hours: 3.0, popularity: 97, image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-20', city_name: 'New Delhi', country: 'India', title: 'Qutub Minar & Mehrauli Archaeological Walk', description: 'Marvel at the 73-meter victory minaret, ancient iron pillar, and ancient Sufi monuments in Mehrauli.', category: 'culture', cost: 600, cost_index: 'budget', duration_hours: 2.5, popularity: 92, image_url: 'https://images.unsplash.com/photo-1592635196078-9fdc757f27f4?auto=format&fit=crop&w=600&q=80', recommended_time: 'afternoon' },
    { id: 'cat-21', city_name: 'Mumbai', country: 'India', title: 'Elephanta Caves Speedboat & Sculpture Tour', description: 'Cruise across Mumbai Harbour to UNESCO-listed 6th-century rock-cut Trimurti Shiva cave temples.', category: 'culture', cost: 2400, cost_index: 'moderate', duration_hours: 4.0, popularity: 95, image_url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-22', city_name: 'Mumbai', country: 'India', title: 'Marine Drive & Chowpatty Street Food Crawl', description: 'Bask in Queen’s Necklace sunsets followed by Mumbai pav bhaji, bhel puri, and kulfi treats.', category: 'food', cost: 1200, cost_index: 'budget', duration_hours: 2.5, popularity: 96, image_url: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-23', city_name: 'Jaipur', country: 'India', title: 'Amber Fort Hilltop Jeep & Palace Tour', description: 'Ascend the rugged Aravalli ridge to explore glittering Sheesh Mahal mirror halls and royal battlements.', category: 'sightseeing', cost: 1800, cost_index: 'moderate', duration_hours: 3.5, popularity: 98, image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-24', city_name: 'Jaipur', country: 'India', title: 'Chokhi Dhani Rajasthani Cultural Evening', description: 'Traditional folk dances, puppet shows, camel rides, and an authentic royal Rajasthani thali banquet.', category: 'culture', cost: 2200, cost_index: 'moderate', duration_hours: 3.5, popularity: 94, image_url: 'https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-25', city_name: 'Goa', country: 'India', title: 'Calangute & Baga Watersports Adventure', description: 'High-speed jet skiing, parasailing above the Arabian Sea, and banana boat rides on golden shores.', category: 'adventure', cost: 2500, cost_index: 'moderate', duration_hours: 3.0, popularity: 96, image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-26', city_name: 'Goa', country: 'India', title: 'Old Goa Heritage Churches & Spice Plantation', description: 'Baroque architecture of Bom Jesus Basilica followed by an aromatic organic spice plantation lunch.', category: 'culture', cost: 1600, cost_index: 'budget', duration_hours: 3.5, popularity: 91, image_url: 'https://images.unsplash.com/photo-1588096344356-9b4317f2bc29?auto=format&fit=crop&w=600&q=80', recommended_time: 'afternoon' },
    { id: 'cat-27', city_name: 'Bengaluru', country: 'India', title: 'Lalbagh Botanical Gardens & Heritage Walk', description: 'Centuries-old rare flora, 19th-century Victorian Glass House, and iconic South Indian filter coffee.', category: 'relaxation', cost: 450, cost_index: 'budget', duration_hours: 2.5, popularity: 89, image_url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-28', city_name: 'Udaipur', country: 'India', title: 'Lake Pichola Royal Sunset Boat Cruise', description: 'Glide past glittering marble palaces of Jag Mandir and the majestic City Palace illuminated at twilight.', category: 'relaxation', cost: 1900, cost_index: 'moderate', duration_hours: 2.0, popularity: 97, image_url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=600&q=80', recommended_time: 'evening' },
    { id: 'cat-29', city_name: 'Varanasi', country: 'India', title: 'Sunrise Boat Ride on Holy River Ganga', description: 'Witness dawn prayers, ancient crematoria rituals, and ancient temple ghats along the sacred waters.', category: 'sightseeing', cost: 1200, cost_index: 'budget', duration_hours: 2.5, popularity: 99, image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-30', city_name: 'Manali', country: 'India', title: 'Solang Valley Paragliding & Adventure', description: 'Tandem paragliding glide above cedar valleys with views of snow-clad Pir Panjal Himalayan peaks.', category: 'adventure', cost: 3200, cost_index: 'moderate', duration_hours: 3.0, popularity: 95, image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-31', city_name: 'Agra', country: 'India', title: 'Taj Mahal Sunrise VIP Guided Entry', description: 'First entry into the world wonder at dawn to witness morning mist reflecting off translucent white Makrana marble.', category: 'sightseeing', cost: 1600, cost_index: 'moderate', duration_hours: 3.0, popularity: 100, image_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
    { id: 'cat-32', city_name: 'Kochi', country: 'India', title: 'Alleppey Backwaters Houseboat Day Cruise', description: 'Drift past emerald paddy fields, coconut groves, and tranquil lagoons aboard a thatched Kerala kettuvallam.', category: 'relaxation', cost: 4200, cost_index: 'moderate', duration_hours: 4.5, popularity: 96, image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80', recommended_time: 'morning' },
  ];

function seedCatalog() {
  const insertCatalog = db.prepare(`
    INSERT OR IGNORE INTO catalog (id, city_name, country, title, description, category, cost, cost_index, duration_hours, popularity, image_url, recommended_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of CATALOG_ITEMS) {
    insertCatalog.run(
      item.id,
      item.city_name,
      item.country,
      item.title,
      item.description,
      item.category,
      item.cost,
      item.cost_index,
      item.duration_hours,
      item.popularity,
      item.image_url,
      item.recommended_time
    );
  }
}

function seedProposalsAndBookings() {
  const trip = db.prepare('SELECT id, start_date FROM trips LIMIT 1').get() as any;
  if (!trip) return;

  // Check if proposals already seeded
  const proposalCount = (db.prepare('SELECT COUNT(*) as c FROM activity_proposals').get() as any).c;
  if (proposalCount === 0) {
    const stops = db.prepare('SELECT id, city_name FROM stops WHERE trip_id = ?').all(trip.id) as any[];
    const p1Stop = stops.find((s: any) => s.city_name.includes('Paris')) || stops[1] || stops[0];
    const p2Stop = stops.find((s: any) => s.city_name.includes('Rome')) || stops[2] || stops[0];
    const p3Stop = stops.find((s: any) => s.city_name.includes('Zurich')) || stops[0];

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);
    const deadlineStr = deadlineDate.toISOString().split('T')[0];

    db.prepare('UPDATE trips SET voting_deadline = ? WHERE id = ?').run(deadlineStr, trip.id);

    // Proposal 1: Seine River Sunset Cruise
    const res1 = db.prepare(`
      INSERT INTO activity_proposals (trip_id, stop_id, proposer_name, title, place, cost_per_person, description, category, status, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `).run(
      trip.id,
      p1Stop?.id || null,
      'Sophie Taylor',
      'Sunset Champagne Cruise on the Seine',
      'Pont Neuf, Paris',
      3600,
      'Watch golden hour light up the Eiffel Tower and Notre Dame with a glass of French champagne.',
      'relaxation',
      deadlineStr
    );
    const prop1Id = Number((res1 as any).lastInsertRowid);

    // Proposal 2: Colosseum Underground & Night Arena
    const res2 = db.prepare(`
      INSERT INTO activity_proposals (trip_id, stop_id, proposer_name, title, place, cost_per_person, description, category, status, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `).run(
      trip.id,
      p2Stop?.id || null,
      'Alex Morgan',
      'VIP Moonlight Colosseum Underground Tour',
      'Piazza del Colosseo, Rome',
      5400,
      'Exclusive night access into the gladiator dungeons and trapdoors away from daytime crowds.',
      'culture',
      deadlineStr
    );
    const prop2Id = Number((res2 as any).lastInsertRowid);

    // Proposal 3: Swiss Alps Cableway to Mount Titlis
    const res3 = db.prepare(`
      INSERT INTO activity_proposals (trip_id, stop_id, proposer_name, title, place, cost_per_person, description, category, status, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `).run(
      trip.id,
      p3Stop?.id || null,
      'Liam Davies',
      'Mount Titlis Rotair Cableway & Glacier Cave',
      'Engelberg, Switzerland',
      7800,
      'Rotating panoramic cable car up to 3,020 meters above sea level with ice flyer and suspension bridge walk.',
      'adventure',
      deadlineStr
    );
    const prop3Id = Number((res3 as any).lastInsertRowid);

    // Seed votes
    const insertVote = db.prepare(`
      INSERT INTO proposal_votes (proposal_id, user_name, vote)
      VALUES (?, ?, ?)
    `);

    // Prop 1 votes
    insertVote.run(prop1Id, 'Alex Morgan', 'yes');
    insertVote.run(prop1Id, 'Sophie Taylor', 'yes');
    insertVote.run(prop1Id, 'Liam Davies', 'maybe');

    // Prop 2 votes (top voted!)
    insertVote.run(prop2Id, 'Alex Morgan', 'yes');
    insertVote.run(prop2Id, 'Sophie Taylor', 'yes');
    insertVote.run(prop2Id, 'Liam Davies', 'yes');

    // Prop 3 votes
    insertVote.run(prop3Id, 'Alex Morgan', 'no');
    insertVote.run(prop3Id, 'Sophie Taylor', 'maybe');
    insertVote.run(prop3Id, 'Liam Davies', 'yes');
  }

  // Seed bookings if empty
  const bookingCount = (db.prepare('SELECT COUNT(*) as c FROM bookings').get() as any).c;
  if (bookingCount === 0) {
    const insertBooking = db.prepare(`
      INSERT INTO bookings (id, trip_id, type, provider, title, subtitle, booking_ref, travel_date, origin, destination, amount, currency, passengers_or_guests, status, category_label, details, qr_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBooking.run(
      'BK-1049',
      trip.id,
      'train',
      'IRCTC / Indian Railways',
      '12952 / MUMBAI RAJDHANI EXPRESS',
      'Coach B3, Berth 27 (Lower Berth) • 3A Tier',
      '241-8934102',
      trip.start_date || '2026-06-12',
      'New Delhi (NDLS)',
      'Mumbai Central (MMCT)',
      1875,
      'INR',
      '1 Adult (Alex Morgan)',
      'Confirmed',
      'IRCTC Indian Railways',
      JSON.stringify({
        'Train No & Name': '12952 / MUMBAI RAJDHANI',
        'PNR Number': '241-8934102',
        'Departure': '16:55 (NDLS)',
        'Arrival': '08:35 (MMCT)',
        'Class': 'AC 3 Tier (3A)',
        'Coach / Berth': 'B3 - 27 (LB)',
        'Charting Status': 'CHART NOT PREPARED'
      }),
      'GT-241-8934102|1875|CONFIRMED'
    );

    insertBooking.run(
      'BK-1050',
      trip.id,
      'rental_car',
      'Goa Self-Drive Hub',
      'Mahindra Thar 4x4 Convertible Rental',
      'Self-Drive • Free 250 km/day • Keyless Bluetooth Pickup',
      'GA-RENT-77190',
      trip.start_date || '2026-06-15',
      'Goa Dabolim Airport Hub',
      'Goa',
      3900,
      'INR',
      'Alex Morgan',
      'Confirmed',
      'Vehicle Rental',
      JSON.stringify({
        'Assigned Plate': 'GA 03 AB 4912',
        'Vehicle Model': 'Mahindra Thar 4x4 Hardtop Diesel',
        'Pickup Location': 'Goa Dabolim Airport Hub Counter 4',
        'Fuel Policy': 'Full to Full'
      }),
      'GT-GA-RENT-77190|3900|CONFIRMED'
    );
  }
}

// Database query helpers
export const dbOps = {
  // User operations
  getUserByEmail(email: string) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  },
  getUserById(id: number) {
    return db.prepare('SELECT id, name, email, photo_url, language, currency, saved_destinations, created_at FROM users WHERE id = ?').get(id) as any;
  },
  createUser(name: string, email: string, passwordHash: string) {
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`;
    const res = db.prepare(`
      INSERT INTO users (name, email, password_hash, photo_url, language, currency, saved_destinations)
      VALUES (?, ?, ?, ?, 'en', 'INR', '[]')
    `).run(name, email, passwordHash, defaultAvatar);
    return this.getUserById(Number(res.lastInsertRowid));
  },
  updateUserProfile(id: number, data: { name?: string; photo_url?: string; language?: string; currency?: string; saved_destinations?: string[] }) {
    const user = this.getUserById(id);
    if (!user) return null;
    const name = data.name ?? user.name;
    const photo = data.photo_url ?? user.photo_url;
    const lang = data.language ?? user.language;
    const curr = data.currency ?? user.currency;
    const saved = data.saved_destinations ? JSON.stringify(data.saved_destinations) : user.saved_destinations;
    
    db.prepare(`
      UPDATE users SET name = ?, photo_url = ?, language = ?, currency = ?, saved_destinations = ?
      WHERE id = ?
    `).run(name, photo, lang, curr, saved, id);
    return this.getUserById(id);
  },
  updateUserPassword(id: number, passwordHash: string) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
  },

  // Trip operations
  getTripsByUser(userId: number) {
    const user = this.getUserById(userId);
    const userEmail = user?.email || '';

    const trips = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM stops WHERE trip_id = t.id) as destinations_count,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = t.id) as total_spent,
        (CASE 
          WHEN t.user_id = ? THEN 'owner' 
          ELSE COALESCE((SELECT role FROM trip_members WHERE trip_id = t.id AND (user_id = ? OR email = ?) LIMIT 1), 'editor')
        END) as user_role
      FROM trips t
      WHERE t.user_id = ?
         OR t.id IN (
           SELECT trip_id FROM trip_members WHERE user_id = ? OR email = ?
         )
      ORDER BY t.start_date DESC
    `).all(userId, userId, userEmail, userId, userId, userEmail) as any[];

    // Include stops for preview
    for (const trip of trips) {
      trip.stops = db.prepare(`
        SELECT id, city_name, country, order_index, start_date, end_date, transport_mode
        FROM stops
        WHERE trip_id = ?
        ORDER BY order_index ASC
      `).all(trip.id);
    }
    return trips;
  },

  getTripById(id: number) {
    const trip = db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = t.id) as total_spent
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!trip) return null;

    // Ensure trip has an invite code
    if (!trip.invite_code) {
      trip.invite_code = generateInviteCode();
      db.prepare('UPDATE trips SET invite_code = ? WHERE id = ?').run(trip.invite_code, trip.id);
    }

    // Get stops with their activities
    const stops = db.prepare(`
      SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC
    `).all(id) as any[];

    for (const stop of stops) {
      stop.activities = db.prepare(`
        SELECT * FROM activities WHERE stop_id = ? ORDER BY date ASC, order_index ASC, id ASC
      `).all(stop.id);
    }

    // Get all expenses
    const expenses = db.prepare(`
      SELECT e.*, s.city_name as stop_city_name
      FROM expenses e
      LEFT JOIN stops s ON e.stop_id = s.id
      WHERE e.trip_id = ?
      ORDER BY e.date ASC, e.id DESC
    `).all(id) as any[];

    for (const exp of expenses) {
      if (typeof exp.splits === 'string') {
        try {
          exp.splits = JSON.parse(exp.splits);
        } catch {
          exp.splits = [];
        }
      }
    }

    // Get members
    const members = this.getTripMembers(id);

    trip.stops = stops;
    trip.expenses = expenses;
    trip.members = members;
    trip.destinations_count = stops.length;
    trip.proposals = this.getProposals(id);
    trip.bookings = this.getBookings(id);
    return trip;
  },

  getTripBySlug(slug: string) {
    const trip = db.prepare('SELECT id FROM trips WHERE public_slug = ?').get(slug) as any;
    if (!trip) return null;
    return this.getTripById(trip.id);
  },

  createTrip(userId: number, data: { name: string; start_date: string; end_date: string; description?: string; cover_image?: string; budget_total?: number; is_public?: boolean }) {
    const slug = generateSlug(data.name);
    const inviteCode = generateInviteCode();
    const cover = data.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
    const budget = data.budget_total || 0;
    const isPublic = data.is_public ? 1 : 0;

    const res = db.prepare(`
      INSERT INTO trips (user_id, name, start_date, end_date, description, cover_image, budget_total, is_public, public_slug, invite_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, data.name, data.start_date, data.end_date, data.description || '', cover, budget, isPublic, slug, inviteCode);

    const newTripId = Number(res.lastInsertRowid);

    // Auto-add trip creator to trip_members as owner
    const creator = this.getUserById(userId);
    if (creator) {
      db.prepare(`
        INSERT INTO trip_members (trip_id, user_id, email, name, role, status)
        VALUES (?, ?, ?, ?, 'owner', 'accepted')
      `).run(newTripId, userId, creator.email, creator.name);
    }

    return this.getTripById(newTripId);
  },

  updateTrip(id: number, data: { name?: string; start_date?: string; end_date?: string; description?: string; cover_image?: string; budget_total?: number; is_public?: boolean }) {
    const current = db.prepare('SELECT * FROM trips WHERE id = ?').get(id) as any;
    if (!current) return null;

    const name = data.name ?? current.name;
    const start_date = data.start_date ?? current.start_date;
    const end_date = data.end_date ?? current.end_date;
    const description = data.description ?? current.description;
    const cover_image = data.cover_image ?? current.cover_image;
    const budget_total = data.budget_total !== undefined ? data.budget_total : current.budget_total;
    const is_public = data.is_public !== undefined ? (data.is_public ? 1 : 0) : current.is_public;

    db.prepare(`
      UPDATE trips
      SET name = ?, start_date = ?, end_date = ?, description = ?, cover_image = ?, budget_total = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, start_date, end_date, description, cover_image, budget_total, is_public, id);

    return this.getTripById(id);
  },

  deleteTrip(id: number) {
    db.prepare('DELETE FROM trips WHERE id = ?').run(id);
    return true;
  },

  duplicateTrip(tripId: number, targetUserId: number) {
    const original = this.getTripById(tripId);
    if (!original) return null;

    const newName = `${original.name} (Copy)`;
    const newTrip = this.createTrip(targetUserId, {
      name: newName,
      start_date: original.start_date,
      end_date: original.end_date,
      description: original.description,
      cover_image: original.cover_image,
      budget_total: original.budget_total,
      is_public: false,
    });

    // Copy stops & activities
    if (original.stops && original.stops.length > 0) {
      for (const stop of original.stops) {
        const newStop = this.createStop(newTrip.id, {
          city_name: stop.city_name,
          country: stop.country,
          order_index: stop.order_index,
          start_date: stop.start_date,
          end_date: stop.end_date,
          transport_mode: stop.transport_mode,
          transport_notes: stop.transport_notes,
          notes: stop.notes,
        });

        if (stop.activities && stop.activities.length > 0) {
          for (const act of stop.activities) {
            this.createActivity({
              stop_id: newStop.id,
              trip_id: newTrip.id,
              title: act.title,
              description: act.description,
              date: act.date,
              time_slot: act.time_slot,
              cost: act.cost,
              category: act.category,
              duration_hours: act.duration_hours,
              location: act.location,
              booking_status: 'planned',
              order_index: act.order_index,
            });
          }
        }
      }
    }

    return this.getTripById(newTrip.id);
  },

  // Stop operations
  createStop(trip_id: number, data: { city_name: string; country: string; order_index?: number; start_date: string; end_date: string; transport_mode?: string; transport_notes?: string; notes?: string }) {
    let orderIndex = data.order_index;
    if (orderIndex === undefined) {
      const max = (db.prepare('SELECT MAX(order_index) as m FROM stops WHERE trip_id = ?').get(trip_id) as any)?.m;
      orderIndex = max !== null && max !== undefined ? max + 1 : 0;
    }

    const res = (db.prepare(`
      INSERT INTO stops (trip_id, city_name, country, order_index, start_date, end_date, transport_mode, transport_notes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `) as any).run(
      trip_id,
      data.city_name,
      data.country,
      orderIndex,
      data.start_date,
      data.end_date,
      data.transport_mode || 'flight',
      data.transport_notes || '',
      data.notes || ''
    );

    return db.prepare('SELECT * FROM stops WHERE id = ?').get(Number(res.lastInsertRowid)) as any;
  },

  updateStop(stop_id: number, data: { city_name?: string; country?: string; order_index?: number; start_date?: string; end_date?: string; transport_mode?: string; transport_notes?: string; notes?: string }) {
    const cur = db.prepare('SELECT * FROM stops WHERE id = ?').get(stop_id) as any;
    if (!cur) return null;

    db.prepare(`
      UPDATE stops
      SET city_name = ?, country = ?, order_index = ?, start_date = ?, end_date = ?, transport_mode = ?, transport_notes = ?, notes = ?
      WHERE id = ?
    `).run(
      data.city_name ?? cur.city_name,
      data.country ?? cur.country,
      data.order_index ?? cur.order_index,
      data.start_date ?? cur.start_date,
      data.end_date ?? cur.end_date,
      data.transport_mode ?? cur.transport_mode,
      data.transport_notes ?? cur.transport_notes,
      data.notes ?? cur.notes,
      stop_id
    );

    return db.prepare('SELECT * FROM stops WHERE id = ?').get(stop_id) as any;
  },

  deleteStop(stop_id: number) {
    db.prepare('DELETE FROM stops WHERE id = ?').run(stop_id);
    return true;
  },

  reorderStops(trip_id: number, orderedStopIds: number[]) {
    const update = db.prepare('UPDATE stops SET order_index = ? WHERE id = ? AND trip_id = ?');
    for (let i = 0; i < orderedStopIds.length; i++) {
      update.run(i, orderedStopIds[i], trip_id);
    }
    return db.prepare('SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC').all(trip_id);
  },

  // Activity operations
  createActivity(data: { stop_id: number; trip_id: number; title: string; description?: string; date: string; time_slot?: string; cost?: number; category?: string; duration_hours?: number; location?: string; booking_status?: string; order_index?: number }) {
    const res = db.prepare(`
      INSERT INTO activities (stop_id, trip_id, title, description, date, time_slot, cost, category, duration_hours, location, booking_status, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.stop_id,
      data.trip_id,
      data.title,
      data.description || '',
      data.date,
      data.time_slot || 'morning',
      data.cost || 0,
      data.category || 'sightseeing',
      data.duration_hours || 2,
      data.location || '',
      data.booking_status || 'planned',
      data.order_index || 0
    );

    return db.prepare('SELECT * FROM activities WHERE id = ?').get(Number(res.lastInsertRowid)) as any;
  },

  updateActivity(id: number, data: { title?: string; description?: string; date?: string; time_slot?: string; cost?: number; category?: string; duration_hours?: number; location?: string; booking_status?: string; order_index?: number }) {
    const cur = db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as any;
    if (!cur) return null;

    db.prepare(`
      UPDATE activities
      SET title = ?, description = ?, date = ?, time_slot = ?, cost = ?, category = ?, duration_hours = ?, location = ?, booking_status = ?, order_index = ?
      WHERE id = ?
    `).run(
      data.title ?? cur.title,
      data.description ?? cur.description,
      data.date ?? cur.date,
      data.time_slot ?? cur.time_slot,
      data.cost !== undefined ? data.cost : cur.cost,
      data.category ?? cur.category,
      data.duration_hours !== undefined ? data.duration_hours : cur.duration_hours,
      data.location ?? cur.location,
      data.booking_status ?? cur.booking_status,
      data.order_index !== undefined ? data.order_index : cur.order_index,
      id
    );

    return db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as any;
  },

  deleteActivity(id: number) {
    db.prepare('DELETE FROM activities WHERE id = ?').run(id);
    return true;
  },

  // Trip Member Operations
  getTripMembers(tripId: number) {
    const trip = db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as any;
    if (!trip) return [];

    const members = db.prepare(`
      SELECT tm.*, u.photo_url
      FROM trip_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.trip_id = ?
      ORDER BY tm.role = 'owner' DESC, tm.created_at ASC
    `).all(tripId) as any[];

    // Ensure owner is present
    const hasOwner = members.some(m => m.role === 'owner' || m.user_id === trip.user_id);
    if (!hasOwner) {
      const owner = this.getUserById(trip.user_id);
      if (owner) {
        members.unshift({
          id: 0,
          trip_id: tripId,
          user_id: owner.id,
          email: owner.email,
          name: owner.name,
          role: 'owner',
          status: 'accepted',
          photo_url: owner.photo_url,
          created_at: new Date().toISOString(),
        });
      }
    }

    return members;
  },

  addTripMember(tripId: number, data: { email: string; name?: string; role?: string; invited_by?: number }) {
    const trimmedEmail = data.email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND email = ?').get(tripId, trimmedEmail) as any;
    if (existing) {
      return db.prepare('SELECT * FROM trip_members WHERE id = ?').get(existing.id) as any;
    }

    // Check if registered user
    const regUser = this.getUserByEmail(trimmedEmail);
    const userId = regUser ? regUser.id : null;
    const displayName = data.name?.trim() || (regUser ? regUser.name : trimmedEmail.split('@')[0]);

    const res = db.prepare(`
      INSERT INTO trip_members (trip_id, user_id, email, name, role, status, invited_by)
      VALUES (?, ?, ?, ?, ?, 'accepted', ?)
    `).run(tripId, userId, trimmedEmail, displayName, data.role || 'editor', data.invited_by || null);

    return db.prepare('SELECT * FROM trip_members WHERE id = ?').get(Number(res.lastInsertRowid)) as any;
  },

  removeTripMember(tripId: number, memberId: number) {
    db.prepare('DELETE FROM trip_members WHERE id = ? AND trip_id = ?').run(memberId, tripId);
    return true;
  },

  getTripByInviteCode(inviteCode: string) {
    const code = inviteCode.trim().toUpperCase();
    const trip = db.prepare('SELECT id FROM trips WHERE invite_code = ?').get(code) as any;
    if (!trip) return null;
    return this.getTripById(trip.id);
  },

  joinTripByInviteCode(inviteCode: string, userId: number) {
    const code = inviteCode.trim().toUpperCase();
    const trip = db.prepare('SELECT id, user_id, name FROM trips WHERE invite_code = ?').get(code) as any;
    if (!trip) return null;

    const user = this.getUserById(userId);
    if (!user) return null;

    // Check if user is already owner
    if (trip.user_id === userId) {
      return this.getTripById(trip.id);
    }

    // Check if already a member
    const existing = db.prepare('SELECT id FROM trip_members WHERE trip_id = ? AND (user_id = ? OR email = ?)').get(trip.id, userId, user.email) as any;
    if (!existing) {
      db.prepare(`
        INSERT INTO trip_members (trip_id, user_id, email, name, role, status)
        VALUES (?, ?, ?, ?, 'editor', 'accepted')
      `).run(trip.id, userId, user.email, user.name);
    } else {
      db.prepare('UPDATE trip_members SET user_id = ?, name = ? WHERE id = ?').run(userId, user.name, existing.id);
    }

    return this.getTripById(trip.id);
  },

  isUserAllowedTrip(tripId: number, userId: number): boolean {
    const trip = db.prepare('SELECT user_id, is_public FROM trips WHERE id = ?').get(tripId) as any;
    if (!trip) return false;
    if (trip.user_id === userId) return true;

    const user = this.getUserById(userId);
    const userEmail = user?.email || '';

    const member = db.prepare(`
      SELECT id FROM trip_members
      WHERE trip_id = ? AND (user_id = ? OR email = ?)
    `).get(tripId, userId, userEmail);

    return !!member;
  },

  // Expense operations
  createExpense(data: {
    trip_id: number;
    stop_id?: number | null;
    title: string;
    category: string;
    amount: number;
    currency?: string;
    date: string;
    paid_by?: string;
    paid_by_user_id?: number | null;
    split_type?: string;
    splits?: any[] | string;
    notes?: string;
  }) {
    const splitsStr = typeof data.splits === 'string' ? data.splits : JSON.stringify(data.splits || []);
    const res = db.prepare(`
      INSERT INTO expenses (trip_id, stop_id, title, category, amount, currency, date, paid_by, paid_by_user_id, split_type, splits, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.trip_id,
      data.stop_id || null,
      data.title,
      data.category,
      data.amount,
      data.currency || 'INR',
      data.date,
      data.paid_by || '',
      data.paid_by_user_id || null,
      data.split_type || 'equal',
      splitsStr,
      data.notes || ''
    );

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(res.lastInsertRowid)) as any;
    if (typeof expense.splits === 'string') {
      try { expense.splits = JSON.parse(expense.splits); } catch { expense.splits = []; }
    }
    return expense;
  },

  updateExpense(id: number, data: {
    stop_id?: number | null;
    title?: string;
    category?: string;
    amount?: number;
    currency?: string;
    date?: string;
    paid_by?: string;
    paid_by_user_id?: number | null;
    split_type?: string;
    splits?: any[] | string;
    notes?: string;
  }) {
    const cur = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
    if (!cur) return null;

    const splitsStr = data.splits !== undefined
      ? (typeof data.splits === 'string' ? data.splits : JSON.stringify(data.splits))
      : cur.splits;

    db.prepare(`
      UPDATE expenses
      SET stop_id = ?, title = ?, category = ?, amount = ?, currency = ?, date = ?, paid_by = ?, paid_by_user_id = ?, split_type = ?, splits = ?, notes = ?
      WHERE id = ?
    `).run(
      data.stop_id !== undefined ? data.stop_id : cur.stop_id,
      data.title ?? cur.title,
      data.category ?? cur.category,
      data.amount !== undefined ? data.amount : cur.amount,
      data.currency ?? cur.currency,
      data.date ?? cur.date,
      data.paid_by ?? cur.paid_by,
      data.paid_by_user_id !== undefined ? data.paid_by_user_id : cur.paid_by_user_id,
      data.split_type ?? cur.split_type,
      splitsStr,
      data.notes ?? cur.notes,
      id
    );

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
    if (typeof expense.splits === 'string') {
      try { expense.splits = JSON.parse(expense.splits); } catch { expense.splits = []; }
    }
    return expense;
  },

  deleteExpense(id: number) {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    return true;
  },

  getExpensesSummary(tripId: number) {
    const breakdown = db.prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      WHERE trip_id = ?
      GROUP BY category
    `).all(tripId) as { category: string; total: number; count: number }[];

    const totalSpent = (db.prepare('SELECT COALESCE(SUM(amount), 0) as s FROM expenses WHERE trip_id = ?').get(tripId) as any).s;
    const dailyExpenses = db.prepare(`
      SELECT date, SUM(amount) as day_total
      FROM expenses
      WHERE trip_id = ?
      GROUP BY date
      ORDER BY date ASC
    `).all(tripId) as { date: string; day_total: number }[];

    return { breakdown, totalSpent, dailyExpenses };
  },

  // Settlements & Debt Simplification
  createSettlement(data: {
    trip_id: number;
    from_user_id?: number | null;
    from_name: string;
    to_user_id?: number | null;
    to_name: string;
    amount: number;
    currency?: string;
    date: string;
    notes?: string;
  }) {
    const res = db.prepare(`
      INSERT INTO settlements (trip_id, from_user_id, from_name, to_user_id, to_name, amount, currency, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.trip_id,
      data.from_user_id || null,
      data.from_name.trim(),
      data.to_user_id || null,
      data.to_name.trim(),
      data.amount,
      data.currency || 'INR',
      data.date,
      data.notes || ''
    );
    return db.prepare('SELECT * FROM settlements WHERE id = ?').get(Number(res.lastInsertRowid)) as any;
  },

  deleteSettlement(id: number) {
    db.prepare('DELETE FROM settlements WHERE id = ?').run(id);
    return true;
  },

  getSettlements(tripId: number) {
    return db.prepare(`
      SELECT * FROM settlements WHERE trip_id = ? ORDER BY date DESC, id DESC
    `).all(tripId) as any[];
  },

  getTripBalances(tripId: number) {
    const trip = this.getTripById(tripId);
    if (!trip) return null;

    const members = this.getTripMembers(tripId);
    const expenses = trip.expenses || [];
    const settlements = this.getSettlements(tripId);

    interface MemberBalance {
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

    const memberMap = new Map<string, MemberBalance>();

    for (const m of members) {
      const key = m.name.toLowerCase().trim();
      memberMap.set(key, {
        id: m.id,
        user_id: m.user_id,
        name: m.name,
        email: m.email,
        role: m.role,
        photo_url: m.photo_url,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      });
    }

    // Ensure trip owner is registered in memberMap
    if (trip.user_name && !memberMap.has(trip.user_name.toLowerCase().trim())) {
      memberMap.set(trip.user_name.toLowerCase().trim(), {
        user_id: trip.user_id,
        name: trip.user_name,
        email: trip.user_email || '',
        role: 'owner',
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      });
    }

    const memberList = Array.from(memberMap.values());
    const memberCount = Math.max(1, memberList.length);

    let totalExpenses = 0;
    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalExpenses += amt;

      // Credit payer
      const payerName = (exp.paid_by || trip.user_name || 'Traveler').trim();
      let payer = memberMap.get(payerName.toLowerCase());
      if (!payer && exp.paid_by_user_id) {
        payer = memberList.find(m => m.user_id === exp.paid_by_user_id);
      }
      if (payer) {
        payer.totalPaid += amt;
      } else {
        const newPayer: MemberBalance = {
          name: payerName,
          email: '',
          role: 'editor',
          totalPaid: amt,
          totalOwed: 0,
          netBalance: 0,
        };
        memberMap.set(payerName.toLowerCase(), newPayer);
        memberList.push(newPayer);
      }

      // Debit participants
      const splitType = exp.split_type || 'equal';
      let splits: any[] = [];
      if (Array.isArray(exp.splits)) {
        splits = exp.splits;
      } else if (typeof exp.splits === 'string') {
        try { splits = JSON.parse(exp.splits); } catch { splits = []; }
      }

      if (splits.length > 0) {
        if (splitType === 'equal') {
          const share = amt / splits.length;
          for (const s of splits) {
            const sName = (s.name || '').toLowerCase().trim();
            const target = memberMap.get(sName) || memberList.find(m => m.user_id && m.user_id === s.userId);
            if (target) target.totalOwed += share;
          }
        } else if (splitType === 'exact') {
          for (const s of splits) {
            const sName = (s.name || '').toLowerCase().trim();
            const target = memberMap.get(sName) || memberList.find(m => m.user_id && m.user_id === s.userId);
            if (target) target.totalOwed += Number(s.amount) || 0;
          }
        } else if (splitType === 'percent') {
          for (const s of splits) {
            const sName = (s.name || '').toLowerCase().trim();
            const target = memberMap.get(sName) || memberList.find(m => m.user_id && m.user_id === s.userId);
            if (target) {
              const pct = Number(s.percent ?? s.amount) || 0;
              target.totalOwed += (amt * pct) / 100;
            }
          }
        }
      } else {
        // Equal split among all known members
        const share = amt / memberCount;
        for (const m of memberList) {
          m.totalOwed += share;
        }
      }
    }

    // Base net balance
    for (const m of memberList) {
      m.netBalance = m.totalPaid - m.totalOwed;
    }

    // Adjust for settlements
    for (const st of settlements) {
      const fromName = (st.from_name || '').toLowerCase().trim();
      const toName = (st.to_name || '').toLowerCase().trim();
      const sAmt = Number(st.amount) || 0;

      const fromMem = memberMap.get(fromName) || memberList.find(m => m.user_id && m.user_id === st.from_user_id);
      const toMem = memberMap.get(toName) || memberList.find(m => m.user_id && m.user_id === st.to_user_id);

      if (fromMem) fromMem.netBalance += sAmt;
      if (toMem) toMem.netBalance -= sAmt;
    }

    // Rounding
    for (const m of memberList) {
      m.totalPaid = Math.round(m.totalPaid * 100) / 100;
      m.totalOwed = Math.round(m.totalOwed * 100) / 100;
      m.netBalance = Math.round(m.netBalance * 100) / 100;
    }

    // Simplified debts algorithm
    interface SimplifiedDebt {
      fromName: string;
      fromUserId?: number;
      toName: string;
      toUserId?: number;
      amount: number;
    }

    const debtors = memberList
      .filter(m => m.netBalance < -0.5)
      .map(m => ({ name: m.name, userId: m.user_id, amount: Math.abs(m.netBalance) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = memberList
      .filter(m => m.netBalance > 0.5)
      .map(m => ({ name: m.name, userId: m.user_id, amount: m.netBalance }))
      .sort((a, b) => b.amount - a.amount);

    const simplifiedDebts: SimplifiedDebt[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settleAmt = Math.min(debtor.amount, creditor.amount);
      if (settleAmt >= 0.5) {
        simplifiedDebts.push({
          fromName: debtor.name,
          fromUserId: debtor.userId,
          toName: creditor.name,
          toUserId: creditor.userId,
          amount: Math.round(settleAmt),
        });
      }

      debtor.amount -= settleAmt;
      creditor.amount -= settleAmt;

      if (debtor.amount < 0.5) dIdx++;
      if (creditor.amount < 0.5) cIdx++;
    }

    return {
      tripId,
      totalExpenses,
      members: memberList,
      simplifiedDebts,
      settlements,
    };
  },

  // Catalog search
  searchCatalog(filters: { query?: string; country?: string; category?: string; cost_index?: string; max_duration?: number; scope?: 'national' | 'international' }) {
    let sql = 'SELECT * FROM catalog WHERE 1=1';
    const params: any[] = [];

    // Scope restriction: National (India) vs International (outside India)
    if (filters.scope === 'national') {
      sql += " AND country = 'India'";
    } else if (filters.scope === 'international') {
      sql += " AND country != 'India'";
    }

    if (filters.query) {
      sql += ' AND (city_name LIKE ? OR country LIKE ? OR title LIKE ? OR description LIKE ?)';
      const q = `%${filters.query}%`;
      params.push(q, q, q, q);
    }
    if (filters.country && filters.country !== 'all') {
      sql += ' AND country = ?';
      params.push(filters.country);
    }
    if (filters.category && filters.category !== 'all') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.cost_index && filters.cost_index !== 'all') {
      sql += ' AND cost_index = ?';
      params.push(filters.cost_index);
    }
    if (filters.max_duration) {
      sql += ' AND duration_hours <= ?';
      params.push(filters.max_duration);
    }

    sql += ' ORDER BY popularity DESC';
    return db.prepare(sql).all(...params) as any[];
  },

  getCatalogCountries(scope?: string) {
    if (scope === 'national') {
      return ['India'];
    }
    if (scope === 'international') {
      return (db.prepare("SELECT DISTINCT country FROM catalog WHERE country != 'India' ORDER BY country ASC").all() as any[]).map(r => r.country);
    }
    return (db.prepare('SELECT DISTINCT country FROM catalog ORDER BY country ASC').all() as any[]).map(r => r.country);
  },

  // Voting Board & Activity Proposals
  getProposals(tripId: number, currentUserName?: string) {
    const trip = db.prepare('SELECT voting_deadline FROM trips WHERE id = ?').get(tripId) as any;
    const defaultDeadline = trip?.voting_deadline;

    const proposals = db.prepare(`
      SELECT p.*, s.city_name as stop_city_name
      FROM activity_proposals p
      LEFT JOIN stops s ON p.stop_id = s.id
      WHERE p.trip_id = ?
      ORDER BY p.status = 'open' DESC, p.created_at DESC
    `).all(tripId) as any[];

    for (const prop of proposals) {
      if (!prop.deadline && defaultDeadline) {
        prop.deadline = defaultDeadline;
      }

      const votes = db.prepare(`
        SELECT * FROM proposal_votes WHERE proposal_id = ? ORDER BY created_at ASC
      `).all(prop.id) as any[];

      prop.votes = votes;
      let yes = 0;
      let no = 0;
      let maybe = 0;
      let userVote: string | undefined = undefined;

      for (const v of votes) {
        if (v.vote === 'yes') yes++;
        else if (v.vote === 'no') no++;
        else if (v.vote === 'maybe') maybe++;

        if (currentUserName && v.user_name?.toLowerCase() === currentUserName.toLowerCase()) {
          userVote = v.vote;
        }
      }

      prop.yesCount = yes;
      prop.noCount = no;
      prop.maybeCount = maybe;
      prop.score = yes - no;
      prop.userVote = userVote;
    }

    proposals.sort((a, b) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (a.status !== 'open' && b.status === 'open') return 1;
      if (a.status === 'open' && b.status === 'open') {
        if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
        return (b.yesCount ?? 0) - (a.yesCount ?? 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return proposals;
  },

  createProposal(data: {
    trip_id: number;
    stop_id?: number | null;
    proposer_user_id?: number | null;
    proposer_name: string;
    title: string;
    place: string;
    cost_per_person: number;
    description?: string;
    category?: string;
    deadline?: string;
  }) {
    const trip = db.prepare('SELECT voting_deadline FROM trips WHERE id = ?').get(data.trip_id) as any;
    const deadline = data.deadline || trip?.voting_deadline || null;

    const res = db.prepare(`
      INSERT INTO activity_proposals (trip_id, stop_id, proposer_user_id, proposer_name, title, place, cost_per_person, description, category, status, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `).run(
      data.trip_id,
      data.stop_id || null,
      data.proposer_user_id || null,
      data.proposer_name,
      data.title.trim(),
      data.place.trim(),
      Number(data.cost_per_person) || 0,
      data.description || '',
      data.category || 'sightseeing',
      deadline
    );

    const propId = Number((res as any).lastInsertRowid);
    db.prepare(`
      INSERT OR REPLACE INTO proposal_votes (proposal_id, user_id, user_name, vote)
      VALUES (?, ?, ?, 'yes')
    `).run(propId, data.proposer_user_id || null, data.proposer_name);

    return this.getProposalById(propId);
  },

  getProposalById(proposalId: number) {
    const prop = db.prepare(`
      SELECT p.*, s.city_name as stop_city_name
      FROM activity_proposals p
      LEFT JOIN stops s ON p.stop_id = s.id
      WHERE p.id = ?
    `).get(proposalId) as any;
    if (!prop) return null;

    const votes = db.prepare('SELECT * FROM proposal_votes WHERE proposal_id = ?').all(prop.id) as any[];
    prop.votes = votes;
    prop.yesCount = votes.filter(v => v.vote === 'yes').length;
    prop.noCount = votes.filter(v => v.vote === 'no').length;
    prop.maybeCount = votes.filter(v => v.vote === 'maybe').length;
    prop.score = prop.yesCount - prop.noCount;
    return prop;
  },

  voteProposal(proposalId: number, userId: number | null, userName: string, vote: 'yes' | 'no' | 'maybe') {
    db.prepare(`
      INSERT INTO proposal_votes (proposal_id, user_id, user_name, vote)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(proposal_id, user_name) DO UPDATE SET vote = excluded.vote, created_at = CURRENT_TIMESTAMP
    `).run(proposalId, userId || null, userName.trim(), vote);

    return this.getProposalById(proposalId);
  },

  setVotingDeadline(tripId: number, deadline: string) {
    db.prepare('UPDATE trips SET voting_deadline = ? WHERE id = ?').run(deadline, tripId);
    db.prepare('UPDATE activity_proposals SET deadline = ? WHERE trip_id = ? AND status = "open"').run(deadline, tripId);
    return this.getProposals(tripId);
  },

  acceptProposalToItinerary(proposalId: number, options: { stop_id?: number; date?: string; time_slot?: string; party_size?: number }) {
    const prop = this.getProposalById(proposalId);
    if (!prop) return null;

    let stopId = options.stop_id || prop.stop_id;
    if (!stopId) {
      const firstStop = db.prepare('SELECT id FROM stops WHERE trip_id = ? ORDER BY order_index ASC LIMIT 1').get(prop.trip_id) as any;
      stopId = firstStop ? firstStop.id : null;
    }

    if (!stopId) throw new Error('A trip stop is required to add this activity to the itinerary');

    const stop = db.prepare('SELECT * FROM stops WHERE id = ?').get(stopId) as any;
    const actDate = options.date || stop.start_date || new Date().toISOString().split('T')[0];
    const timeSlot = options.time_slot || 'afternoon';
    const partySize = options.party_size && options.party_size > 0 ? options.party_size : 1;
    const totalCost = (Number(prop.cost_per_person) || 0) * partySize;

    const activity = this.createActivity({
      stop_id: stopId,
      trip_id: prop.trip_id,
      title: prop.title,
      description: prop.description || `Voted & approved activity at ${prop.place}`,
      date: actDate,
      time_slot: timeSlot,
      cost: totalCost,
      category: prop.category || 'sightseeing',
      duration_hours: 2.5,
      location: prop.place,
      booking_status: 'planned'
    });

    if (totalCost > 0) {
      this.createExpense({
        trip_id: prop.trip_id,
        stop_id: stopId,
        title: `${prop.title} (${partySize} pax)`,
        category: 'activities',
        amount: totalCost,
        currency: 'INR',
        date: actDate,
        paid_by: prop.proposer_name || 'Traveler',
        notes: `Approved via voting board. Cost: ₹${prop.cost_per_person}/person`
      });
    }

    db.prepare('UPDATE activity_proposals SET status = "accepted" WHERE id = ?').run(proposalId);

    return {
      proposal: this.getProposalById(proposalId),
      activity,
      trip: this.getTripById(prop.trip_id)
    };
  },

  deleteProposal(proposalId: number) {
    db.prepare('DELETE FROM activity_proposals WHERE id = ?').run(proposalId);
    return true;
  },

  // Bookings Storage & Management
  getBookings(tripId: number) {
    const list = db.prepare(`
      SELECT * FROM bookings WHERE trip_id = ? ORDER BY travel_date ASC, created_at DESC
    `).all(tripId) as any[];

    for (const b of list) {
      if (typeof b.details === 'string') {
        try { b.details = JSON.parse(b.details); } catch { b.details = {}; }
      }
    }
    return list;
  },

  createBooking(tripId: number, data: any) {
    const id = data.id || 'BK-' + Math.floor(1000 + Math.random() * 9000);
    const detailsStr = typeof data.details === 'string' ? data.details : JSON.stringify(data.details || {});

    db.prepare(`
      INSERT OR REPLACE INTO bookings (id, trip_id, type, provider, title, subtitle, booking_ref, travel_date, end_date, origin, destination, amount, currency, passengers_or_guests, status, category_label, details, qr_data, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tripId,
      data.type || 'activity',
      data.provider || '',
      data.title || 'Confirmed Reservation',
      data.subtitle || '',
      data.booking_ref || data.bookingRef || 'REF-' + Math.floor(100000 + Math.random() * 900000),
      data.travel_date || data.travelDate || new Date().toISOString().split('T')[0],
      data.end_date || data.endDate || null,
      data.origin || '',
      data.destination || '',
      Number(data.amount) || 0,
      data.currency || 'INR',
      data.passengers_or_guests || data.passengersOrGuests || '1 Traveler',
      data.status || 'Confirmed',
      data.category_label || data.categoryLabel || 'Booking',
      detailsStr,
      data.qr_data || data.qrData || `GT-${id}|${data.booking_ref}|CONFIRMED`,
      data.notes || ''
    );

    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
    if (b && typeof b.details === 'string') {
      try { b.details = JSON.parse(b.details); } catch { b.details = {}; }
    }
    return b;
  },

  deleteBooking(id: string) {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    return true;
  }
};
