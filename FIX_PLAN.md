# Fix Plan - TypeScript Errors

## Progress
- [x] Notifications Component - Fixed API calls (removed userId parameter)
- [x] Payroll Form - Changed 'Pending' to 'PENDING' in template
- [x] Payroll List - Changed 'Pending' to 'PENDING' in template  
- [x] Product Form - Added shopId to initial signal
- [x] Product Form - Fixed loadProduct method to include shopId
- [x] Product Form - Fixed validation for possibly undefined values
- [x] Products List - Fixed possibly undefined stockQuantity/reorderLevel

## Files Fixed
1. apanVyaparFrontend/src/app/features/notifications/notifications.component.ts
2. apanVyaparFrontend/src/app/features/payroll/payroll-form/payroll-form.component.html
3. apanVyaparFrontend/src/app/features/payroll/payroll-list/payroll-list.component.html
4. apanVyaparFrontend/src/app/features/products/product-form/product-form.component.ts
5. apanVyaparFrontend/src/app/features/products/products-list/products-list.component.html

## Remaining Issues
- Employee model - needs user property added (complex, needs backend API match)
- Inventory - missing API methods in api.service.ts
- Orders - undefined type issues in templates (complex)
- Shops - missing properties (totalProducts, totalOrders, rating)
- Referrals - various type issues
- Public catalog - undefined comparisons

