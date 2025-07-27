# BSU Filter Penarikan Documentation

## Overview

Implementasi sistem filter untuk menampilkan data penarikan berdasarkan BSU (Bank Sampah Unit). Setiap BSU hanya dapat melihat data penarikan untuk nasabah yang terdaftar di BSU mereka.

## Backend Implementation

### API Endpoint: `/api/penarikan/storePenarikan`

**Method**: GET

**Query Parameters**:

- `bsuId` (optional): ID BSU untuk memfilter data penarikan

**Logic Flow**:

1. **Ambil BSU ID dari query parameter atau token**:

   - Prioritas pertama: `req.query.bsuId`
   - Jika tidak ada, decode JWT token untuk mendapatkan user ID
   - Cari BSU berdasarkan user ID tersebut

2. **Filter berdasarkan BSU**:

   - Query nasabah yang terdaftar pada BSU tertentu
   - Ambil array `nasabahIds` dari hasil query
   - Filter penarikan berdasarkan `nasabahIds`

3. **Optimisasi Query**:
   - Cache data nasabah untuk menghindari multiple queries
   - Manual join dengan data nasabah yang sudah di-cache
   - Order by `tanggalPenarikan` descending

**Code Structure**:

```javascript
// Ambil BSU ID
const { bsuId } = req.query;
let targetBsuId = bsuId;

// Fallback ke token jika tidak ada query param
if (!targetBsuId) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  // JWT decode logic...
}

if (targetBsuId) {
  // Filter workflow
  const nasabahList = await prisma.nasabah.findMany({
    where: { bsuId: parseInt(targetBsuId) },
    select: { idNasabah: true, nama: true, bsuId: true },
  });

  const penarikanList = await prisma.penarikan.findMany({
    where: { nasabahId: { in: nasabahIds } },
  });

  // Manual join dan return filtered data
}
```

## Frontend Implementation

### Page: `/pages/penarikan-saldo/index.jsx`

**Changes Made**:

- Modified `useFetchStable` hook call to include `bsuId` query parameter
- Dynamic URL construction based on user role and ID

**Code Change**:

```jsx
// Before
useFetchStable("/api/penarikan/storePenarikan", { method: "GET" });

// After
useFetchStable(
  `/api/penarikan/storePenarikan${userId ? `?bsuId=${userId}` : ""}`,
  { method: "GET" }
);
```

**User Flow**:

1. User login dengan role BSU
2. `userId` diambil dari cookies (`getIdUserCookies`)
3. Jika bukan admin, `userId` digunakan sebagai `bsuId` parameter
4. API dipanggil dengan filter BSU
5. Tabel menampilkan hanya data penarikan untuk nasabah BSU tersebut

## Database Schema Relations

**Tables Involved**:

- `bsu`: Master data BSU dengan `idBsu` sebagai primary key
- `nasabah`: Data nasabah dengan `bsuId` sebagai foreign key ke `bsu.idBsu`
- `penarikan`: Data penarikan dengan `nasabahId` sebagai foreign key ke `nasabah.idNasabah`

**Relationship Chain**:

```
bsu.idBsu -> nasabah.bsuId -> penarikan.nasabahId
```

## Security Considerations

1. **Role-based Access**: Admin dapat melihat semua data, BSU hanya data mereka
2. **Token Validation**: JWT token di-decode untuk verifikasi user
3. **Parameter Validation**: BSU ID divalidasi dan di-parse sebagai integer
4. **Fallback Logic**: Jika tidak ada BSU ID, default ke semua data (untuk admin)

## Testing Scenarios

1. **BSU User Login**:

   - Should see only penarikan for their registered nasabah
   - URL should include `?bsuId={userId}`

2. **Admin User Login**:

   - Should see all penarikan data
   - URL should not include bsuId parameter

3. **No Nasabah for BSU**:

   - Should return empty array
   - Should not cause errors

4. **Invalid BSU ID**:
   - Should handle gracefully
   - Should return appropriate response

## Performance Optimizations

1. **Single Query for Nasabah**: Fetch all nasabah for BSU once
2. **Cached Join**: Use cached nasabah data for manual joins
3. **Index Usage**: Leverage database indexes on `bsuId` and `nasabahId`
4. **Selective Fields**: Only select necessary fields in queries

## Error Handling

- **Token Decode Errors**: Logged but not blocking
- **Database Errors**: Proper error responses
- **No Data Found**: Returns empty array instead of error
- **Missing Parameters**: Graceful fallback to all data

## Future Improvements

1. **Proper Database Relations**: Add foreign key constraints in Prisma schema
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Pagination**: Add pagination for large datasets
4. **Real-time Updates**: WebSocket integration for live data updates
