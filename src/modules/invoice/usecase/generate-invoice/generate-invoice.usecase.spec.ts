import Invoice from '../../domain/invoice.entity';
import InvoiceItem from '../../domain/invoice-item.entity';
import Id from '../../../@shared/domain/value-object/id.value-object';
import GenerateInvoiceUseCase from './generate-invoice.usecase';

const item1 = new InvoiceItem({
  id: new Id('item-1'),
  name: 'Product A',
  price: 50,
});

const item2 = new InvoiceItem({
  id: new Id('item-2'),
  name: 'Product B',
  price: 75,
});

const mockInvoice = new Invoice({
  id: new Id('invoice-1'),
  name: 'John Doe',
  document: '123.456.789-00',
  address: '123 Main St',
  items: [item1, item2],
});

const MockRepository = () => ({
  generate: jest.fn().mockResolvedValue(mockInvoice),
  find: jest.fn(),
});

describe('GenerateInvoiceUseCase unit test', () => {
  it('should generate an invoice with provided ids', async () => {
    const repository = MockRepository();
    const usecase = new GenerateInvoiceUseCase(repository);

    const result = await usecase.execute({
      id: 'invoice-1',
      name: 'John Doe',
      document: '123.456.789-00',
      address: '123 Main St',
      items: [
        { id: 'item-1', name: 'Product A', price: 50 },
        { id: 'item-2', name: 'Product B', price: 75 },
      ],
    });

    expect(repository.generate).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('invoice-1');
    expect(result.name).toBe('John Doe');
    expect(result.document).toBe('123.456.789-00');
    expect(result.address).toBe('123 Main St');
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({ id: 'item-1', name: 'Product A', price: 50 });
    expect(result.items[1]).toEqual({ id: 'item-2', name: 'Product B', price: 75 });
    expect(result.total).toBe(125);
  });

  it('should generate an invoice without providing ids (auto-generated)', async () => {
    const repository = MockRepository();
    const usecase = new GenerateInvoiceUseCase(repository);

    await usecase.execute({
      name: 'Jane Doe',
      document: '987.654.321-00',
      address: '456 Elm St',
      items: [
        { name: 'Product C', price: 30 },
        { name: 'Product D', price: 20 },
      ],
    });

    expect(repository.generate).toHaveBeenCalledTimes(1);
    const invoiceArg = repository.generate.mock.calls[0][0] as Invoice;
    expect(invoiceArg.id).toBeDefined();
    expect(invoiceArg.items[0].id).toBeDefined();
    expect(invoiceArg.items[1].id).toBeDefined();
  });

  it('should return createdAt from the saved invoice', async () => {
    const repository = MockRepository();
    const usecase = new GenerateInvoiceUseCase(repository);

    const result = await usecase.execute({
      id: 'invoice-1',
      name: 'John Doe',
      document: '123.456.789-00',
      address: '123 Main St',
      items: [{ id: 'item-1', name: 'Product A', price: 50 }],
    });

    expect(result.createdAt).toBe(mockInvoice.createdAt);
  });
});
