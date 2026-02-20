import { Router, Request, Response } from 'express';
import Joi from 'joi';
import ClientAdmFacadeFactory from '../factory/client-adm.facade.factory';
import { validateBody } from '../../@shared/middleware/validate';

const clientAdmRouter = Router();

const createClientSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  address: Joi.string().required(),
});

// POST /api/clients
clientAdmRouter.post(
  '/',
  validateBody(createClientSchema),
  async (req: Request, res: Response) => {
    try {
      const { id, name, email, address } = req.body;

      const facade = ClientAdmFacadeFactory.create();
      await facade.add({ id, name, email, address });

      res.status(201).json({ message: 'Client created successfully' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ error: message });
    }
  }
);

// GET /api/clients/:id
clientAdmRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facade = ClientAdmFacadeFactory.create();
    const client = await facade.find({ id });

    res.status(200).json(client);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export default clientAdmRouter;
