import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
  tableName: 'orders',
  timestamps: false,
})
export default class OrderModel extends Model {
  @PrimaryKey
  @Column({ allowNull: false })
  id: string;

  @Column({ allowNull: false })
  clientId: string;

  @Column({ allowNull: false, type: DataTypes.TEXT })
  items: string;

  @Column({ allowNull: false })
  status: string;

  @Column({ allowNull: true })
  invoiceId: string;

  @Column({ allowNull: true })
  transactionId: string;

  @Column({ allowNull: false })
  createdAt: Date;

  @Column({ allowNull: false })
  updatedAt: Date;
}
