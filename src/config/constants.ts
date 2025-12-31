export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
  SELLER: "SELLER",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_WRITE: "users.write",
  USERS_ALL: "users.*",

  CATEGORY_READ: "category.read",
  CATEGORY_WRITE: "category.write",
  CATEGORY_ALL: "category.*",

  PRODUCT_READ: "product.read",
  PRODUCT_WRITE: "product.write",
  PRODUCT_ALL: "product.*",
  PRODUCT_OWN_DELETE: "product.own.delete",

  ORDER_READ: "order.read",
  ORDER_WRITE: "order.write",

  ORDER_OWN_READ: "order.own.read",
  ORDER_OWN_WRITE: "order.own.write",
  ORDER_OWN_DELETE: "order.own.delete",

  ORDER_ALL: "order.*",
} as const;

export type Permission =
  typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Readonly<Record<UserRole, readonly Permission[]>> = {
  ADMIN: [
    PERMISSIONS.USERS_ALL,
    PERMISSIONS.CATEGORY_ALL,
    PERMISSIONS.PRODUCT_ALL,
    PERMISSIONS.ORDER_ALL,
  ],

  SELLER: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CATEGORY_ALL,
    PERMISSIONS.PRODUCT_ALL,
    PERMISSIONS.ORDER_OWN_READ,
  ],

  USER: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.ORDER_OWN_READ,
  ],
} as const;

