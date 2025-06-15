export type SpaceStatus = 'open' | 'full' | 'ongoing' | 'completed';
export type HolderType = 'instructor' | 'owner' | 'both';
export type PricingType = 'free' | 'fixed' | 'donation';

export interface Space {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: SpaceStatus;
  attendees: number;
  capacity: number;
  isHolder: boolean;
  isAttending: boolean;
  image: string;
  holderType?: HolderType;
  pricing?: {
    type: PricingType;
    amount?: number;
    suggestedDonation?: number;
  };
}

export interface SpaceHolder {
  id: string;
  userId: string;
  type: HolderType;
  bio: string;
  expertise?: string[];
  certifications?: string[];
}