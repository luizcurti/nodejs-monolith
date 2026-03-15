import Id from '../../@shared/domain/value-object/id.value-object';
import InvoiceItem from '../domain/invoice-item.entity';
import Invoice from '../domain/invoice.entity';
import InvoiceGateway from '../gateway/invoice.gateway';
import { InvoiceItemModel, InvoiceModel } from './invoice.model';

export default class InvoiceRepository implements InvoiceGateway {
  async generate(invoice: Invoice): Promise<Invoice> {
    await InvoiceModel.create(
      {
        id: invoice.id.id,
        name: invoice.name,
        document: invoice.document,
        address: invoice.address,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        items: invoice.items.map(item => ({
          id: item.id.id,
          invoiceId: invoice.id.id,
          name: item.name,
          price: item.price,
        })),
      },
      { include: [InvoiceItemModel] }
    );

    return invoice;
  }

  async find(id: string): Promise<Invoice> {
    const model = await InvoiceModel.findOne({
      where: { id },
      include: [InvoiceItemModel],
    });

    if (!model) {
      throw new Error('Invoice not found');
    }

    const items = model.items.map(
      item =>
        new InvoiceItem({
          id: new Id(item.id),
          name: item.name,
          price: item.price,
        })
    );

    return new Invoice({
      id: new Id(model.id),
      name: model.name,
      document: model.document,
      address: model.address,
      items,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
