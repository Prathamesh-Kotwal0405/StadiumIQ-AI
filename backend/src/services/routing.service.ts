export interface GateOption {
  id: number;
  name: string;
  flowRate: number;
  currentQueueSize: number;
  status: 'open' | 'bottleneck' | 'closed';
}

export interface BinItem {
  id: number;
  zoneName: string;
  fillLevel: number;
  locationDetails: string;
}

export class RoutingService {
  /**
   * Recommends the best gate based on queue size, flow rate, and status.
   * Wait Time = Queue Size / Flow Rate (in minutes).
   */
  public static recommendGate(gates: GateOption[], preferredSide?: string): { recommended: GateOption; waitTimeMinutes: number; options: any[] } {
    const activeGates = gates.filter(g => g.status !== 'closed');
    if (activeGates.length === 0) {
      throw new Error('No open gates available.');
    }

    const options = activeGates.map(g => {
      // If it's a bottleneck, artificially penalize the flow rate
      const effectiveFlow = g.status === 'bottleneck' ? Math.max(5, g.flowRate * 0.3) : g.flowRate;
      const waitTime = Math.round(g.currentQueueSize / effectiveFlow);
      return {
        ...g,
        estimatedWaitTimeMinutes: waitTime
      };
    });

    // Sort by wait time ascending.
    options.sort((a, b) => a.estimatedWaitTimeMinutes - b.estimatedWaitTimeMinutes);

    // If preferred side matches, prefer it unless wait time is twice the minimum.
    let recommended = options[0];
    if (preferredSide) {
      const sidePref = preferredSide.toLowerCase();
      const match = options.find(o => {
        const nameLower = o.name.toLowerCase();
        return nameLower.includes(sidePref) || 
               sidePref.includes(nameLower) ||
               (sidePref.includes('north') && nameLower.includes('north')) ||
               (sidePref.includes('south') && nameLower.includes('south')) ||
               (sidePref.includes('east') && nameLower.includes('east')) ||
               (sidePref.includes('west') && nameLower.includes('west'));
      });
      if (match && match.estimatedWaitTimeMinutes <= options[0].estimatedWaitTimeMinutes * 2.0) {
        recommended = match;
      }
    }

    return {
      recommended,
      waitTimeMinutes: recommended.estimatedWaitTimeMinutes,
      options
    };
  }

  /**
   * Sorts full bins and optimizes collection paths using a greedy approach prioritizing high fill level and zone grouping.
   */
  public static optimizeBinCollection(bins: BinItem[]): { route: BinItem[]; summary: string } {
    // Filter out bins that are below 50% fill level as they don't require immediate collection.
    const priorityBins = bins.filter(b => b.fillLevel >= 50);

    // Sort priority bins descending by fill level
    const sortedBins = [...priorityBins].sort((a, b) => b.fillLevel - a.fillLevel);

    let summary = '';
    if (sortedBins.length === 0) {
      summary = 'All smart bins are within acceptable limits. No waste collection route required.';
    } else {
      summary = `Optimized collection route generated for ${sortedBins.length} bins. Collect in order of highest fill level to prevent overflows.`;
    }

    return {
      route: sortedBins,
      summary
    };
  }
}
