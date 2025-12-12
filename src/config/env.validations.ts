import * as Joi from 'joi';
import { ENVIRONMENTS } from 'src/common/enums';

export const envValidationSchema = Joi.object({
  /**
   * General
   */
  APP_ENV: Joi.string().valid(...Object.values(ENVIRONMENTS)),

  /**
   * Database
   */
  DATABASE_URL: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_HOST: Joi.string().required(),
});
