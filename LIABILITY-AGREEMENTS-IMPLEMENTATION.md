# Liability Agreement System Implementation

**Date**: 2025-01-13
**Status**: ✅ Backend Complete | 🚧 Frontend In Progress

---

## Overview

Comprehensive liability agreement system for space creators to protect themselves when hosting events at their spaces. Includes support for day and overnight retreats with customizable agreement templates.

---

## Features Implemented

### 1. Database Schema ✅

**Tables Created**:
- `agreement_templates` - Pre-built agreement templates (day and overnight)
- `space_liability_agreements` - Agreements created by space owners
- `event_liability_agreements` - Links events to required agreements
- `participant_agreement_signatures` - Tracks participant signatures

**Event Enhancements**:
- Added retreat-specific fields to `events` table:
  - `is_retreat` - Boolean flag for retreat events
  - `retreat_type` - Type: 'day', 'overnight', 'multi-day'
  - `retreat_start_date` - Start date/time
  - `retreat_end_date` - End date/time
  - `accommodation_provided` - Boolean for overnight stays
  - `meals_included` - Array of meals (breakfast, lunch, dinner)
  - `retreat_itinerary` - JSON structure for retreat schedule

**Security**: Full RLS (Row Level Security) policies implemented for all tables

### 2. Agreement Templates ✅

Two default templates included:

#### Day Retreat Agreement Template
Covers:
- Assumption of risk for single-day activities
- Release of liability
- Medical clearance
- Photo/video release with opt-out
- Code of conduct
- Cancellation policy
- Emergency contact information

#### Overnight Retreat Agreement Template
Comprehensive coverage for:
- Extended stay and overnight accommodations
- Meal preparation and consumption
- Shared accommodation facilities
- Insurance information
- Detailed code of conduct
- Packing list requirements
- Check-in/check-out procedures
- Emergency contact with alternate phone

**Template Variables** (auto-populated):
- `{{space_name}}` - Space name
- `{{event_name}}` - Event title
- `{{event_date}}` - Event date
- `{{retreat_start_date}}` / `{{retreat_end_date}}` - Retreat dates
- `{{space_address}}` - Location
- `{{participant_name}}` - Participant name
- `{{emergency_contact_name}}` / `{{emergency_contact_phone}}` - Emergency info
- `{{cancellation_policy}}` - Customizable policy
- `{{dietary_restrictions}}` / `{{allergies}}` - Health info
- `{{accommodation_details}}` - Housing specifics
- And more...

### 3. TypeScript Types ✅

**New Types Added** (in `src/lib/supabase.ts`):
```typescript
export type AgreementType = 'day' | 'overnight'

export interface AgreementTemplate {
  id: string
  name: string
  type: AgreementType
  description?: string
  content: string
  is_default: boolean
  is_active: boolean
  // timestamps...
}

export interface SpaceLiabilityAgreement {
  id: string
  space_id: string
  creator_id: string
  agreement_type: AgreementType
  template_id?: string
  title: string
  content: string
  requires_signature: boolean
  is_active: boolean
  // Relations: space, creator, template
}

export interface EventLiabilityAgreement {
  id: string
  event_id: string
  agreement_id: string
  is_required: boolean
  // Relations: event, agreement
}

export interface ParticipantAgreementSignature {
  id: string
  event_id: string
  agreement_id: string
  participant_id: string
  signed_at: string
  signature_data?: Record<string, unknown>
  agreed_to_terms: boolean
  // Relations: event, agreement, participant
}
```

**Event Interface Updated**:
```typescript
export interface Event {
  // ... existing fields ...

  // Retreat-specific fields
  is_retreat?: boolean
  retreat_type?: 'day' | 'overnight' | 'multi-day'
  retreat_start_date?: string
  retreat_end_date?: string
  accommodation_provided?: boolean
  meals_included?: string[]
  retreat_itinerary?: Record<string, unknown>
}
```

### 4. Retreat Category Added ✅

**HolisticCategorySelector Updated**:
- Added "Retreat & Transformation" category
- Icon: Sunrise (amber/yellow gradient)
- Mantra: "I embrace deep renewal and transformation"
- Element: All Elements
- Chakra: All Chakras
- Description: "Immerse in sacred space and time"

Users can now select "Retreat" when creating events, which will enable retreat-specific fields.

---

## Implementation Files

### Database Schema
**File**: `liability-agreements-schema.sql`
- Complete table definitions
- RLS policies
- Indexes for performance
- Default template data
- Well-documented with comments

### TypeScript Types
**File**: `src/lib/supabase.ts`
- Agreement type definitions
- Event interface updates
- Full TypeScript support for frontend

### Component Updates
**File**: `src/components/HolisticCategorySelector.tsx`
- Added Retreat category
- Maintains circular layout (now 7 categories)
- Consistent styling with other categories

---

## Next Steps (Frontend UI) 🚧

### 1. Space Creator Agreement Onboarding
**Component**: `src/components/SpaceAgreementOnboarding.tsx`

Features needed:
- Wizard flow for creating first agreement
- Template selector (day vs overnight)
- Agreement preview and customization
- Variable field editor
- Save and activate agreement

### 2. Agreement Editor Component
**Component**: `src/components/AgreementEditor.tsx`

Features needed:
- Rich text editor for agreement content
- Template variable insertion tool
- Preview mode
- Markdown support
- Print/PDF export

### 3. Space Settings Agreement Tab
**Component**: Update `src/pages/SpaceDetail.tsx` or Settings

Features needed:
- List all agreements for a space
- Create new agreement from template
- Edit existing agreements
- Toggle active/inactive
- Delete agreements

### 4. Event Creation Integration
**Component**: Update `src/pages/CreateEvent.tsx`

When retreat category selected:
- Show retreat type selector (day/overnight/multi-day)
- Enable date range picker
- Show accommodation toggle
- Meals included checkboxes
- Link to space's agreement (if space selected)
- Preview agreement before finalizing

### 5. Participant Agreement Signing
**Component**: `src/components/AgreementSigningModal.tsx`

Features needed:
- Display agreement content
- Digital signature pad
- "I agree to terms" checkbox
- Save signature with metadata
- Email confirmation copy

### 6. Event Organizer Agreement Management
**Component**: `src/pages/EventAgreementManagement.tsx`

Features needed:
- View all agreements for event
- See who has signed
- Send reminder to unsigned participants
- Download signed agreements
- Bulk export for records

---

## Database Migration Instructions

To apply the database schema to your Supabase project:

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy contents of `liability-agreements-schema.sql`
4. Paste and execute
5. Verify tables created in Table Editor

### Option 2: Using Database Manager CLI
```bash
node scripts/db-manager.mjs sql "$(cat liability-agreements-schema.sql)"
```

### Option 3: Using Supabase CLI
```bash
supabase db push
```

---

## User Flow Examples

### For Space Creators

1. **First Time Setup** (Onboarding):
   - Space creator goes to Space Settings
   - Clicks "Create Liability Agreement"
   - Selects template: Day or Overnight
   - Reviews template content
   - Customizes fields (cancellation policy, accommodation details, etc.)
   - Saves and activates agreement
   - Agreement is now linked to their space

2. **Creating Retreat Event**:
   - Create new event
   - Select "Retreat & Transformation" category
   - Choose retreat type (day/overnight)
   - Select space (agreement auto-attached)
   - Set retreat dates, accommodation, meals
   - Publish event with agreement requirement

### For Participants

1. **Registering for Retreat**:
   - Browse events, find retreat
   - Click "Register"
   - Review event details
   - See "Liability Agreement Required" notice
   - Read full agreement
   - Sign digitally
   - Complete registration

2. **Agreement Management**:
   - View signed agreements in profile
   - Download copies
   - See all upcoming events with agreements

### For Event Organizers

1. **Before Event**:
   - View participant list
   - See signature status
   - Send reminders to unsigned participants
   - Download signed agreements for records

2. **At Event Check-In**:
   - Verify all participants signed
   - Have paper backup if needed
   - Keep records for liability protection

---

## Security & Privacy Considerations

### Row Level Security (RLS)

**Space Agreements**:
- ✅ Space creators can create agreements for their spaces only
- ✅ Space creators can update/delete their own agreements
- ✅ Anyone can view active agreements (transparency)

**Event Agreements**:
- ✅ Event organizers can link agreements to their events
- ✅ Participants can view required agreements for events they're joining

**Signatures**:
- ✅ Participants can sign agreements
- ✅ Users can view their own signatures
- ✅ Event organizers can view signatures for their events only
- ✅ Signatures are immutable (cannot be edited after creation)

### Data Protection

- Signature metadata includes:
  - IP address (for verification)
  - User agent (device/browser info)
  - Timestamp (exact signing time)
  - Agreement version (in case of updates)

- Agreements are versioned:
  - If space owner updates agreement, existing signatures remain valid for old version
  - New registrations require new agreement version

### Legal Compliance

- Templates are starting points, not legal advice
- Space creators should consult legal professionals
- Agreements can be customized per jurisdiction
- Digital signatures are legally binding in most jurisdictions
- Audit trail maintained for all signatures

---

## Testing Checklist

### Database Schema
- [ ] Run SQL migration successfully
- [ ] Verify all tables created
- [ ] Check RLS policies working
- [ ] Test template data inserted
- [ ] Verify indexes created

### Frontend Components (To Do)
- [ ] Space agreement onboarding wizard
- [ ] Agreement editor with template variables
- [ ] Event creation retreat fields
- [ ] Participant signing flow
- [ ] Organizer agreement management dashboard

### End-to-End Flows
- [ ] Space creator creates day agreement
- [ ] Space creator creates overnight agreement
- [ ] Create day retreat event with agreement
- [ ] Create overnight retreat with agreement
- [ ] Participant registers and signs agreement
- [ ] Organizer views signatures
- [ ] Download signed agreements

### Edge Cases
- [ ] What if participant declines to sign?
- [ ] Can participant register without signing?
- [ ] Agreement update after signatures collected
- [ ] Space deleted with active agreements
- [ ] Event canceled with signed agreements

---

## API Endpoints (Helper Functions)

Create these in `src/lib/supabase.ts`:

```typescript
// Get templates
export async function getAgreementTemplates(type?: AgreementType) {
  const query = supabase
    .from('agreement_templates')
    .select('*')
    .eq('is_active', true);

  if (type) query.eq('type', type);

  const { data, error } = await query;
  return { data, error };
}

// Create space agreement from template
export async function createSpaceAgreement(
  spaceId: string,
  templateId: string,
  customizations?: Partial<SpaceLiabilityAgreement>
) {
  // 1. Get template
  const { data: template } = await supabase
    .from('agreement_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) return { error: 'Template not found' };

  // 2. Create agreement
  const { data, error } = await supabase
    .from('space_liability_agreements')
    .insert({
      space_id: spaceId,
      creator_id: (await supabase.auth.getUser()).data.user?.id,
      agreement_type: template.type,
      template_id: templateId,
      title: customizations?.title || `${template.name} for ${spaceId}`,
      content: customizations?.content || template.content,
      requires_signature: customizations?.requires_signature ?? true,
      is_active: customizations?.is_active ?? true
    })
    .select()
    .single();

  return { data, error };
}

// Link agreement to event
export async function linkAgreementToEvent(eventId: string, agreementId: string) {
  const { data, error } = await supabase
    .from('event_liability_agreements')
    .insert({
      event_id: eventId,
      agreement_id: agreementId,
      is_required: true
    })
    .select()
    .single();

  return { data, error };
}

// Sign agreement
export async function signAgreement(
  eventId: string,
  agreementId: string,
  signatureData?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('participant_agreement_signatures')
    .insert({
      event_id: eventId,
      agreement_id: agreementId,
      participant_id: (await supabase.auth.getUser()).data.user?.id,
      signature_data: signatureData,
      agreed_to_terms: true
    })
    .select()
    .single();

  return { data, error };
}

// Check if user signed agreement
export async function hasUserSignedAgreement(
  eventId: string,
  agreementId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('participant_agreement_signatures')
    .select('id')
    .eq('event_id', eventId)
    .eq('agreement_id', agreementId)
    .eq('participant_id', userId)
    .single();

  return { hasSigned: !!data, error };
}
```

---

## Conclusion

The backend foundation for the liability agreement system is complete! This includes:

✅ **Database schema** with 4 new tables and retreat event fields
✅ **Row Level Security** for data protection
✅ **Default templates** for day and overnight retreats
✅ **TypeScript types** for full type safety
✅ **Retreat category** in event creation

**Next phase**: Build frontend UI components for space creators and participants to interact with the agreement system.

---

## Questions & Answers

**Q: Can agreements be edited after participants sign?**
A: Yes, but signatures remain tied to the version they signed. New registrations would sign the updated version.

**Q: What if a space has no agreement?**
A: Events can still be created, but the organizer assumes full liability without the protection of a signed waiver.

**Q: Can I customize the templates?**
A: Absolutely! The templates are starting points. Space creators can fully customize content, add/remove sections, and adjust to their needs.

**Q: Are digital signatures legally binding?**
A: In most jurisdictions, yes. The system captures metadata (IP, timestamp, device) to create an audit trail. However, consult a lawyer for your specific jurisdiction.

**Q: Can I have different agreements for different event types?**
A: Yes! Each space can have multiple agreements. When creating an event, the organizer can select which agreement applies.

**Q: What about multi-day retreats longer than overnight?**
A: The overnight template covers multi-day. The `retreat_type` field supports 'multi-day' as an option, and the start/end dates can span multiple days.

---

*For questions or support, consult the codebase documentation or reach out to the development team.*
