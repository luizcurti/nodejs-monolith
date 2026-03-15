import UseCaseInterface from '../../../@shared/usecase/use-case.interface';
import Id from '../../../@shared/domain/value-object/id.value-object';
import InvoiceItem from '../../domain/invoice-item.entity';
import Invoice from '../../domain/invoice.entity';
import InvoiceGateway from '../../gateway/invoice.gateway';
import {
  GenerateInvoiceUseCaseInputDto,
  GenerateInvoiceUseCaseOutputDto,
} from './generate-invoice.dto';

export default class GenerateInvoiceUseCase implements UseCaseInterface {
  constructor(private readonly invoiceRepository: InvoiceGateway) {}

  async execute(
    input: GenerateInvoiceUseCaseInputDto
  ): Promise<GenerateInvoiceUseCaseOutputDto> {
    const items = input.items.map(
      i =>
        new InvoiceItem({
          id: i.id ? new Id(i.id) : new Id(),
          name: i.name,
          price: i.price,
        })
    );

    const invoice = new Invoice({
      id: input.id ? new Id(input.id) : new Id(),
      name: input.name,
      document: input.document,
      address: input.address,
      items,
    });

    const saved = await this.invoiceRepository.generate(invoice);

    return {
      id: saved.id.id,
      name: saved.name,
      document: saved.document,
      address: saved.address,
      items: saved.items.map(i => ({
        id: i.id.id,
        name: i.name,
        price: i.price,
      })),
      total: saved.total,
      createdAt: saved.createdAt,
    };
  }
}
