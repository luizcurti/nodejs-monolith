import Id from '../../@shared/domain/value-object/id.value-object';
import Order, { OrderItem } from '../domain/order.entity';
import CheckoutGateway from '../gateway/checkout.gateway';
import OrderModel from './order.model';

export default class OrderRepository implements CheckoutGateway {
  async addOrder(order: Order): Promise<Order> {
    await OrderModel.create({
      id: order.id.id,
      clientId: order.clientId,
      items: JSON.stringify(order.items),
      status: order.status,
      invoiceId: order.invoiceId,
      transactionId: order.transactionId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });

    return order;
  }

  async findOrder(id: string): Promise<Order> {
    const model = await OrderModel.findOne({ where: { id } });

    if (!model) {
      throw new Error('Order not found');
    }

    return new Order({
      id: new Id(model.id),
      clientId: model.clientId,
      items: JSON.parse(model.items) as OrderItem[],
      status: model.status,
      invoiceId: model.invoiceId ?? null,
      transactionId: model.transactionId ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
