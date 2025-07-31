# Student Card Management System

This document explains how to use the student card system that allows admins to assign free, half, and full cards to students for each class.

## Overview

The student card system provides two types of cards:
- **Free Card**: Student can attend class for free (100% discount)
- **Half Card**: Student pays 50% of the class fee

## Features

### For Administrators

1. **Card Management Interface**
   - Navigate to: Admin Dashboard → Student Management → Student Cards
   - Add, edit, and delete student cards
   - Set validity periods and usage limits
   - Provide reasons for free/half cards

2. **Card Types**
   - **Free Card**: Complete fee waiver
   - **Half Card**: 50% fee reduction

3. **Card Properties**
   - **Student**: Which student the card is for
   - **Class**: Which class the card applies to
   - **Card Type**: Free or Half
   - **Reason**: Required for free/half cards (e.g., "Scholarship", "Family Discount")
   - **Valid From/Until**: Date range when the card is active

### For Students

1. **Card Display in My Classes**
   - Students can see their cards for each class
   - Card status (Active, Expired, Maxed Out)
   - Usage information
   - Validity dates

2. **Card Display in Purchase Classes**
   - Students see card discounts when purchasing classes
   - Automatic fee calculation with card discounts
   - Clear indication of card benefits

## How to Use

### Setting Up Cards

1. **Access the Card Management**
   - Go to Admin Dashboard
   - Click "Student Management" → "Student Cards"

2. **Add a New Card**
   - Click "Add New Card"
   - Select the student and class
   - Choose card type (Free or Half)
   - Set validity dates
   - Add reason for free/half cards
   - Save the card

3. **Initialize Sample Cards (Testing)**
   - Click "Initialize Sample Cards" to create test cards
   - This creates sample free and half cards for existing students

### Card Validation

Cards are automatically validated based on:
- **Expiration**: Cards expire after the "Valid Until" date
- **Usage Limit**: Cards become inactive after reaching "Max Uses"
- **Active Status**: Cards can be manually deactivated

### Fee Calculation

The system automatically calculates fees based on card types:
- **Free Card**: Fee = 0
- **Half Card**: Fee = Original Fee × 0.5
- **No Card**: Fee = Original Fee (standard pricing)

## Technical Implementation

### Files Created/Modified

1. **New Components**
   - `StudentCardManagement.jsx` - Admin interface for managing cards
   - `cardUtils.js` - Utility functions for card operations
   - `initializeCards.js` - Sample card initialization

2. **Modified Components**
   - `MyClasses.jsx` - Added card display for students
   - `PurchaseClasses.jsx` - Added card discount calculation
   - `AdminDashboardSidebar.jsx` - Added navigation link
   - `adminRoutes.js` - Added route for card management

### Data Storage

Cards are stored in localStorage under the key `studentCards` with the following structure:

```javascript
{
  id: "studentId_classId_timestamp",
  studentId: "STUDENT_001",
  studentName: "John Doe",
  classId: "class_123",
  className: "Mathematics",
  subject: "Math",
  teacher: "Mr. Smith",
  cardType: "free", // "free" or "half"
  reason: "Scholarship",
  validFrom: "2024-01-01",
  validUntil: "2024-12-31",
  isActive: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### Utility Functions

The `cardUtils.js` file provides these key functions:

- `getStudentCard(studentId, classId)` - Get a student's card for a specific class
- `isCardValid(card)` - Check if a card is valid (not expired, not maxed out)
- `calculateFeeWithCard(baseFee, cardType)` - Calculate fee with card discount
- `getCardTypeInfo(cardType)` - Get display information for card types
- `getCardStatus(card)` - Get status information for a card
- `incrementCardUsage(cardId)` - Increment card usage count
- `createCard(cardData)` - Create a new card
- `updateCard(cardId, updates)` - Update an existing card
- `deleteCard(cardId)` - Delete a card

## Testing

### Initialize Sample Data

1. Create some students and classes first
2. Go to Student Card Management
3. Click "Initialize Sample Cards"
4. Check the browser console for confirmation

### View Card Statistics

1. Go to Student Card Management
2. Click "View Stats"
3. Check the browser console for statistics

### Test Card Functionality

1. Create cards with different types and validity periods
2. Test fee calculations in the purchase interface
3. Verify card display in student dashboard
4. Test card expiration and usage limits

## Browser Console Commands

For testing purposes, these functions are available in the browser console:

```javascript
// Initialize sample cards
window.initializeSampleCards()

// Clear all cards
window.clearAllCards()

// Get card statistics
window.getCardStats()
```

## Future Enhancements

Potential improvements for the card system:

1. **Bulk Card Operations**: Assign cards to multiple students at once
2. **Card Templates**: Predefined card configurations
3. **Card History**: Track all card changes and usage
4. **Automatic Expiration**: System notifications for expiring cards
5. **Card Analytics**: Reports on card usage and effectiveness
6. **Integration with Payment System**: Automatic fee calculation during checkout
7. **Card Sharing**: Allow students to share cards with family members
8. **Conditional Cards**: Cards that activate based on certain conditions

## Support

For issues or questions about the card system:
1. Check the browser console for error messages
2. Verify that students and classes exist before creating cards
3. Ensure card dates are in the correct format (YYYY-MM-DD)
4. Check that card usage limits are reasonable numbers 