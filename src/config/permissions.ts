/**
 * Authorization Permissions and Role-Permission Mapping
 *
 * This file defines:
 * 1. Fine-grained permissions for each resource
 * 2. Role-to-permission mapping
 * 3. Permission validation utilities
 *
 * Permission Naming Convention:
 * - resource.action (e.g., 'store.create')
 * - resource.own.action (e.g., 'store.own.update') - for owned resources
 * - resource.* (e.g., 'store.*') - wildcard for all actions
 */

import type { UserRole } from './constants';

// ============================================
// PERMISSION CONSTANTS
// ============================================

export const PERMISSIONS = {
  // ===== User Permissions =====
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  USERS_DELETE: 'users.delete',
  USERS_ALL: 'users.*',

  // ===== Category Permissions =====
  CATEGORY_READ: 'category.read',
  CATEGORY_WRITE: 'category.write', // Combined create/update for simplicity
  CATEGORY_CREATE: 'category.create',
  CATEGORY_UPDATE: 'category.update',
  CATEGORY_DELETE: 'category.delete',
  CATEGORY_ALL: 'category.*',

  // ===== Store Permissions =====
  STORE_READ: 'store.read', // Public - anyone can view stores
  STORE_CREATE: 'store.create', // Seller can create store
  STORE_OWN_UPDATE: 'store.own.update', // Seller can update own store
  STORE_OWN_DELETE: 'store.own.delete', // Seller can delete own store
  STORE_ALL: 'store.*', // Admin can do everything

  // ===== Product Permissions =====
  PRODUCT_READ: 'product.read', // Public - anyone can view products
  PRODUCT_CREATE: 'product.create', // Seller can create products
  PRODUCT_OWN_UPDATE: 'product.own.update', // Seller can update own products
  PRODUCT_OWN_DELETE: 'product.own.delete', // Seller can delete own products
  PRODUCT_ALL: 'product.*', // Admin can manage all products

  // ===== Order Permissions =====
  ORDER_READ: 'order.read', // Admin can read all orders
  ORDER_WRITE: 'order.write', // Admin can modify orders
  ORDER_DELETE: 'order.delete', // Admin can delete orders
  ORDER_ALL: 'order.*', // Admin has all order permissions

  // User's own orders
  ORDER_OWN_READ: 'order.own.read', // User can read their orders
  ORDER_OWN_WRITE: 'order.own.write', // User can update their orders (cancel, etc.)
  ORDER_OWN_DELETE: 'order.own.delete', // User can delete their orders

  // Seller's order management
  ORDER_SELLER_READ: 'order.seller.read', // Seller can read orders for their products
  ORDER_SELLER_UPDATE: 'order.seller.update', // Seller can update order status

  // ===== Analytics Permissions =====
  ANALYTICS_OWN_READ: 'analytics.own.read', // Seller can view their analytics
  ANALYTICS_ALL_READ: 'analytics.all.read', // Admin can view all analytics

  // ===== Review Permissions =====
  REVIEW_READ: 'review.read', // Public - anyone can read reviews
  REVIEW_CREATE: 'review.create', // User can create reviews
  REVIEW_OWN_UPDATE: 'review.own.update', // User can update their reviews
  REVIEW_OWN_DELETE: 'review.own.delete', // User can delete their reviews
  REVIEW_ALL: 'review.*', // Admin can manage all reviews
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================
// ROLE-PERMISSION MAPPING
// ============================================

/**
 * Defines which permissions each role has
 *
 * Design Principles:
 * - ADMIN: Full control (wildcards)
 * - SELLER: Can manage own resources + read public data
 * - USER: Read public data + manage own orders/reviews
 */
export const ROLE_PERMISSIONS: Readonly<Record<UserRole, readonly Permission[]>> = {
  /**
   * ADMIN Role:
   * - Full system access
   * - Can manage all resources
   * - Dashboard and analytics access
   */
  ADMIN: [
    PERMISSIONS.USERS_ALL,
    PERMISSIONS.CATEGORY_ALL,
    PERMISSIONS.STORE_ALL,
    PERMISSIONS.PRODUCT_ALL,
    PERMISSIONS.ORDER_ALL,
    PERMISSIONS.ANALYTICS_ALL_READ,
    PERMISSIONS.REVIEW_ALL,
  ],

  /**
   * SELLER Role:
   * - Can create and manage their own stores
   * - Can create and manage their own products
   * - Can view orders for their products
   * - Can view their own analytics
   * - Can read public data (categories, other stores)
   */
  SELLER: [
    // Read permissions (public data)
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.CATEGORY_WRITE, // Can create/update categories
    PERMISSIONS.STORE_READ, // Can view all stores (public)
    PERMISSIONS.PRODUCT_READ, // Can view all products (public)
    PERMISSIONS.REVIEW_READ,

    // Store management (own stores only)
    PERMISSIONS.STORE_CREATE,
    PERMISSIONS.STORE_OWN_UPDATE,
    PERMISSIONS.STORE_OWN_DELETE,

    // Product management (own products only)
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_OWN_UPDATE,
    PERMISSIONS.PRODUCT_OWN_DELETE,

    // Order management (for their products)
    PERMISSIONS.ORDER_SELLER_READ,
    PERMISSIONS.ORDER_SELLER_UPDATE,

    // Analytics (own data only)
    PERMISSIONS.ANALYTICS_OWN_READ,

    // Can manage orders for their own purchases
    PERMISSIONS.ORDER_OWN_READ,
    PERMISSIONS.ORDER_OWN_WRITE,
  ],

  /**
   * USER Role:
   * - Can view public data
   * - Can place and manage orders
   * - Can create and manage reviews
   */
  USER: [
    // Read permissions (public data)
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CATEGORY_READ,
    PERMISSIONS.STORE_READ, // Can view all stores (public)
    PERMISSIONS.PRODUCT_READ, // Can view all products (public)
    PERMISSIONS.REVIEW_READ,

    // Order management (own orders only)
    PERMISSIONS.ORDER_OWN_READ,
    PERMISSIONS.ORDER_OWN_WRITE,

    // Review management
    PERMISSIONS.REVIEW_CREATE,
    PERMISSIONS.REVIEW_OWN_UPDATE,
    PERMISSIONS.REVIEW_OWN_DELETE,
  ],
} as const;

// ============================================
// PERMISSION UTILITIES
// ============================================

/**
 * Check if a user has a specific permission
 * Supports wildcard permissions (e.g., 'store.*' matches 'store.create')
 */
export const hasPermission = (
  userPermissions: readonly Permission[],
  requiredPermission: string,
): boolean => {
  return userPermissions.some(permission => {
    // Exact match
    if (permission === requiredPermission) return true;

    // Wildcard match (e.g., 'store.*' matches 'store.create')
    if (permission.endsWith('.*')) {
      const prefix = permission.slice(0, -2); // Remove '.*'
      return requiredPermission.startsWith(prefix);
    }

    return false;
  });
};

/**
 * Get all permissions for a role
 */
export const getPermissionsForRole = (role: UserRole): readonly Permission[] => {
  return ROLE_PERMISSIONS[role] ?? [];
};

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  const rolePermissions = getPermissionsForRole(role);
  return hasPermission(rolePermissions, permission);
};
