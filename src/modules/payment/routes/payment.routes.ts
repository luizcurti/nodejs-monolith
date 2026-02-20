import { Router, Request, Response } from 'express';
import Joi from 'joi';
import PaymentFacadeFactory from '../factory/payment.facade.factory';
import { validateBody } from '../../@shared/middleware/validate';

const paymentRouter = Router();

const processPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number().positive().required(),
});

// POST /api/payments
paymentRouter.post(
  '/',
  validateBody(processPaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const { orderId, amount } = req.body;

      const facade = PaymentFacadeFactory.create();
      const result = await facade.process({ orderId, amount });

      const statusCode = result.status === 'approved' ? 200 : 422;
      res.status(statusCode).json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

export default paymentRouter;
