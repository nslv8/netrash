# Nasabah Data Loading Fix Documentation

## Problem Description

Daftar nasabah pada BSU tidak muncul/ditampilkan di halaman nasabah.

## Root Cause Analysis

### 1. **API Logic Issues**

- API `/api/bsu/nasabah/getNasabah.js` memiliki logika yang kompleks dan tidak efisien
- Multiple queries yang tidak perlu (query akun dengan roleId 6)
- Kondisi filter yang membingungkan dengan `isBsu` dan `!isBsu`
- Tidak ada proper debugging/logging

### 2. **Frontend Issues**

- Kurang debugging information
- Error handling tidak comprehensive
- Conditional fetching tidak ditangani dengan baik di `useFetchStable`
- `userId` validation tidak proper

### 3. **Hook Issues**

- `useFetchStable` tidak menangani `url = null` dengan baik
- Tidak ada cache control headers
- Error state tidak di-reset dengan proper

## Solutions Implemented

### 1. **API Simplification (`/api/bsu/nasabah/getNasabah.js`)**

**Before**: Complex logic dengan multiple unnecessary queries
**After**: Simplified direct query

```javascript
// Simplified logic:
1. Validate request body
2. Check if BSU exists and is active
3. Directly query nasabah by bsuId
4. Return results with proper logging
```

**Key Changes**:

- Removed unnecessary `idNasabah` query from `akun` table
- Removed complex `isBsu` conditional logic
- Direct query: `prisma.nasabah.findMany({ where: { bsuId: body.idBsu } })`
- Added comprehensive logging for debugging
- Proper error handling for non-existent BSU

### 2. **Frontend Improvements (`/pages/nasabah/index.jsx`)**

**Enhanced Debugging**:

```javascript
console.log("=== NASABAH PAGE INIT ===");
console.log("Raw userId:", userId);
console.log("Is Admin:", isAdmin);
console.log("Request will be made with:", requestBody);
```

**Conditional Fetching**:

```javascript
// Skip request jika tidak ada userId
const requestBody = userId ? { idBsu: parseInt(userId) } : null;

const { data, error, isLoading } = useFetchStable(
  requestBody ? "/api/bsu/nasabah/getNasabah" : null,
  requestBody ? { method: "POST", body: JSON.stringify(requestBody) } : null
);
```

**Enhanced Error States**:

- No userId found state
- Loading state with proper message
- Error state dengan detail message
- Empty data state
- Success state dengan data table

### 3. **Hook Enhancement (`/hooks/useFetchStable.js`)**

**Conditional Fetching Support**:

```javascript
// Skip fetching jika url null atau tidak ada token
if (!url || !token) {
  console.log("Skipping fetch - URL:", url, "Token:", !!token);
  setIsLoading(false);
  setData(null);
  setError(null);
  return;
}
```

**Cache Control Headers**:

```javascript
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
}
```

**Better Error Handling**:

- Reset error state before new fetch
- Set data to null on error
- Comprehensive error logging

## Database Schema Context

**Tables Involved**:

- `bsu`: Master BSU data
- `nasabah`: Customer data dengan `bsuId` foreign key
- `akun`: User accounts (not directly needed for this query)

**Relationship**:

```
bsu.idBsu -> nasabah.bsuId
```

## Testing Scenarios

### 1. **Valid BSU User**

- ✅ Should see list of nasabah registered to their BSU
- ✅ Proper loading states
- ✅ Search functionality works

### 2. **BSU with No Nasabah**

- ✅ Should show "Tidak ada nasabah yang terdaftar untuk BSU ini"
- ✅ No errors in console

### 3. **Invalid/Missing User ID**

- ✅ Should show "User ID tidak ditemukan. Silakan login ulang"
- ✅ No API calls made

### 4. **Network/API Errors**

- ✅ Proper error message displayed
- ✅ Debug info in console
- ✅ No crashes

## Debug Information Available

### Console Logs

1. **Page Initialization**: User ID, admin status, request body
2. **API Calls**: Request details, response status, response data
3. **Hook Behavior**: Fetch skipping, error details
4. **Data Processing**: Filtering, search functionality

### Error Messages

1. **No User ID**: Clear message for login issues
2. **API Errors**: Detailed error with console reference
3. **Loading States**: User-friendly loading indicators
4. **Empty States**: Informative empty data messages

## Performance Improvements

1. **Reduced Queries**: Single direct query instead of multiple joins
2. **Better Caching**: Proper cache control headers
3. **Conditional Fetching**: No unnecessary API calls
4. **Efficient Filtering**: Client-side search optimization

## Security Considerations

1. **Token Validation**: Proper JWT verification
2. **BSU Access Control**: Users only see their BSU's nasabah
3. **Input Validation**: Zod schema validation
4. **Error Information**: No sensitive data in error messages

## Future Improvements

1. **Database Relations**: Add proper foreign key constraints
2. **Pagination**: For large nasabah lists
3. **Real-time Updates**: WebSocket for live data
4. **Enhanced Search**: Server-side search with pagination
