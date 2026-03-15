export interface PlaceOrderInputDto {
  clientId: string;
  products: { productId: string }[];
}

export interface PlaceOrderOutputDto {
  id: string;
  invoiceId: string | null;
  transactionId: string | null;
  status: string;
  total: number;
  products: { productId: string }[];
}
