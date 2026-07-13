import { Request, Response, NextFunction } from 'express';
import { TransitSchedule } from '../db/models';

export class TransitController {
  public static async getSchedules(_req: Request, res: Response, next: NextFunction) {
    try {
      const schedules = await TransitSchedule.findAll({
        order: [['transportType', 'ASC'], ['routeName', 'ASC']]
      });
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  }

  public static async updateTransitStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const transitId = parseInt(req.params.id);
      const { status, delayDetails } = req.body;

      const schedule = await TransitSchedule.findByPk(transitId);
      if (!schedule) {
        return res.status(404).json({ error: 'Transit schedule not found.' });
      }

      if (status !== undefined) schedule.status = status;
      if (delayDetails !== undefined) schedule.delayDetails = delayDetails;

      await schedule.save();
      res.json({ message: 'Transit status updated.', schedule });
    } catch (error) {
      next(error);
    }
  }
}
