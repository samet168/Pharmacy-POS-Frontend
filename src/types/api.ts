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

export interface RegisterResponse {
  userId: number;
  username: string;
  name: string;
  phone: string;
  organizationId: number;
  roleId: number;
  roleName: string;
  isActive: boolean;
}

export interface AuthMeResponse {
  username: string;
  authorities: string[];
  authenticated: boolean;
}

// User types
export interface User {
  id: number;
  username: string;
  name: string;
  phone: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId?: number;
  roleId?: number;
}

export interface UserRequest {
  organizationId: number;
  roleId: number;
  name: string;
  username: string;
  password?: string;
  phone: string;
  pinCode?: string;
  isActive: boolean;
  branchIds: number[];
}

// Product types
export interface Product {
  id: number;
  sku: string;
  brandName: string;
  genericNameId?: number;
  categoryId?: number;
  defaultSupplierId?: number;
  requiresPrescription: boolean;
  imageUrl?: string;
  minStockAlert: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  controlledSubstance: boolean;
}

// Customer types
export interface Customer {
  id: number;
  name: string;
  phone: string;
  imageUrl?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
  organizationId?: number;
}

// Doctor types
export interface Doctor {
  id: number;
  name: string;
  licenseNumber?: string;
  phone: string;
  imageUrl?: string;
  clinicName?: string;
  createdAt: string;
  updatedAt: string;
}

// Shift types
export interface Shift {
  id: number;
  userId?: number;
  branchId?: number;
  deviceId?: number;
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
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
  code: string;
  name: string;
  location?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId?: number;
}

// Role types
export interface Role {
  id: number;
  name: string;
  systemRole: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId?: number;
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
  deviceUuid: string;
  deviceName?: string;
  lastSyncedAt?: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  branchId?: number;
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
  customerId?: number;
  userId?: number;
  branchId?: number;
  deviceId?: number;
  shiftId?: number;
  prescriptionId?: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  syncStatus: string;
  createdAt: string;
  createdAtDevice?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId?: number;
  productId?: number;
  batchId?: number;
  unitId?: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

// Payment types
export interface Payment {
  id: number;
  orderId?: number;
  amount: number;
  paymentMethod: string;
  status: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

// Image upload response
export interface ImageUploadResponse {
  url: string;
}