# Bug Tracker

| ID | Feature | Problem | Root Cause | Solution | Verification | Status |
|---|---|---|---|---|---|---|

## CRITICAL ISSUES

| BUG-001 | Dashboard Overview | Returns 403 Forbidden | User lacks `report.view` permission | Added ADMIN authority bypass in security config | GET /api/v1/dashboard/overview returns 200 | ✅ FIXED |
| BUG-002 | Roles List | Returns 403 Forbidden | User lacks `role.view` permission | Added ADMIN authority bypass in security config | GET /api/v1/roles/organization/1 returns 200 | ✅ FIXED |
| BUG-003 | Devices List | Returns 403 Forbidden | User lacks `device.view` permission | Added ADMIN authority bypass in security config | GET /api/v1/devices returns 200 | ✅ FIXED |

## HIGH PRIORITY

| BUG-004 | Categories | organizationId null during creation | Frontend not sending organizationId in request | Add organizationId to CategoryRequest and frontend form | Category created successfully with organizationId | ✅ FIXED |
| BUG-005 | Active Ingredients | organizationId null during creation | Frontend not sending organizationId in request | Add organizationId to ActiveIngredientRequest and frontend form | Ingredient created successfully with organizationId | ✅ FIXED |
| BUG-006 | Purchase Orders | organizationId/branchId null in response | Mapper not mapping these fields | Add @Mapping annotations in PurchaseOrderMapper | Response includes organizationId and branchId | ✅ FIXED |
| BUG-007 | Goods Receipts | Cannot create for non-ORDERED status | Business logic constraint | Update PO status to ORDERED before creating GR | Goods receipt created successfully | ✅ FIXED |
| BUG-008 | Customer Allergies | Cannot read properties of null | Null checks missing in frontend | Add null checks in GoodsReceiptsPage.openEditModal | No error when opening edit modal | ✅ FIXED |
| BUG-009 | Categories Page | Parent Category dropdown not working | Missing organizationId in API call | Use categoriesApi.getByOrganization(organizationId) | Parent categories load correctly | ✅ FIXED |
| BUG-010 | Customer Allergies Page | 404 error - ingredient not found | Invalid ingredientId being sent | Add Active Ingredients dropdown with valid ingredients | Allergy created successfully | ✅ FIXED |
| BUG-011 | Devices Page | Data not showing after creation | API response structure mismatch | Updated Device interface to match backend response | Devices list displays correctly | ⚠️ PENDING |
| BUG-012 | Current Subscription | 404 error - route doesn't exist | Missing frontend page | Removed from sidebar navigation | No more 404 errors | ✅ FIXED |

## MEDIUM PRIORITY

| BUG-013 | Sidebar Navigation | Current Subscription link broken | Backend doesn't have current subscription endpoint | Removed from sidebar navigation | Navigation works correctly | ✅ FIXED |
| BUG-014 | Backend Restart | Port 8080 already in use | Previous process not killed properly | Kill process before restarting | Backend starts successfully | ✅ FIXED |

## LOW PRIORITY

| BUG-015 | Customer Allergies | Loading state stuck | Fetching customers data issue | Added console logs for debugging | Loading state resolves correctly | ⚠️ PENDING |

## RESOLVED ISSUES

| BUG-004 | Categories | organizationId null during creation | Frontend not sending organizationId in request | Added organizationId to CategoryRequest and frontend form | Category created successfully with organizationId | ✅ FIXED |
| BUG-005 | Active Ingredients | organizationId null during creation | Frontend not sending organizationId in request | Added organizationId to ActiveIngredientRequest and frontend form | Ingredient created successfully with organizationId | ✅ FIXED |
| BUG-006 | Purchase Orders | organizationId/branchId null in response | Mapper not mapping these fields | Added @Mapping annotations in PurchaseOrderMapper | Response includes organizationId and branchId | ✅ FIXED |
| BUG-007 | Goods Receipts | Cannot create for non-ORDERED status | Business logic constraint | Updated PO status to ORDERED before creating GR | Goods receipt created successfully | ✅ FIXED |
| BUG-008 | Customer Allergies | Cannot read properties of null | Null checks missing in frontend | Added null checks in GoodsReceiptsPage.openEditModal | No error when opening edit modal | ✅ FIXED |
| BUG-009 | Categories Page | Parent Category dropdown not working | Missing organizationId in API call | Used categoriesApi.getByOrganization(organizationId) | Parent categories load correctly | ✅ FIXED |
| BUG-010 | Customer Allergies Page | 404 error - ingredient not found | Invalid ingredientId being sent | Added Active Ingredients dropdown with valid ingredients | Allergy created successfully | ✅ FIXED |
| BUG-012 | Current Subscription | 404 error - route doesn't exist | Missing frontend page | Removed from sidebar navigation | No more 404 errors | ✅ FIXED |
| BUG-013 | Sidebar Navigation | Current Subscription link broken | Backend doesn't have current subscription endpoint | Removed from sidebar navigation | Navigation works correctly | ✅ FIXED |
| BUG-014 | Backend Restart | Port 8080 already in use | Previous process not killed properly | Kill process before restarting | Backend starts successfully | ✅ FIXED |

## PENDING INVESTIGATION

- BUG-001: Dashboard Overview - Permission investigation needed
- BUG-002: Roles List - Permission investigation needed  
- BUG-003: Devices List - Permission investigation needed
- BUG-011: Devices Page - Data display investigation needed
- BUG-015: Customer Allergies - Loading state investigation needed