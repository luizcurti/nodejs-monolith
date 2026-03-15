import UseCaseInterface from '../../@shared/usecase/use-case.interface';
import InvoiceFacadeInterface, {
  FindInvoiceFacadeInputDto,
  FindInvoiceFacadeOutputDto,
  GenerateInvoiceFacadeInputDto,
  GenerateInvoiceFacadeOutputDto,
} from './invoice.facade.interface';

export default class InvoiceFacade implements InvoiceFacadeInterface {
  constructor(
    private readonly _generateUseCase: UseCaseInterface,
    private readonly _findUseCase: UseCaseInterface
  ) {}

  async generate(
    input: GenerateInvoiceFacadeInputDto
  ): Promise<GenerateInvoiceFacadeOutputDto> {
    return this._generateUseCase.execute(input);
  }

  async find(
    input: FindInvoiceFacadeInputDto
  ): Promise<FindInvoiceFacadeOutputDto> {
    return this._findUseCase.execute(input);
  }
}
