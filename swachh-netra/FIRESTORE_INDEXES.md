# Firestore Indexes Setup Guide

The app requires certain Firestore indexes for optimal performance. When you see warnings about missing indexes, follow this guide to create them.

## Required Indexes

### 1. FeederPointAssignments Collection

**Index for contractor assignments query:**
- Collection: `feederPointAssignments`
- Fields:
  - `contractorId` (Ascending)
  - `status` (Ascending)
  - `assignedAt` (Descending)

**How to create:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `swachh-netra-3e12e`
3. Go to Firestore Database → Indexes
4. Click "Create Index"
5. Set Collection ID: `feederPointAssignments`
6. Add fields:
   - Field: `contractorId`, Order: Ascending
   - Field: `status`, Order: Ascending  
   - Field: `assignedAt`, Order: Descending
7. Click "Create"

### 2. VehicleAssignments Collection

**Index for contractor vehicle assignments:**
- Collection: `vehicleAssignments`
- Fields:
  - `contractorId` (Ascending)
  - `status` (Ascending)

**How to create:**
1. Go to Firestore Database → Indexes
2. Click "Create Index"
3. Set Collection ID: `vehicleAssignments`
4. Add fields:
   - Field: `contractorId`, Order: Ascending
   - Field: `status`, Order: Ascending
5. Click "Create"

### 3. TripRecords Collection (if needed)

**Index for contractor trip queries:**
- Collection: `tripRecords`
- Fields:
  - `contractorId` (Ascending)
  - `date` (Descending)
  - `status` (Ascending)

### 4. WorkerAttendance Collection (if needed)

**Index for contractor attendance queries:**
- Collection: `workerAttendance`
- Fields:
  - `contractorId` (Ascending)
  - `date` (Descending)

## Quick Index Creation via Console Links

When you see a warning message with a link like:
```
https://console.firebase.google.com/v1/r/project/swachh-netra-3e12e/firestore/indexes?create_composite=...
```

Simply click on that link and it will take you directly to the index creation page with the fields pre-filled.

## Alternative: Automatic Index Creation

The app is designed to work without indexes by falling back to simpler queries. However, for better performance, it's recommended to create the indexes above.

## Verification

After creating indexes:
1. Restart the app
2. The warning messages should disappear
3. Queries should be faster
4. Check the console logs for "Using compound query" instead of "Using simple query"

## Troubleshooting

If you still see warnings after creating indexes:
1. Wait 5-10 minutes for indexes to build
2. Check index status in Firebase Console
3. Ensure field names match exactly (case-sensitive)
4. Verify collection names are correct

## Index Status

You can check index building status in Firebase Console:
- Go to Firestore Database → Indexes
- Look for "Building" status
- Wait for "Enabled" status before testing
