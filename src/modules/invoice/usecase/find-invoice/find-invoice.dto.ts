export interface FindInvoiceUseCaseInputDto {
  id: string;
}

export interface FindInvoiceUseCaseOutputDto {
  id: string;
  name: string;
  document: string;
  address: string;
  items: { id: string; name: string; price: number }[];
  total: number;
  createdAt: Date;
}
