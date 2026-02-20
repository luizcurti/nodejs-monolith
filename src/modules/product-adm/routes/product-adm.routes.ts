import { Router, Request, Response } from 'express';
import Joi from 'joi';
import ProductAdmFacadeFactory from '../factory/facade.factory';
import { validateBody } from '../../@shared/middleware/validate';

const productAdmRouter = Router();

const createProductSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  purchasePrice: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
});

// POST /api/products
productAdmRouter.post(
  '/',
  validateBody(createProductSchema),
  async (req: Request, res: Response) => {
    try {
      const { id, name, description, purchasePrice, stock } = req.body;

      const facade = ProductAdmFacadeFactory.create();
      await facade.addProduct({ id, name, description, purchasePrice, stock });

      res.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// GET /api/products/:id/stock
productAdmRouter.get('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facade = ProductAdmFacadeFactory.create();
    const result = await facade.checkStock({ productId: id });

    res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export default productAdmRouter;
