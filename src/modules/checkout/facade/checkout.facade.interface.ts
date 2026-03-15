export interface PlaceOrderFacadeInputDto {
  clientId: string;
  products: { productId: string }[];
}

export interface PlaceOrderFacadeOutputDto {
  id: string;
  invoiceId: string | null;
  transactionId: string | null;
  status: string;
  total: number;
  products: { productId: string }[];
}

export default interface CheckoutFacadeInterface {
  placeOrder(
    input: PlaceOrderFacadeInputDto
  ): Promise<PlaceOrderFacadeOutputDto>;
}
