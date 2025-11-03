# Route Exploration Summary: /dashboard/profile/employment

**Date**: 2025-11-02  
**Exploration Task**: fc4f40ed-77ed-4629-84df-c40226fe1758  
**TEST Ticket Created**: 0a816d12-f796-462b-a739-5fa0d34de806  
**Method**: Code Review (Batch 3 Success Pattern)

---

## Summary

Successfully explored the `/dashboard/profile/employment` route using comprehensive code review methodology. This route manages employment preferences including work locations, travel willingness, residency, licensing, military status, availability, and compensation.

### Key Features Documented

1. **Hourly Rate Input** - Numeric input with validation (0-200 dollars)
2. **Preferred Work Locations** - LocationListInput with Mapbox autocomplete (max 3)
3. **Travel Preferences** - ToggleCard with expandable slider (5-100 miles)
4. **Residency Status** - Two ToggleCards (US Resident, US Passport)
5. **Driver's License** - ToggleCard with 7 multi-select checkboxes
6. **Military Status** - ToggleCard with 5 multi-select checkboxes
7. **Availability** - ToggleCard with 8 multi-select checkboxes
8. **Save Button** - With loading state and dirty detection

### tRPC Endpoints

- `profile.getEmployment` (Query) - Fetches employment data from `private.profile`
- `profile.updateEmployment` (Mutation) - Updates employment preferences with validation

### Components Used

- **ToggleCard** - Expandable card with toggle switch and nested content
- **LocationListInput** - Mapbox-powered location autocomplete
- **Tamagui Components** - Input, Slider, Checkbox, Label, Button, Spinner

### Validation Schema

Located: `packages/core/features/profile/config/employment-schema.ts`
- Zod-based validation
- Real-time validation (onChange mode)
- Comprehensive field-level validation

---

## Files Reviewed

1. `apps/expo/app/dashboard/profile/employment/index.tsx`
2. `packages/core/features/profile/profile-employment-left.tsx`
3. `packages/core/features/profile/profile-employment-right.tsx`
4. `packages/core/features/profile/config/employment-schema.ts`
5. `packages/supabase/functions/trpc/routers/profile/employment.router.ts`
6. `packages/ui/src/components/inputs/ToggleCard.tsx`
7. `packages/ui/src/components/address/LocationListInput.tsx`

---

## Documentation Created

**Main Documentation**: `docs/testing/route-admin-019-dashboard-profile-employment.md`

Includes:
- Feature component breakdown (8 main features)
- tRPC endpoint documentation
- Form validation rules
- UI component details
- State management patterns
- User flow documentation
- 10 critical test cases
- Edge cases and accessibility notes
- Schema constants
- Database schema

---

## TEST Ticket

**ID**: 0a816d12-f796-462b-a739-5fa0d34de806  
**Title**: TEST: /dashboard/profile/employment - Admin Employment Preferences

**Test Coverage**:
- 8 form field categories
- 10 test scenarios
- Edge cases
- Validation testing
- Data persistence testing
- Multi-select checkbox behavior
- ToggleCard expand/collapse
- Location autocomplete
- Slider interaction

---

## Next Steps

1. ✅ Exploration complete
2. ✅ Documentation created
3. ✅ TEST ticket created
4. ✅ Original task marked done
5. ⏭️ Implement comprehensive Playwright test suite

---

## Notes

- **Code Review Method**: More efficient than interactive Playwright exploration
- **Components**: Complex nested forms with ToggleCards and multi-select checkboxes
- **Validation**: Real-time Zod validation with React Hook Form
- **Database**: Uses `private.profile` table with cents conversion for hourly rate
- **UX**: Auto-expanding ToggleCards when values exist
- **Edge Cases**: Toggle collapse clears nested checkbox values

---

**Status**: ✅ Complete
