export enum ENVIRONMENTS {
  DEV = `dev`,
  DEVELOPMENT = `development`,
  STAGING = `staging`,
  PROD = `prod`,
  PRODUCTION = `production`,
}

export enum EXPIRE_IN {
  ONE_MINUTES = 60, // 60s
  FIVE_MINUTES = 5 * 60, // 300s
  FIFTEEN_MINUTES = 15 * 60, // 900s
  ONE_HOUR = 60 * 60, // 3600s
  ONE_DAY = 24 * 60 * 60, // 86400s
  SEVEN_DAYS = 7 * 24 * 60 * 60, // 604800s
}

export enum FILE_SIZE {
  ONE_MB = 1 * 1024 * 1024,
  FIVE_MB = 5 * 1024 * 1024,
  TEN_MB = 10 * 1024 * 1024,
  FIFTY_MB = 50 * 1024 * 1024,
}

export enum EQueryOperator {
  EQ = `=`,
  LIKE = `LIKE`,
  ILIKE = `ILIKE`,
  GT = `>`,
  LT = `<`,
}
