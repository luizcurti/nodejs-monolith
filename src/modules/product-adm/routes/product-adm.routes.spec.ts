import express from 'express';
import request from 'supertest';
import { Sequelize } from 'sequelize-typescript';
import { ProductModel } from '../repository/product.model';
import productAdmRouter from './product-adm.routes';

// Isolated Express app — no dependency on main.ts
const app = express();
app.use(express.json());
app.use('/api/products', productAdmRouter);

let sequelize: Sequelize;

// ─── End-to-end data flow ──────────────────────────────────────────────────────
// POST /api/products
//   → productAdmRouter → ProductAdmFacadeFactory.create()
//   → ProductAdmFacade → AddProductUseCase → ProductRepository → ProductModel (SQLite)
//
// GET /api/products/:id/stock
//   → productAdmRouter → ProductAdmFacadeFactory.create()
//   → ProductAdmFacade → CheckStockUseCase → ProductRepository → ProductModel (SQLite)
// ──────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    sync: { force: true },
  });
  await sequelize.addModels([ProductModel]);
  await sequelize.sync();
});

afterEach(async () => {
  await sequelize.close();
});

describe('POST /api/products', () => {
  describe('success cases', () => {
    it('creates a product with all required fields and returns 201', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Pro Notebook',
        description: 'High-performance laptop',
        purchasePrice: 3500,
        stock: 10,
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: 'Product created successfully' });
    });

    it('accepts optional id and persists it to the database', async () => {
      const res = await request(app).post('/api/products').send({
        id: 'prod-uuid-001',
        name: 'Wireless Mouse',
        description: 'Ergonomic mouse',
        purchasePrice: 120,
        stock: 50,
      });

      expect(res.status).toBe(201);

      const found = await ProductModel.findOne({
        where: { id: 'prod-uuid-001' },
      });
      expect(found).not.toBeNull();
      expect(found.name).toBe('Wireless Mouse');
      expect(found.stock).toBe(50);
      expect(found.purchasePrice).toBe(120);
    });

    it('accepts stock equal to zero', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Out of Stock Item',
        description: 'Currently unavailable',
        purchasePrice: 99,
        stock: 0,
      });

      expect(res.status).toBe(201);
    });

    it('accepts decimal purchasePrice', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Budget Item',
        description: 'Affordable product',
        purchasePrice: 19.99,
        stock: 100,
      });

      expect(res.status).toBe(201);
    });
  });

  describe('missing required fields — 400', () => {
    it('returns 400 when name is missing', async () => {
      const res = await request(app).post('/api/products').send({
        description: 'Product without name',
        purchasePrice: 100,
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when description is missing', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Product',
        purchasePrice: 100,
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when purchasePrice is missing', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Product',
        description: 'Desc',
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when stock is missing', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Product',
        description: 'Desc',
        purchasePrice: 100,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/products').send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('invalid field types — 400', () => {
    it('returns 400 when name is a number', async () => {
      const res = await request(app).post('/api/products').send({
        name: 123,
        description: 'Valid desc',
        purchasePrice: 100,
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    it('returns 400 when description is a number', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Valid',
        description: 456,
        purchasePrice: 100,
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    it('returns 400 when purchasePrice is a string', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Valid',
        description: 'Valid',
        purchasePrice: 'expensive',
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/number/i);
    });

    it('returns 400 when stock is a string', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Valid',
        description: 'Valid',
        purchasePrice: 100,
        stock: 'many',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/number/i);
    });
  });

  describe('invalid field ranges — 400', () => {
    it('returns 400 when purchasePrice is zero', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Free Item',
        description: 'Zero price product',
        purchasePrice: 0,
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
    });

    it('returns 400 when purchasePrice is negative', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Negative Price',
        description: 'Invalid price',
        purchasePrice: -10,
        stock: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
    });

    it('returns 400 when stock is negative', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Product',
        description: 'Desc',
        purchasePrice: 100,
        stock: -1,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/greater than or equal to 0/i);
    });

    it('returns 400 when stock is a float', async () => {
      const res = await request(app).post('/api/products').send({
        name: 'Product',
        description: 'Desc',
        purchasePrice: 100,
        stock: 1.5,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/integer/i);
    });
  });
});

describe('GET /api/products/:id/stock', () => {
  describe('success cases', () => {
    it('returns product stock with status 200 and correct shape', async () => {
      const now = new Date();
      await ProductModel.create({
        id: 'stock-prod-001',
        name: 'Mechanical Keyboard',
        description: 'Blue switch keyboard',
        purchasePrice: 250,
        stock: 30,
        createdAt: now,
        updatedAt: now,
      });

      const res = await request(app).get('/api/products/stock-prod-001/stock');

      expect(res.status).toBe(200);
      expect(res.body.productId).toBe('stock-prod-001');
      expect(res.body.stock).toBe(30);
    });

    it('returns zero stock correctly', async () => {
      const now = new Date();
      await ProductModel.create({
        id: 'stock-prod-zero',
        name: 'Sold Out Item',
        description: 'No stock left',
        purchasePrice: 50,
        stock: 0,
        createdAt: now,
        updatedAt: now,
      });

      const res = await request(app).get('/api/products/stock-prod-zero/stock');

      expect(res.status).toBe(200);
      expect(res.body.stock).toBe(0);
    });
  });

  describe('not found — 404', () => {
    it('returns 404 when product does not exist', async () => {
      const res = await request(app).get('/api/products/nonexistent-id/stock');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('end-to-end flow', () => {
    it('creates via POST then checks stock via GET with matching values', async () => {
      await request(app).post('/api/products').send({
        id: 'e2e-prod-001',
        name: '4K Monitor',
        description: 'Ultra HD display',
        purchasePrice: 1800,
        stock: 15,
      });

      const res = await request(app).get('/api/products/e2e-prod-001/stock');

      expect(res.status).toBe(200);
      expect(res.body.productId).toBe('e2e-prod-001');
      expect(res.body.stock).toBe(15);
    });
  });
});
