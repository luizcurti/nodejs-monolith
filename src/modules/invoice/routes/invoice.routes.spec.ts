import express from 'express';
import request from 'supertest';
import { Sequelize } from 'sequelize-typescript';
import { InvoiceModel, InvoiceItemModel } from '../repository/invoice.model';
import invoiceRouter from './invoice.routes';
import InvoiceFacadeFactory from '../factory/invoice.facade.factory';

// Isolated Express app — no dependency on main.ts
const app = express();
app.use(express.json());
app.use('/api/invoices', invoiceRouter);

let sequelize: Sequelize;

// ─── End-to-end data flow ──────────────────────────────────────────────────────
// POST /api/invoices
//   → invoiceRouter → InvoiceFacadeFactory.create()
//   → InvoiceFacade → GenerateInvoiceUseCase → InvoiceRepository → InvoiceModel (SQLite)
//
// GET /api/invoices/:id
//   → invoiceRouter → InvoiceFacadeFactory.create()
//   → InvoiceFacade → FindInvoiceUseCase → InvoiceRepository → InvoiceModel (SQLite)
// ──────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    sync: { force: true },
  });
  await sequelize.addModels([InvoiceModel, InvoiceItemModel]);
  await sequelize.sync();
});

afterEach(async () => {
  await sequelize.close();
  jest.restoreAllMocks();
});

describe('POST /api/invoices', () => {
  describe('success cases', () => {
    it('creates an invoice and returns 201 with correct shape', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'John Doe',
          document: '12345678900',
          address: '123 Main St',
          items: [
            { name: 'Product A', price: 50 },
            { name: 'Product B', price: 100 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('string');
      expect(res.body.name).toBe('John Doe');
      expect(res.body.document).toBe('12345678900');
      expect(res.body.address).toBe('123 Main St');
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(150);
      expect(res.body).toHaveProperty('createdAt');
    });

    it('accepts optional id and uses it', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          id: 'inv-custom-001',
          name: 'Custom ID Invoice',
          document: '99999999999',
          address: '99 Custom Street',
          items: [{ name: 'Item', price: 200 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('inv-custom-001');
    });

    it('generates a uuid when id is not provided', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Auto ID Invoice',
          document: '11111111111',
          address: '1 Auto Street',
          items: [{ name: 'Widget', price: 99.9 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.id).toHaveLength(36);
    });

    it('each item in response has id, name and price with correct types', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Shape Test',
          document: '22222222222',
          address: '2 Shape Street',
          items: [{ name: 'Widget', price: 75.5 }],
        });

      expect(res.status).toBe(201);
      const item = res.body.items[0];
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');
      expect(item.name).toBe('Widget');
      expect(item.price).toBe(75.5);
    });

    it('calculates total correctly for multiple items', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Total Test',
          document: '33333333333',
          address: '3 Total Avenue',
          items: [
            { name: 'Item A', price: 10.5 },
            { name: 'Item B', price: 20 },
            { name: 'Item C', price: 0.5 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.total).toBeCloseTo(31);
    });

    it('persists invoice and items to the database', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'DB Test Invoice',
          document: '44444444444',
          address: '4 DB Road',
          items: [{ name: 'Stored Item', price: 300 }],
        });

      expect(res.status).toBe(201);

      const invoice = await InvoiceModel.findOne({
        where: { id: res.body.id },
        include: [InvoiceItemModel],
      });
      expect(invoice).not.toBeNull();
      expect(invoice.name).toBe('DB Test Invoice');
      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0].name).toBe('Stored Item');
      expect(invoice.items[0].price).toBe(300);
    });
  });

  describe('missing required fields — 400', () => {
    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          document: '12345678900',
          address: 'Street',
          items: [{ name: 'Item', price: 10 }],
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when document is missing', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Name',
          address: 'Street',
          items: [{ name: 'Item', price: 10 }],
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when address is missing', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Name',
          document: '123',
          items: [{ name: 'Item', price: 10 }],
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when items is missing', async () => {
      const res = await request(app).post('/api/invoices').send({
        name: 'Name',
        document: '123',
        address: 'Street',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when items array is empty', async () => {
      const res = await request(app).post('/api/invoices').send({
        name: 'Name',
        document: '123',
        address: 'Street',
        items: [],
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/invoices').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('invalid item values — 400', () => {
    it('returns 400 when item price is zero', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Name',
          document: '123',
          address: 'Street',
          items: [{ name: 'Item', price: 0 }],
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when item price is negative', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Name',
          document: '123',
          address: 'Street',
          items: [{ name: 'Item', price: -10 }],
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when item name is missing', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Name',
          document: '123',
          address: 'Street',
          items: [{ price: 50 }],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('error handling', () => {
    it('returns 500 when facade throws an Error', async () => {
      jest.spyOn(InvoiceFacadeFactory, 'create').mockReturnValue({
        generate: jest.fn().mockRejectedValue(new Error('DB error')),
        find: jest.fn(),
      } as any);

      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Name',
          document: '123',
          address: 'Street',
          items: [{ name: 'Item', price: 10 }],
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB error');
    });

    it('returns 500 with generic message when facade throws a non-Error value', async () => {
      jest.spyOn(InvoiceFacadeFactory, 'create').mockReturnValue({
        generate: jest.fn().mockRejectedValue('unexpected'),
        find: jest.fn(),
      } as any);

      const res = await request(app)
        .post('/api/invoices')
        .send({
          name: 'Name',
          document: '123',
          address: 'Street',
          items: [{ name: 'Item', price: 10 }],
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});

describe('GET /api/invoices/:id', () => {
  const createInvoice = async () => {
    const res = await request(app)
      .post('/api/invoices')
      .send({
        name: 'Created Invoice',
        document: '11111111111',
        address: '1 Street Ave',
        items: [
          { name: 'Item A', price: 100 },
          { name: 'Item B', price: 200 },
        ],
      });
    return res.body;
  };

  describe('success cases', () => {
    it('returns the invoice with status 200 and correct shape', async () => {
      const created = await createInvoice();

      const res = await request(app).get(`/api/invoices/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.name).toBe('Created Invoice');
      expect(res.body.document).toBe('11111111111');
      expect(res.body.address).toBe('1 Street Ave');
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(300);
      expect(res.body).toHaveProperty('createdAt');
    });

    it('returns correct types for all fields', async () => {
      const created = await createInvoice();

      const res = await request(app).get(`/api/invoices/${created.id}`);

      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.name).toBe('string');
      expect(typeof res.body.document).toBe('string');
      expect(typeof res.body.address).toBe('string');
      expect(typeof res.body.total).toBe('number');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('returns items with correct id, name and price', async () => {
      const created = await createInvoice();

      const res = await request(app).get(`/api/invoices/${created.id}`);

      for (const item of res.body.items) {
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.price).toBe('number');
      }
    });

    it('end-to-end: POST then GET returns same data', async () => {
      const created = await createInvoice();

      const res = await request(app).get(`/api/invoices/${created.id}`);

      expect(res.body.id).toBe(created.id);
      expect(res.body.total).toBe(created.total);
      expect(res.body.items).toHaveLength(created.items.length);
    });
  });

  describe('not found — 404', () => {
    it('returns 404 when invoice does not exist', async () => {
      const res = await request(app).get('/api/invoices/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/not found/i);
    });

    it('returns 404 even when other invoices exist', async () => {
      await createInvoice();

      const res = await request(app).get('/api/invoices/wrong-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('error handling', () => {
    it('returns 500 when facade throws a non-not-found Error', async () => {
      jest.spyOn(InvoiceFacadeFactory, 'create').mockReturnValue({
        generate: jest.fn(),
        find: jest.fn().mockRejectedValue(new Error('DB crash')),
      } as any);

      const res = await request(app).get('/api/invoices/some-id');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB crash');
    });

    it('returns 500 with generic message when facade throws a non-Error value', async () => {
      jest.spyOn(InvoiceFacadeFactory, 'create').mockReturnValue({
        generate: jest.fn(),
        find: jest.fn().mockRejectedValue('unexpected'),
      } as any);

      const res = await request(app).get('/api/invoices/some-id');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});
