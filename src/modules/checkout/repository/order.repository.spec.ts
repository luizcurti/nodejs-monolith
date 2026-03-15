import { Sequelize } from 'sequelize-typescript';
import Id from '../../@shared/domain/value-object/id.value-object';
import Order from '../domain/order.entity';
import OrderModel from './order.model';
import OrderRepository from './order.repository';

const makeOrder = (overrides: Partial<ConstructorParameters<typeof Order>[0]> = {}) =>
  new Order({
    id: new Id('order-1'),
    clientId: 'client-1',
    items: [{ id: 'prod-1', name: 'Product A', salesPrice: 150 }],
    status: 'approved',
    invoiceId: 'invoice-1',
    transactionId: 'txn-1',
    ...overrides,
  });

describe('OrderRepository integration test', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([OrderModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('should save an order', async () => {
    const order = makeOrder();
    const repository = new OrderRepository();

    const result = await repository.addOrder(order);

    expect(result.id.id).toBe('order-1');
    expect(result.clientId).toBe('client-1');
    expect(result.status).toBe('approved');
    expect(result.invoiceId).toBe('invoice-1');
    expect(result.transactionId).toBe('txn-1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Product A');
  });

  it('should find an order by id', async () => {
    const order = makeOrder();
    const repository = new OrderRepository();
    await repository.addOrder(order);

    const found = await repository.findOrder('order-1');

    expect(found.id.id).toBe('order-1');
    expect(found.clientId).toBe('client-1');
    expect(found.status).toBe('approved');
    expect(found.invoiceId).toBe('invoice-1');
    expect(found.transactionId).toBe('txn-1');
    expect(found.items).toHaveLength(1);
    expect(found.items[0].salesPrice).toBe(150);
  });

  it('should save an order with null invoiceId and transactionId', async () => {
    const order = makeOrder({ status: 'declined', invoiceId: null, transactionId: null });
    const repository = new OrderRepository();
    const result = await repository.addOrder(order);

    const found = await repository.findOrder(result.id.id);
    expect(found.invoiceId).toBeNull();
    expect(found.transactionId).toBeNull();
  });

  it('should throw when order is not found', async () => {
    const repository = new OrderRepository();
    await expect(repository.findOrder('nonexistent-id')).rejects.toThrow('Order not found');
  });
});
