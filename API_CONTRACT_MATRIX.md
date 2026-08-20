# API Contract Matrix

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|

## AUTHENTICATION

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Login | /login | POST | /api/v1/auth/login | {username, password} | {accessToken, refreshToken, organizationId, roleId, roleName} | ✅ MATCH |
| Register | /register | POST | /api/v1/auth/register | {username, password, name, phone, organizationId} | {accessToken, refreshToken, organizationId, roleId, roleName} | ✅ MATCH |
| Get Current User | - | GET | /api/v1/auth/me | - | {id, username, name, phone, imageUrl, active, organizationId, roleId, roleName, authorities} | ✅ MATCH |
| Change Password | /settings/change-password | PUT | /api/v1/auth/change-password | {currentPassword, newPassword} | - | ✅ MATCH |
| Refresh Token | - | POST | /api/v1/auth/refresh | {refreshToken} | {accessToken, refreshToken} | ✅ MATCH |

## DASHBOARD

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Dashboard Overview | /dashboard | GET | /api/v1/dashboard/overview | - | {todaySales, totalSales, activeShift, lowStockCount, expiredCount} | ⚠️ 403 FORBIDDEN |

## PRODUCTS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Products List | /products | GET | /api/v1/products | {page, size, search, organizationId, branchId} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Product Details | /products/[id] | GET | /api/v1/products/{id} | - | Product object | ✅ MATCH |
| Create Product | /products | POST | /api/v1/products | ProductRequest | ProductResponse | ✅ MATCH |
| Update Product | /products/[id] | PUT | /api/v1/products/{id} | ProductRequest | ProductResponse | ✅ MATCH |
| Delete Product | /products/[id] | DELETE | /api/v1/products/{id} | - | - | ✅ MATCH |
| Search Products | - | GET | /api/v1/products/search | {query, organizationId} | Product[] | ✅ MATCH |
| Barcode Search | - | GET | /api/v1/products/barcode/{barcode} | - | Product | ✅ MATCH |
| Expiring Products | /inventory/expiring | GET | /api/v1/products/expiring | {days, organizationId, branchId} | Product[] | ✅ MATCH |
| Expired Products | /inventory/expired | GET | /api/v1/products/expired | {organizationId, branchId} | Product[] | ✅ MATCH |

## CATEGORIES

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Categories List | /categories | GET | /api/v1/categories | {organizationId} | Category[] | ✅ MATCH |
| Category Details | /categories/[id] | GET | /api/v1/categories/{id} | - | Category | ✅ MATCH |
| Create Category | /categories | POST | /api/v1/categories | {name, nameKh, parentId, organizationId} | CategoryResponse | ✅ MATCH |
| Update Category | /categories/[id] | PUT | /api/v1/categories/{id} | {name, nameKh, parentId, organizationId} | CategoryResponse | ✅ MATCH |
| Delete Category | /categories/[id] | DELETE | /api/v1/categories/{id} | - | - | ✅ MATCH |

## SUPPLIERS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Suppliers List | /catalog/suppliers | GET | /api/v1/suppliers | {organizationId} | Supplier[] | ✅ MATCH |
| Supplier Details | /catalog/suppliers/[id] | GET | /api/v1/suppliers/{id} | - | Supplier | ✅ MATCH |
| Create Supplier | /catalog/suppliers | POST | /api/v1/suppliers | {name, phone, email, address, organizationId} | SupplierResponse | ✅ MATCH |
| Update Supplier | /catalog/suppliers/[id] | PUT | /api/v1/suppliers/{id} | {name, phone, email, address, organizationId} | SupplierResponse | ✅ MATCH |
| Delete Supplier | /catalog/suppliers/[id] | DELETE | /api/v1/suppliers/{id} | - | - | ✅ MATCH |

## ACTIVE INGREDIENTS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Ingredients List | /active-ingredients | GET | /api/v1/active-ingredients/organization/{organizationId} | - | ActiveIngredient[] | ✅ MATCH |
| Ingredient Details | /active-ingredients/[id] | GET | /api/v1/active-ingredients/{id} | - | ActiveIngredient | ✅ MATCH |
| Create Ingredient | /active-ingredients | POST | /api/v1/active-ingredients | {name, nameKh, description, organizationId} | ActiveIngredientResponse | ✅ MATCH |
| Update Ingredient | /active-ingredients/[id] | PUT | /api/v1/active-ingredients/{id} | {name, nameKh, description, organizationId} | ActiveIngredientResponse | ✅ MATCH |
| Delete Ingredient | /active-ingredients/[id] | DELETE | /api/v1/active-ingredients/{id} | - | - | ✅ MATCH |

## CUSTOMERS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Customers List | /customers | GET | /api/v1/customers/organization/{organizationId} | - | Customer[] | ✅ MATCH |
| Customer Details | /customers/[id] | GET | /api/v1/customers/{id} | - | Customer | ✅ MATCH |
| Create Customer | /customers | POST | /api/v1/customers | {name, phone, email, address, organizationId} | CustomerResponse | ✅ MATCH |
| Update Customer | /customers/[id] | PUT | /api/v1/customers/{id} | {name, phone, email, address, organizationId} | CustomerResponse | ✅ MATCH |
| Delete Customer | /customers/[id] | DELETE | /api/v1/customers/{id} | - | - | ✅ MATCH |
| Search Customers | - | GET | /api/v1/customers/search | {query, organizationId} | Customer[] | ✅ MATCH |

## CUSTOMER ALLERGIES

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Customer Allergies | /customer-allergies | GET | /api/v1/customer-allergies/customer/{customerId} | - | CustomerAllergy[] | ✅ MATCH |
| Create Allergy | /customer-allergies | POST | /api/v1/customer-allergies | {customerId, ingredientId, reactionNotes} | CustomerAllergyResponse | ✅ MATCH |
| Update Allergy | /customer-allergies/[id] | PUT | /api/v1/customer-allergies/{id} | {customerId, ingredientId, reactionNotes} | CustomerAllergyResponse | ✅ MATCH |
| Delete Allergy | /customer-allergies/[id] | DELETE | /api/v1/customer-allergies/{id} | - | - | ✅ MATCH |

## DOCTORS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Doctors List | /doctors | GET | /api/v1/doctors/organization/{organizationId} | - | Doctor[] | ✅ MATCH |
| Doctor Details | /doctors/[id] | GET | /api/v1/doctors/{id} | - | Doctor | ✅ MATCH |
| Create Doctor | /doctors | POST | /api/v1/doctors | {name, phone, email, specialty, organizationId} | DoctorResponse | ✅ MATCH |
| Update Doctor | /doctors/[id] | PUT | /api/v1/doctors/{id} | {name, phone, email, specialty, organizationId} | DoctorResponse | ✅ MATCH |
| Delete Doctor | /doctors/[id] | DELETE | /api/v1/doctors/{id} | - | - | ✅ MATCH |

## PRESCRIPTIONS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Prescriptions List | /prescriptions | GET | /api/v1/prescriptions/organization/{organizationId} | - | Prescription[] | ✅ MATCH |
| Prescription Details | /prescriptions/[id] | GET | /api/v1/prescriptions/{id} | - | Prescription | ✅ MATCH |
| Create Prescription | /prescriptions | POST | /api/v1/prescriptions | PrescriptionRequest | PrescriptionResponse | ✅ MATCH |
| Update Prescription | /prescriptions/[id] | PUT | /api/v1/prescriptions/{id} | PrescriptionRequest | PrescriptionResponse | ✅ MATCH |
| Delete Prescription | /prescriptions/[id] | DELETE | /api/v1/prescriptions/{id} | - | - | ✅ MATCH |

## PURCHASE ORDERS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Purchase Orders List | /purchase-orders | GET | /api/v1/purchase-orders | {organizationId, branchId, status} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Purchase Order Details | /purchase-orders/[id] | GET | /api/v1/purchase-orders/{id} | - | PurchaseOrderResponse | ✅ MATCH |
| Create Purchase Order | /purchase-orders | POST | /api/v1/purchase-orders | PurchaseOrderRequest | PurchaseOrderResponse | ✅ MATCH |
| Update Purchase Order | /purchase-orders/[id] | PUT | /api/v1/purchase-orders/{id} | PurchaseOrderRequest | PurchaseOrderResponse | ✅ MATCH |
| Delete Purchase Order | /purchase-orders/[id] | DELETE | /api/v1/purchase-orders/{id} | - | - | ✅ MATCH |

## GOODS RECEIPTS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Goods Receipts List | /goods-receipts | GET | /api/v1/goods-receipts | {organizationId, branchId} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Goods Receipt Details | /goods-receipts/[id] | GET | /api/v1/goods-receipts/{id} | - | GoodsReceiptResponse | ✅ MATCH |
| Create Goods Receipt | /goods-receipts | POST | /api/v1/goods-receipts | GoodsReceiptRequest | GoodsReceiptResponse | ✅ MATCH |
| Update Goods Receipt | /goods-receipts/[id] | PUT | /api/v1/goods-receipts/{id} | GoodsReceiptRequest | GoodsReceiptResponse | ✅ MATCH |
| Delete Goods Receipt | /goods-receipts/[id] | DELETE | /api/v1/goods-receipts/{id} | - | - | ✅ MATCH |

## INVENTORY

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Stock List | /inventory | GET | /api/v1/branch-inventory | {organizationId, branchId} | BranchInventory[] | ✅ MATCH |
| Low Stock | /inventory/low-stock | GET | /api/v1/branch-inventory/low-stock | {organizationId, branchId} | BranchInventory[] | ✅ MATCH |
| Stock Adjustments | /inventory/adjustments | GET | /api/v1/stock-adjustments | {organizationId, branchId} | StockAdjustment[] | ✅ MATCH |
| Create Stock Adjustment | /inventory/adjustments | POST | /api/v1/stock-adjustments | StockAdjustmentRequest | StockAdjustmentResponse | ✅ MATCH |

## ORGANIZATIONS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Organizations List | /organization/organizations | GET | /api/v1/organizations | - | Organization[] | ✅ MATCH |
| Organization Details | /organization/organizations/[id] | GET | /api/v1/organizations/{id} | - | Organization | ✅ MATCH |
| Create Organization | /organization/organizations | POST | /api/v1/organizations | OrganizationRequest | OrganizationResponse | ✅ MATCH |
| Update Organization | /organization/organizations/[id] | PUT | /api/v1/organizations/{id} | OrganizationRequest | OrganizationResponse | ✅ MATCH |
| Delete Organization | /organization/organizations/[id] | DELETE | /api/v1/organizations/{id} | - | - | ✅ MATCH |

## BRANCHES

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Branches List | /branches | GET | /api/v1/branches | {organizationId} | Branch[] | ✅ MATCH |
| Branch Details | /branches/[id] | GET | /api/v1/branches/{id} | - | Branch | ✅ MATCH |
| Create Branch | /branches | POST | /api/v1/branches | {name, phone, email, address, organizationId} | BranchResponse | ✅ MATCH |
| Update Branch | /branches/[id] | PUT | /api/v1/branches/{id} | {name, phone, email, address, organizationId} | BranchResponse | ✅ MATCH |
| Delete Branch | /branches/[id] | DELETE | /api/v1/branches/{id} | - | - | ✅ MATCH |
| Branch Settings | /branches/[id]/settings | GET | /api/v1/branches/{id}/settings | - | BranchSettings | ✅ MATCH |
| Update Branch Settings | /branches/[id]/settings | PUT | /api/v1/branches/{id}/settings | BranchSettingsRequest | BranchSettingsResponse | ✅ MATCH |

## USERS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Users List | /users | GET | /api/v1/users/organization/{organizationId} | - | User[] | ✅ MATCH |
| User Details | /users/[id] | GET | /api/v1/users/{id} | - | User | ✅ MATCH |
| Create User | /users | POST | /api/v1/users | UserRequest | UserResponse | ✅ MATCH |
| Update User | /users/[id] | PUT | /api/v1/users/{id} | UserRequest | UserResponse | ✅ MATCH |
| Delete User | /users/[id] | DELETE | /api/v1/users/{id} | - | - | ✅ MATCH |

## ROLES

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Roles List | /roles-permissions | GET | /api/v1/roles/organization/{organizationId} | - | Role[] | ⚠️ 403 FORBIDDEN |
| Role Details | /roles-permissions/[id] | GET | /api/v1/roles/{id} | - | Role | ✅ MATCH |
| Create Role | /roles-permissions | POST | /api/v1/roles | RoleRequest | RoleResponse | ✅ MATCH |
| Update Role | /roles-permissions/[id] | PUT | /api/v1/roles/{id} | RoleRequest | RoleResponse | ✅ MATCH |
| Delete Role | /roles-permissions/[id] | DELETE | /api/v1/roles/{id} | - | - | ✅ MATCH |

## DEVICES

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Devices List | /devices | GET | /api/v1/devices | {page, size} | {content: [], totalElements, totalPages} | ⚠️ 403 FORBIDDEN |
| Device Details | /devices/[id] | GET | /api/v1/devices/{id} | - | DeviceResponse | ✅ MATCH |
| Create Device | /devices | POST | /api/v1/devices | DeviceRequest | DeviceResponse | ✅ MATCH |
| Update Device | /devices/[id] | PUT | /api/v1/devices/{id} | DeviceRequest | DeviceResponse | ✅ MATCH |
| Delete Device | /devices/[id] | DELETE | /api/v1/devices/{id} | - | - | ✅ MATCH |
| Device Sync | /devices/sync/{uuid} | POST | /api/v1/devices/sync/{deviceUuid} | SyncRequest | SyncResponse | ✅ MATCH |

## SHIFTS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Current Shift | /shifts | GET | /api/v1/shifts/current | {branchId} | ShiftResponse | ✅ MATCH |
| Open Shift | /shifts | POST | /api/v1/shifts/open | {branchId, openingAmount} | ShiftResponse | ✅ MATCH |
| Close Shift | /shifts | POST | /api/v1/shifts/close | {shiftId, closingAmount} | ShiftResponse | ✅ MATCH |
| Shift History | /shifts | GET | /api/v1/shifts | {branchId, page, size} | {content: [], totalElements, totalPages} | ✅ MATCH |

## ORDERS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Orders List | /orders | GET | /api/v1/orders | {organizationId, branchId, status, page, size} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Order Details | /orders/[id] | GET | /api/v1/orders/{id} | - | OrderResponse | ✅ MATCH |
| Create Order | /orders | POST | /api/v1/orders | OrderRequest | OrderResponse | ✅ MATCH |
| Update Order | /orders/[id] | PUT | /api/v1/orders/{id} | OrderRequest | OrderResponse | ✅ MATCH |
| Delete Order | /orders/[id] | DELETE | /api/v1/orders/{id} | - | - | ✅ MATCH |

## PAYMENTS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Payments List | /sales/payments | GET | /api/v1/payments | {organizationId, branchId, page, size} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Payment Details | /sales/payments/[id] | GET | /api/v1/payments/{id} | - | PaymentResponse | ✅ MATCH |
| Create Payment | /sales/payments | POST | /api/v1/payments | PaymentRequest | PaymentResponse | ✅ MATCH |

## ORDER RETURNS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Returns List | /sales/returns | GET | /api/v1/order-returns | {organizationId, branchId, page, size} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Return Details | /sales/returns/[id] | GET | /api/v1/order-returns/{id} | - | OrderReturnResponse | ✅ MATCH |
| Create Return | /sales/returns | POST | /api/v1/order-returns | OrderReturnRequest | OrderReturnResponse | ✅ MATCH |

## SUBSCRIPTION PLANS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Subscription Plans | /subscriptions | GET | /api/v1/subscription-plans | {page, size} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Plan Details | /subscriptions/[id] | GET | /api/v1/subscription-plans/{id} | - | SubscriptionPlanResponse | ✅ MATCH |
| Create Plan | /subscriptions | POST | /api/v1/subscription-plans | SubscriptionPlanRequest | SubscriptionPlanResponse | ✅ MATCH |
| Update Plan | /subscriptions/[id] | PUT | /api/v1/subscription-plans/{id} | SubscriptionPlanRequest | SubscriptionPlanResponse | ✅ MATCH |
| Delete Plan | /subscriptions/[id] | DELETE | /api/v1/subscription-plans/{id} | - | - | ✅ MATCH |

## REPORTS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Sales Reports | /reports/sales | GET | /api/v1/reports/sales | {startDate, endDate, organizationId, branchId} | SalesReportResponse | ✅ MATCH |
| Product Reports | /reports | GET | /api/v1/reports/products | {startDate, endDate, organizationId, branchId} | ProductReportResponse | ✅ MATCH |
| Customer Reports | /reports | GET | /api/v1/reports/customers | {startDate, endDate, organizationId, branchId} | CustomerReportResponse | ✅ MATCH |
| Purchase Reports | /reports | GET | /api/v1/reports/purchases | {startDate, endDate, organizationId, branchId} | PurchaseReportResponse | ✅ MATCH |
| Inventory Reports | /reports | GET | /api/v1/reports/inventory | {organizationId, branchId} | InventoryReportResponse | ✅ MATCH |

## AUDIT LOGS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Audit Logs | /audit-logs | GET | /api/v1/audit-logs | {organizationId, userId, action, startDate, endDate, page, size} | {content: [], totalElements, totalPages} | ✅ MATCH |

## DRUG INTERACTIONS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Drug Interactions | /drug-interactions | GET | /api/v1/drug-interactions | {organizationId} | DrugInteraction[] | ✅ MATCH |
| Create Interaction | /drug-interactions | POST | /api/v1/drug-interactions | DrugInteractionRequest | DrugInteractionResponse | ✅ MATCH |
| Update Interaction | /drug-interactions/[id] | PUT | /api/v1/drug-interactions/{id} | DrugInteractionRequest | DrugInteractionResponse | ✅ MATCH |
| Delete Interaction | /drug-interactions/[id] | DELETE | /api/v1/drug-interactions/{id} | - | - | ✅ MATCH |

## NOTIFICATIONS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| Notifications | /notifications | GET | /api/v1/notifications | {userId, read, page, size} | {content: [], totalElements, totalPages} | ✅ MATCH |
| Mark as Read | /notifications/[id] | PUT | /api/v1/notifications/{id}/read | - | NotificationResponse | ✅ MATCH |

## SYSTEM SETTINGS

| Feature | Frontend Route | HTTP Method | Backend Endpoint | Request | Response | Status |
|---|---|---|---|---|---|---|
| System Settings | /system-settings | GET | /api/v1/system-settings | - | SystemSettings | ✅ MATCH |
| Update Settings | /system-settings | PUT | /api/v1/system-settings | SystemSettingsRequest | SystemSettingsResponse | ✅ MATCH |

## KEY ISSUES IDENTIFIED

1. **Dashboard Overview** - Returns 403 Forbidden (permission issue)
2. **Roles List** - Returns 403 Forbidden (permission issue)  
3. **Devices List** - Returns 403 Forbidden (permission issue)

These are permission-based access issues that need to be resolved by ensuring the user has the correct permissions or by adjusting the security configuration.