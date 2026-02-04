import dotenv from 'dotenv';

dotenv.config();

interface SequelizeConfig {
  development: {
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
    logging: boolean;
  };
  test: {
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
    logging: boolean;
  };
  production: {
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
    logging: boolean;
  };
}

const config: SequelizeConfig = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'apna_vyapar_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true',
  },
  test: {
    username: process.env.DB_USER_TEST || 'root',
    password: process.env.DB_PASSWORD_TEST || '',
    database: process.env.DB_NAME_TEST || 'apna_vyapar_test',
    host: process.env.DB_HOST_TEST || 'localhost',
    port: parseInt(process.env.DB_PORT_TEST || '3306'),
    dialect: 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'apna_vyapar',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
  },
};

export default config;
