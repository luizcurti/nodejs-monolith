import express from 'express';
import request from 'supertest';
import { Sequelize } from 'sequelize-typescript';
import { ClientModel } from '../repository/client.model';
import clientAdmRouter from './client-adm.routes';
import ClientAdmFacadeFactory from '../factory/client-adm.facade.factory';

// Isolated Express app — no dependency on main.ts
const app = express();
app.use(express.json());
app.use('/api/clients', clientAdmRouter);

let sequelize: Sequelize;

// ─── End-to-end data flow ──────────────────────────────────────────────────────
// POST /api/clients
//   → clientAdmRouter → ClientAdmFacadeFactory.create()
//   → ClientAdmFacade → AddClientUseCase → ClientRepository → ClientModel (SQLite)
//
// GET /api/clients/:id
//   → clientAdmRouter → ClientAdmFacadeFactory.create()
//   → ClientAdmFacade → FindClientUseCase → ClientRepository → ClientModel (SQLite)
// ──────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    sync: { force: true },
  });
  await sequelize.addModels([ClientModel]);
  await sequelize.sync();
});

afterEach(async () => {
  await sequelize.close();
  jest.restoreAllMocks();
});

describe('POST /api/clients', () => {
  describe('success cases', () => {
    it('creates a client with all required fields and returns 201', async () => {
      const res = await request(app).post('/api/clients').send({
        name: 'Maria Silva',
        email: 'maria@example.com',
        address: '42 Flower Street',
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: 'Client created successfully' });
    });

    it('accepts optional id and persists it to the database', async () => {
      const res = await request(app).post('/api/clients').send({
        id: 'custom-uuid-001',
        name: 'John Santos',
        email: 'john@example.com',
        address: '100 Brazil Ave',
      });

      expect(res.status).toBe(201);

      const found = await ClientModel.findOne({
        where: { id: 'custom-uuid-001' },
      });
      expect(found).not.toBeNull();
      expect(found.name).toBe('John Santos');
      expect(found.email).toBe('john@example.com');
      expect(found.address).toBe('100 Brazil Ave');
    });

    it('generates a uuid when id is not provided', async () => {
      await request(app).post('/api/clients').send({
        name: 'Auto ID',
        email: 'auto@example.com',
        address: '1 Main Road',
      });

      const found = await ClientModel.findOne({
        where: { email: 'auto@example.com' },
      });
      expect(found).not.toBeNull();
      expect(found.id).toBeDefined();
      expect(found.id).toHaveLength(36); // uuid v4 format
    });
  });

  describe('missing required fields — 400', () => {
    it('returns 400 when name is missing', async () => {
      const res = await request(app).post('/api/clients').send({
        email: 'no-name@example.com',
        address: 'Street X',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/name/i);
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/clients').send({
        name: 'No Email',
        address: 'Street Y',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when address is missing', async () => {
      const res = await request(app).post('/api/clients').send({
        name: 'No Address',
        email: 'no@address.com',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app).post('/api/clients').send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('invalid field types — 400', () => {
    it('returns 400 when name is a number', async () => {
      const res = await request(app).post('/api/clients').send({
        name: 123,
        email: 'test@example.com',
        address: 'Street Z',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    it('returns 400 when email is a number', async () => {
      const res = await request(app).post('/api/clients').send({
        name: 'Valid Name',
        email: 456,
        address: 'Street Z',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    it('returns 400 when address is a boolean', async () => {
      const res = await request(app).post('/api/clients').send({
        name: 'Valid Name',
        email: 'test@example.com',
        address: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/string/i);
    });

    it('returns 400 when all fields are wrong types', async () => {
      const res = await request(app).post('/api/clients').send({
        name: 1,
        email: 2,
        address: 3,
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});

describe('GET /api/clients/:id', () => {
  describe('success cases', () => {
    it('returns an existing client with status 200 and correct shape', async () => {
      const now = new Date();
      await ClientModel.create({
        id: 'test-id-001',
        name: 'Ana Costa',
        email: 'ana@example.com',
        address: '7 Green Street',
        createdAt: now,
        updatedAt: now,
      });

      const res = await request(app).get('/api/clients/test-id-001');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('test-id-001');
      expect(res.body.name).toBe('Ana Costa');
      expect(res.body.email).toBe('ana@example.com');
      expect(res.body.address).toBe('7 Green Street');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
    });
  });

  describe('not found — 404', () => {
    it('returns 404 when client does not exist', async () => {
      const res = await request(app).get('/api/clients/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('end-to-end flow', () => {
    it('creates via POST then retrieves via GET with correct data', async () => {
      await request(app).post('/api/clients').send({
        id: 'e2e-client-001',
        name: 'Lucas Lima',
        email: 'lucas@example.com',
        address: '500 Central Ave',
      });

      const res = await request(app).get('/api/clients/e2e-client-001');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('e2e-client-001');
      expect(res.body.name).toBe('Lucas Lima');
      expect(res.body.email).toBe('lucas@example.com');
      expect(res.body.address).toBe('500 Central Ave');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
    });
  });
});

describe('error handling — POST /api/clients', () => {
  it('returns 500 with error message when facade throws an Error', async () => {
    jest.spyOn(ClientAdmFacadeFactory, 'create').mockReturnValue({
      add: jest.fn().mockRejectedValue(new Error('DB connection failed')),
      find: jest.fn(),
    } as any);

    const res = await request(app).post('/api/clients').send({
      name: 'Test',
      email: 'test@example.com',
      address: 'Street 1',
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB connection failed');
  });

  it('returns 500 with generic message when facade throws a non-Error value', async () => {
    jest.spyOn(ClientAdmFacadeFactory, 'create').mockReturnValue({
      add: jest.fn().mockRejectedValue('unexpected string error'),
      find: jest.fn(),
    } as any);

    const res = await request(app).post('/api/clients').send({
      name: 'Test',
      email: 'test@example.com',
      address: 'Street 1',
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});

describe('error handling — GET /api/clients/:id', () => {
  it('returns 500 with error message when facade throws a non-not-found Error', async () => {
    jest.spyOn(ClientAdmFacadeFactory, 'create').mockReturnValue({
      add: jest.fn(),
      find: jest.fn().mockRejectedValue(new Error('DB timeout')),
    } as any);

    const res = await request(app).get('/api/clients/any-id');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB timeout');
  });

  it('returns 500 with generic message when facade throws a non-Error value', async () => {
    jest.spyOn(ClientAdmFacadeFactory, 'create').mockReturnValue({
      add: jest.fn(),
      find: jest.fn().mockRejectedValue({ code: 503 }),
    } as any);

    const res = await request(app).get('/api/clients/any-id');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
