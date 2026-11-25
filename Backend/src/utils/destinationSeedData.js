/**
 * Curated initial destination catalog for Samundar Ke Sath.
 * Automatically seeded idempotently when the Destination collection is empty.
 */
export const CURATED_DESTINATIONS = [
  {
    name: 'South Goa (Palolem & Agonda)',
    slug: 'south-goa-palolem-agonda',
    country: 'India',
    stateOrRegion: 'Goa',
    shortDescription:
      'Tranquil crescent bays, palm-fringed beach huts, sunset kayaking, and laid-back Goan seafood shacks.',
    description:
      'South Goa offers a peaceful contrast to the bustling north. Known for Palolem, Agonda, and Cola beaches, travelers enjoy dolphin-spotting boat trips, freshwater lagoon kayaking, Portuguese heritage churches, and serene sunset dining along the Arabian Sea.',
    category: 'beach',
    travelTypes: ['couple', 'friends', 'solo', 'relaxation'],
    budgetTier: 'moderate',
    averageDailyBudget: 3500,
    currency: 'INR',
    bestSeason: 'November to February',
    recommendedDays: 4,
    rating: 4.8,
    highlights: [
      'Palolem Beach Kayaking',
      'Cola Beach Freshwater Lagoon',
      'Cabo de Rama Cliff Fort',
      'Agonda Sunset Walk',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 15.0099, longitude: 74.0232 },
    isFeatured: true,
  },
  {
    name: 'Gokarna Coastal Trail',
    slug: 'gokarna-coastal-trail',
    country: 'India',
    stateOrRegion: 'Karnataka',
    shortDescription:
      'Cliffside beach treks linking Kudle, Om, Half Moon, and Paradise beaches with rustic coastal cafes.',
    description:
      'Gokarna blends sacred temple-town charm with rugged coastal trekking. Backpackers and beach lovers traverse rocky headlands between secluded coves, camp beneath starry skies, and watch bioluminescent waves along Karnataka’s Uttara Kannada shoreline.',
    category: 'coastal',
    travelTypes: ['solo', 'friends', 'budget', 'backpacking', 'adventure'],
    budgetTier: 'budget',
    averageDailyBudget: 1800,
    currency: 'INR',
    bestSeason: 'October to March',
    recommendedDays: 3,
    rating: 4.7,
    highlights: [
      'Five-Beach Cliff Trek',
      'Om Beach Water Sports',
      'Mirjan Fort Heritage Stop',
      'Yana Caves Day Excursion',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 14.5479, longitude: 74.3188 },
    isFeatured: true,
  },
  {
    name: 'Varkala Cliff',
    slug: 'varkala-cliff',
    country: 'India',
    stateOrRegion: 'Kerala',
    shortDescription:
      'Dramatic red laterite cliffs towering over the Arabian Sea with surf schools, Ayurveda spas, and cliffside cafes.',
    description:
      'Varkala is the only place in southern Kerala where cliffs stand adjacent to the Arabian Sea. Travelers come for morning surf sessions, Ayurvedic wellness retreats, Kappil backwater kayaking, and panoramic cliff-edge dining.',
    category: 'wellness',
    travelTypes: ['solo', 'couple', 'relaxation', 'budget'],
    budgetTier: 'moderate',
    averageDailyBudget: 2800,
    currency: 'INR',
    bestSeason: 'November to March',
    recommendedDays: 4,
    rating: 4.7,
    highlights: [
      'North Cliff Sunset Promenade',
      'Kappil Beach & Backwaters',
      'Beginner Surfing Lessons',
      'Munroe Island Mangrove Canoeing',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 8.7379, longitude: 76.7163 },
    isFeatured: true,
  },
  {
    name: 'Havelock Island (Swaraj Dweep)',
    slug: 'havelock-island-andaman',
    country: 'India',
    stateOrRegion: 'Andaman & Nicobar Islands',
    shortDescription:
      'Turquoise coral reefs, powdery white sands at Radhanagar Beach, and world-class scuba diving.',
    description:
      'Havelock Island is the crown jewel of the Andaman archipelago. Accessible via inter-island ferry from Port Blair, it offers pristine diving at Nemo Reef, glass-bottom boat tours at Elephant Beach, and tranquil beachfront eco-resorts.',
    category: 'island',
    travelTypes: ['couple', 'family', 'luxury', 'adventure'],
    budgetTier: 'luxury',
    averageDailyBudget: 7500,
    currency: 'INR',
    bestSeason: 'November to April',
    recommendedDays: 5,
    rating: 4.9,
    highlights: [
      'Radhanagar Beach Sunset',
      'Scuba Diving at Nemo Reef',
      'Elephant Beach Snorkeling',
      'Bioluminescent Night Kayaking',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 11.9761, longitude: 92.9876 },
    isFeatured: true,
  },
  {
    name: 'Alleppey Backwaters',
    slug: 'alleppey-backwaters',
    country: 'India',
    stateOrRegion: 'Kerala',
    shortDescription:
      'Emerald palm-lined canals, traditional kettuvallam houseboats, and coastal Marari beach escapes.',
    description:
      'Often called the Venice of the East, Alappuzha (Alleppey) offers serene slow-travel cruises along tranquil lagoons and village waterways, paired with authentic Kerala toddy-shop seafood and quiet beaches nearby.',
    category: 'backwaters',
    travelTypes: ['family', 'couple', 'relaxation', 'luxury'],
    budgetTier: 'moderate',
    averageDailyBudget: 4500,
    currency: 'INR',
    bestSeason: 'October to March',
    recommendedDays: 3,
    rating: 4.6,
    highlights: [
      'Overnight Houseboat Cruise',
      'Shikara Sunrise Canal Ride',
      'Marari Beach Relaxation',
      'Alappuzha Lighthouse',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 9.4981, longitude: 76.3388 },
    isFeatured: false,
  },
  {
    name: 'Pondicherry (White Town & Serenity Beach)',
    slug: 'pondicherry-white-town',
    country: 'India',
    stateOrRegion: 'Puducherry',
    shortDescription:
      'French-colonial mustard boulevards, Bay of Bengal promenade walks, artisanal cafes, and coastal surfing.',
    description:
      'Pondicherry merges Franco-Tamil architecture with relaxed seaside charm. Cycle through tree-lined White Town, explore Auroville’s Matrimandir, and catch gentle morning swells at Serenity Beach.',
    category: 'heritage',
    travelTypes: ['couple', 'friends', 'solo', 'budget'],
    budgetTier: 'moderate',
    averageDailyBudget: 3000,
    currency: 'INR',
    bestSeason: 'October to March',
    recommendedDays: 3,
    rating: 4.6,
    highlights: [
      'Rock Beach Promenade Walk',
      'White Town French Quarter',
      'Paradise Beach Ferry',
      'Auroville Cultural Visit',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 11.9416, longitude: 79.8083 },
    isFeatured: true,
  },
  {
    name: 'Tarkarli & Malvan Coast',
    slug: 'tarkarli-malvan-coast',
    country: 'India',
    stateOrRegion: 'Maharashtra',
    shortDescription:
      'Crystal-clear Konkan waters, historic Sindhudurg Sea Fort, scuba diving, and fiery Malvani cuisine.',
    description:
      'Tucked along Maharashtra’s Konkan coast, Tarkarli boasts clear sandy shoals ideal for beginner scuba diving and snorkeling, alongside Chhatrapati Shivaji Maharaj’s majestic island fortress of Sindhudurg.',
    category: 'adventure',
    travelTypes: ['friends', 'family', 'budget', 'adventure'],
    budgetTier: 'budget',
    averageDailyBudget: 2000,
    currency: 'INR',
    bestSeason: 'October to March',
    recommendedDays: 3,
    rating: 4.5,
    highlights: [
      'Sindhudurg Sea Fort Boat Tour',
      'Tsunami Island Water Sports',
      'Karli Backwater Houseboat',
      'Authentic Malvani Fish Curry',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 16.0124, longitude: 73.4892 },
    isFeatured: false,
  },
  {
    name: 'Agatti & Bangaram Islands',
    slug: 'lakshadweep-agatti-bangaram',
    country: 'India',
    stateOrRegion: 'Lakshadweep',
    shortDescription:
      'Untouched turquoise coral atolls, shallow reef lagoons, and ultra-serene island stays.',
    description:
      'Lakshadweep’s coral lagoons are among the clearest waters in the Indian Ocean. With controlled visitor permits, travelers experience vibrant marine life, sea turtles, reef kayaking, and secluded island hospitality.',
    category: 'island',
    travelTypes: ['couple', 'luxury', 'relaxation', 'adventure'],
    budgetTier: 'luxury',
    averageDailyBudget: 9500,
    currency: 'INR',
    bestSeason: 'October to April',
    recommendedDays: 5,
    rating: 4.9,
    highlights: [
      'Bangaram Sandbank Excursion',
      'Coral Reef Snorkeling',
      'Glass-Bottom Lagoon Cruise',
      'Deep-Sea Fishing & Diving',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 10.8588, longitude: 72.1944 },
    isFeatured: true,
  },
  {
    name: 'Rameswaram & Dhanushkodi',
    slug: 'rameswaram-dhanushkodi',
    country: 'India',
    stateOrRegion: 'Tamil Nadu',
    shortDescription:
      'Iconic Pamban sea bridge, surreal ghost-town sandspit where two seas meet, and monumental Dravidian corridors.',
    description:
      'Connected to mainland Tamil Nadu via the dramatic Pamban Bridge, Rameswaram combines coastal history, flamingos at Dhanushkodi’s Arichal Munai tip, and kayaking through calm Gulf of Mannar waters.',
    category: 'heritage',
    travelTypes: ['family', 'solo', 'budget'],
    budgetTier: 'budget',
    averageDailyBudget: 2100,
    currency: 'INR',
    bestSeason: 'October to March',
    recommendedDays: 2,
    rating: 4.6,
    highlights: [
      'Dhanushkodi Land’s End Drive',
      'Pamban Bridge Ocean View',
      'Ramanathaswamy Temple Corridors',
      'Kurusadai Marine Reserve',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 9.2876, longitude: 79.3129 },
    isFeatured: false,
  },
  {
    name: 'Fort Kochi',
    slug: 'fort-kochi-kerala',
    country: 'India',
    stateOrRegion: 'Kerala',
    shortDescription:
      'Historic spice-trade harbor, iconic Chinese fishing nets, contemporary art cafes, and sunset ferries.',
    description:
      'Fort Kochi is a vibrant coastal port town shaped by Portuguese, Dutch, and British maritime history. Wander heritage spice markets, watch fishermen hoist giant cantilevered nets, and unwind in courtyard art cafes.',
    category: 'city',
    travelTypes: ['couple', 'family', 'solo', 'friends'],
    budgetTier: 'moderate',
    averageDailyBudget: 3200,
    currency: 'INR',
    bestSeason: 'October to March',
    recommendedDays: 3,
    rating: 4.6,
    highlights: [
      'Chinese Fishing Nets at Sunset',
      'Jew Town & Spice Markets',
      'Kathakali Evening Performance',
      'Kochi Harbour Ferry Ride',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 9.9658, longitude: 76.2421 },
    isFeatured: false,
  },
  {
    name: 'Diu Coastal Island',
    slug: 'diu-coastal-island',
    country: 'India',
    stateOrRegion: 'Dadra & Nagar Haveli and Daman & Diu',
    shortDescription:
      'Portuguese sea forts, Blue Flag Ghoghla Beach, coastal cycling tracks, and uncrowded seaside caves.',
    description:
      'Sitting off the southern tip of Gujarat’s Saurashtra peninsula, Diu offers peaceful beaches, dramatic sandstone sea caves at Naida, the imposing 16th-century Diu Fort, and scenic oceanfront cycling paths.',
    category: 'coastal',
    travelTypes: ['family', 'friends', 'budget', 'relaxation'],
    budgetTier: 'budget',
    averageDailyBudget: 2300,
    currency: 'INR',
    bestSeason: 'October to March',
    recommendedDays: 3,
    rating: 4.5,
    highlights: [
      'Diu Sea Fort Panorama',
      'Blue Flag Ghoghla Beach',
      'Naida Sandstone Caves',
      'Nagoa Beach Water Sports',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 20.7144, longitude: 70.9874 },
    isFeatured: false,
  },
  {
    name: 'Munnar & Western Ghats Mist',
    slug: 'munnar-western-ghats',
    country: 'India',
    stateOrRegion: 'Kerala',
    shortDescription:
      'Rolling emerald tea plantations, misty mountain passes, and cool highland escapes near the Kerala coast.',
    description:
      'Ideal to pair with a Kochi or Alleppey coastal journey, Munnar rises into the Western Ghats with fragrant spice gardens, sunrise viewpoints at Kolukkumalai, and wildlife trails at Eravikulam National Park.',
    category: 'hills',
    travelTypes: ['couple', 'family', 'relaxation', 'adventure'],
    budgetTier: 'moderate',
    averageDailyBudget: 3600,
    currency: 'INR',
    bestSeason: 'September to March',
    recommendedDays: 3,
    rating: 4.8,
    highlights: [
      'Kolukkumalai Sunrise Jeep Trail',
      'Eravikulam National Park',
      'Tea Museum & Estate Walk',
      'Top Station Cloud Views',
    ],
    coverImage:
      'https://images.unsplash.com/photo-1516496636080-14fb876e029d?auto=format&fit=crop&w=1200&q=80',
    coordinates: { latitude: 10.0889, longitude: 77.0595 },
    isFeatured: false,
  },
];

export default CURATED_DESTINATIONS;

