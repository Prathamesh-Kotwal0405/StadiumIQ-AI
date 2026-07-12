import { describe, it, expect } from 'vitest';
import { RoutingService, GateOption, BinItem } from '../services/routing.service';

describe('RoutingService Unit Tests', () => {
  describe('recommendGate', () => {
    it('should select the gate with the shortest queue and wait time', () => {
      const gates: GateOption[] = [
        { id: 1, name: 'Gate A', flowRate: 50, currentQueueSize: 200, status: 'open' }, // 4 mins
        { id: 2, name: 'Gate B', flowRate: 30, currentQueueSize: 60, status: 'open' },  // 2 mins (Best)
        { id: 3, name: 'Gate C', flowRate: 40, currentQueueSize: 400, status: 'open' }  // 10 mins
      ];

      const result = RoutingService.recommendGate(gates);
      expect(result.recommended.id).toBe(2);
      expect(result.waitTimeMinutes).toBe(2);
    });

    it('should penalize bottleneck gates appropriately', () => {
      const gates: GateOption[] = [
        { id: 1, name: 'Gate A', flowRate: 50, currentQueueSize: 100, status: 'bottleneck' }, // effective flow = 50 * 0.3 = 15; wait = 100 / 15 = 7 mins
        { id: 2, name: 'Gate B', flowRate: 20, currentQueueSize: 80, status: 'open' }         // wait = 80 / 20 = 4 mins (Best)
      ];

      const result = RoutingService.recommendGate(gates);
      expect(result.recommended.id).toBe(2);
    });

    it('should exclude closed gates', () => {
      const gates: GateOption[] = [
        { id: 1, name: 'Gate A', flowRate: 50, currentQueueSize: 10, status: 'closed' },
        { id: 2, name: 'Gate B', flowRate: 20, currentQueueSize: 100, status: 'open' }
      ];

      const result = RoutingService.recommendGate(gates);
      expect(result.recommended.id).toBe(2);
    });

    it('should respect preferred side filter when wait time differences are reasonable', () => {
      const gates: GateOption[] = [
        { id: 1, name: 'Gate A (North)', flowRate: 40, currentQueueSize: 40, status: 'open' }, // 1 min (Best overall)
        { id: 2, name: 'Gate B (South)', flowRate: 40, currentQueueSize: 50, status: 'open' }  // 1.25 min (Matches preference)
      ];

      const result = RoutingService.recommendGate(gates, 'South');
      expect(result.recommended.id).toBe(2);
    });

    it('should ignore preferred side if wait time is significantly worse than minimum', () => {
      const gates: GateOption[] = [
        { id: 1, name: 'Gate A (North)', flowRate: 50, currentQueueSize: 50, status: 'open' },  // 1 min (Best overall)
        { id: 2, name: 'Gate B (South)', flowRate: 10, currentQueueSize: 100, status: 'open' }  // 10 min (Preferred but way worse)
      ];

      const result = RoutingService.recommendGate(gates, 'South');
      expect(result.recommended.id).toBe(1); // Should select North because South is a massive queue
    });
  });

  describe('optimizeBinCollection', () => {
    it('should filter out bins below 50% fill level and sort the remainder descending', () => {
      const bins: BinItem[] = [
        { id: 1, zoneName: 'Zone A', fillLevel: 30, locationDetails: '' }, // Excluded
        { id: 2, zoneName: 'Zone B', fillLevel: 90, locationDetails: '' }, // 1st
        { id: 3, zoneName: 'Zone C', fillLevel: 75, locationDetails: '' }  // 2nd
      ];

      const result = RoutingService.optimizeBinCollection(bins);
      expect(result.route.length).toBe(2);
      expect(result.route[0].id).toBe(2);
      expect(result.route[1].id).toBe(3);
    });

    it('should return empty route list when all bins are under threshold', () => {
      const bins: BinItem[] = [
        { id: 1, zoneName: 'Zone A', fillLevel: 20, locationDetails: '' },
        { id: 2, zoneName: 'Zone B', fillLevel: 45, locationDetails: '' }
      ];

      const result = RoutingService.optimizeBinCollection(bins);
      expect(result.route.length).toBe(0);
      expect(result.summary).toContain('acceptable limits');
    });
  });
});
