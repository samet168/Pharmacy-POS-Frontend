// API Response types (mirroring backend ApiResponse<T> wrapper)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface PinLoginRequest {
  pinCode: string;
  branchId: number;
  deviceUuid?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  organizationId: number;
  roleId: number;
  roleName: string;
}

export interface AuthMeResponse {
  id: number;
  username: string;
  name: string;
  phone: string;
  imageUrl: string;
  active: boolean;
  organizationId: number;
  roleId: number;
  roleName: string;
  authorities: string[];
  authenticated: boolean;
}

// User types
export interface User {
  id: number;
  organizationId: number;
  roleId: number;
  name: string;
  username: string;
  phone?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  organizationId: number;
  roleId: number;
  name: string;
  username: string;
  password?: string;
  phone?: string;
  pinCode?: string;
  imageUrl?: string;
  isActive?: boolean;
  branchIds?: number[];
}

// Product types
export interface Product {
  id: number;
  organizationId: number;
  sku: string;
  brandName: string;
  genericNameId?: number;
  categoryId?: number;
  defaultSupplierId?: number;
  requiresPrescription: boolean;
  isControlledSubstance: boolean;
  imageUrl?: string;
  minStockAlert: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer types
export interface Customer {
  id: number;
  organizationId: number;
  name: string;
  phone?: string;
  imageUrl?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

// Doctor types
export interface Doctor {
  id: number;
  name: string;
  licenseNumber?: string;
  phone?: string;
  imageUrl?: string;
  clinicName?: string;
  createdAt: string;
  updatedAt: string;
}

// Shift types
export interface Shift {
  id: number;
  userId: number;
  branchId: number;
  deviceId?: number;
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Organization types
export interface Organization {
  id: number;
  name: string;
  slug: string;
  licenseNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  baseCurrency: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// Branch types
export interface Branch {
  id: number;
  organizationId: number;
  code: string;
  name: string;
  location?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Role types
export interface Role {
  id: number;
  organizationId: number;
  name: string;
  systemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission types
export interface Permission {
  id: number;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Device types
export interface Device {
  id: number;
  branchId: number;
  deviceUuid: string;
  deviceName?: string;
  lastSyncedAt?: string;
  isActive: boolean;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

// Subscription Plan types
export interface SubscriptionPlan {
  id: number;
  organizationId: number;
  planName: string;
  maxBranches: number;
  maxUsers: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

// Prescription types
export interface Prescription {
  id: number;
  customerId?: number;
  doctorId?: number;
  diagnosis?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: number;
  prescriptionId?: number;
  productId?: number;
  dosageInstruction?: string;
  quantity: number;
  unitPrice: number;
}

// Order types
export interface Order {
  id: number;
  clientUuid?: string;
  invoiceNumber?: string;
  organizationId: number;
  branchId: number;
  deviceId?: number;
  userId: number;
  customerId?: number;
  shiftId?: number;
  prescriptionId?: number;
  prescriptionUrl?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'PENDING_SYNC';
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  createdAtDevice?: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId?: number;
  productId?: number;
  batchId?: number;
  unitId?: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  dosageInstruction?: string;
  createdAt?: string;
}

// Payment types
export interface Payment {
  id: number;
  orderId?: number;
  paymentMethod: string;
  amountPaid: number;
  currency: string;
  exchangeRateUsed?: number;
  transactionRef?: string;
  createdAt?: string;
}

// Image upload response
export interface ImageUploadResponse {
  url: string;
}