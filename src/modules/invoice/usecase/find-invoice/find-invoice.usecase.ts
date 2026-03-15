import UseCaseInterface from '../../../@shared/usecase/use-case.interface';
import InvoiceGateway from '../../gateway/invoice.gateway';
import {
  FindInvoiceUseCaseInputDto,
  FindInvoiceUseCaseOutputDto,
} from './find-invoice.dto';

export default class FindInvoiceUseCase implements UseCaseInterface {
  constructor(private readonly invoiceRepository: InvoiceGateway) {}

  async execute(
    input: FindInvoiceUseCaseInputDto
  ): Promise<FindInvoiceUseCaseOutputDto> {
    const invoice = await this.invoiceRepository.find(input.id);

    return {
      id: invoice.id.id,
      name: invoice.name,
      document: invoice.document,
      address: invoice.address,
      items: invoice.items.map(i => ({
        id: i.id.id,
        name: i.name,
        price: i.price,
      })),
      total: invoice.total,
      createdAt: invoice.createdAt,
    };
  }
}
