import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array().map(err => {
        if (err.type === 'field') {
          return { field: err.path, message: err.msg };
        }
        return { message: err.msg };
      })
    });
  }
  next();
};

export const registerValidationRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters.'),
  body('email').trim().isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  })
];

export const loginValidationRules = [
  body('email').trim().isEmail().withMessage('Must be a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
];

export const updateFlowValidationRules = [
  param('stadiumId').isInt().withMessage('Stadium ID must be an integer.'),
  param('gateId').isInt().withMessage('Gate ID must be an integer.'),
  body('flowRate').optional().isInt({ min: 0, max: 500 }).withMessage('Flow rate must be an integer between 0 and 500.'),
  body('currentQueueSize').optional().isInt({ min: 0 }).withMessage('Queue size must be a non-negative integer.'),
  body('status').optional().isIn(['open', 'bottleneck', 'closed']).withMessage('Invalid gate status.')
];

export const updateBinValidationRules = [
  param('stadiumId').isInt().withMessage('Stadium ID must be an integer.'),
  param('binId').isInt().withMessage('Bin ID must be an integer.'),
  body('fillLevel').isInt({ min: 0, max: 100 }).withMessage('Fill level must be an integer between 0 and 100.')
];

export const postIncidentValidationRules = [
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('severity').isIn(['low', 'medium', 'high']).withMessage('Severity must be low, medium, or high.')
];
