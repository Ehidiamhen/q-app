# Manual API Testing Guide

Since the automated test requires authentication, here are curl commands to manually test all endpoints.

## Server Status

The dev server is running on: **http://localhost:3001** (port 3000 was in use)

---

## 🟢 Public Endpoints (No Auth Required)

### 1. List Questions (Feed)

```bash
curl http://localhost:3001/api/questions
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### 2. List Questions with Pagination

```bash
curl "http://localhost:3001/api/questions?page=1&limit=5"
```

---

### 3. Search Questions (Empty Database)

```bash
curl "http://localhost:3001/api/questions/search?q=CS101"
```

---

### 4. Search with Filters

```bash
curl "http://localhost:3001/api/questions/search?level=100&year=2024&semester=First"
```

---

### 5. Get User Profile (test-user-1 from seed data)

```bash
curl http://localhost:3001/api/users/test-user-1
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "test-user-1",
      "displayName": "John Doe",
      "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      "createdAt": "...",
      "uploadCount": 0
    }
  }
}
```

---

### 6. Get User's Questions

```bash
curl http://localhost:3001/api/users/test-user-1/questions
```

---

### 7. Get Single Question (404 expected)

```bash
curl http://localhost:3001/api/questions/invalid-id
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Question not found"
}
```

---

## 🔒 Protected Endpoints (Auth Required - Will Return 401)

### 8. Create Question (Should Fail - No Auth)

```bash
curl -X POST http://localhost:3001/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CS101 Final Exam 2024",
    "courseCode": "CS101",
    "courseName": "Introduction to Programming",
    "level": 100,
    "year": 2024,
    "semester": "First",
    "hashtags": ["programming", "java"],
    "images": ["https://picsum.photos/800/1000?random=1"]
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 9. Get Presigned URL (Should Fail - No Auth)

```bash
curl -X POST http://localhost:3001/api/upload/presign \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.jpg",
    "contentType": "image/jpeg"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 10. Get Own Profile (Should Fail - No Auth)

```bash
curl http://localhost:3001/api/users/me
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

### 11. Update Profile (Should Fail - No Auth)

```bash
curl -X PUT http://localhost:3001/api/users/me \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "New Name"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## ✅ Validation Tests

### 12. Invalid Question Data (Should Fail - Validation Error)

```bash
curl -X POST http://localhost:3001/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AB",
    "courseCode": "CS101"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```
(Will get 401 first before validation)

---

### 13. Invalid Presigned URL Request

```bash
curl -X POST http://localhost:3001/api/upload/presign \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.jpg",
    "contentType": "application/pdf"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```
(Will get 401 first before validation)

---

## 📊 Expected Results Summary

| Endpoint | Method | Auth Required | Expected Status | Notes |
|----------|--------|---------------|-----------------|-------|
| `/api/questions` | GET | No | 200 | Returns empty array initially |
| `/api/questions?page=1&limit=5` | GET | No | 200 | Pagination works |
| `/api/questions/search` | GET | No | 200 | Empty results initially |
| `/api/questions/:id` | GET | No | 404 | Invalid ID |
| `/api/questions` | POST | Yes | 401 | No auth token |
| `/api/questions/:id` | PUT | Yes | 401 | No auth token |
| `/api/questions/:id` | DELETE | Yes | 401 | No auth token |
| `/api/upload/presign` | POST | Yes | 401 | No auth token |
| `/api/users/:id` | GET | No | 200 | Returns user profile |
| `/api/users/:id/questions` | GET | No | 200 | Returns empty array |
| `/api/users/me` | GET | Yes | 401 | No auth token |
| `/api/users/me` | PUT | Yes | 401 | No auth token |

---

## ✅ Success Criteria

All backend API routes are implemented correctly if:

1. ✅ Public endpoints return 200 with correct data structure
2. ✅ Protected endpoints return 401 without auth
3. ✅ Invalid data returns appropriate error messages
4. ✅ Pagination works correctly
5. ✅ Search filters apply correctly
6. ✅ Not found returns 404
7. ✅ All responses follow `ApiResponse<T>` format

---

## 🧪 Next Steps

1. **Test with actual authentication:**
   - Sign in via Google OAuth in the UI
   - Use browser dev tools to copy session cookie
   - Add cookie to curl requests

2. **Test complete upload flow:**
   - Sign in
   - Get presigned URL
   - Upload image to R2
   - Create question with image URL

3. **Test with real data:**
   - Create multiple questions
   - Test search functionality
   - Test pagination with real results

---

## 🎯 Current Status

**Day 2 Backend: ✅ COMPLETE**

All API endpoints implemented:
- ✅ OAuth callback handler
- ✅ Questions CRUD (POST, GET, GET by ID, PUT, DELETE)
- ✅ Questions search with filters
- ✅ Users endpoints (profile, uploads, update)
- ✅ Upload presigned URL generation
- ✅ Error handling with standardized responses
- ✅ Validation with Zod schemas

**Ready for:** Day 3 Frontend UI implementation
