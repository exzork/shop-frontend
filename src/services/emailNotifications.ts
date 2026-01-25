// Email-based notification service for anonymous buyers
import { 
  useCreateEmailNotificationSubscriptionMutation,
  useGetEmailNotificationSubscriptionsQuery,
  useUpdateEmailNotificationSubscriptionMutation,
  useDeleteEmailNotificationSubscriptionMutation,
  useLazyUnsubscribeFromNotificationsQuery,
  useLazyUnsubscribeFromSingleNotificationQuery,
  useGetEmailSubscriptionsForManagementQuery,
  useUnsubscribeAllForEmailMutation
} from './api';

export interface EmailNotificationSubscription {
  id: number;
  game_id: number;
  game: { name: string };
  server_name: string;
  gender: string;
  max_price: number;
  characters: Array<{
    character: string;
    min_copies: number;
  }>;
  weapons: Array<{
    weapon: string;
    min_copies: number;
  }>;
  is_active: boolean;
  created_at: string;
  email: string;
}

export interface CreateSubscriptionData {
  email: string;
  game_id: number;
  server_name?: string;
  gender?: string;
  max_price?: number;
  characters?: Array<{
    character: string;
    min_copies: number;
  }>;
  weapons?: Array<{
    weapon: string;
    min_copies: number;
  }>;
}

export interface UpdateSubscriptionData {
  id: number;
  email: string;
  game_id: number;
  server_name?: string;
  gender?: string;
  max_price?: number;
  characters?: Array<{
    character: string;
    min_copies: number;
  }>;
  weapons?: Array<{
    weapon: string;
    min_copies: number;
  }>;
  is_active?: boolean;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get stored user email from localStorage
export function getUserEmail(): string | null {
  return localStorage.getItem('userNotificationEmail');
}

// Store user email in localStorage
export function setUserEmail(email: string): void {
  if (isValidEmail(email)) {
    localStorage.setItem('userNotificationEmail', email);
  }
}

// Remove user email from localStorage
export function clearUserEmail(): void {
  localStorage.removeItem('userNotificationEmail');
}

// Check if user has notifications enabled (has email stored)
export function hasNotificationsEnabled(): boolean {
  const email = getUserEmail();
  return email !== null && isValidEmail(email);
}

// Export hooks for component usage
export {
  useCreateEmailNotificationSubscriptionMutation,
  useGetEmailNotificationSubscriptionsQuery,
  useUpdateEmailNotificationSubscriptionMutation,
  useDeleteEmailNotificationSubscriptionMutation,
  useLazyUnsubscribeFromNotificationsQuery,
  useLazyUnsubscribeFromSingleNotificationQuery,
  useGetEmailSubscriptionsForManagementQuery,
  useUnsubscribeAllForEmailMutation
};

// Helper function to show success/error messages
export function showNotificationMessage(message: string, type: 'success' | 'error' = 'success') {
  // For now, use simple alert. In production, you might want to use a toast library
  if (type === 'error') {
    alert(`❌ ${message}`);
  } else {
    alert(`✅ ${message}`);
  }
}

// Format subscription for display
export function formatSubscriptionSummary(subscription: EmailNotificationSubscription): string {
  const parts = [];
  
  // Game
  parts.push(`Game: ${subscription.game.name}`);
  
  // Server
  if (subscription.server_name) {
    parts.push(`Server: ${subscription.server_name}`);
  }
  
  // Gender
  if (subscription.gender) {
    parts.push(`Gender: ${subscription.gender}`);
  }
  
  // Characters
  if (subscription.characters.length > 0) {
    const charList = subscription.characters.map(char => 
      `${char.character}${char.min_copies > 0 ? ` (C${char.min_copies}+)` : ' (C0+)'}`
    ).join(', ');
    parts.push(`Characters: ${charList}`);
  }
  
  // Weapons
  if (subscription.weapons.length > 0) {
    const weaponList = subscription.weapons.map(weapon => 
      `${weapon.weapon}${weapon.min_copies > 0 ? ` (R${weapon.min_copies + 1}+)` : ' (R1+)'}`
    ).join(', ');
    parts.push(`Weapons: ${weaponList}`);
  }
  
  // Price
  if (subscription.max_price > 0) {
    parts.push(`Max Price: $${subscription.max_price}`);
  }
  
  return parts.join(' • ');
}

// Generate subscription criteria from search parameters
export function generateSubscriptionCriteria(
  searchParams: { characters?: string; weapons?: string; servers?: string; gender?: string },
  game: any
): {
  characters: Array<{ character: string; min_copies: number }>;
  weapons: Array<{ weapon: string; min_copies: number }>;
  serverName: string;
  gender: string;
} {
  const charactersList = searchParams.characters
    ? searchParams.characters.split(',').filter(Boolean)
    : [];
  
  const weaponsList = searchParams.weapons
    ? searchParams.weapons.split(',').filter(Boolean)
    : [];

  const serversList = searchParams.servers
    ? searchParams.servers.split(',').filter(Boolean)
    : [];

  // Count character copies and build character criteria
  const characterCriteria: Array<{
    character: string;
    min_copies: number;
  }> = [];

  const characterCounts: { [key: string]: number } = {};
  charactersList.forEach(char => {
    characterCounts[char] = (characterCounts[char] || 0) + 1;
  });

  Object.entries(characterCounts).forEach(([charValue, count]) => {
    const character = game.characters.find((c: any) => c.value === charValue);
    if (character) {
      characterCriteria.push({
        character: character.name,
        min_copies: count - 1 // Convert to constellation (C0 = 0 copies, C1 = 1 copy, etc.)
      });
    }
  });

  // Build weapon criteria
  const weaponCriteria: Array<{
    weapon: string;
    min_copies: number;
  }> = [];

  const weaponCounts: { [key: string]: number } = {};
  weaponsList.forEach(weapon => {
    weaponCounts[weapon] = (weaponCounts[weapon] || 0) + 1;
  });

  Object.entries(weaponCounts).forEach(([weaponValue, count]) => {
    const weapon = game.weapons.find((w: any) => w.value === weaponValue);
    if (weapon) {
      weaponCriteria.push({
        weapon: weapon.name,
        min_copies: count - 1 // Convert to refinement (R1 = 0 copies, R2 = 1 copy, etc.)
      });
    }
  });

  // Use first server or empty string for any server
  const serverName = serversList.length > 0 
    ? game.servers.find((s: any) => s.value === serversList[0])?.name || ""
    : "";

  // Handle gender
  const gender = searchParams.gender || "";

  return {
    characters: characterCriteria,
    weapons: weaponCriteria,
    serverName,
    gender
  };
} 