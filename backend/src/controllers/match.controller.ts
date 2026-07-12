import { Request, Response, NextFunction } from 'express';
import { Match, Stadium } from '../db/models';

export class MatchController {
  public static async listMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const stadiumId = req.query.stadiumId ? parseInt(req.query.stadiumId as string) : undefined;
      const offset = (page - 1) * limit;

      const filter: any = {};
      if (stadiumId) {
        filter.stadiumId = stadiumId;
      }

      const { count, rows } = await Match.findAndCountAll({
        where: filter,
        include: [{ model: Stadium, attributes: ['name', 'city'] }],
        limit,
        offset,
        order: [['dateTime', 'ASC']]
      });

      res.json({
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        matches: rows
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMatchDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = parseInt(req.params.id);
      const match = await Match.findByPk(matchId, {
        include: [{ model: Stadium }]
      });

      if (!match) {
        return res.status(404).json({ error: 'Match schedule not found.' });
      }

      res.json(match);
    } catch (error) {
      next(error);
    }
  }
}
