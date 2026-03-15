import AggregateRoot from '../../@shared/domain/entity/aggregate-root.interface';
import BaseEntity from '../../@shared/domain/entity/base.entity';
import Id from '../../@shared/domain/value-object/id.value-object';

export type OrderItem = {
  id: string;
  name: string;
  salesPrice: number;
};

type OrderProps = {
  id?: Id;
  clientId: string;
  items: OrderItem[];
  status?: string;
  invoiceId?: string | null;
  transactionId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export default class Order extends BaseEntity implements AggregateRoot {
  private _clientId: string;
  private _items: OrderItem[];
  private _status: string;
  private _invoiceId: string | null;
  private _transactionId: string | null;

  constructor(props: OrderProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._clientId = props.clientId;
    this._items = props.items;
    this._status = props.status ?? 'pending';
    this._invoiceId = props.invoiceId ?? null;
    this._transactionId = props.transactionId ?? null;
  }

  get clientId(): string {
    return this._clientId;
  }

  get items(): OrderItem[] {
    return this._items;
  }

  get status(): string {
    return this._status;
  }

  get invoiceId(): string | null {
    return this._invoiceId;
  }

  get transactionId(): string | null {
    return this._transactionId;
  }

  get total(): number {
    return this._items.reduce((sum, i) => sum + i.salesPrice, 0);
  }
}
