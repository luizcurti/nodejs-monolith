import { Router, Request, Response } from 'express';
import Joi from 'joi';
import CheckoutFacadeFactory from '../factory/checkout.facade.factory';
import { validateBody } from '../../@shared/middleware/validate';

const checkoutRouter = Router();

const placeOrderSchema = Joi.object({
  clientId: Joi.string().required(),
  products: Joi.array()
    .items(Joi.object({ productId: Joi.string().required() }))
    .min(1)
    .required(),
});

// POST /api/checkout
checkoutRouter.post(
  '/',
  validateBody(placeOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const facade = CheckoutFacadeFactory.create();
      const result = await facade.placeOrder(req.body);
      const statusCode = result.status === 'approved' ? 200 : 422;
      res.status(statusCode).json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      const isBusinessError =
        message.toLowerCase().includes('not found') ||
        message.toLowerCase().includes('out of stock');
      res.status(isBusinessError ? 422 : 500).json({ error: message });
    }
  }
);

export default checkoutRouter;
