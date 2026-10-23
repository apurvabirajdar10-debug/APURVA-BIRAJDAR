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
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE SET NULL
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
  `);

  seedData();
}

// Simple password hashing helper
export function hashPassword(password: string): string {
  const salt = 'globetrotter_salt_2026';
  return crypto.scryptSync(password, salt, 32).toString('hex');
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

  // 4. Seed Catalog of Global Activities & Cities for Search (Costs in INR)
  const catalogItems = [
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

  const insertCatalog = db.prepare(`
    INSERT INTO catalog (id, city_name, country, title, description, category, cost, cost_index, duration_hours, popularity, image_url, recommended_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of catalogItems) {
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

  console.log('Seeded database successfully with INR values!');
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
    const trips = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM stops WHERE trip_id = t.id) as destinations_count,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = t.id) as total_spent
      FROM trips t
      WHERE t.user_id = ?
      ORDER BY t.start_date DESC
    `).all(userId) as any[];

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
      SELECT t.*, u.name as user_name,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = t.id) as total_spent
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!trip) return null;

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
    `).all(id);

    trip.stops = stops;
    trip.expenses = expenses;
    trip.destinations_count = stops.length;
    return trip;
  },

  getTripBySlug(slug: string) {
    const trip = db.prepare('SELECT id FROM trips WHERE public_slug = ?').get(slug) as any;
    if (!trip) return null;
    return this.getTripById(trip.id);
  },

  createTrip(userId: number, data: { name: string; start_date: string; end_date: string; description?: string; cover_image?: string; budget_total?: number; is_public?: boolean }) {
    const slug = generateSlug(data.name);
    const cover = data.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
    const budget = data.budget_total || 0;
    const isPublic = data.is_public ? 1 : 0;

    const res = db.prepare(`
      INSERT INTO trips (user_id, name, start_date, end_date, description, cover_image, budget_total, is_public, public_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, data.name, data.start_date, data.end_date, data.description || '', cover, budget, isPublic, slug);

    return this.getTripById(Number(res.lastInsertRowid));
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

  // Expense operations
  createExpense(data: { trip_id: number; stop_id?: number | null; title: string; category: string; amount: number; currency?: string; date: string; paid_by?: string; notes?: string }) {
    const res = db.prepare(`
      INSERT INTO expenses (trip_id, stop_id, title, category, amount, currency, date, paid_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.trip_id,
      data.stop_id || null,
      data.title,
      data.category,
      data.amount,
      data.currency || 'INR',
      data.date,
      data.paid_by || '',
      data.notes || ''
    );

    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(res.lastInsertRowid)) as any;
  },

  updateExpense(id: number, data: { stop_id?: number | null; title?: string; category?: string; amount?: number; currency?: string; date?: string; paid_by?: string; notes?: string }) {
    const cur = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
    if (!cur) return null;

    db.prepare(`
      UPDATE expenses
      SET stop_id = ?, title = ?, category = ?, amount = ?, currency = ?, date = ?, paid_by = ?, notes = ?
      WHERE id = ?
    `).run(
      data.stop_id !== undefined ? data.stop_id : cur.stop_id,
      data.title ?? cur.title,
      data.category ?? cur.category,
      data.amount !== undefined ? data.amount : cur.amount,
      data.currency ?? cur.currency,
      data.date ?? cur.date,
      data.paid_by ?? cur.paid_by,
      data.notes ?? cur.notes,
      id
    );

    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any;
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
  }
};
