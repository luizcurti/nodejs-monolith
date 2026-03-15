import express from 'express';
import request from 'supertest';
import { Sequelize } from 'sequelize-typescript';
import { ClientModel } from '../../client-adm/repository/client.model';
import { ProductModel as ProductAdmModel } from '../../product-adm/repository/product.model';
import CatalogProductModel from '../../store-catalog/repository/product.model';
import TransactionModel from '../../payment/repository/transaction.model';
import {
  InvoiceModel,
  InvoiceItemModel,
} from '../../invoice/repository/invoice.model';
import OrderModel from '../repository/order.model';
import checkoutRouter from './checkout.routes';
import CheckoutFacadeFactory from '../factory/checkout.facade.factory';

// Isolated Express app — no dependency on main.ts
const app = express();
app.use(express.json());
app.use('/api/checkout', checkoutRouter);

let sequelize: Sequelize;

// ─── End-to-end data flow ──────────────────────────────────────────────────────
// POST /api/checkout
//   → checkoutRouter → CheckoutFacadeFactory.create()
//   → CheckoutFacade → PlaceOrderUseCase
//       → ClientAdmFacade  → ClientRepository  → ClientModel  (SQLite)
//       → ProductAdmFacade → ProductRepository → ProductAdmModel (SQLite)
//       → CatalogFacade    → ProductRepository → CatalogProductModel (SQLite)
//       → PaymentFacade    → TransactionRepository → TransactionModel (SQLite)
//       → InvoiceFacade    → InvoiceRepository → InvoiceModel (SQLite)
//       → OrderRepository  → OrderModel (SQLite)
// ──────────────────────────────────────────────────────────────────────────────

// Note: ProductAdmModel and CatalogProductModel both target the 'products' table.
// After sync the last-registered model's schema wins; we patch missing columns via ALTER TABLE.
const patchProductsTable = async (seq: Sequelize) => {
  for (const sql of [
    'ALTER TABLE "products" ADD COLUMN "salesPrice" REAL DEFAULT 0',
    'ALTER TABLE "products" ADD COLUMN "purchasePrice" REAL DEFAULT 0',
    'ALTER TABLE "products" ADD COLUMN "stock" INTEGER DEFAULT 0',
    `ALTER TABLE "products" ADD COLUMN "createdAt" TEXT DEFAULT ''`,
    `ALTER TABLE "products" ADD COLUMN "updatedAt" TEXT DEFAULT ''`,
  ]) {
    try {
      await seq.query(sql);
    } catch {
      // column already exists — ignore
    }
  }
};

const seedClient = async (id = 'client-001') => {
  const now = new Date();
  await ClientModel.create({
    id,
    name: 'Ana Costa',
    email: 'ana@example.com',
    address: '7 Green Street',
    createdAt: now,
    updatedAt: now,
  });
};

const seedProduct = async (
  id: string,
  name: string,
  salesPrice: number,
  stock: number
) => {
  const now = new Date().toISOString();
  await sequelize.query(
    `INSERT INTO "products" (id, name, description, "purchasePrice", "salesPrice", stock, "createdAt", "updatedAt")
     VALUES (:id, :name, 'A test product', :price, :price, :stock, :now, :now)`,
    { replacements: { id, name, price: salesPrice, stock, now } }
  );
};

beforeEach(async () => {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    sync: { force: true },
  });
  await sequelize.addModels([
    ClientModel,
    ProductAdmModel,
    CatalogProductModel,
    TransactionModel,
    InvoiceModel,
    InvoiceItemModel,
    OrderModel,
  ]);
  await sequelize.sync();
  await patchProductsTable(sequelize);
});

afterEach(async () => {
  await sequelize.close();
  jest.restoreAllMocks();
});

describe('POST /api/checkout', () => {
  describe('validation — 400', () => {
    it('returns 400 when clientId is missing', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .send({ products: [{ productId: 'prod-001' }] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when products array is missing', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .send({ clientId: 'client-001' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when products array is empty', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .send({ clientId: 'client-001', products: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/checkout').send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when productId is missing inside products array', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .send({ clientId: 'client-001', products: [{}] });

      expect(res.status).toBe(400);
    });
  });

  describe('business errors — 422', () => {
    it('returns 422 when client is not found', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'nonexistent-client',
          products: [{ productId: 'prod-001' }],
        });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 422 when product is out of stock', async () => {
      await seedClient();
      await seedProduct('prod-out', 'Out of Stock Product', 200, 0);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-out' }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error).toMatch(/out of stock/i);
    });

    it('returns 422 when product is not found', async () => {
      await seedClient();

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'nonexistent-product' }],
        });

      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('business rule: approved order (total >= 100)', () => {
    it('returns 200 with status approved when total >= 100', async () => {
      await seedClient();
      await seedProduct('prod-expensive', 'Expensive Product', 150, 10);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-expensive' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
    });

    it('approved response contains all required fields with correct types', async () => {
      await seedClient();
      await seedProduct('prod-full-shape', 'Full Shape Product', 200, 5);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-full-shape' }],
        });

      expect(res.status).toBe(200);
      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.status).toBe('string');
      expect(typeof res.body.total).toBe('number');
      expect(res.body.invoiceId).not.toBeNull();
      expect(res.body.transactionId).not.toBeNull();
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('total matches the sum of product salesPrices', async () => {
      await seedClient();
      await seedProduct('prod-p1', 'Product 1', 120, 5);
      await seedProduct('prod-p2', 'Product 2', 80, 5);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-p1' }, { productId: 'prod-p2' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(200);
    });

    it('persists approved order to the database', async () => {
      await seedClient();
      await seedProduct('prod-db', 'DB Product', 200, 3);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-db' }],
        });

      expect(res.status).toBe(200);

      const order = await OrderModel.findOne({ where: { id: res.body.id } });
      expect(order).not.toBeNull();
      expect(order.status).toBe('approved');
      expect(order.clientId).toBe('client-001');
    });

    it('generates an invoice for approved orders', async () => {
      await seedClient();
      await seedProduct('prod-inv', 'Invoice Product', 300, 2);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-inv' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.invoiceId).not.toBeNull();

      const invoice = await InvoiceModel.findOne({
        where: { id: res.body.invoiceId },
        include: [InvoiceItemModel],
      });
      expect(invoice).not.toBeNull();
      expect(invoice.name).toBe('Ana Costa');
      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0].name).toBe('Invoice Product');
    });
  });

  describe('business rule: declined order (total < 100)', () => {
    it('returns 422 with status declined when total < 100', async () => {
      await seedClient();
      await seedProduct('prod-cheap', 'Cheap Product', 50, 5);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-cheap' }],
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('declined');
    });

    it('declined order has null invoiceId', async () => {
      await seedClient();
      await seedProduct('prod-cheap-2', 'Cheap Product 2', 99, 5);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-cheap-2' }],
        });

      expect(res.body.invoiceId).toBeNull();
    });

    it('persists declined order to the database', async () => {
      await seedClient();
      await seedProduct('prod-cheap-3', 'Cheap Product 3', 10, 5);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-cheap-3' }],
        });

      const order = await OrderModel.findOne({ where: { id: res.body.id } });
      expect(order).not.toBeNull();
      expect(order.status).toBe('declined');
      expect(order.invoiceId).toBeNull();
    });
  });

  describe('error handling', () => {
    it('returns 500 when facade throws an unexpected Error', async () => {
      jest.spyOn(CheckoutFacadeFactory, 'create').mockReturnValue({
        placeOrder: jest.fn().mockRejectedValue(new Error('DB crash')),
      } as any);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-001' }],
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB crash');
    });

    it('returns 500 with generic message when facade throws a non-Error value', async () => {
      jest.spyOn(CheckoutFacadeFactory, 'create').mockReturnValue({
        placeOrder: jest.fn().mockRejectedValue('unexpected'),
      } as any);

      const res = await request(app)
        .post('/api/checkout')
        .send({
          clientId: 'client-001',
          products: [{ productId: 'prod-001' }],
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});
