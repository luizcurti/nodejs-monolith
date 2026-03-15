export interface GenerateInvoiceFacadeInputDto {
  id?: string;
  name: string;
  document: string;
  address: string;
  items: { id?: string; name: string; price: number }[];
}

export interface GenerateInvoiceFacadeOutputDto {
  id: string;
  name: string;
  document: string;
  address: string;
  items: { id: string; name: string; price: number }[];
  total: number;
  createdAt: Date;
}

export interface FindInvoiceFacadeInputDto {
  id: string;
}

export interface FindInvoiceFacadeOutputDto {
  id: string;
  name: string;
  document: string;
  address: string;
  items: { id: string; name: string; price: number }[];
  total: number;
  createdAt: Date;
}

export default interface InvoiceFacadeInterface {
  generate(
    input: GenerateInvoiceFacadeInputDto
  ): Promise<GenerateInvoiceFacadeOutputDto>;
  find(input: FindInvoiceFacadeInputDto): Promise<FindInvoiceFacadeOutputDto>;
}
