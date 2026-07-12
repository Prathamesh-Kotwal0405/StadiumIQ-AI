import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service';
import { Match, Gate, TransitSchedule, SmartBin, Incident } from '../db/models';

export class AIController {
  public static async fanChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, language } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required.' });
      }

      // Fetch fresh context snapshots from database
      const [matches, gates, transit] = await Promise.all([
        Match.findAll({ limit: 5 }),
        Gate.findAll(),
        TransitSchedule.findAll()
      ]);

      const contextData = {
        matches,
        gates,
        transit
      };

      const responseText = await GeminiService.generateFanResponse(
        query, 
        contextData, 
        language || 'en'
      );
      res.json({ response: responseText });
    } catch (error) {
      next(error);
    }
  }

  public static async opsQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required.' });
      }

      // Fetch comprehensive operations context
      const [gates, bins, incidents, transit] = await Promise.all([
        Gate.findAll(),
        SmartBin.findAll(),
        Incident.findAll({ limit: 15 }),
        TransitSchedule.findAll()
      ]);

      const operationalData = {
        gates,
        bins,
        incidents,
        transit
      };

      const responseText = await GeminiService.analyzeOperations(query, operationalData);
      res.json({ response: responseText });
    } catch (error) {
      next(error);
    }
  }
}
