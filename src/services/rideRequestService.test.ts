import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RideRequestService } from './rideRequestService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
  },
}));

describe('RideRequestService', () => {
  let service: RideRequestService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RideRequestService();
  });

  describe('calculateFare', () => {
    it('should call calculate_ride_fare RPC and return formatted result', async () => {
      const mockData = [{ amount: 50, currency: 'CNY', is_discounted: false }];
      (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

      const result = await service.calculateFare('route-123', 'vehicle-456');

      expect(supabase.rpc).toHaveBeenCalledWith('calculate_ride_fare', {
        p_fixed_route_id: 'route-123',
        p_vehicle_id: 'vehicle-456',
      });
      expect(result).toEqual({
        amount: 50,
        currency: 'CNY',
        is_discounted: false,
      });
    });

    it('should throw error when RPC fails', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('RPC Error') });

      await expect(service.calculateFare('route-123')).rejects.toThrow('RPC Error');
    });
  });

  describe('checkDriverTimingConflict', () => {
    it('should call check_driver_timing_conflict RPC and return boolean', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });
      const requestedTime = new Date();

      const result = await service.checkDriverTimingConflict('vehicle-123', 'route-456', requestedTime);

      expect(supabase.rpc).toHaveBeenCalledWith('check_driver_timing_conflict', {
        p_vehicle_id: 'vehicle-123',
        p_fixed_route_id: 'route-456',
        p_requested_time: requestedTime.toISOString(),
      });
      expect(result).toBe(true);
    });

    it('should return false when RPC returns null/false', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: false, error: null });
      const result = await service.checkDriverTimingConflict('v1', 'r1', new Date());
      expect(result).toBe(false);
    });
  });

  describe('confirmPayment', () => {
    it('should call verify_and_confirm_payment RPC', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      const result = await service.confirmPayment('pay-123', 'tx-hash-456');

      expect(supabase.rpc).toHaveBeenCalledWith('verify_and_confirm_payment', {
        p_payment_id: 'pay-123',
        p_transaction_hash: 'tx-hash-456',
      });
      expect(result).toBe(true);
    });
  });
});
