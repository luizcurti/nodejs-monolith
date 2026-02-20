import { Router, Request, Response } from 'express';
import StoreCatalogFacadeFactory from '../factory/facade.factory';

const storeCatalogRouter = Router();

// GET /api/catalog/products
storeCatalogRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const facade = StoreCatalogFacadeFactory.create();
    const result = await facade.findAll();

    res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// GET /api/catalog/products/:id
storeCatalogRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facade = StoreCatalogFacadeFactory.create();
    const product = await facade.find({ id });

    res.status(200).json(product);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export default storeCatalogRouter;
