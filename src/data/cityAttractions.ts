export interface CuratedAttraction {
  title: string;
  description: string;
  category: 'sightseeing' | 'food' | 'culture' | 'adventure' | 'relaxation' | 'shopping';
  time_slot: 'morning' | 'afternoon' | 'evening';
  duration_hours: number;
  cost: number; // in INR (₹)
  location: string;
}

export const CURATED_CITY_ATTRACTIONS: Record<string, CuratedAttraction[]> = {
  // Paris, France
  paris: [
    {
      title: 'Eiffel Tower & Champ de Mars Summit',
      description: 'Ascend to the highest accessible observation platform in Europe with breathtaking panoramic vistas across Paris.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 2800,
      location: 'Champ de Mars, 7th Arr.',
    },
    {
      title: 'Louvre Museum Masterpieces & Glass Pyramid',
      description: 'Guided tour of the Mona Lisa, Winged Victory of Samothrace, and majestic Venus de Milo in royal historic galleries.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 3.5,
      cost: 2400,
      location: 'Rue de Rivoli, 1st Arr.',
    },
    {
      title: 'Seine River Sunset Cruise with Champagne',
      description: 'Gliding along the illuminated banks of the Seine past Notre-Dame Cathedral and the shimmering Eiffel Tower.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 1.5,
      cost: 2100,
      location: 'Pont Neuf, Central Paris',
    },
    {
      title: 'Montmartre Bohemian Alleys & Sacré-Cœur',
      description: 'Wander cobbled artisan lanes, Place du Tertre portrait painters, and the hilltop basilica overlooking Paris.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 0,
      location: '18th Arrondissement',
    },
    {
      title: 'Musée d’Orsay Impressionist Masterworks',
      description: 'Marvel at Monet, Van Gogh, and Renoir masterpieces in a splendid former Beaux-Arts railway terminal.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 1900,
      location: '1 Rue de la Légion d’Honneur',
    },
    {
      title: 'Le Marais Bistro Dinner & Artisan Bakery Walk',
      description: 'Savor classic French duck confit, fresh baguettes, and delicate macarons in the historic Marais district.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 3200,
      location: 'Rue des Rosiers, 4th Arr.',
    },
    {
      title: 'Palace of Versailles Grand Apartments & Fountains',
      description: 'Tour the opulent Hall of Mirrors, king’s state bedrooms, and geometric landscaped gardens designed by Le Nôtre.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 4.0,
      cost: 3200,
      location: 'Versailles',
    },
    {
      title: 'Arc de Triomphe & Champs-Élysées Promenade',
      description: 'Climb the rooftop terrace of Napoleon’s triumphal arch followed by luxury window shopping along the grand boulevard.',
      category: 'sightseeing',
      time_slot: 'afternoon',
      duration_hours: 2.0,
      cost: 1600,
      location: 'Place Charles de Gaulle',
    },
    {
      title: 'Latin Quarter Jazz Cellar Experience',
      description: 'Intimate live jazz performance and vintage cocktails in a medieval vaulted cellar beneath Saint-Germain.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 2500,
      location: 'Rue de la Huchette',
    },
  ],

  // London, United Kingdom
  london: [
    {
      title: 'Tower of London & Crown Jewels',
      description: 'Explore nearly 1,000 years of royal intrigue, medieval armory, and the dazzling British Crown Jewels.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 3.0,
      cost: 3400,
      location: 'Tower Hill, London EC3N',
    },
    {
      title: 'Borough Market Gourmet Food Odyssey',
      description: 'Sample artisan cheddar, Scotch eggs, sizzling duck confit sandwiches, and fresh custard tarts under Victorian railway arches.',
      category: 'food',
      time_slot: 'afternoon',
      duration_hours: 2.0,
      cost: 1800,
      location: 'Southwark, London SE1',
    },
    {
      title: 'West End Musical Theatre Production',
      description: 'Premiere evening orchestra seating for an acclaimed musical in London’s glittering theatre district.',
      category: 'culture',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 6500,
      location: 'Covent Garden / Shaftesbury Ave',
    },
    {
      title: 'British Museum Antiquities & Rosetta Stone',
      description: 'Encounter world-defining archeological treasures under the sweeping glass canopy of the Great Court.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 3.0,
      cost: 0,
      location: 'Great Russell St, Bloomsbury',
    },
    {
      title: 'Sky Garden 360° London Panoramic Observation',
      description: 'Lush indoor tropical landscaped garden 35 stories high offering sweeping bird’s-eye vistas of London’s skyline.',
      category: 'sightseeing',
      time_slot: 'afternoon',
      duration_hours: 1.5,
      cost: 800,
      location: '20 Fenchurch St',
    },
    {
      title: 'South Bank Thames Walk & Historic Pub Crawl',
      description: 'Stroll past Shakespeare’s Globe and Tate Modern, stopping in 17th-century riverside timbered alehouses.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 2200,
      location: 'Bankside & Southwark',
    },
  ],

  // Rome, Italy
  rome: [
    {
      title: 'Colosseum Underground & Roman Forum VIP Access',
      description: 'Step directly onto the gladiator arena floor and wander through the ruins of ancient Roman temples and triumphal arches.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 3.5,
      cost: 3800,
      location: 'Piazza del Colosseo',
    },
    {
      title: 'Trevi Fountain, Pantheon & Piazza Navona Walk',
      description: 'Toss a lucky coin in the Baroque fountain, marvel at the ancient oculus dome of the Pantheon, and taste pistachio gelato.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 500,
      location: 'Centro Storico',
    },
    {
      title: 'Trastevere Handmade Pasta & Chianti Evening',
      description: 'Cozy culinary dinner featuring authentic cacio e pepe, carbonara, and carafes of regional red wine on ivy-draped cobbled alleys.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 2800,
      location: 'Trastevere',
    },
    {
      title: 'Vatican Museums, Sistine Chapel & St. Peter’s',
      description: 'Admire Michelangelo’s immortal Sistine Chapel ceiling and the grandeur of the world’s largest Renaissance basilica.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 4.0,
      cost: 4200,
      location: 'Vatican City',
    },
    {
      title: 'Villa Borghese Gardens & Art Gallery',
      description: 'Rent a rowboat on the lake and view Bernini marble masterpieces inside the aristocratic Borghese palazzo.',
      category: 'relaxation',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 1800,
      location: 'Piazzale Scipione Borghese',
    },
    {
      title: 'Monti Rooftop Sunset Aperitivo',
      description: 'Watch the golden sun dip behind ancient stone domes while sipping an Italian Aperol Spritz with antipasti.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 2.0,
      cost: 1600,
      location: 'Rione Monti',
    },
  ],

  // Tokyo, Japan
  tokyo: [
    {
      title: 'Meiji Jingu Shrine & Harajuku Forest Walk',
      description: 'Stroll through tranquil evergreen cedar forest to the imperial Shinto shrine, followed by fashionable Takeshita street.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 0,
      location: 'Shibuya City',
    },
    {
      title: 'Shibuya Crossing & Shibuya Sky 360 Observatory',
      description: 'Walk across the world’s busiest pedestrian intersection and ride open-air escalators 230 meters up to view Mt. Fuji.',
      category: 'sightseeing',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 1800,
      location: 'Shibuya Scramble Square',
    },
    {
      title: 'Shinjuku Omoide Yokocho & Golden Gai Izakaya Crawl',
      description: 'Atmospheric lantern-lit alleyways with sizzling yakitori skewers, draft craft beer, and tiny 6-seat themed bars.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 3.0,
      cost: 3200,
      location: 'Shinjuku',
    },
    {
      title: 'Tsukiji Outer Market Fresh Seafood Breakfast',
      description: 'Sample blowtorched wagyu beef, fresh sea urchin, tamagoyaki sweet omelets, and bluefin tuna sashimi bowls.',
      category: 'food',
      time_slot: 'morning',
      duration_hours: 2.0,
      cost: 2500,
      location: 'Chuo City',
    },
    {
      title: 'teamLab Borderless Digital Light Museum',
      description: 'Wander inside boundary-pushing 3D digital projection light installations that interact dynamically with your touch.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 3.0,
      cost: 2800,
      location: 'Azabudai Hills',
    },
    {
      title: 'Akihabara Neon Arcade & Retro Gaming Experience',
      description: 'Dive into multi-story arcades, vintage cartridge stores, and anime collectible shrines with an expert local guide.',
      category: 'adventure',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 1500,
      location: 'Chiyoda City',
    },
  ],

  // Kyoto, Japan
  kyoto: [
    {
      title: 'Fushimi Inari Taisha 10,000 Torii Gate Sunrise Hike',
      description: 'Early morning spiritual mountain hike beneath vibrant vermilion tunnel gates through mystical sacred cedar groves.',
      category: 'adventure',
      time_slot: 'morning',
      duration_hours: 3.0,
      cost: 0,
      location: 'Fushimi Ward',
    },
    {
      title: 'Kiyomizu-dera Wooden Temple & Ninenzaka Streets',
      description: 'Iconic cliffside wooden stage overlooking Kyoto valley, flanked by preserved Edo-era pottery shops and teahouses.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 600,
      location: 'Higashiyama Ward',
    },
    {
      title: 'Gion Geisha District Evening Stroll & Kaiseki Dinner',
      description: 'Atmospheric wooden machiya townhouses along the Shirakawa canal, accompanied by traditional multi-course dining.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 4500,
      location: 'Gion',
    },
    {
      title: 'Arashiyama Bamboo Grove & Tenryu-ji Zen Garden',
      description: 'Towering green bamboo stalks swaying in the breeze followed by UNESCO World Heritage Zen dry landscape gardens.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 3.0,
      cost: 800,
      location: 'Ukyo Ward',
    },
    {
      title: 'Authentic Matcha Tea Ceremony in Historic Chashitsu',
      description: 'Learn the ritual art of whisking ceremonial Uji green tea with seasonal wagashi sweets from a kimono-clad tea master.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 1.5,
      cost: 2200,
      location: 'Kita Ward',
    },
    {
      title: 'Kamo Riverbank Sunset Relaxation & Pontocho Dining',
      description: 'Sit along the cooling riverbank terraces (kawayuka) and enjoy grilled sweetfish and Kyoto craft beer.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 2.0,
      cost: 2400,
      location: 'Pontocho Alley',
    },
  ],

  // New Delhi, India
  'new delhi': [
    {
      title: 'Qutub Minar & Mehrauli Archaeological Park',
      description: 'Marvel at the 73-meter fluted red sandstone minaret and 4th-century rust-resistant Iron Pillar of Delhi.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 600,
      location: 'Mehrauli, South Delhi',
    },
    {
      title: 'Humayun’s Tomb & Sunder Nursery Heritage Walk',
      description: 'UNESCO World Heritage precursor to the Taj Mahal, set within restored Mughal water gardens and bird sanctuaries.',
      category: 'sightseeing',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 650,
      location: 'Nizamuddin East',
    },
    {
      title: 'Old Delhi Chandni Chowk Food Safari & Rickshaw Ride',
      description: 'Cycle rickshaw through narrow spice markets with famous parathas, hot jalebis, and Karim’s historic mutton delicacies.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 3.0,
      cost: 1200,
      location: 'Chandni Chowk',
    },
    {
      title: 'India Gate & Kartavya Path Grand Promenade',
      description: 'Commemorative war memorial arch and royal ceremonial boulevard illuminated with fountains and evening breeze.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 1.5,
      cost: 0,
      location: 'Central Secretariat',
    },
    {
      title: 'Swaminarayan Akshardham Temple & Cultural Boat Ride',
      description: 'Masterpiece of hand-carved pink Rajasthani stone and Italian Carrara marble depicting ancient Indian wisdom.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 3.5,
      cost: 400,
      location: 'NH 24, East Delhi',
    },
    {
      title: 'Hauz Khas Village Medieval Fort & Rooftop Cafes',
      description: '13th-century madrasa ruins overlooking scenic royal reservoir lake, bustling with indie boutiques and live music.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 1500,
      location: 'Hauz Khas',
    },
  ],

  // Mumbai, India
  mumbai: [
    {
      title: 'Gateway of India & Taj Mahal Palace Heritage Walk',
      description: 'Iconic basalt Indo-Saracenic arch overlooking Mumbai Harbor, alongside the legendary 1903 Victorian grand hotel.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 2.0,
      cost: 0,
      location: 'Colaba, South Mumbai',
    },
    {
      title: 'Elephanta Island Rock-Cut Cave Temples Ferry',
      description: 'Scenic 1-hour Arabian Sea boat ride to 6th-century rock-cut Shiva sculptures and the monumental Trimurti relief.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 4.0,
      cost: 850,
      location: 'Elephanta Island',
    },
    {
      title: 'Marine Drive Sunset & Chowpatty Street Snacks',
      description: 'Queen’s Necklace seaside promenade breeze with famous pav bhaji, pani puri, and fresh kulfi on Girgaon sands.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 2.0,
      cost: 600,
      location: 'Marine Drive',
    },
    {
      title: 'Chhatrapati Shivaji Maharaj Terminus & Fort Walk',
      description: 'UNESCO Gothic Revival architectural marvel and colonial banking heritage quarter of vintage stone palazzos.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 2.0,
      cost: 200,
      location: 'Fort, Mumbai',
    },
    {
      title: 'Bandra Bandstand & Bollywood Bungalow Tour',
      description: 'Rocky seaside promenade leading up to Portuguese Castella de Aguada fort and hip street art murals.',
      category: 'sightseeing',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 0,
      location: 'Bandra West',
    },
    {
      title: 'Kala Ghoda Art Cafes & Coastal Seafood Feast',
      description: 'Art gallery district with specialty coffee, followed by world-famous coastal butter garlic crab at Trishna or Mahesh.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 2500,
      location: 'Kala Ghoda',
    },
  ],

  // Jaipur, India
  jaipur: [
    {
      title: 'Amber Fort Elephant Ramp & Sheesh Mahal Mirrors',
      description: 'Perched on rugged Amer hills with mirror mosaics, ornate marble courtyards, and panoramic Maota lake reflections.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 3.5,
      cost: 600,
      location: 'Amer, Jaipur',
    },
    {
      title: 'Hawa Mahal Palace of Winds & Pink City Bazaars',
      description: '953 latticed sandstone jharokha honeycomb windows and lively Johari Bazaar gemstone shopping.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 300,
      location: 'Badi Choupad',
    },
    {
      title: 'Nahargarh Fort Sunset View & Royal Thali Feast',
      description: 'Watch the entire Pink City glow golden at sunset from mountain fortress ramparts, followed by Laal Maas dining.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 3.0,
      cost: 1600,
      location: 'Aravalli Hills',
    },
  ],

  // Dubai, UAE
  dubai: [
    {
      title: 'Burj Khalifa 148th Floor At The Top Observatory',
      description: 'Soar to the world’s highest outdoor observation deck for unbelievable views of Dubai coastline and desert dunes.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 4500,
      location: 'Downtown Dubai',
    },
    {
      title: 'Dubai Mall Aquariums & Gold & Spice Souk',
      description: 'Walk through underwater shark tunnels followed by traditional abra boat ride across Dubai Creek to gold souks.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 3.0,
      cost: 1800,
      location: 'Deira / Downtown',
    },
    {
      title: 'Red Dunes 4x4 Desert Safari & Bedouin BBQ Night',
      description: 'Thrilling sand dune bashing in Land Cruisers, camel rides, sandboarding, and stargazing dinner with tanoura dance.',
      category: 'adventure',
      time_slot: 'evening',
      duration_hours: 5.0,
      cost: 4200,
      location: 'Lahbab Desert',
    },
  ],

  // Zurich, Switzerland
  zurich: [
    {
      title: 'Lake Zurich Steamboat Cruise to Rapperswil',
      description: 'Glide over turquoise alpine waters with views of snow-dusted Alps, vineyards, and rose gardens.',
      category: 'relaxation',
      time_slot: 'morning',
      duration_hours: 3.0,
      cost: 3200,
      location: 'Bürkliplatz Pier',
    },
    {
      title: 'Uetliberg Mountain Summit Lookout Tower',
      description: 'Take the scenic alpine railway up to Zurich’s home peak for commanding 360-degree panoramas of city and lakes.',
      category: 'adventure',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 1400,
      location: 'Uetliberg',
    },
    {
      title: 'Old Town Niederdorf Fondue & Swiss Craft Beer',
      description: 'Cobblestone medieval pedestrian alleys with bubbling Gruyère cheese fondue and Swiss mountain wines.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 4800,
      location: 'Old Town Zurich',
    },
  ],

  // Barcelona, Spain
  barcelona: [
    {
      title: 'Sagrada Familia Basilica & Tower Climb',
      description: 'Gaudí’s forest of towering organic columns bathed in brilliant stained-glass rainbow sunlight.',
      category: 'culture',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 3200,
      location: 'Eixample',
    },
    {
      title: 'Park Güell Mosaic Serpent Terraces',
      description: 'Colorful gingerbread pavilion gates, panoramic Mediterranean viewpoints, and mosaic salamander stairways.',
      category: 'sightseeing',
      time_slot: 'afternoon',
      duration_hours: 2.0,
      cost: 1200,
      location: 'Gràcia',
    },
    {
      title: 'Gothic Quarter Tapas & Sangria Crawl',
      description: 'Sample patatas bravas, Iberian acorn-fed bellota ham, and fresh seafood tapas across romantic medieval plazas.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 3.0,
      cost: 2600,
      location: 'El Born & Barri Gòtic',
    },
  ],
  // Goa, India
  goa: [
    {
      title: 'Calangute & Baga Watersports Adventure',
      description: 'Jet skiing, parasailing high above the sparkling Arabian Sea, and thrilling banana boat rides on golden sands.',
      category: 'adventure',
      time_slot: 'morning',
      duration_hours: 3.0,
      cost: 2500,
      location: 'Calangute Beach, North Goa',
    },
    {
      title: 'Old Goa Basilica of Bom Jesus & Se Cathedral',
      description: 'UNESCO World Heritage 16th-century Portuguese baroque architecture and sacred relics in lush historic grounds.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 200,
      location: 'Velha Goa',
    },
    {
      title: 'Anjuna Beach Sunset Shacks & Live Music Dinner',
      description: 'Watch vibrant sunsets over Arabian Sea waves with fresh Goan prawn curry, poi bread, and acoustic music.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 3.0,
      cost: 1800,
      location: 'Anjuna Beach',
    },
  ],

  // Udaipur, India
  udaipur: [
    {
      title: 'City Palace Complex & Crystal Gallery Tour',
      description: 'Rajasthan’s largest palace complex, featuring ornate mirror mosaics, marble balconies, and royal courtyards.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 3.5,
      cost: 650,
      location: 'City Palace Road',
    },
    {
      title: 'Lake Pichola Sunset Boat Cruise to Jag Mandir',
      description: 'Scenic cruise past floating island marble palaces and ghats bathed in amber evening light.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 2.0,
      cost: 1200,
      location: 'Rameshwar Ghat Pier',
    },
    {
      title: 'Saheliyon-ki-Bari Lotus Fountains & Gardens',
      description: 'Historic royal leisure gardens with marble elephants, lotus pools, and cooling fountain pavilions.',
      category: 'relaxation',
      time_slot: 'afternoon',
      duration_hours: 1.5,
      cost: 150,
      location: 'Saheli Marg',
    },
  ],

  // Varanasi, India
  varanasi: [
    {
      title: 'Dawn Sunrise Boat Ride on River Ganga',
      description: 'Glide past ancient stone ghats at first light to witness dawn prayers, rituals, and sacred morning chants.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 800,
      location: 'Assi Ghat to Dashashwamedh',
    },
    {
      title: 'Sarnath Deer Park & Dhamek Stupa Excursion',
      description: 'Sacred Buddhist sanctuary where Lord Buddha delivered his first sermon, set in tranquil green ruins.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 3.0,
      cost: 400,
      location: 'Sarnath',
    },
    {
      title: 'Dashashwamedh Ghat Grand Evening Ganga Aarti',
      description: 'Hypnotic synchronized brass lamp fire ritual performed by priests with conch shells and sacred chants.',
      category: 'culture',
      time_slot: 'evening',
      duration_hours: 2.0,
      cost: 0,
      location: 'Dashashwamedh Ghat',
    },
  ],

  // Kochi, India
  kochi: [
    {
      title: 'Fort Kochi Chinese Fishing Nets & Heritage Stroll',
      description: 'Walk past cantilevered 14th-century fishing nets, St. Francis Church, and colorful Dutch colonial villas.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 200,
      location: 'Fort Kochi Beach',
    },
    {
      title: 'Alleppey Backwaters Houseboat Day Cruise',
      description: 'Drift through serene coconut canals and emerald lagoons aboard a traditional thatched kettuvallam.',
      category: 'relaxation',
      time_slot: 'afternoon',
      duration_hours: 4.5,
      cost: 3800,
      location: 'Alleppey Backwaters',
    },
    {
      title: 'Kathakali Theatre & Kerala Seafood Banquet',
      description: 'Mesmerizing classical Kerala dance-drama performance followed by traditional Karimeen Pollichathu feast.',
      category: 'culture',
      time_slot: 'evening',
      duration_hours: 3.0,
      cost: 1600,
      location: 'KB Jacob Road, Fort Kochi',
    },
  ],

  // Manali, India
  manali: [
    {
      title: 'Solang Valley Paragliding & Adventure Sports',
      description: 'Tandem paragliding flight with breathtaking views of snow-dusted Himalayan Pir Panjal peaks.',
      category: 'adventure',
      time_slot: 'morning',
      duration_hours: 3.5,
      cost: 3200,
      location: 'Solang Valley',
    },
    {
      title: 'Hadimba Devi Ancient Cedar Forest Temple',
      description: 'Unique 16th-century wooden pagoda temple nestled among towering giant deodar cedar pine groves.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.0,
      cost: 100,
      location: 'Dhungri Forest',
    },
    {
      title: 'Old Manali Bohemian Riverside Cafes & Live Trout Feast',
      description: 'Rustic wooden cafes by the gushing Manalsu river serving woodfired pizzas, apple pie, and local cider.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 2.5,
      cost: 1400,
      location: 'Old Manali',
    },
  ],

  // Agra, India
  agra: [
    {
      title: 'Taj Mahal Sunrise VIP Guided Experience',
      description: 'Enter the world wonder at dawn to witness pink and golden morning light reflect across white marble domes.',
      category: 'sightseeing',
      time_slot: 'morning',
      duration_hours: 3.0,
      cost: 1200,
      location: 'Dharmapuri, Forest Colony',
    },
    {
      title: 'Agra Fort Red Sandstone Imperial Palaces',
      description: 'Mughal citadel with Jahangiri Mahal, Diwan-i-Khas, and Musamman Burj where Shah Jahan gazed at the Taj.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 650,
      location: 'Agra Fort',
    },
    {
      title: 'Mehtab Bagh Moonlight River Reflection Garden',
      description: 'Charbagh garden complex on opposite Yamuna riverbank with unbeatable romantic sunset silhouettes of Taj Mahal.',
      category: 'relaxation',
      time_slot: 'evening',
      duration_hours: 2.0,
      cost: 300,
      location: 'Across Yamuna River',
    },
  ],

  // Bengaluru, India
  bengaluru: [
    {
      title: 'Lalbagh Botanical Garden & Glass House Heritage Walk',
      description: '240 acres of rare centuries-old trees, lotus ponds, and the famed 1889 London Crystal Palace replica.',
      category: 'relaxation',
      time_slot: 'morning',
      duration_hours: 2.5,
      cost: 150,
      location: 'Mavalli, Bengaluru',
    },
    {
      title: 'Bangalore Palace Tudor Royal Architecture Tour',
      description: 'Grand wooden carvings, Tudor-style fortified battlements, and royal family memorabilia.',
      category: 'culture',
      time_slot: 'afternoon',
      duration_hours: 2.5,
      cost: 450,
      location: 'Vasanth Nagar',
    },
    {
      title: 'Indiranagar Craft Brewery Crawl & South Indian Bites',
      description: 'Sample mango wheat and IPA brews paired with ghee roast dosas and gunpowder potatoes.',
      category: 'food',
      time_slot: 'evening',
      duration_hours: 3.0,
      cost: 2200,
      location: '100ft Road, Indiranagar',
    },
  ],
};

// Aliases for common city names
const CITY_NAME_ALIASES: Record<string, string> = {
  delhi: 'new delhi',
  'new delhi': 'new delhi',
  bombay: 'mumbai',
  mumbai: 'mumbai',
  bengaluru: 'bengaluru',
  bangalore: 'bengaluru',
  calangute: 'goa',
  baga: 'goa',
  panaji: 'goa',
  alleppey: 'kochi',
  alappuzha: 'kochi',
};

/**
 * Distribute curated or intelligently generated attractions across the given number of days.
 */
export function getDistributedAttractionsForCity(
  cityName: string,
  country: string = '',
  dayCount: number = 2
): CuratedAttraction[] {
  const cleanCity = cityName.toLowerCase().trim();
  const lookupKey = CITY_NAME_ALIASES[cleanCity] || cleanCity;

  let pool: CuratedAttraction[] = CURATED_CITY_ATTRACTIONS[lookupKey] || [];

  // If no exact preset exists, generate a set of authentic, high-value highlights for this city
  if (pool.length === 0) {
    const formattedCity = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    const formattedCountry = country ? `, ${country}` : '';

    pool = [
      {
        title: `${formattedCity} Historic Old Town & Landmark Square`,
        description: `Explore the vibrant heart of ${formattedCity}${formattedCountry}, discovering architectural heritage, monuments, and iconic city plazas.`,
        category: 'sightseeing',
        time_slot: 'morning',
        duration_hours: 2.5,
        cost: 0,
        location: `Central ${formattedCity}`,
      },
      {
        title: `${formattedCity} National Heritage & Cultural Museum`,
        description: `Immerse in local arts, cultural history, and renowned exhibits documenting the deep traditions of ${formattedCity}.`,
        category: 'culture',
        time_slot: 'afternoon',
        duration_hours: 2.5,
        cost: 850,
        location: `${formattedCity} Museum District`,
      },
      {
        title: `${formattedCity} Artisan Market & Local Flavors Tasting`,
        description: `Sample authentic regional culinary specialties, street snacks, and handcrafted delicacies at the city’s favorite food market.`,
        category: 'food',
        time_slot: 'evening',
        duration_hours: 2.0,
        cost: 1600,
        location: `${formattedCity} Market Square`,
      },
      {
        title: `${formattedCity} Botanical Gardens & Waterfront Promenade`,
        description: `Tranquil walking trails featuring landscaped flora, fountains, and peaceful waterfront vistas.`,
        category: 'relaxation',
        time_slot: 'morning',
        duration_hours: 2.0,
        cost: 400,
        location: `${formattedCity} Gardens`,
      },
      {
        title: `${formattedCity} Scenic Mountain / High-Rise Viewpoint`,
        description: `Panoramic overlook offering stunning wide-angle photography perspectives over ${formattedCity} and surrounding landscapes.`,
        category: 'sightseeing',
        time_slot: 'afternoon',
        duration_hours: 2.0,
        cost: 650,
        location: `${formattedCity} Vista Point`,
      },
      {
        title: `${formattedCity} Sunset River / Harbor Dinner Cruise`,
        description: `Unwind with scenic twilight views along the water while enjoying fresh regional dinner and cocktails.`,
        category: 'food',
        time_slot: 'evening',
        duration_hours: 2.5,
        cost: 2400,
        location: `${formattedCity} Waterfront`,
      },
    ];
  }

  // Allocate 2 to 3 attractions per day
  const totalNeeded = Math.min(pool.length, Math.max(2, dayCount * 2));
  return pool.slice(0, totalNeeded);
}

/**
 * Returns all curated attractions for a destination for rich browsing and discovery
 */
export function getCuratedAttractionsForCity(
  cityName: string,
  country: string = ''
): CuratedAttraction[] {
  const cleanCity = cityName.toLowerCase().trim();
  const lookupKey = CITY_NAME_ALIASES[cleanCity] || cleanCity;
  const pool = CURATED_CITY_ATTRACTIONS[lookupKey];
  if (pool && pool.length > 0) {
    return pool;
  }
  // If not in pre-defined set, generate high quality attractions pool
  return getDistributedAttractionsForCity(cityName, country, 4);
}
