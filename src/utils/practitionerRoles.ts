import { PractitionerRole } from '../lib/supabase';

export const PRACTITIONER_ROLE_LABELS: Record<PractitionerRole, string> = {
  activity_lead: 'Activity Lead',
  preparer: 'Preparer',
  cleaner: 'Cleaner',
  post_event_cleanup: 'Post-Event Cleanup',
  greeter: 'Greeter',
  food_service: 'Food Service',
  materials_manager: 'Materials Manager',
  tech_support: 'Tech Support',
  assistant: 'Assistant',
  coordinator: 'Coordinator',
};

export const PRACTITIONER_ROLE_DESCRIPTIONS: Record<PractitionerRole, string> = {
  activity_lead: 'Main facilitator running the activity',
  preparer: 'Sets up materials and prepares the space',
  cleaner: 'Maintains cleanliness during and after event',
  post_event_cleanup: 'Handles cleanup after event ends',
  greeter: 'Welcomes and checks in participants',
  food_service: 'Manages food and beverages',
  materials_manager: 'Organizes and manages supplies',
  tech_support: 'Handles technical aspects (A/V, virtual setup, etc.)',
  assistant: 'General support for various tasks',
  coordinator: 'Coordinates between different roles and teams',
};

export const PRACTITIONER_ROLES: PractitionerRole[] = [
  'activity_lead',
  'coordinator',
  'preparer',
  'greeter',
  'materials_manager',
  'food_service',
  'tech_support',
  'assistant',
  'cleaner',
  'post_event_cleanup',
];

export function getPractitionerRoleLabel(role: PractitionerRole): string {
  return PRACTITIONER_ROLE_LABELS[role] || role;
}

export function getPractitionerRoleDescription(role: PractitionerRole): string {
  return PRACTITIONER_ROLE_DESCRIPTIONS[role] || '';
}

export function getRoleIcon(role: PractitionerRole): string {
  const icons: Record<PractitionerRole, string> = {
    activity_lead: '👨‍🏫',
    coordinator: '🎯',
    preparer: '🛠️',
    greeter: '👋',
    materials_manager: '📦',
    food_service: '🍽️',
    tech_support: '💻',
    assistant: '🤝',
    cleaner: '🧹',
    post_event_cleanup: '✨',
  };
  return icons[role] || '👤';
}
