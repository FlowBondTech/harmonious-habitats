/**
 * Event Registry Templates System
 *
 * Provides smart defaults for event registries based on:
 * - Event category (yoga, potluck, music jam, etc.)
 * - Venue type (home/informal vs studio/venue with equipment)
 *
 * Templates include:
 * - Required/provided items
 * - Lending pool items (extras to share)
 * - Venue-aware defaults
 */

export interface RegistryTemplateItem {
  item: string;
  quantity?: string;
  maxQuantity?: number;
  isRequired?: boolean;
  provider?: 'participant' | 'organizer' | 'either';
  notes?: string;
  registryType: 'required' | 'lending';
}

export interface RegistryTemplate {
  category: string;
  venueType: 'home' | 'studio';
  items: RegistryTemplateItem[];
}

/**
 * Yoga & Movement Templates
 */
const yogaHomeTemplate: RegistryTemplateItem[] = [
  {
    item: 'Yoga Mat',
    quantity: '1 per person',
    maxQuantity: undefined, // unlimited
    isRequired: true,
    provider: 'participant',
    notes: 'Please bring your own mat',
    registryType: 'required'
  },
  {
    item: 'Water Bottle',
    quantity: '1 per person',
    isRequired: true,
    provider: 'participant',
    notes: 'Stay hydrated!',
    registryType: 'required'
  },
  {
    item: 'Extra Yoga Mats',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Bring extras to lend to others who need them',
    registryType: 'lending'
  },
  {
    item: 'Yoga Blocks',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra blocks for participants to borrow',
    registryType: 'lending'
  },
  {
    item: 'Yoga Straps',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra straps for participants to borrow',
    registryType: 'lending'
  }
];

const yogaStudioTemplate: RegistryTemplateItem[] = [
  {
    item: 'Yoga Mats',
    quantity: '15 available',
    maxQuantity: 15,
    isRequired: false,
    provider: 'organizer',
    notes: 'Reserve a mat if you need one',
    registryType: 'required'
  },
  {
    item: 'Yoga Blocks',
    quantity: '10 pairs available',
    maxQuantity: 10,
    isRequired: false,
    provider: 'organizer',
    notes: 'Reserve blocks if you need them',
    registryType: 'required'
  },
  {
    item: 'Yoga Straps',
    quantity: '15 available',
    maxQuantity: 15,
    isRequired: false,
    provider: 'organizer',
    notes: 'Reserve a strap if you need one',
    registryType: 'required'
  },
  {
    item: 'Water Bottle',
    quantity: '1 per person',
    isRequired: true,
    provider: 'participant',
    notes: 'Please bring your own water',
    registryType: 'required'
  }
];

/**
 * Potluck & Food Templates
 */
const potluckHomeTemplate: RegistryTemplateItem[] = [
  {
    item: 'Main Dish',
    quantity: 'Serves 6-8',
    maxQuantity: 3,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., lasagna, curry, casserole)',
    registryType: 'required'
  },
  {
    item: 'Side Dish',
    quantity: 'Serves 6-8',
    maxQuantity: 4,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., salad, vegetables, rice)',
    registryType: 'required'
  },
  {
    item: 'Appetizer',
    quantity: 'Serves 6-8',
    maxQuantity: 3,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., hummus & veggies, chips & dip)',
    registryType: 'required'
  },
  {
    item: 'Dessert',
    quantity: 'Serves 6-8',
    maxQuantity: 2,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., cookies, cake, fruit)',
    registryType: 'required'
  },
  {
    item: 'Beverages',
    quantity: 'For the group',
    maxQuantity: 2,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., juice, tea, soda)',
    registryType: 'required'
  },
  {
    item: 'Extra Plates & Utensils',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Reusable plates, bowls, utensils to lend',
    registryType: 'lending'
  },
  {
    item: 'Extra Serving Dishes',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Large bowls or platters to lend',
    registryType: 'lending'
  }
];

const potluckStudioTemplate: RegistryTemplateItem[] = [
  {
    item: 'Main Dish',
    quantity: 'Serves 6-8',
    maxQuantity: 3,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., lasagna, curry, casserole)',
    registryType: 'required'
  },
  {
    item: 'Side Dish',
    quantity: 'Serves 6-8',
    maxQuantity: 4,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., salad, vegetables, rice)',
    registryType: 'required'
  },
  {
    item: 'Appetizer',
    quantity: 'Serves 6-8',
    maxQuantity: 3,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., hummus & veggies, chips & dip)',
    registryType: 'required'
  },
  {
    item: 'Dessert',
    quantity: 'Serves 6-8',
    maxQuantity: 2,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., cookies, cake, fruit)',
    registryType: 'required'
  },
  {
    item: 'Beverages',
    quantity: 'For the group',
    maxQuantity: 2,
    isRequired: false,
    provider: 'participant',
    notes: 'What are you bringing? (e.g., juice, tea, soda)',
    registryType: 'required'
  },
  {
    item: 'Plates & Utensils',
    quantity: 'Provided by venue',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'organizer',
    notes: 'Venue provides plates and utensils',
    registryType: 'required'
  }
];

/**
 * Music Jam Templates
 */
const musicJamHomeTemplate: RegistryTemplateItem[] = [
  {
    item: 'Guitar (Acoustic)',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Guitar (Electric)',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Keyboard/Piano',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Drums/Percussion',
    quantity: 'What type?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Specify the instrument (e.g., djembe, congas, drum kit)',
    registryType: 'required'
  },
  {
    item: 'Bass',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Other Instruments',
    quantity: 'What type?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Specify the instrument (e.g., violin, flute, ukulele)',
    registryType: 'required'
  },
  {
    item: 'Extra Instruments to Lend',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Bring extra instruments for others to try out',
    registryType: 'lending'
  },
  {
    item: 'Extra Cables & Accessories',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra guitar cables, picks, straps, etc.',
    registryType: 'lending'
  }
];

const musicJamStudioTemplate: RegistryTemplateItem[] = [
  {
    item: 'PA System',
    quantity: '1 available',
    maxQuantity: 1,
    isRequired: false,
    provider: 'organizer',
    notes: 'Sound system provided by venue',
    registryType: 'required'
  },
  {
    item: 'Microphones',
    quantity: '4 available',
    maxQuantity: 4,
    isRequired: false,
    provider: 'organizer',
    notes: 'Reserve if you need one',
    registryType: 'required'
  },
  {
    item: 'Guitar (Acoustic)',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Guitar (Electric)',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Keyboard/Piano',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Drums/Percussion',
    quantity: 'What type?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Specify the instrument',
    registryType: 'required'
  },
  {
    item: 'Bass',
    quantity: 'How many?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'What instrument are you bringing?',
    registryType: 'required'
  },
  {
    item: 'Other Instruments',
    quantity: 'What type?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Specify the instrument',
    registryType: 'required'
  },
  {
    item: 'Extra Instruments to Lend',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Bring extra instruments for others to try out',
    registryType: 'lending'
  }
];

/**
 * Meditation & Mindfulness Templates
 */
const meditationHomeTemplate: RegistryTemplateItem[] = [
  {
    item: 'Meditation Cushion',
    quantity: '1 per person',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Bring your own cushion or pillow',
    registryType: 'required'
  },
  {
    item: 'Blanket',
    quantity: '1 per person',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Optional for warmth during meditation',
    registryType: 'required'
  },
  {
    item: 'Extra Cushions',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra cushions or pillows to lend',
    registryType: 'lending'
  },
  {
    item: 'Extra Blankets',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra blankets for participants',
    registryType: 'lending'
  }
];

const meditationStudioTemplate: RegistryTemplateItem[] = [
  {
    item: 'Meditation Cushions',
    quantity: '20 available',
    maxQuantity: 20,
    isRequired: false,
    provider: 'organizer',
    notes: 'Reserve a cushion if you need one',
    registryType: 'required'
  },
  {
    item: 'Blankets',
    quantity: '20 available',
    maxQuantity: 20,
    isRequired: false,
    provider: 'organizer',
    notes: 'Reserve a blanket if you need one',
    registryType: 'required'
  }
];

/**
 * Art & Craft Templates
 */
const artCraftHomeTemplate: RegistryTemplateItem[] = [
  {
    item: 'Art Supplies',
    quantity: 'What are you bringing?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Specify what you\'re bringing (e.g., paint, brushes, paper)',
    registryType: 'required'
  },
  {
    item: 'Extra Art Supplies',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra supplies for others to use',
    registryType: 'lending'
  },
  {
    item: 'Drop Cloths',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'To protect surfaces',
    registryType: 'lending'
  }
];

const artCraftStudioTemplate: RegistryTemplateItem[] = [
  {
    item: 'Basic Art Supplies',
    quantity: 'Provided by venue',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'organizer',
    notes: 'Paper, pencils, basic materials included',
    registryType: 'required'
  },
  {
    item: 'Specialty Supplies',
    quantity: 'What are you bringing?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Any specialty materials you want to use',
    registryType: 'required'
  }
];

/**
 * Study Group / Workshop Templates
 */
const studyGroupTemplate: RegistryTemplateItem[] = [
  {
    item: 'Laptop/Tablet',
    quantity: '1 per person',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'If needed for the session',
    registryType: 'required'
  },
  {
    item: 'Notebook & Pen',
    quantity: '1 per person',
    maxQuantity: undefined,
    isRequired: true,
    provider: 'participant',
    notes: 'For taking notes',
    registryType: 'required'
  },
  {
    item: 'Reference Materials',
    quantity: 'What are you bringing?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Books, handouts, or resources to share',
    registryType: 'required'
  },
  {
    item: 'Extra Laptops',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra devices to lend',
    registryType: 'lending'
  }
];

/**
 * Garden / Outdoor Work Templates
 */
const gardenWorkTemplate: RegistryTemplateItem[] = [
  {
    item: 'Garden Gloves',
    quantity: '1 pair per person',
    maxQuantity: undefined,
    isRequired: true,
    provider: 'participant',
    notes: 'Bring your own gloves',
    registryType: 'required'
  },
  {
    item: 'Garden Tools',
    quantity: 'What are you bringing?',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Specify tools (e.g., shovel, rake, pruners)',
    registryType: 'required'
  },
  {
    item: 'Water Bottle',
    quantity: '1 per person',
    maxQuantity: undefined,
    isRequired: true,
    provider: 'participant',
    notes: 'Stay hydrated!',
    registryType: 'required'
  },
  {
    item: 'Extra Garden Tools',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra tools for others to use',
    registryType: 'lending'
  },
  {
    item: 'Extra Gloves',
    quantity: 'If you have extras',
    maxQuantity: undefined,
    isRequired: false,
    provider: 'participant',
    notes: 'Extra pairs for participants',
    registryType: 'lending'
  }
];

/**
 * Template registry by category and venue type
 */
const REGISTRY_TEMPLATES: Record<string, { home: RegistryTemplateItem[], studio: RegistryTemplateItem[] }> = {
  'yoga': {
    home: yogaHomeTemplate,
    studio: yogaStudioTemplate
  },
  'movement': {
    home: yogaHomeTemplate,
    studio: yogaStudioTemplate
  },
  'potluck': {
    home: potluckHomeTemplate,
    studio: potluckStudioTemplate
  },
  'food': {
    home: potluckHomeTemplate,
    studio: potluckStudioTemplate
  },
  'music': {
    home: musicJamHomeTemplate,
    studio: musicJamStudioTemplate
  },
  'meditation': {
    home: meditationHomeTemplate,
    studio: meditationStudioTemplate
  },
  'mindfulness': {
    home: meditationHomeTemplate,
    studio: meditationStudioTemplate
  },
  'art': {
    home: artCraftHomeTemplate,
    studio: artCraftStudioTemplate
  },
  'craft': {
    home: artCraftHomeTemplate,
    studio: artCraftStudioTemplate
  },
  'study': {
    home: studyGroupTemplate,
    studio: studyGroupTemplate
  },
  'workshop': {
    home: studyGroupTemplate,
    studio: studyGroupTemplate
  },
  'garden': {
    home: gardenWorkTemplate,
    studio: gardenWorkTemplate
  },
  'outdoor': {
    home: gardenWorkTemplate,
    studio: gardenWorkTemplate
  }
};

/**
 * Get registry template for a specific event category and venue type
 */
export function getRegistryTemplate(
  category: string,
  venueType: 'home' | 'studio'
): RegistryTemplateItem[] {
  const categoryKey = category.toLowerCase();

  // Find matching template (exact match or partial match)
  for (const [key, templates] of Object.entries(REGISTRY_TEMPLATES)) {
    if (categoryKey.includes(key) || key.includes(categoryKey)) {
      return templates[venueType];
    }
  }

  // Return empty template if no match
  return [];
}

/**
 * Get list of categories that have templates
 */
export function getAvailableTemplateCategories(): string[] {
  return Object.keys(REGISTRY_TEMPLATES);
}

/**
 * Check if a category has a template
 */
export function hasTemplate(category: string): boolean {
  const categoryKey = category.toLowerCase();
  return Object.keys(REGISTRY_TEMPLATES).some(
    key => categoryKey.includes(key) || key.includes(categoryKey)
  );
}
