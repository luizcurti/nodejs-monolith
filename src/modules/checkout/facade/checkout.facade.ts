import CheckoutFacadeInterface, {
  PlaceOrderFacadeInputDto,
  PlaceOrderFacadeOutputDto,
} from './checkout.facade.interface';
import PlaceOrderUseCase from '../usecase/place-order/place-order.usecase';

export default class CheckoutFacade implements CheckoutFacadeInterface {
  constructor(private readonly _placeOrderUseCase: PlaceOrderUseCase) {}

  async placeOrder(
    input: PlaceOrderFacadeInputDto
  ): Promise<PlaceOrderFacadeOutputDto> {
    return this._placeOrderUseCase.execute(input);
  }
}
