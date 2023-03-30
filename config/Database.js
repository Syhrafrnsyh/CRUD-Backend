import { Sequelize } from 'sequelize';

const db = new Sequelize('multiple', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

export default db;
