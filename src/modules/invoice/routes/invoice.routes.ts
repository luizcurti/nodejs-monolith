import { Router, Request, Response } from 'express';
import Joi from 'joi';
import InvoiceFacadeFactory from '../factory/invoice.facade.factory';
import { validateBody } from '../../@shared/middleware/validate';

const invoiceRouter = Router();

const generateInvoiceSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required(),
  document: Joi.string().required(),
  address: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().optional(),
        name: Joi.string().required(),
        price: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required(),
});

// POST /api/invoices
invoiceRouter.post(
  '/',
  validateBody(generateInvoiceSchema),
  async (req: Request, res: Response) => {
    try {
      const facade = InvoiceFacadeFactory.create();
      const result = await facade.generate(req.body);
      res.status(201).json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// GET /api/invoices/:id
invoiceRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const facade = InvoiceFacadeFactory.create();
    const result = await facade.find({ id: req.params.id });
    res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export default invoiceRouter;
