import { Sequelize } from 'sequelize-typescript';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let sequelize: Sequelize;

if (isTest) {
  // Use SQLite for tests
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    sync: { force: true },
    models: [path.join(__dirname, '../../modules/**/repository/*.model.ts')],
  });
} else {
  // Use PostgreSQL for development and production
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'monolith_db',
    username: process.env.DB_USER || 'monolith_user',
    password: process.env.DB_PASSWORD || 'monolith_pass',
    // eslint-disable-next-line no-console
    logging: isProduction ? false : (sql: string) => console.log(sql),
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    models: [path.join(__dirname, '../../modules/**/repository/*.model.ts')],
  });
}

export default sequelize;
