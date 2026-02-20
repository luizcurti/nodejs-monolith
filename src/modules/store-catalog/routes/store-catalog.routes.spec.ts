import express from 'express';
import request from 'supertest';
import { Sequelize } from 'sequelize-typescript';
import ProductModel from '../repository/product.model';
import storeCatalogRouter from './store-catalog.routes';

// Isolated Express app — no dependency on main.ts
const app = express();
app.use(express.json());
app.use('/api/catalog/products', storeCatalogRouter);

let sequelize: Sequelize;

// ─── End-to-end data flow ──────────────────────────────────────────────────────
// GET /api/catalog/products
//   → storeCatalogRouter → StoreCatalogFacadeFactory.create()
//   → StoreCatalogFacade → FindAllProductsUsecase → ProductRepository → ProductModel (SQLite)
//
// GET /api/catalog/products/:id
//   → storeCatalogRouter → StoreCatalogFacadeFactory.create()
//   → StoreCatalogFacade → FindProductUseCase → ProductRepository → ProductModel (SQLite)
// ──────────────────────────────────────────────────────────────────────────────

const seedProducts = async () => {
  await ProductModel.bulkCreate([
    {
      id: 'cat-prod-001',
      name: 'Gaming Chair',
      description: 'Ergonomic gaming chair',
      salesPrice: 899.9,
    },
    {
      id: 'cat-prod-002',
      name: 'L-Shaped Desk',
      description: 'Wide corner desk',
      salesPrice: 1200,
    },
  ]);
};

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

describe('GET /api/catalog/products', () => {
  describe('success cases', () => {
    it('returns an empty products array when no products exist', async () => {
      const res = await request(app).get('/api/catalog/products');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('products');
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products).toHaveLength(0);
    });

    it('returns all products with status 200', async () => {
      await seedProducts();

      const res = await request(app).get('/api/catalog/products');

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(2);
    });

    it('each product in the list has the correct shape', async () => {
      await seedProducts();

      const res = await request(app).get('/api/catalog/products');

      for (const product of res.body.products) {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('salesPrice');
        expect(typeof product.id).toBe('string');
        expect(typeof product.name).toBe('string');
        expect(typeof product.description).toBe('string');
        expect(typeof product.salesPrice).toBe('number');
      }
    });

    it('returns correct data for each product', async () => {
      await seedProducts();

      const res = await request(app).get('/api/catalog/products');

      const names = res.body.products.map((p: { name: string }) => p.name);
      expect(names).toContain('Gaming Chair');
      expect(names).toContain('L-Shaped Desk');

      const chair = res.body.products.find(
        (p: { name: string }) => p.name === 'Gaming Chair'
      );
      expect(chair.id).toBe('cat-prod-001');
      expect(chair.salesPrice).toBe(899.9);
    });
  });
});

describe('GET /api/catalog/products/:id', () => {
  describe('success cases', () => {
    it('returns the product with status 200 and correct shape', async () => {
      await seedProducts();

      const res = await request(app).get('/api/catalog/products/cat-prod-001');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('cat-prod-001');
      expect(res.body.name).toBe('Gaming Chair');
      expect(res.body.description).toBe('Ergonomic gaming chair');
      expect(res.body.salesPrice).toBe(899.9);
    });

    it('returns correct types for all fields', async () => {
      await seedProducts();

      const res = await request(app).get('/api/catalog/products/cat-prod-001');

      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.name).toBe('string');
      expect(typeof res.body.description).toBe('string');
      expect(typeof res.body.salesPrice).toBe('number');
    });

    it('returns the correct product when multiple products exist', async () => {
      await seedProducts();

      const res = await request(app).get('/api/catalog/products/cat-prod-002');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('cat-prod-002');
      expect(res.body.name).toBe('L-Shaped Desk');
      expect(res.body.salesPrice).toBe(1200);
    });
  });

  describe('not found — 404', () => {
    it('returns 404 when product does not exist', async () => {
      const res = await request(app).get(
        '/api/catalog/products/nonexistent-id'
      );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/not found/i);
    });

    it('returns 404 even when other products exist', async () => {
      await seedProducts();

      const res = await request(app).get('/api/catalog/products/wrong-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });
});
