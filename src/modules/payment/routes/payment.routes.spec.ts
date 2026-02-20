import express from 'express';
import request from 'supertest';
import { Sequelize } from 'sequelize-typescript';
import TransactionModel from '../repository/transaction.model';
import paymentRouter from './payment.routes';

// Isolated Express app — no dependency on main.ts
const app = express();
app.use(express.json());
app.use('/api/payments', paymentRouter);

let sequelize: Sequelize;

// ─── End-to-end data flow ──────────────────────────────────────────────────────
// POST /api/payments
//   → paymentRouter → PaymentFacadeFactory.create()
//   → PaymentFacade → ProcessPaymentUseCase → Transaction (domain)
//   → Transaction.process(): amount >= 100 → approved | 0 < amount < 100 → declined
//   → TransactionRepository.save() → TransactionModel (SQLite)
// ──────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    sync: { force: true },
  });
  await sequelize.addModels([TransactionModel]);
  await sequelize.sync();
});

afterEach(async () => {
  await sequelize.close();
});

describe('POST /api/payments', () => {
  describe('missing required fields — 400', () => {
    it('returns 400 when orderId is missing', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ amount: 150 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/orderId/i);
    });

    it('returns 400 when amount is missing', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-001' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/payments').send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('invalid amount type or range — 400', () => {
    it('returns 400 when amount is zero', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-001', amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
    });

    it('returns 400 when amount is negative', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-001', amount: -50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
    });

    it('returns 400 when amount is a string', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-001', amount: 'hundred' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/number/i);
    });

    it('returns 400 when amount is a boolean', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-001', amount: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/number/i);
    });
  });

  describe('business rule: Transaction.process() — amount threshold', () => {
    // domain rule: amount >= 100 → approved (HTTP 200)
    //              0 < amount < 100 → declined (HTTP 422)

    it('approves a transaction with amount exactly 100 and returns 200', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-100', amount: 100 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.orderId).toBe('order-100');
      expect(res.body.amount).toBe(100);
      expect(typeof res.body.transactionId).toBe('string');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
    });

    it('approves a transaction with amount above 100 and returns 200', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-high', amount: 999.99 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.amount).toBe(999.99);
    });

    it('declines a transaction with amount below 100 and returns 422', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-50', amount: 50 });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('declined');
      expect(res.body.orderId).toBe('order-50');
      expect(res.body.amount).toBe(50);
    });

    it('declines a transaction with amount of 0.01 and returns 422', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-cent', amount: 0.01 });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('declined');
    });

    it('declines a transaction with amount of 99.99 and returns 422', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-99', amount: 99.99 });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe('declined');
    });
  });

  describe('response shape', () => {
    it('approved response contains all required fields with correct types', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-shape', amount: 150 });

      expect(res.status).toBe(200);
      expect(typeof res.body.transactionId).toBe('string');
      expect(typeof res.body.orderId).toBe('string');
      expect(typeof res.body.amount).toBe('number');
      expect(typeof res.body.status).toBe('string');
      expect(typeof res.body.createdAt).toBe('string');
      expect(typeof res.body.updatedAt).toBe('string');
    });

    it('declined response contains all required fields with correct types', async () => {
      const res = await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-shape-declined', amount: 30 });

      expect(res.status).toBe(422);
      expect(typeof res.body.transactionId).toBe('string');
      expect(typeof res.body.orderId).toBe('string');
      expect(typeof res.body.amount).toBe('number');
      expect(typeof res.body.status).toBe('string');
    });
  });

  describe('database persistence', () => {
    it('persists an approved transaction to the database', async () => {
      await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-persist-ok', amount: 200 });

      const saved = await TransactionModel.findOne({
        where: { orderId: 'order-persist-ok' },
      });
      expect(saved).not.toBeNull();
      expect(saved.status).toBe('approved');
      expect(saved.amount).toBe(200);
      expect(saved.orderId).toBe('order-persist-ok');
    });

    it('persists a declined transaction to the database', async () => {
      await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-persist-fail', amount: 75 });

      const saved = await TransactionModel.findOne({
        where: { orderId: 'order-persist-fail' },
      });
      expect(saved).not.toBeNull();
      expect(saved.status).toBe('declined');
      expect(saved.amount).toBe(75);
    });

    it('each payment creates a unique transaction record', async () => {
      await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-dup-1', amount: 100 });
      await request(app)
        .post('/api/payments')
        .send({ orderId: 'order-dup-2', amount: 100 });

      const count = await TransactionModel.count();
      expect(count).toBe(2);
    });
  });
});
