import Id from '../../@shared/domain/value-object/id.value-object';
import Product from './product.entity';

describe('Product Entity Unit Tests', () => {
  it('should create a product with all properties', () => {
    const productProps = {
      id: new Id('123'),
      name: 'Test Product',
      description: 'Test Description',
      purchasePrice: 100.5,
      stock: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product = new Product(productProps);

    expect(product.id).toEqual(productProps.id);
    expect(product.name).toBe(productProps.name);
    expect(product.description).toBe(productProps.description);
    expect(product.purchasePrice).toBe(productProps.purchasePrice);
    expect(product.stock).toBe(productProps.stock);
  });

  it('should create a product without optional properties', () => {
    const productProps = {
      name: 'Test Product',
      description: 'Test Description',
      purchasePrice: 100.5,
      stock: 25,
    };

    const product = new Product(productProps);

    expect(product.id).toBeDefined();
    expect(product.name).toBe(productProps.name);
    expect(product.description).toBe(productProps.description);
    expect(product.purchasePrice).toBe(productProps.purchasePrice);
    expect(product.stock).toBe(productProps.stock);
  });

  it('should update name using setter', () => {
    const product = new Product({
      name: 'Original Name',
      description: 'Test Description',
      purchasePrice: 100,
      stock: 10,
    });

    expect(product.name).toBe('Original Name');

    product.name = 'Updated Name';

    expect(product.name).toBe('Updated Name');
  });

  it('should update description using setter', () => {
    const product = new Product({
      name: 'Test Product',
      description: 'Original Description',
      purchasePrice: 100,
      stock: 10,
    });

    expect(product.description).toBe('Original Description');

    product.description = 'Updated Description';

    expect(product.description).toBe('Updated Description');
  });

  it('should update purchasePrice using setter', () => {
    const product = new Product({
      name: 'Test Product',
      description: 'Test Description',
      purchasePrice: 100,
      stock: 10,
    });

    expect(product.purchasePrice).toBe(100);

    product.purchasePrice = 150.75;

    expect(product.purchasePrice).toBe(150.75);
  });

  it('should update stock using setter', () => {
    const product = new Product({
      name: 'Test Product',
      description: 'Test Description',
      purchasePrice: 100,
      stock: 10,
    });

    expect(product.stock).toBe(10);

    product.stock = 25;

    expect(product.stock).toBe(25);
  });
});
