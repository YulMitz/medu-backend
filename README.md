# medu-backend
NCCU Cloud Native Project Medu Backend

## API 說明

### User API 
#### 1. 註冊新用戶

**POST** `/api/user/register`

**請求 Body:**
```json
{
  "username": "string",
  "password": "string",
  "nickname": "string", 
  "birthDate": "Date",
  "gender": "String"
}
```

**範例請求 Body:**
```json
{
  "username" : "testuser",
  "password" : "testpassword",
  "nickname" : "testnickname",
  "birthDate" : "2016-05-18",
  "gender" : "male"
}
```

**處理流程：**
- 檢查用戶名是否已被使用。
- 如果用戶名可用，將密碼進行哈希處理後保存新用戶。
- 返回註冊成功訊息。

---

#### 2. 用戶登錄

**POST** `/api/user/login`

**請求 Body:**
```json
{
  "username": "String",
  "password": "String"
}
```

**處理流程：**
- 驗證用戶名和密碼。
- 如果驗證正確，生成有效期為 1 小時的 JWT token。
- 將 Hash 後的 token 返回給客戶端。

---

#### 3. 上傳照片
**POST** `/api/user/profilepicture`

**需 JWT Token**

**請求 Body:**
```json
{
  "profilePicture": "jpg, png"
}
```
---
#### 4. 獲取目標用戶 profile picture
**GET** `/api/user/profilepicture/:targetUserId`

---
#### 5. 獲取目標用戶暱稱
**GET** `/api/user/nickname/:targetUserId`

---
#### 6. 刷新 token
**POST** `/api/user/token`
```json
{
  "refreshToken": "refreshToken"
}
```

---
#### 7. 用戶登出
**POST** `/api/user/logout`
```json
{
  "refreshToken": "refreshToken"
}
```

---
#### 8. 用戶更改暱稱
**POST** `/api/user/nickname`
```json
{
  "nickname": "String"
}
```

---
#### 9. 用戶更改密碼
**POST** `/api/user/password`
```json
{
  "password": "String"
}
```

---
#### 10. 用戶更改自介
**POST** `/api/user/bio`
```json
{
  "bio": "String"
}
```

### Match API
#### 1. 喜歡 / 不喜歡目標用戶

**需 JWT Token**

喜歡 : **POST** `/api/match/like`

不喜歡 : **POST** `/api/match/dislike`

```json
{
  "targetUserId": "String"
}
```

---

#### 2. 獲取朋友列表

**需 JWT Token**

**GET** `/api/match/friendlist`

---

#### 3. 獲取下一張配對卡片

**需 JWT Token**

**GET** `/api/match/matchcard`


---

### Message API

#### 1. 獲取和目標用戶的歷史訊息

**需 JWT Token**

**GET** `/api/message/messagehistory/:targetUserId`

---

#### 2. 獲取和目標用戶最近一條的歷史訊息

**需 JWT Token**

**GET** `/api/message/latestmessage/:targetUserId`




