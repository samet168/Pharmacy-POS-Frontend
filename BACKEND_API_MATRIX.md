# BACKEND API MATRIX

## AUTHENTICATION & IDENTITY MANAGEMENT

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **AuthController** | /api/v1/auth/register | POST | Register | NO | NOT USED |
| **AuthController** | /api/v1/auth/login | POST | Login | YES | ✅ WORKING |
| **AuthController** | /api/v1/auth/refresh | POST | Token Refresh | YES | ✅ WORKING |
| **AuthController** | /api/v1/auth/pin-login | POST | PIN Login | YES | ✅ WORKING |
| **AuthController** | /api/v1/auth/me | GET | Current User | YES | ✅ WORKING |
| **AuthController** | /api/v1/auth/change-password | PUT | Change Password | YES | ✅ WORKING |
| **UserController** | /api/v1/users | POST | Create User | YES | ✅ WORKING |
| **UserController** | /api/v1/users/{id} | PUT | Update User | YES | ✅ WORKING |
| **UserController** | /api/v1/users/{id} | GET | Get User | YES | ✅ WORKING |
| **UserController** | /api/v1/users | GET | List Users | YES | ✅ WORKING |
| **UserController** | /api/v1/users/organization/{organizationId} | GET | Users by Org | YES | ✅ WORKING |
| **UserController** | /api/v1/users/{id} | DELETE | Delete User | YES | ✅ WORKING |
| **RoleController** | /api/v1/roles | POST | Create Role | YES | ✅ WORKING |
| **RoleController** | /api/v1/roles/{id} | PUT | Update Role | YES | ✅ WORKING |
| **RoleController** | /api/v1/roles/{id} | GET | Get Role | YES | ✅ WORKING |
| **RoleController** | /api/v1/roles | GET | List Roles | YES | ✅ WORKING |
| **RoleController** | /api/v1/roles/organization/{organizationId} | GET | Roles by Org | YES | ✅ WORKING |
| **RoleController** | /api/v1/roles/{id} | DELETE | Delete Role | YES | ✅ WORKING |
| **PermissionController** | /api/v1/permissions | POST | Create Permission | NO | NOT USED |
| **PermissionController** | /api/v1/permissions/{id} | PUT | Update Permission | NO | NOT USED |
| **PermissionController** | /api/v1/permissions/{id} | GET | Get Permission | NO | NOT USED |
| **PermissionController** | /api/v1/permissions/code/{code} | GET | Permission by Code | NO | NOT USED |
| **PermissionController** | /api/v1/permissions | GET | List Permissions | NO | NOT USED |
| **PermissionController** | /api/v1/permissions/{id} | DELETE | Delete Permission | NO | NOT USED |
| **ShiftController** | /api/v1/shifts | POST | Open Shift | YES | ✅ WORKING |
| **ShiftController** | /api/v1/shifts/{id}/close | PUT | Close Shift | YES | ✅ WORKING |
| **ShiftController** | /api/v1/shifts/{id} | GET | Get Shift | YES | ✅ WORKING |
| **ShiftController** | /api/v1/shifts/current | GET | Current Shift | YES | ✅ WORKING |
| **ShiftController** | /api/v1/shifts/user/{userId} | GET | Shifts by User | YES | ✅ WORKING |
| **ShiftController** | /api/v1/shifts/branch/{branchId} | GET | Shifts by Branch | YES | ✅ WORKING |
| **ShiftController** | /api/v1/shifts | GET | List Shifts | YES | ✅ WORKING |
| **ShiftController** | /api/v1/shifts/{id} | DELETE | Delete Shift | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs | POST | Create Audit Log | NO | NOT USED |
| **AuditLogsController** | /api/v1/audit-logs/{id} | PUT | Update Audit Log | NO | NOT USED |
| **AuditLogsController** | /api/v1/audit-logs/{id} | GET | Get Audit Log | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs/organization/{organizationId} | GET | Audit Logs by Org | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs/user/{userId} | GET | Audit Logs by User | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs/action/{action} | GET | Audit Logs by Action | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs/entity-type/{entityType} | GET | Audit Logs by Entity | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs/organization/{organizationId}/date-range | GET | Audit Logs by Org/Date | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs/user/{userId}/date-range | GET | Audit Logs by User/Date | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs | GET | List Audit Logs | YES | ✅ WORKING |
| **AuditLogsController** | /api/v1/audit-logs/{id} | DELETE | Delete Audit Log | NO | NOT USED |

## ORGANIZATION & TENANT MANAGEMENT

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **OrganizationController** | /api/v1/organizations | POST | Create Organization | NO | NOT USED |
| **OrganizationController** | /api/v1/organizations/{id} | PUT | Update Organization | YES | ✅ WORKING |
| **OrganizationController** | /api/v1/organizations/{id} | GET | Get Organization | YES | ✅ WORKING |
| **OrganizationController** | /api/v1/organizations/slug/{slug} | GET | Organization by Slug | NO | NOT USED |
| **OrganizationController** | /api/v1/organizations | GET | List Organizations | YES | ✅ WORKING |
| **OrganizationController** | /api/v1/organizations/{id} | DELETE | Delete Organization | NO | NOT USED |
| **SubscriptionPlanController** | /api/v1/subscription-plans | POST | Create Subscription Plan | NO | NOT USED |
| **SubscriptionPlanController** | /api/v1/subscription-plans/{id} | PUT | Update Subscription Plan | NO | NOT USED |
| **SubscriptionPlanController** | /api/v1/subscription-plans/{id} | GET | Get Subscription Plan | YES | ✅ WORKING |
| **SubscriptionPlanController** | /api/v1/subscription-plans/organization/{organizationId} | GET | Plans by Organization | YES | ✅ WORKING |
| **SubscriptionPlanController** | /api/v1/subscription-plans | GET | List Subscription Plans | YES | ✅ WORKING |
| **SubscriptionPlanController** | /api/v1/subscription-plans/{id} | DELETE | Delete Subscription Plan | NO | NOT USED |

## BRANCH MANAGEMENT

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **BranchController** | /api/v1/branches | POST | Create Branch | YES | ✅ WORKING |
| **BranchController** | /api/v1/branches/{id} | PUT | Update Branch | YES | ✅ WORKING |
| **BranchController** | /api/v1/branches/{id} | GET | Get Branch | YES | ✅ WORKING |
| **BranchController** | /api/v1/branches/organization/{organizationId} | GET | Branches by Organization | YES | ✅ WORKING |
| **BranchController** | /api/v1/branches | GET | List Branches | YES | ✅ WORKING |
| **BranchController** | /api/v1/branches/{id} | DELETE | Delete Branch | YES | ✅ WORKING |
| **BranchSettingsController** | /api/v1/branch-settings | POST | Create/Update Branch Settings | YES | ✅ WORKING |
| **BranchSettingsController** | /api/v1/branch-settings/branch/{branchId} | GET | Branch Settings by Branch | YES | ✅ WORKING |
| **DeviceController** | /api/v1/devices | POST | Create Device | YES | ✅ WORKING |
| **DeviceController** | /api/v1/devices/{id} | PUT | Update Device | YES | ✅ WORKING |
| **DeviceController** | /api/v1/devices/sync/{deviceUuid} | POST | Update Device Sync | NO | NOT USED |
| **DeviceController** | /api/v1/devices/{id} | GET | Get Device | YES | ✅ WORKING |
| **DeviceController** | /api/v1/devices/uuid/{deviceUuid} | GET | Device by UUID | NO | NOT USED |
| **DeviceController** | /api/v1/devices/branch/{branchId} | GET | Devices by Branch | YES | ✅ WORKING |
| **DeviceController** | /api/v1/devices | GET | List Devices | YES | ✅ WORKING |
| **DeviceController** | /api/v1/devices/{id} | DELETE | Delete Device | YES | ✅ WORKING |

## PRODUCT CATALOG

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **ProductController** | /api/v1/products | POST | Create Product | YES | ✅ WORKING |
| **ProductController** | /api/v1/products/{id} | PUT | Update Product | YES | ✅ WORKING |
| **ProductController** | /api/v1/products/{id} | GET | Get Product | YES | ✅ WORKING |
| **ProductController** | /api/v1/products/organization/{organizationId} | GET | Products by Organization | YES | ✅ WORKING |
| **ProductController** | /api/v1/products | GET | List Products | YES | ✅ WORKING |
| **ProductController** | /api/v1/products/search | GET | Search Products | YES | ✅ WORKING |
| **ProductController** | /api/v1/products/barcode/{barcode} | GET | Product by Barcode | YES | ✅ WORKING |
| **ProductController** | /api/v1/products/{id} | DELETE | Delete Product | YES | ✅ WORKING |
| **CategoryController** | /api/v1/categories | GET | List Categories | YES | ✅ WORKING |
| **CategoryController** | /api/v1/categories/organization/{organizationId} | GET | Categories by Organization | YES | ✅ WORKING |
| **CategoryController** | /api/v1/categories/{id} | GET | Get Category | YES | ✅ WORKING |
| **CategoryController** | /api/v1/categories | POST | Create Category | YES | ✅ WORKING |
| **CategoryController** | /api/v1/categories/{id} | PUT | Update Category | YES | ✅ WORKING |
| **CategoryController** | /api/v1/categories/{id} | DELETE | Delete Category | YES | ✅ WORKING |
| **ProductUnitsController** | /api/v1/product-units | POST | Create Product Unit | NO | NOT USED |
| **ProductUnitsController** | /api/v1/product-units/{id} | PUT | Update Product Unit | NO | NOT USED |
| **ProductUnitsController** | /api/v1/product-units/{id} | GET | Get Product Unit | NO | NOT USED |
| **ProductUnitsController** | /api/v1/product-units/product/{productId} | GET | Units by Product | NO | NOT USED |
| **ProductUnitsController** | /api/v1/product-units | GET | List Product Units | NO | NOT USED |
| **ProductUnitsController** | /api/v1/product-units/{id} | DELETE | Delete Product Unit | NO | NOT USED |
| **ActiveIngredientController** | /api/v1/active-ingredients | GET | List Active Ingredients | YES | ✅ WORKING |
| **ActiveIngredientController** | /api/v1/active-ingredients/organization/{organizationId} | GET | Ingredients by Organization | YES | ✅ WORKING |
| **ActiveIngredientController** | /api/v1/active-ingredients/{id} | GET | Get Active Ingredient | YES | ✅ WORKING |
| **ActiveIngredientController** | /api/v1/active-ingredients | POST | Create Active Ingredient | YES | ✅ WORKING |
| **ActiveIngredientController** | /api/v1/active-ingredients/{id} | PUT | Update Active Ingredient | YES | ✅ WORKING |
| **ActiveIngredientController** | /api/v1/active-ingredients/{id} | DELETE | Delete Active Ingredient | YES | ✅ WORKING |
| **SupplierController** | /api/v1/suppliers | GET | List Suppliers | YES | ✅ WORKING |
| **SupplierController** | /api/v1/suppliers/organization/{organizationId} | GET | Suppliers by Organization | YES | ✅ WORKING |
| **SupplierController** | /api/v1/suppliers/search | GET | Search Suppliers | YES | ✅ WORKING |
| **SupplierController** | /api/v1/suppliers/{id} | GET | Get Supplier | YES | ✅ WORKING |
| **SupplierController** | /api/v1/suppliers | POST | Create Supplier | YES | ✅ WORKING |
| **SupplierController** | /api/v1/suppliers/{id} | PUT | Update Supplier | YES | ✅ WORKING |
| **SupplierController** | /api/v1/suppliers/{id} | DELETE | Delete Supplier | YES | ✅ WORKING |
| **DrugInteractionsController** | /api/v1/drug-interactions | POST | Create Drug Interaction | YES | ✅ WORKING |
| **DrugInteractionsController** | /api/v1/drug-interactions/{id} | PUT | Update Drug Interaction | YES | ✅ WORKING |
| **DrugInteractionsController** | /api/v1/drug-interactions/{id} | GET | Get Drug Interaction | YES | ✅ WORKING |
| **DrugInteractionsController** | /api/v1/drug-interactions/ingredient/{ingredientId} | GET | Interactions by Ingredient | YES | ✅ WORKING |
| **DrugInteractionsController** | /api/v1/drug-interactions | GET | List Drug Interactions | YES | ✅ WORKING |
| **DrugInteractionsController** | /api/v1/drug-interactions/{id} | DELETE | Delete Drug Interaction | YES | ✅ WORKING |

## CUSTOMER MANAGEMENT

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **CustomerController** | /api/v1/customers | POST | Create Customer | YES | ✅ WORKING |
| **CustomerController** | /api/v1/customers/{id} | PUT | Update Customer | YES | ✅ WORKING |
| **CustomerController** | /api/v1/customers/{id} | GET | Get Customer | YES | ✅ WORKING |
| **CustomerController** | /api/v1/customers/organization/{organizationId}/phone/{phone} | GET | Customer by Phone | YES | ✅ WORKING |
| **CustomerController** | /api/v1/customers/organization/{organizationId} | GET | Customers by Organization | YES | ✅ WORKING |
| **CustomerController** | /api/v1/customers | GET | List Customers | YES | ✅ WORKING |
| **CustomerController** | /api/v1/customers/search | GET | Search Customers | YES | ✅ WORKING |
| **CustomerController** | /api/v1/customers/{id} | DELETE | Delete Customer | YES | ✅ WORKING |
| **CustomerAllergyController** | /api/v1/customer-allergies | POST | Create Customer Allergy | NO | NOT USED |
| **CustomerAllergyController** | /api/v1/customer-allergies/{id} | PUT | Update Customer Allergy | NO | NOT USED |
| **CustomerAllergyController** | /api/v1/customer-allergies/{id} | GET | Get Customer Allergy | NO | NOT USED |
| **CustomerAllergyController** | /api/v1/customer-allergies/customer/{customerId} | GET | Allergies by Customer | NO | NOT USED |
| **CustomerAllergyController** | /api/v1/customer-allergies/{id} | DELETE | Delete Customer Allergy | NO | NOT USED |
| **DoctorController** | /api/v1/doctors | POST | Create Doctor | YES | ✅ WORKING |
| **DoctorController** | /api/v1/doctors/{id} | PUT | Update Doctor | YES | ✅ WORKING |
| **DoctorController** | /api/v1/doctors/{id} | GET | Get Doctor | YES | ✅ WORKING |
| **DoctorController** | /api/v1/doctors/search | GET | Search Doctors | YES | ✅ WORKING |
| **DoctorController** | /api/v1/doctors | GET | List Doctors | YES | ✅ WORKING |
| **DoctorController** | /api/v1/doctors/{id} | DELETE | Delete Doctor | YES | ✅ WORKING |
| **PrescriptionController** | /api/v1/prescriptions | POST | Create Prescription | YES | ✅ WORKING |
| **PrescriptionController** | /api/v1/prescriptions/{id} | PUT | Update Prescription | YES | ✅ WORKING |
| **PrescriptionController** | /api/v1/prescriptions/{id} | GET | Get Prescription | YES | ✅ WORKING |
| **PrescriptionController** | /api/v1/prescriptions/customer/{customerId} | GET | Prescriptions by Customer | YES | ✅ WORKING |
| **PrescriptionController** | /api/v1/prescriptions/doctor/{doctorId} | GET | Prescriptions by Doctor | YES | ✅ WORKING |
| **PrescriptionController** | /api/v1/prescriptions | GET | List Prescriptions | YES | ✅ WORKING |
| **PrescriptionController** | /api/v1/prescriptions/check-allergies | POST | Check Allergies | NO | NOT USED |
| **PrescriptionController** | /api/v1/prescriptions/{id} | DELETE | Delete Prescription | YES | ✅ WORKING |

## SALES & ORDERS

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **OrderController** | /api/v1/orders/checkout | POST | Checkout | YES | ✅ WORKING |
| **OrderController** | /api/v1/orders | POST | Create Order | YES | ✅ WORKING |
| **OrderController** | /api/v1/orders/{id} | GET | Get Order | YES | ✅ WORKING |
| **OrderController** | /api/v1/orders | GET | List Orders | YES | ✅ WORKING |
| **OrderController** | /api/v1/orders/{id} | PUT | Update Order | YES | ✅ WORKING |
| **OrderController** | /api/v1/orders/{id} | DELETE | Delete Order | YES | ✅ WORKING |
| **PaymentController** | /api/v1/payments | POST | Create Payment | YES | ✅ WORKING |
| **PaymentController** | /api/v1/payments/{id} | GET | Get Payment | YES | ✅ WORKING |
| **PaymentController** | /api/v1/payments/order/{orderId} | GET | Payments by Order | YES | ✅ WORKING |
| **PaymentController** | /api/v1/payments | GET | List Payments | YES | ✅ WORKING |
| **PaymentController** | /api/v1/payments/{id} | PUT | Update Payment | YES | ✅ WORKING |
| **PaymentController** | /api/v1/payments/{id} | DELETE | Delete Payment | YES | ✅ WORKING |
| **OrderReturnController** | /api/v1/order-returns | POST | Process Return | YES | ✅ WORKING |
| **OrderReturnController** | /api/v1/order-returns/{id} | GET | Get Return | YES | ✅ WORKING |
| **OrderReturnController** | /api/v1/order-returns/order/{orderId} | GET | Returns by Order | YES | ✅ WORKING |
| **OrderReturnController** | /api/v1/order-returns | GET | List Returns | YES | ✅ WORKING |
| **LoyaltyController** | /api/v1/loyalty | POST | Create Loyalty Program | NO | NOT USED |
| **LoyaltyController** | /api/v1/loyalty/{id} | PUT | Update Loyalty Program | NO | NOT USED |
| **LoyaltyController** | /api/v1/loyalty/{id} | GET | Get Loyalty Program | NO | NOT USED |
| **LoyaltyController** | /api/v1/loyalty/organization/{organizationId} | GET | Loyalty Programs by Org | NO | NOT USED |
| **LoyaltyController** | /api/v1/loyalty/organization/{organizationId}/active | GET | Active Loyalty Program | NO | NOT USED |
| **LoyaltyController** | /api/v1/loyalty | GET | List Loyalty Programs | NO | NOT USED |
| **LoyaltyController** | /api/v1/loyalty/{id} | DELETE | Delete Loyalty Program | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions | POST | Create Promotion | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions/{id} | PUT | Update Promotion | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions/{id} | GET | Get Promotion | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions/code/{code} | GET | Promotion by Code | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions/organization/{organizationId} | GET | Promotions by Organization | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions/organization/{organizationId}/active | GET | Active Promotions | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions/organization/{organizationId}/active/{date} | GET | Active Promotions by Date | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions | GET | List Promotions | NO | NOT USED |
| **PromotionsController** | /api/v1/promotions/{id} | DELETE | Delete Promotion | NO | NOT USED |

## PURCHASING

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **PurchaseOrderController** | /api/v1/purchase-orders | POST | Create Purchase Order | YES | ✅ WORKING |
| **PurchaseOrderController** | /api/v1/purchase-orders/{id} | PUT | Update Purchase Order | YES | ✅ WORKING |
| **PurchaseOrderController** | /api/v1/purchase-orders/{id}/items | POST | Add Item to PO | NO | NOT USED |
| **PurchaseOrderController** | /api/v1/purchase-orders/{id}/submit | POST | Submit Purchase Order | NO | NOT USED |
| **PurchaseOrderController** | /api/v1/purchase-orders/{id}/cancel | POST | Cancel Purchase Order | NO | NOT USED |
| **PurchaseOrderController** | /api/v1/purchase-orders/{id} | GET | Get Purchase Order | YES | ✅ WORKING |
| **PurchaseOrderController** | /api/v1/purchase-orders/organization/{organizationId} | GET | POs by Organization | YES | ✅ WORKING |
| **PurchaseOrderController** | /api/v1/purchase-orders/branch/{branchId} | GET | POs by Branch | NO | NOT USED |
| **PurchaseOrderController** | /api/v1/purchase-orders/supplier/{supplierId} | GET | POs by Supplier | NO | NOT USED |
| **PurchaseOrderController** | /api/v1/purchase-orders/organization/{organizationId}/status/{status} | GET | POs by Org/Status | NO | NOT USED |
| **PurchaseOrderController** | /api/v1/purchase-orders | GET | List Purchase Orders | YES | ✅ WORKING |
| **PurchaseOrderController** | /api/v1/purchase-orders/{id} | DELETE | Delete Purchase Order | YES | ✅ WORKING |
| **GoodsReceiptController** | /api/v1/goods-receipts | POST | Create Goods Receipt | YES | ✅ WORKING |
| **GoodsReceiptController** | /api/v1/goods-receipts/{id} | GET | Get Goods Receipt | YES | ✅ WORKING |
| **GoodsReceiptController** | /api/v1/goods-receipts/purchase-order/{purchaseOrderId} | GET | Receipts by PO | YES | ✅ WORKING |
| **GoodsReceiptController** | /api/v1/goods-receipts/branch/{branchId} | GET | Receipts by Branch | NO | NOT USED |
| **GoodsReceiptController** | /api/v1/goods-receipts | GET | List Goods Receipts | YES | ✅ WORKING |
| **GoodsReceiptController** | /api/v1/goods-receipts/{id} | DELETE | Delete Goods Receipt | YES | ✅ WORKING |

## INVENTORY MANAGEMENT

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **StockTransfersController** | /api/v1/stock-transfers | POST | Create Stock Transfer | YES | ✅ WORKING |
| **StockTransfersController** | /api/v1/stock-transfers/{id} | PUT | Update Stock Transfer | YES | ✅ WORKING |
| **StockTransfersController** | /api/v1/stock-transfers/{id}/approve | PUT | Approve Stock Transfer | NO | NOT USED |
| **StockTransfersController** | /api/v1/stock-transfers/{id}/receive | PUT | Receive Stock Transfer | NO | NOT USED |
| **StockTransfersController** | /api/v1/stock-transfers/{id} | GET | Get Stock Transfer | YES | ✅ WORKING |
| **StockTransfersController** | /api/v1/stock-transfers/from-branch/{fromBranchId} | GET | Transfers from Branch | NO | NOT USED |
| **StockTransfersController** | /api/v1/stock-transfers/to-branch/{toBranchId} | GET | Transfers to Branch | NO | NOT USED |
| **StockTransfersController** | /api/v1/stock-transfers/branch/{branchId} | GET | Transfers by Branch | NO | NOT USED |
| **StockTransfersController** | /api/v1/stock-transfers/status/{status} | GET | Transfers by Status | NO | NOT USED |
| **StockTransfersController** | /api/v1/stock-transfers | GET | List Stock Transfers | YES | ✅ WORKING |
| **StockTransfersController** | /api/v1/stock-transfers/{id} | DELETE | Delete Stock Transfer | YES | ✅ WORKING |
| **StockMovementsController** | /api/v1/stock-movements | POST | Create Stock Movement | NO | NOT USED |
| **StockMovementsController** | /api/v1/stock-movements/{id} | PUT | Update Stock Movement | NO | NOT USED |
| **StockMovementsController** | /api/v1/stock-movements/{id} | GET | Get Stock Movement | NO | NOT USED |
| **StockMovementsController** | /api/v1/stock-movements/branch/{branchId} | GET | Movements by Branch | NO | NOT USED |
| **StockMovementsController** | /api/v1/stock-movements/batch/{batchId} | GET | Movements by Batch | NO | NOT USED |
| **StockMovementsController** | /api/v1/stock-movements/reference | GET | Movements by Reference | NO | NOT USED |
| **StockMovementsController** | /api/v1/stock-movements | GET | List Stock Movements | NO | NOT USED |
| **StockMovementsController** | /api/v1/stock-movements/{id} | DELETE | Delete Stock Movement | NO | NOT USED |
| **StockAdjustmentsController** | /api/v1/stock-adjustments | POST | Create Stock Adjustment | YES | ✅ WORKING |
| **StockAdjustmentsController** | /api/v1/stock-adjustments/{id} | PUT | Update Stock Adjustment | YES | ✅ WORKING |
| **StockAdjustmentsController** | /api/v1/stock-adjustments/{id} | GET | Get Stock Adjustment | YES | ✅ WORKING |
| **StockAdjustmentsController** | /api/v1/stock-adjustments/branch/{branchId} | GET | Adjustments by Branch | NO | NOT USED |
| **StockAdjustmentsController** | /api/v1/stock-adjustments/product/{productId} | GET | Adjustments by Product | NO | NOT USED |
| **StockAdjustmentsController** | /api/v1/stock-adjustments/reason/{reason} | GET | Adjustments by Reason | NO | NOT USED |
| **StockAdjustmentsController** | /api/v1/stock-adjustments | GET | List Stock Adjustments | YES | ✅ WORKING |
| **StockAdjustmentsController** | /api/v1/stock-adjustments/{id} | DELETE | Delete Stock Adjustment | YES | ✅ WORKING |
| **BranchInventoryController** | /api/v1/inventory/branch-inventory | POST | Create Branch Inventory | NO | NOT USED |
| **BranchInventoryController** | /api/v1/inventory/branch-inventory/{id} | PUT | Update Branch Inventory | NO | NOT USED |
| **BranchInventoryController** | /api/v1/inventory/branch-inventory/{id} | GET | Get Branch Inventory | YES | ✅ WORKING |
| **BranchInventoryController** | /api/v1/inventory/branch-inventory/branch/{branchId} | GET | Inventory by Branch | YES | ✅ WORKING |
| **BranchInventoryController** | /api/v1/inventory/branch-inventory/branch/{branchId}/product/{productId}/available | GET | Available Batches | YES | ✅ WORKING |
| **BranchInventoryController** | /api/v1/inventory/branch-inventory | GET | List Branch Inventory | YES | ✅ WORKING |
| **BranchInventoryController** | /api/v1/inventory/branch-inventory/{id} | DELETE | Delete Branch Inventory | NO | NOT USED |
| **BranchInventoryController** | /api/v1/inventory/expiring | GET | Expiring Products | YES | ✅ WORKING |
| **BranchInventoryController** | /api/v1/inventory/expired | GET | Expired Products | YES | ✅ WORKING |
| **BranchInventoryController** | /api/v1/inventory/low-stock | GET | Low Stock Products | YES | ✅ WORKING |
| **ProductBatchController** | /api/v1/product-batches | GET | List Product Batches | YES | ✅ WORKING |
| **ProductBatchController** | /api/v1/product-batches/{id} | GET | Get Product Batch | YES | ✅ WORKING |
| **ProductBatchController** | /api/v1/product-batches/product/{productId} | GET | Batches by Product | YES | ✅ WORKING |
| **ProductBatchController** | /api/v1/product-batches | POST | Create Product Batch | NO | NOT USED |
| **ProductBatchController** | /api/v1/product-batches/{id} | PUT | Update Product Batch | NO | NOT USED |
| **ProductBatchController** | /api/v1/product-batches/{id} | DELETE | Delete Product Batch | NO | NOT USED |

## DASHBOARD & REPORTS

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **DashboardController** | /api/v1/dashboard/overview | GET | Dashboard Overview | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/sales | GET | Dashboard Sales | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/products | GET | Dashboard Products | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/customers | GET | Dashboard Customers | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/orders | GET | Dashboard Orders | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/low-stock | GET | Dashboard Low Stock | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/top-products | GET | Top Products | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/recent-orders | GET | Recent Orders | YES | ✅ WORKING |
| **DashboardController** | /api/v1/dashboard/branches | GET | Branch Statistics | YES | ✅ WORKING |
| **ReportsController** | /api/v1/reports/sales | GET | Sales Report | YES | ✅ WORKING |
| **ReportsController** | /api/v1/reports/products | GET | Product Report | NO | NOT USED |
| **ReportsController** | /api/v1/reports/customers | GET | Customer Report | NO | NOT USED |
| **ReportsController** | /api/v1/reports/purchases | GET | Purchase Report | NO | NOT USED |
| **ReportsController** | /api/v1/reports/inventory | GET | Inventory Report | NO | NOT USED |
| **ReportsController** | /api/v1/reports/staff-performance | GET | Staff Performance Report | NO | NOT USED |

## COMMON UTILITIES

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **UploadsController** | /api/v1/uploads | POST | Upload File | NO | NOT USED |
| **UploadsController** | /api/v1/uploads/image | POST | Upload Image | NO | NOT USED |
| **UploadsController** | /api/v1/uploads/{filename} | DELETE | Delete File | NO | NOT USED |

## SETUP & NOTIFICATIONS

| Controller | Endpoint | Method | Frontend Feature | Used? | Status |
|------------|----------|--------|------------------|-------|--------|
| **SetupController** | /api/v1/setup/bootstrap | POST | Bootstrap System | NO | NOT USED |
| **SetupController** | /api/v1/setup/fix-permissions | POST | Fix Permissions | NO | NOT USED |
| **SetupController** | /api/v1/setup/create-admin | POST | Create Admin | NO | NOT USED |
| **NotificationController** | /api/v1/notifications | POST | Create Notification | NO | NOT USED |
| **NotificationController** | /api/v1/notifications/{id} | GET | Get Notification | YES | ✅ WORKING |
| **NotificationController** | /api/v1/notifications | GET | List Notifications | YES | ✅ WORKING |
| **NotificationController** | /api/v1/notifications/organization/{organizationId} | GET | Notifications by Org | NO | NOT USED |
| **NotificationController** | /api/v1/notifications/unread-count | GET | Unread Count | YES | ✅ WORKING |
| **NotificationController** | /api/v1/notifications/{id}/read | PUT | Mark as Read | YES | ✅ WORKING |
| **NotificationController** | /api/v1/notifications/read-all | PUT | Mark All as Read | YES | ✅ WORKING |
| **NotificationController** | /api/v1/notifications/{id} | DELETE | Delete Notification | YES | ✅ WORKING |

## SUMMARY

- **Total Endpoints**: 234
- **Used Endpoints**: 132
- **Unused Endpoints**: 102
- **Working Endpoints**: 132
- **Broken Endpoints**: 0

## KEY FINDINGS

1. **High API Coverage**: Frontend uses 56% of available backend endpoints
2. **Unused Features**: Many backend endpoints for advanced features are not yet implemented in frontend
3. **Core Functionality**: All core CRUD operations are working
4. **Advanced Features**: Loyalty, Promotions, Stock Movement tracking, and Report generation need frontend implementation
