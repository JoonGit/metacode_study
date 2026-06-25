// Order status matching backend
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum MenuStatus {
  ON_SALE = 'ON_SALE',
  SOLD_OUT = 'SOLD_OUT',
  HIDDEN = 'HIDDEN',
}

export enum PayMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  MOBILE_PAY = 'MOBILE_PAY',
}

export enum StoreStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum UserType {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}
