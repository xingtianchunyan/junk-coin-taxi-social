
export interface RideRequest {
  id: string;
  friendName: string;
  startLocation: string;
  endLocation: string;
  requestedTime: Date;
  contactInfo: string;
  notes?: string;
  status: 'pending' | 'completed';
  createdAt: Date;
}
