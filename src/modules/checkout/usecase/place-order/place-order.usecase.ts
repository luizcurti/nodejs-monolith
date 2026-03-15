import ClientAdmFacadeInterface from '../../../client-adm/facade/client-adm.facade.interface';
import InvoiceFacadeInterface from '../../../invoice/facade/invoice.facade.interface';
import PaymentFacadeInterface from '../../../payment/facade/facade.interface';
import ProductAdmFacadeInterface from '../../../product-adm/facade/product-adm.facade.interface';
import StoreCatalogFacadeInterface from '../../../store-catalog/facade/store-catalog.facade.interface';
import Order from '../../domain/order.entity';
import CheckoutGateway from '../../gateway/checkout.gateway';
import { PlaceOrderInputDto, PlaceOrderOutputDto } from './place-order.dto';

export default class PlaceOrderUseCase {
  constructor(
    private readonly clientFacade: ClientAdmFacadeInterface,
    private readonly productFacade: ProductAdmFacadeInterface,
    private readonly catalogFacade: StoreCatalogFacadeInterface,
    private readonly paymentFacade: PaymentFacadeInterface,
    private readonly invoiceFacade: InvoiceFacadeInterface,
    private readonly orderRepository: CheckoutGateway
  ) {}

  async execute(input: PlaceOrderInputDto): Promise<PlaceOrderOutputDto> {
    // 1. Validate client exists
    const client = await this.clientFacade.find({ id: input.clientId });

    // 2. Validate stock and retrieve catalog data for each product
    const orderItems = await Promise.all(
      input.products.map(async ({ productId }) => {
        const { stock } = await this.productFacade.checkStock({ productId });
        if (stock <= 0) {
          throw new Error(`Product ${productId} is out of stock`);
        }
        const product = await this.catalogFacade.find({ id: productId });
        return {
          id: product.id,
          name: product.name,
          salesPrice: product.salesPrice,
        };
      })
    );

    const order = new Order({
      clientId: input.clientId,
      items: orderItems,
      status: 'pending',
    });

    // 3. Process payment
    const payment = await this.paymentFacade.process({
      orderId: order.id.id,
      amount: order.total,
    });

    const approved = payment.status === 'approved';

    // 4. Generate invoice only for approved orders
    let invoiceId: string | null = null;
    if (approved) {
      const invoice = await this.invoiceFacade.generate({
        name: client.name,
        document: client.email,
        address: client.address,
        items: orderItems.map(i => ({ name: i.name, price: i.salesPrice })),
      });
      invoiceId = invoice.id;
    }

    // 5. Persist final order
    const finalOrder = new Order({
      id: order.id,
      clientId: order.clientId,
      items: order.items,
      status: approved ? 'approved' : 'declined',
      invoiceId,
      transactionId: payment.transactionId,
    });

    await this.orderRepository.addOrder(finalOrder);

    return {
      id: finalOrder.id.id,
      invoiceId: finalOrder.invoiceId,
      transactionId: finalOrder.transactionId,
      status: finalOrder.status,
      total: finalOrder.total,
      products: input.products,
    };
  }
}
