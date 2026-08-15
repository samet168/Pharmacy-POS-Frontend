# BUG TRACKER

| ID | Feature | Problem | Root Cause | Fix | Test Result | Status |
|---|---|---|---|---|---|---|

## BUG LOG

### FIXED BUGS

**BUG-001**
- **Feature**: Roles & Permissions
- **Problem**: Frontend had `description` field but backend didn't
- **Root Cause**: DTO mismatch between frontend RoleRequest and backend
- **Fix**: Removed `description` field from frontend formData and modals
- **Test**: Create/Update/Delete roles working
- **Status**: ✅ FIXED

**BUG-002**
- **Feature**: Branch Settings
- **Problem**: `branches.map is not a function` error
- **Root Cause**: API returned PageResponse object, frontend expected array
- **Fix**: Added proper PageResponse unwrapping with fallback
- **Test**: Branch settings page loads correctly
- **Status**: ✅ FIXED

**BUG-003**
- **Feature**: Branch Settings
- **Problem**: `useAuthStore is not defined` error
- **Root Cause**: Missing import for useAuthStore
- **Fix**: Added correct import path for useAuthStore
- **Test**: Branch settings page loads correctly
- **Status**: ✅ FIXED

**BUG-004**
- **Feature**: Users
- **Problem**: `useAuthStore is not defined` error
- **Root Cause**: Missing import for useAuthStore
- **Fix**: Added correct import path for useAuthStore
- **Test**: Users page loads correctly
- **Status**: ✅ FIXED

**BUG-005**
- **Feature**: Roles & Permissions
- **Problem**: Backend 500 error when fetching roles by organization
- **Root Cause**: Missing `getByOrganization` endpoint in backend
- **Fix**: Added `getByOrganization` method to RoleController, RoleService, RoleRepository
- **Test**: Roles load correctly by organization
- **Status**: ✅ FIXED

**BUG-006**
- **Feature**: Users
- **Problem**: Backend 500 error when fetching users by organization
- **Root Cause**: Missing `getByOrganization` endpoint in backend
- **Fix**: Added `getByOrganization` method to UserController, UserService, UserRepository
- **Test**: Users load correctly by organization
- **Status**: ✅ FIXED

**BUG-007**
- **Feature**: Navigation
- **Problem**: "Roles" menu item pointed to incorrect path
- **Root Cause**: Wrong route in BackofficeLayout navigation
- **Fix**: Changed path from `/roles` to `/roles-permissions`
- **Test**: Navigation to roles works correctly
- **Status**: ✅ FIXED

**BUG-008**
- **Feature**: Navigation
- **Problem**: "Security" menu item caused 404 error
- **Root Cause**: Navigation pointed to non-existent `/settings/security` page
- **Fix**: Removed Security menu item from sidebar
- **Test**: No more 404 errors in settings
- **Status**: ✅ FIXED

**BUG-009**
- **Feature**: Customers
- **Problem**: `useAuthStore is not defined` error
- **Root Cause**: Missing import for useAuthStore
- **Fix**: Added correct import path for useAuthStore
- **Test**: Customers page loads correctly
- **Status**: ✅ FIXED

**BUG-010**
- **Feature**: Suppliers
- **Problem**: Backend 500 error when creating supplier
- **Root Cause**: SupplierRequest missing required `organizationId` field
- **Fix**: Added `organizationId` field with `@NotNull` validation to SupplierRequest
- **Test**: Supplier creation works correctly
- **Status**: ✅ FIXED

**BUG-011**
- **Feature**: Users, Products, Customers, Doctors
- **Problem**: Image upload functionality not working for update operations
- **Root Cause**: API client `upload` method always used POST instead of PUT for updates
- **Fix**: Added `method` parameter to upload method, updated all update calls to use 'PUT'
- **Test**: Image upload works for create and update operations
- **Status**: ✅ FIXED

### ACTIVE BUGS

*No active bugs currently being investigated*

### KNOWN ISSUES

**ISSUE-001**
- **Feature**: Cloudinary Images
- **Problem**: Some product images return 404 errors
- **Root Cause**: Old image URLs pointing to non-existent Cloudinary resources
- **Impact**: Minor - broken image icons in product list
- **Status**: 📝 DOCUMENTED - Will be resolved as products are updated with new images

**ISSUE-002**
- **Feature**: Navigation
- **Problem**: Some navigation items point to non-existent pages
- **Root Cause**: Incomplete frontend implementation
- **Impact**: Medium - broken navigation links
- **Affected Pages**: 
  - /devices/terminals
  - /shifts/current
  - /shifts/open
  - /reports/products
  - /reports/customers
  - /reports/purchases
  - /reports/inventory
  - /notifications/announcements
  - /audit-logs/activity
  - /customer-allergies
- **Status**: 📝 DOCUMENTED - Pages need to be implemented or navigation items removed

## BUG STATISTICS
- **Total Bugs Found**: 11
- **Total Bugs Fixed**: 11
- **Active Bugs**: 0
- **Known Issues**: 2
- **Fix Rate**: 100%
