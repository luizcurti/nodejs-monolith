import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware factory that validates req.body against a Joi schema.
 * Returns 400 with a joined error message on validation failure.
 * On success, replaces req.body with the coerced/stripped value from Joi.
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      res
        .status(400)
        .json({ error: error.details.map(d => d.message).join('; ') });
      return;
    }

    req.body = value;
    next();
  };
};
