import type { DisasterType } from "../data-sources/types";

// Product categories that can be matched to disasters
export type ProductCategory =
  | "water"
  | "food"
  | "shelter"
  | "first-aid"
  | "communication"
  | "power"
  | "tools"
  | "clothing"
  | "navigation"
  | "safety";

// Mapping of disaster types to relevant product categories and priorities
const DISASTER_PRODUCT_MAP: Record<
  DisasterType,
  Array<{ category: ProductCategory; priority: number }>
> = {
  flood: [
    { category: "water", priority: 10 },
    { category: "power", priority: 9 },
    { category: "shelter", priority: 8 },
    { category: "first-aid", priority: 7 },
    { category: "communication", priority: 6 },
  ],
  wildfire: [
    { category: "safety", priority: 10 },
    { category: "first-aid", priority: 9 },
    { category: "clothing", priority: 8 },
    { category: "shelter", priority: 7 },
    { category: "water", priority: 6 },
  ],
  earthquake: [
    { category: "safety", priority: 10 },
    { category: "first-aid", priority: 9 },
    { category: "tools", priority: 8 },
    { category: "shelter", priority: 7 },
    { category: "communication", priority: 6 },
  ],
  tsunami: [
    { category: "safety", priority: 10 },
    { category: "water", priority: 9 },
    { category: "communication", priority: 8 },
    { category: "first-aid", priority: 7 },
    { category: "shelter", priority: 6 },
  ],
  hurricane: [
    { category: "shelter", priority: 10 },
    { category: "power", priority: 9 },
    { category: "water", priority: 8 },
    { category: "food", priority: 7 },
    { category: "communication", priority: 6 },
  ],
  tornado: [
    { category: "shelter", priority: 10 },
    { category: "safety", priority: 9 },
    { category: "first-aid", priority: 8 },
    { category: "communication", priority: 7 },
    { category: "tools", priority: 6 },
  ],
  drought: [
    { category: "water", priority: 10 },
    { category: "food", priority: 9 },
    { category: "tools", priority: 7 },
  ],
  volcanic: [
    { category: "safety", priority: 10 },
    { category: "clothing", priority: 9 },
    { category: "first-aid", priority: 8 },
    { category: "shelter", priority: 7 },
    { category: "communication", priority: 6 },
  ],
  landslide: [
    { category: "safety", priority: 10 },
    { category: "first-aid", priority: 9 },
    { category: "tools", priority: 8 },
    { category: "communication", priority: 7 },
    { category: "shelter", priority: 6 },
  ],
  storm: [
    { category: "shelter", priority: 10 },
    { category: "power", priority: 9 },
    { category: "communication", priority: 8 },
    { category: "first-aid", priority: 7 },
    { category: "water", priority: 6 },
  ],
  heat_wave: [
    { category: "water", priority: 10 },
    { category: "power", priority: 9 },
    { category: "first-aid", priority: 8 },
    { category: "clothing", priority: 7 },
  ],
  cold_wave: [
    { category: "shelter", priority: 10 },
    { category: "clothing", priority: 9 },
    { category: "power", priority: 8 },
    { category: "food", priority: 7 },
    { category: "first-aid", priority: 6 },
  ],
};

// Essential products for each category
const CATEGORY_ESSENTIALS: Record<ProductCategory, string[]> = {
  water: [
    "Water purifier",
    "Water storage container",
    "Portable water filter",
    "Water purification tablets",
  ],
  food: [
    "Emergency food rations",
    "Freeze-dried meals",
    "Energy bars",
    "Canned goods opener",
  ],
  shelter: [
    "Emergency tent",
    "Tarp",
    "Sleeping bag",
    "Mylar emergency blanket",
  ],
  "first-aid": [
    "First aid kit",
    "Trauma kit",
    "Medications",
    "Bandages",
    "Antiseptic",
  ],
  communication: [
    "Emergency radio",
    "Satellite phone",
    "Whistle",
    "Signal mirror",
  ],
  power: [
    "Portable generator",
    "Solar charger",
    "Power bank",
    "Flashlight",
    "Batteries",
  ],
  tools: ["Multi-tool", "Rope", "Duct tape", "Shovel", "Axe"],
  clothing: ["N95 masks", "Goggles", "Gloves", "Rain gear", "Sturdy boots"],
  navigation: ["Compass", "Maps", "GPS device"],
  safety: [
    "Fire extinguisher",
    "Smoke detector",
    "Carbon monoxide detector",
    "Safety helmet",
  ],
};

export interface MatchedProduct {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  relevanceScore: number;
  isEssential: boolean;
}

export interface ProductMatchResult {
  disasterType: DisasterType;
  categories: Array<{ category: ProductCategory; priority: number }>;
  essentialItems: string[];
}

/**
 * Get product categories and priorities for a disaster type
 */
export function getProductMatchesForDisaster(
  disasterType: DisasterType,
): ProductMatchResult {
  const categories =
    DISASTER_PRODUCT_MAP[disasterType] || DISASTER_PRODUCT_MAP.storm;

  // Collect essential items from matched categories
  const essentialItems: string[] = [];
  for (const { category } of categories.slice(0, 3)) {
    essentialItems.push(...(CATEGORY_ESSENTIALS[category] || []).slice(0, 2));
  }

  return {
    disasterType,
    categories,
    essentialItems: [...new Set(essentialItems)], // Remove duplicates
  };
}

/**
 * Calculate relevance score for a product given a disaster type
 */
export function calculateProductRelevance(
  productCategories: ProductCategory[],
  disasterType: DisasterType,
): number {
  const disasterCategories = DISASTER_PRODUCT_MAP[disasterType] || [];
  let score = 0;
  let matches = 0;

  for (const productCat of productCategories) {
    const match = disasterCategories.find((dc) => dc.category === productCat);
    if (match) {
      score += match.priority;
      matches++;
    }
  }

  // Normalize score to 0-100
  return matches > 0 ? Math.min(100, Math.round((score / matches) * 10)) : 0;
}

/**
 * Get a human-readable reason why a product is relevant
 */
export function getRelevanceReason(
  productName: string,
  productCategories: ProductCategory[],
  disasterType: DisasterType,
): string {
  const reasons: Record<DisasterType, Record<ProductCategory, string>> = {
    flood: {
      water:
        "Essential for ensuring clean drinking water when supply is contaminated",
      power:
        "Critical for pumping water and maintaining communication during outages",
      shelter: "Provides protection when homes are flooded or damaged",
      "first-aid": "Treats injuries and prevents waterborne infections",
      communication: "Enables emergency calls and weather updates",
      food: "Provides sustenance when stores are inaccessible",
      tools: "Helps with emergency repairs and debris removal",
      clothing: "Keeps you dry and protected from contaminated water",
      navigation: "Helps find safe routes around flooded areas",
      safety: "Prevents accidents in hazardous flood conditions",
    },
    earthquake: {
      safety: "Protects from falling debris and aftershock hazards",
      "first-aid": "Treats injuries from collapsed structures",
      tools: "Essential for rescue and debris removal",
      shelter: "Provides protection when buildings are unsafe",
      communication: "Enables emergency contact when lines are down",
      water: "Ensures clean water when infrastructure is damaged",
      food: "Provides sustenance during extended rescue operations",
      power: "Maintains lighting and communication capabilities",
      clothing: "Protects from dust, debris, and cold temperatures",
      navigation: "Helps locate safe zones and evacuation routes",
    },
    // Default reasons for other disaster types
    wildfire: {
      safety: "Protects respiratory system from smoke and ash",
      "first-aid": "Treats burns and smoke inhalation",
      shelter: "Provides refuge from approaching flames",
      water: "Essential for hydration in extreme heat",
      clothing: "Protects skin from heat and embers",
      power: "Maintains communication during evacuations",
      communication: "Enables emergency alerts and coordination",
      tools: "Helps create firebreaks and clear escape routes",
      food: "Sustains energy during evacuation",
      navigation: "Identifies safe evacuation routes",
    },
    tsunami: {
      safety: "Provides flotation and visibility in water",
      water: "Ensures clean drinking water post-disaster",
      communication: "Enables rescue coordination",
      "first-aid": "Treats injuries and prevents infections",
      shelter: "Provides protection from elements",
      power: "Maintains emergency communications",
      tools: "Assists with rescue and recovery",
      clothing: "Protects from water and cold",
      food: "Provides sustenance during recovery",
      navigation: "Helps locate high ground and safety",
    },
    hurricane: {
      shelter: "Protects from extreme winds and rain",
      power: "Maintains electricity during extended outages",
      water: "Ensures clean water when supply is disrupted",
      food: "Provides sustenance during extended storms",
      communication: "Enables weather updates and emergency contact",
      "first-aid": "Treats storm-related injuries",
      safety: "Protects from flying debris",
      tools: "Helps with emergency repairs",
      clothing: "Keeps you dry and protected",
      navigation: "Identifies safe zones and routes",
    },
    tornado: {
      shelter: "Provides protection from extreme winds",
      safety: "Protects from flying debris",
      "first-aid": "Treats injuries from structural damage",
      communication: "Enables emergency alerts",
      tools: "Assists with rescue efforts",
      power: "Maintains lighting in shelters",
      water: "Ensures water access post-storm",
      food: "Provides emergency sustenance",
      clothing: "Protects from debris and elements",
      navigation: "Helps locate storm shelters",
    },
    drought: {
      water: "Critical for maintaining hydration and sanitation",
      food: "Provides sustenance when crops fail",
      tools: "Helps with water conservation efforts",
      power: "Runs water pumps and filtration",
      "first-aid": "Treats heat-related conditions",
      shelter: "Provides shade and cooling",
      communication: "Enables water supply coordination",
      clothing: "Protects from sun exposure",
      navigation: "Locates water sources",
      safety: "Prevents heat-related emergencies",
    },
    volcanic: {
      safety: "Protects from ash and toxic gases",
      clothing: "Shields skin and lungs from ash",
      "first-aid": "Treats respiratory issues and burns",
      shelter: "Provides refuge from ashfall",
      communication: "Enables evacuation coordination",
      water: "Ensures clean water supply",
      power: "Maintains emergency systems",
      tools: "Helps with ash removal",
      food: "Provides sustenance during evacuation",
      navigation: "Identifies safe evacuation routes",
    },
    landslide: {
      safety: "Protects from debris impacts",
      "first-aid": "Treats trauma injuries",
      tools: "Essential for rescue operations",
      communication: "Enables rescue coordination",
      shelter: "Provides temporary housing",
      water: "Ensures water access",
      power: "Runs rescue equipment",
      food: "Sustains rescue workers",
      clothing: "Protects from mud and debris",
      navigation: "Identifies stable ground",
    },
    storm: {
      shelter: "Protects from wind and rain",
      power: "Maintains electricity during outages",
      communication: "Enables weather updates",
      "first-aid": "Treats storm injuries",
      water: "Ensures clean water supply",
      safety: "Prevents electrical hazards",
      tools: "Helps with emergency repairs",
      food: "Provides sustenance",
      clothing: "Keeps you dry and warm",
      navigation: "Finds safe shelter locations",
    },
    heat_wave: {
      water: "Critical for preventing dehydration",
      power: "Runs cooling equipment",
      "first-aid": "Treats heat stroke and exhaustion",
      clothing: "Provides sun protection",
      shelter: "Offers cooling refuge",
      communication: "Enables heat advisories",
      food: "Light nutrition for extreme heat",
      tools: "Helps with cooling solutions",
      navigation: "Locates cooling centers",
      safety: "Monitors heat conditions",
    },
    cold_wave: {
      shelter: "Provides warmth and insulation",
      clothing: "Prevents hypothermia and frostbite",
      power: "Runs heating equipment",
      food: "Provides calories for warmth",
      "first-aid": "Treats cold-related injuries",
      water: "Prevents frozen pipes",
      communication: "Enables emergency contact",
      tools: "Helps with pipe repair",
      navigation: "Locates warming centers",
      safety: "Monitors cold conditions",
    },
  };

  const disasterReasons = reasons[disasterType] || reasons.storm;
  for (const category of productCategories) {
    if (disasterReasons[category]) {
      return disasterReasons[category];
    }
  }

  return `Recommended for ${disasterType} preparedness`;
}
