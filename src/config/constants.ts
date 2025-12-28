export const USER_ROLES = {
ADMIN: 'ADMIN',
USER: 'USER',
SELLER: 'SELLER'
} as const

export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;