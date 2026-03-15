import AggregateRoot from '../../@shared/domain/entity/aggregate-root.interface';
import BaseEntity from '../../@shared/domain/entity/base.entity';
import Id from '../../@shared/domain/value-object/id.value-object';
import InvoiceItem from './invoice-item.entity';

type InvoiceProps = {
  id?: Id;
  name: string;
  document: string;
  address: string;
  items: InvoiceItem[];
  createdAt?: Date;
  updatedAt?: Date;
};

export default class Invoice extends BaseEntity implements AggregateRoot {
  private _name: string;
  private _document: string;
  private _address: string;
  private _items: InvoiceItem[];

  constructor(props: InvoiceProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._document = props.document;
    this._address = props.address;
    this._items = props.items;
  }

  get name(): string {
    return this._name;
  }

  get document(): string {
    return this._document;
  }

  get address(): string {
    return this._address;
  }

  get items(): InvoiceItem[] {
    return this._items;
  }

  get total(): number {
    return this._items.reduce((sum, item) => sum + item.price, 0);
  }
}
