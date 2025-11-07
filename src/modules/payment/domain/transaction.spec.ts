import Id from '../../@shared/domain/value-object/id.value-object';
import Transaction from './transaction';

describe('Transaction Entity Unit Tests', () => {
  it('should create a transaction with all properties', () => {
    const transactionProps = {
      id: new Id('123'),
      amount: 100.5,
      orderId: 'order-123',
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const transaction = new Transaction(transactionProps);

    expect(transaction.id).toBe(transactionProps.id);
    expect(transaction.amount).toBe(transactionProps.amount);
    expect(transaction.orderId).toBe(transactionProps.orderId);
    expect(transaction.status).toBe(transactionProps.status);
  });

  it('should create a transaction without optional properties', () => {
    const transactionProps = {
      amount: 100.5,
      orderId: 'order-123',
      status: 'pending' as const,
    };

    const transaction = new Transaction(transactionProps);

    expect(transaction.id).toBeDefined();
    expect(transaction.amount).toBe(transactionProps.amount);
    expect(transaction.orderId).toBe(transactionProps.orderId);
    expect(transaction.status).toBe(transactionProps.status);
  });

  it('should approve a transaction', () => {
    const transaction = new Transaction({
      amount: 100,
      orderId: 'order-123',
      status: 'pending',
    });

    transaction.approve();

    expect(transaction.status).toBe('approved');
  });

  it('should decline a transaction', () => {
    const transaction = new Transaction({
      amount: 100,
      orderId: 'order-123',
      status: 'pending',
    });

    transaction.decline();

    expect(transaction.status).toBe('declined');
  });

  it('should process a transaction successfully with sufficient amount', () => {
    const transaction = new Transaction({
      amount: 100,
      orderId: 'order-123',
      status: 'pending',
    });

    transaction.process();

    expect(transaction.status).toBe('approved');
  });

  it('should decline a transaction with insufficient amount', () => {
    const transaction = new Transaction({
      amount: 50,
      orderId: 'order-123',
      status: 'pending',
    });

    transaction.process();

    expect(transaction.status).toBe('declined');
  });

  it('should validate transaction with valid amount', () => {
    expect(() => {
      new Transaction({
        amount: 100,
        orderId: 'order-123',
        status: 'pending',
      });
    }).not.toThrow();
  });

  it('should throw error when creating transaction with invalid amount', () => {
    expect(() => {
      new Transaction({
        amount: -10,
        orderId: 'order-123',
        status: 'pending',
      });
    }).toThrow('Amount must be greater than 0');
  });

  it('should throw error when creating transaction with zero amount', () => {
    expect(() => {
      new Transaction({
        amount: 0,
        orderId: 'order-123',
        status: 'pending',
      });
    }).toThrow('Amount must be greater than 0');
  });
});
