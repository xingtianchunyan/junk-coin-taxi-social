import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { RideRequestService } from '../services/rideRequestService';
import { supabase } from '../integrations/supabase/client';

vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
  },
}));

describe('RideRequestService Fare Calculation', () => {
  let service: RideRequestService;

  beforeEach(() => {
    service = new RideRequestService();
    vi.clearAllMocks();
  });

  it('should call calculate_ride_fare RPC with correct parameters', async () => {
    const mockData = [{ amount: 100, currency: 'CNY', is_discounted: true }];
    (supabase.rpc as Mock).mockResolvedValue({ data: mockData, error: null });

    const routeId = 'route-123';
    const vehicleId = 'vehicle-456';
    
    const result = await service.calculateFare(routeId, vehicleId);

    expect(supabase.rpc).toHaveBeenCalledWith('calculate_ride_fare', {
      p_fixed_route_id: routeId,
      p_vehicle_id: vehicleId,
    });
    
    expect(result).toEqual({
      amount: 100,
      currency: 'CNY',
      is_discounted: true,
    });
  });

  it('should handle RPC errors gracefully', async () => {
    const mockError = { message: 'RPC Error' };
    (supabase.rpc as Mock).mockResolvedValue({ data: null, error: mockError });

    await expect(service.calculateFare('route-123')).rejects.toEqual(mockError);
  });
});

describe('RideRequestService Payment', () => {
  let service: RideRequestService;

  beforeEach(() => {
    service = new RideRequestService();
    vi.clearAllMocks();
  });

  it('should create a payment record with status pending', async () => {
    const mockPayment = {
      id: 'pay-123',
      ride_request_id: 'ride-123',
      amount: 100,
      currency: 'CNY',
      wallet_address: '0x123',
      payment_method: 'ETH',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockPayment, error: null })
      })
    });
    (supabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'payments') return { insert: insertMock };
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
    });

    const paymentData = {
      ride_request_id: 'ride-123',
      amount: 100,
      currency: 'CNY',
      wallet_address: '0x123',
      payment_method: 'ETH',
      transaction_hash: '0xabc'
    };

    const result = await service.createPayment(paymentData);

    expect(insertMock).toHaveBeenCalledWith([{
      ...paymentData,
      status: 'pending'
    }]);
    expect(result.id).toBe('pay-123');
    expect(result.status).toBe('pending');
  });

  it('should call verify_and_confirm_payment RPC', async () => {
    (supabase.rpc as Mock).mockResolvedValue({ data: true, error: null });

    const paymentId = 'pay-123';
    const txHash = '0xabc';
    
    const result = await service.confirmPayment(paymentId, txHash);

    expect(supabase.rpc).toHaveBeenCalledWith('verify_and_confirm_payment', {
      p_payment_id: paymentId,
      p_transaction_hash: txHash,
    });
    expect(result).toBe(true);
  });
});
