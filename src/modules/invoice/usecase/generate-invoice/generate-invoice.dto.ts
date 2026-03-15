export interface GenerateInvoiceUseCaseInputDto {
  id?: string;
  name: string;
  document: string;
  address: string;
  items: { id?: string; name: string; price: number }[];
}

export interface GenerateInvoiceUseCaseOutputDto {
  id: string;
  name: string;
  document: string;
  address: string;
  items: { id: string; name: string; price: number }[];
  total: number;
  createdAt: Date;
}
