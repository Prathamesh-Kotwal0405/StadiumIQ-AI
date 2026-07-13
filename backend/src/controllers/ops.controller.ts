import { Request, Response, NextFunction } from 'express';
import { Gate, SmartBin, Incident } from '../db/models';
import { RoutingService } from '../services/routing.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class OpsController {
  public static async getGates(req: Request, res: Response, next: NextFunction) {
    try {
      const stadiumId = parseInt(req.params.stadiumId);
      const gates = await Gate.findAll({ where: { stadiumId } });

      if (req.query.recommend === 'true') {
        const side = req.query.side as string || undefined;
        try {
          const recommendation = RoutingService.recommendGate(gates as any, side);
          return res.json({ gates, ...recommendation });
        } catch (err: any) {
          return res.status(400).json({ error: err.message, gates });
        }
      }

      res.json(gates);
    } catch (error) {
      next(error);
    }
  }

  public static async updateGateFlow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { flowRate, currentQueueSize, status } = req.body;
      const gateId = parseInt(req.params.gateId);
      const stadiumId = parseInt(req.params.stadiumId);

      const gate = await Gate.findOne({ where: { id: gateId, stadiumId } });
      if (!gate) {
        return res.status(404).json({ error: 'Gate not found at this stadium.' });
      }

      if (flowRate !== undefined) gate.flowRate = flowRate;
      if (currentQueueSize !== undefined) gate.currentQueueSize = currentQueueSize;
      if (status !== undefined) gate.status = status;

      await gate.save();
      res.json({ message: 'Gate status updated successfully.', gate });
    } catch (error) {
      next(error);
    }
  }

  public static async getBins(req: Request, res: Response, next: NextFunction) {
    try {
      const stadiumId = parseInt(req.params.stadiumId);
      const bins = await SmartBin.findAll({ where: { stadiumId } });
      res.json(bins);
    } catch (error) {
      next(error);
    }
  }

  public static async updateBinLevel(req: Request, res: Response, next: NextFunction) {
    try {
      const { fillLevel } = req.body;
      const binId = parseInt(req.params.binId);
      const stadiumId = parseInt(req.params.stadiumId);

      const bin = await SmartBin.findOne({ where: { id: binId, stadiumId } });
      if (!bin) {
        return res.status(404).json({ error: 'Smart bin not found at this stadium.' });
      }

      bin.fillLevel = fillLevel;
      bin.status = fillLevel >= 80 ? 'full' : 'normal';

      await bin.save();
      res.json({ message: 'Smart Bin sensors updated.', bin });
    } catch (error) {
      next(error);
    }
  }

  public static async getOptimizedBinRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const stadiumId = parseInt(req.params.stadiumId);
      const bins = await SmartBin.findAll({ where: { stadiumId } });
      const routingResult = RoutingService.optimizeBinCollection(bins as any);
      res.json(routingResult);
    } catch (error) {
      next(error);
    }
  }

  public static async getIncidents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      if (req.user && req.user.role !== 'organizer') {
        filter.reportedBy = req.user.email;
      }

      const incidents = await Incident.findAll({
        where: filter,
        order: [['createdAt', 'DESC']]
      });
      res.json(incidents);
    } catch (error) {
      next(error);
    }
  }

  public static async reportIncident(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { description, severity } = req.body;
      const reportedBy = req.user ? req.user.email : 'Anonymous Fan';

      const incident = await Incident.create({
        reportedBy,
        description,
        severity,
        status: 'open',
        responseAction: 'Logged by system dispatcher.'
      });

      res.status(201).json({ message: 'Incident reported successfully.', incident });
    } catch (error) {
      next(error);
    }
  }

  public static async updateIncident(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const incidentId = parseInt(req.params.id);
      const { status, responseAction } = req.body;

      const incident = await Incident.findByPk(incidentId);
      if (!incident) {
        return res.status(404).json({ error: 'Incident report not found.' });
      }

      if (status !== undefined) incident.status = status;
      if (responseAction !== undefined) incident.responseAction = responseAction;

      await incident.save();
      res.json({ message: 'Incident status updated.', incident });
    } catch (error) {
      next(error);
    }
  }
}
