# Story: Implement Neighborhoods Feature

<!-- Source: User-defined enhancement request -->
<!-- Context: Brownfield enhancement to existing Harmony Spaces platform -->

## Status: Draft

## Story

As a local community member,
I want to join and participate in my verified neighborhood community,
so that I can connect with actual neighbors and access hyper-local events and spaces.

As a neighborhood gate holder,
I want to manage neighborhood membership and invite non-residents,
so that I can build a trusted local community while allowing selected non-local participants.

## Context Source

- Source Document: brownfield-architecture.md + user requirements
- Enhancement Type: New feature with significant integration
- Existing System Impact: Extends profiles, events, spaces, and adds new neighborhood entity

## Acceptance Criteria

1. **Neighborhood Creation and Management**
   - [ ] Neighborhoods can be created with defined geographic boundaries
   - [ ] Each neighborhood has one or more gate holders who manage membership
   - [ ] Neighborhoods have their own community page with local events, spaces, and members

2. **Geo-Verification for Residents**
   - [ ] Users can request verification for their local neighborhood
   - [ ] System verifies user's address falls within neighborhood boundaries
   - [ ] Verified residents get automatic access to their neighborhood

3. **Gate Holder Invitation System**
   - [ ] Gate holders can invite non-residents to join the neighborhood
   - [ ] Invited users have special "invited" status visible in the neighborhood
   - [ ] Gate holders can revoke access if needed

4. **Integration with Existing Features**
   - [ ] Existing profile neighborhood field continues to work unchanged
   - [ ] Events can be marked as "neighborhood only"
   - [ ] Spaces can be restricted to neighborhood members
   - [ ] Search and discovery respect neighborhood boundaries
   - [ ] All existing functionality remains unaffected

5. **Premium Feature Access**
   - [ ] Neighborhood features are marked as premium
   - [ ] Clear upgrade path for users wanting neighborhood access
   - [ ] Graceful degradation for non-premium users

## Dev Technical Guidance

### Existing System Context

From the brownfield analysis:
- **Current neighborhood handling**: Simple text field in profiles table (line 40 in supabase.ts)
- **Location data**: Events and spaces already have latitude/longitude fields
- **No geo-spatial queries**: Currently just storing coordinates, not using them
- **Authentication**: Supabase Auth with custom profile management via useAuth hook
- **Database**: PostgreSQL via Supabase with Row Level Security

### Integration Approach

1. **Database Schema Extension**
   - Create new `neighborhoods` table for neighborhood entities
   - Create `neighborhood_members` junction table for membership
   - Create `neighborhood_boundaries` table for geo-polygons
   - Extend existing profiles with `verified_address` and `neighborhood_id`
   - Add PostGIS extension for geo-spatial queries

2. **Follow Existing Patterns**
   - Add types to `src/lib/supabase.ts` (currently 1857 lines - needs refactoring)
   - Create direct Supabase queries in components (current pattern, though not ideal)
   - Use existing auth context via `useAuthContext` hook
   - Follow Tailwind styling with forest/earth theme colors

3. **Component Structure**
   - Create new pages in `src/pages/` directory
   - Add neighborhood components in `src/components/`
   - Follow pattern of large page files (like Account.tsx at 1640 lines)

### Technical Constraints

1. **No State Management**: Must work with local component state only
2. **No Service Layer**: Direct Supabase calls from components
3. **Type Safety**: Many `any` types in codebase, maintain consistency
4. **No Real-time**: Don't add subscriptions, use manual refresh pattern
5. **Bundle Size**: Already large, minimize new dependencies

### Missing Information Needed

**CRITICAL**: Please provide clarification on these points:

1. **Geo-verification method**: How should address verification work?
   - Manual admin approval?
   - Integration with address verification service?
   - User uploads proof of address?

2. **Neighborhood boundaries**: How are geographic boundaries defined?
   - Draw on map interface?
   - List of zip codes?
   - Radius from center point?
   - Pre-defined by admin?

3. **Gate holder selection**: How are gate holders chosen?
   - First verified resident?
   - Admin appointed?
   - Community election?

4. **Premium implementation**: How is premium access controlled?
   - Subscription via Stripe?
   - Manual admin flag?
   - Feature flags in profile?

## Tasks / Subtasks

### Phase 1: Database Foundation
- [ ] Task 1: Create database schema migration
  - [ ] Install PostGIS extension for geo-spatial support
  - [ ] Create neighborhoods table with fields: id, name, slug, description, created_by, created_at
  - [ ] Create neighborhood_boundaries table for polygon data
  - [ ] Create neighborhood_members table with user_id, neighborhood_id, status (verified/invited), invited_by
  - [ ] Create neighborhood_gate_holders table
  - [ ] Add indexes for geo-spatial queries

### Phase 2: Analyze and Extend Existing Code
- [ ] Task 2: Analyze current location handling
  - [ ] Review how events use latitude/longitude (lines 204-205 in supabase.ts)
  - [ ] Review how spaces use location data (lines 504-506 in supabase.ts)
  - [ ] Document current neighborhood field usage in profiles
  - [ ] Identify all location-related UI components

- [ ] Task 3: Extend type system
  - [ ] Add Neighborhood, NeighborhoodMember interfaces to supabase.ts
  - [ ] Add geo-verification related types
  - [ ] Update Profile interface to include neighborhood membership

### Phase 3: Core Implementation
- [ ] Task 4: Implement neighborhood management
  - [ ] Create NeighborhoodPage component in src/pages/
  - [ ] Create NeighborhoodCard component following SpaceCard pattern
  - [ ] Implement CRUD operations for neighborhoods (admin only initially)
  - [ ] Add neighborhood routes to App.tsx

- [ ] Task 5: Implement membership system
  - [ ] Create verification request flow
  - [ ] Create gate holder invitation UI
  - [ ] Add membership status badges
  - [ ] Implement access control checks

- [ ] Task 6: Integrate with existing features
  - [ ] Extend event creation to support "neighborhood only" flag
  - [ ] Extend space sharing for neighborhood restriction
  - [ ] Update search filters to include neighborhood option
  - [ ] Modify discovery radius to respect neighborhood boundaries

### Phase 4: Testing and Safety
- [ ] Task 7: Verify existing functionality unchanged
  - [ ] Test profile neighborhood field still works
  - [ ] Test event creation/discovery unaffected
  - [ ] Test space listing/booking unaffected
  - [ ] Verify no performance degradation

- [ ] Task 8: Add feature flags for rollout
  - [ ] Implement feature flag in profile for neighborhood access
  - [ ] Hide neighborhood features behind flag
  - [ ] Create upgrade prompt for non-premium users

## Risk Assessment

### Implementation Risks

**Primary Risk**: Breaking existing location-based features
- **Mitigation**: All new neighborhood code separate from existing location fields
- **Verification**: Comprehensive testing of events and spaces before/after

**Secondary Risk**: Performance impact from geo-spatial queries
- **Mitigation**: Proper PostGIS indexes, pagination, caching coordinates
- **Verification**: Load test with realistic data volumes

**Third Risk**: Complex migration with geo data
- **Mitigation**: Make all new fields optional, gradual rollout
- **Verification**: Test migration on copy of production data

### Rollback Plan

1. Feature flag in database to disable neighborhood features
2. All new tables/columns are additive (no modifications to existing)
3. Simple SQL to remove neighborhood tables if needed
4. UI components can be hidden via feature flag

### Safety Checks

- [ ] Existing profile.neighborhood field remains unchanged
- [ ] Events without neighborhood restrictions work normally  
- [ ] Space discovery unaffected for non-neighborhood users
- [ ] No required fields added to existing tables
- [ ] Performance benchmarks before/after implementation

## Dependencies and Blockers

1. **PostGIS Extension**: Need Supabase project support for geo-spatial
2. **Address Verification**: Need decision on verification method
3. **Premium System**: Need payment/subscription implementation plan
4. **Design Assets**: Need UI/UX for neighborhood pages

## Notes for Implementation

- Start with minimal viable neighborhood (no geo features) to test concept
- Use existing patterns even though technical debt exists
- Consider this as foundation for future location-based features
- Document all geo-spatial queries for future optimization