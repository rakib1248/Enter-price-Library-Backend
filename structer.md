# Library Management System — API Architecture & Implementation Roadmap

## Module Dependency Graph (build order)

```
Phase 1: Auth & User  (already partially done)
  └── Auth ──> User (Prisma)

Phase 2: Core Catalog (depends on Phase 1)
  ├── Author
  ├── Category
  ├── Publisher
  └── Book ──> Author, Category, Publisher, User (seller)

Phase 3: Inventory & Borrowing (depends on Phase 2)
  ├── BookCopy ──> Book
  └── BorrowRecord ──> BookCopy, User

Phase 4: Cart & Order (depends on Phase 2, Phase 1)
  ├── Cart ──> User, Book
  └── Order ──> User, Book, Cart

Phase 5: Payment (depends on Phase 4)
  └── Payment ──> Order

Phase 6: Reviews (depends on Phase 2, Phase 1)
  └── Review ──> Book, User

Phase 7: Membership & Subscription (depends on Phase 1)
  ├── Membership
  └── Subscription ──> Membership, User

Phase 8: Notification (depends on Phase 1)
  └── Notification ──> User

Phase 9: Polish & Fixes (cross-cutting)
  ├── Fix auth typo (singin → signin)
  ├── Fix Book stub → real implementation
  ├── Add RBAC (Roles guard)
  ├── Add Swagger docs
  └── Fix JWT secret → ConfigService
```

---

## Phase 1: Auth & User (already exists — needs fixes)

### Endpoints — Already Built

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/singin` | No | Login → JWT |
| POST | `/user` | No | Register user |
| GET | `/user` | JWT | List users |
| GET | `/user/:id` | No | Get user |
| PATCH | `/user/:id` | No | Update user |
| DELETE | `/user/:id` | No | Delete user |

### What to do in this phase

- [x] **Done**: User CRUD, Auth login, bcrypt hashing, JWT signing
- [ ] **Fix**: Rename `singin` → `signin` everywhere (endpoint, DTO, service method, filenames)
- [ ] **Fix**: Read JWT secret from `ConfigService` (`.env`) instead of hardcoding
- [ ] **Fix**: Add `JwtAuthGuard` to `PATCH /user/:id` and `DELETE /user/:id`
- [ ] **Fix**: Add `@UsePipes(ValidationPipe)` to `PATCH /user/:id`
- [ ] **Add**: `GET /auth/profile` — returns current logged-in user (uses JWT payload)
- [ ] **Add**: Verify current-user owns the resource or has ADMIN role before PATCH/DELETE

### Add: `Roles` Guard & Decorator

```typescript
// common/guards/roles.guard.ts
// common/decorators/roles.decorator.ts
```

---

## Phase 2: Core Catalog (Author, Category, Publisher, Book)

### Dependency: Phase 1 must be done.

### 2a — Author Module

**Path**: `src/author/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/author` | JWT + ADMIN | Create author |
| GET | `/author` | No | List all authors |
| GET | `/author/:id` | No | Get author + books |
| PATCH | `/author/:id` | JWT + ADMIN | Update author |
| DELETE | `/author/:id` | JWT + ADMIN | Delete author |

**DTO**:
```typescript
class CreateAuthorDto {
  @IsString() name: string;
  @IsOptional() @IsString() bio?: string;
}
```

**Service logic**:
- `create()` → `prisma.author.create()`
- `findAll()` → `prisma.author.findMany({ include: { books: true } })`
- `findOne()` → `prisma.author.findUnique({ where: { id }, include: { books: true } })`
- `update()` → `prisma.author.update()`
- `remove()` → `prisma.author.delete()`

---

### 2b — Category Module

**Path**: `src/category/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/category` | JWT + ADMIN | Create category |
| GET | `/category` | No | List all |
| GET | `/category/:id` | No | Get + books |
| PATCH | `/category/:id` | JWT + ADMIN | Update |
| DELETE | `/category/:id` | JWT + ADMIN | Delete |

**DTO**:
```typescript
class CreateCategoryDto {
  @IsString() name: string;
}
```

> `name` is `@unique` in Prisma — handle duplicate with `BadRequestException`.

---

### 2c — Publisher Module

**Path**: `src/publisher/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/publisher` | JWT + ADMIN | Create |
| GET | `/publisher` | No | List all |
| GET | `/publisher/:id` | No | Get + books |
| PATCH | `/publisher/:id` | JWT + ADMIN | Update |
| DELETE | `/publisher/:id` | JWT + ADMIN | Delete |

**DTO**:
```typescript
class CreatePublisherDto {
  @IsString() name: string;
}
```

---

### 2d — Book Module (REWRITE the stub)

**Path**: `src/book/` (already exists — needs complete rewrite)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/book` | JWT + SELLER/ADMIN | Create book |
| GET | `/book` | No | List all (filter: ?authorId, ?categoryId, ?sellerId, ?isForSale, ?isForBorrow) |
| GET | `/book/:id` | No | Get book + author + category + copies + reviews |
| PATCH | `/book/:id` | JWT + SELLER/ADMIN | Update (owner or admin) |
| DELETE | `/book/:id` | JWT + SELLER/ADMIN | Delete (owner or admin) |

**CreateBookDto**:
```typescript
class CreateBookDto {
  @IsString() title: string;
  @IsString() isbn: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsNumber() @IsPositive() price: number;
  @IsOptional() @IsBoolean() isForSale?: boolean;
  @IsOptional() @IsBoolean() isForBorrow?: boolean;
  @IsUUID() authorId: string;
  @IsUUID() categoryId: string;
  @IsOptional() @IsUUID() publisherId?: string;
  // sellerId: taken from JWT payload (current user)
}
```

**Key logic in service**:
- `create()` — set `sellerId` from `@CurrentUser()` decorator
- `findAll()` — accept query filters (authorId, categoryId, sellerId, isForSale, isForBorrow, search by title)
- `findOne()` — include relations: author, category, publisher, copies, reviews
- `update()` — verify `sellerId === currentUserId` OR user role is ADMIN
- `remove()` — same ownership check

**BookCopy should be created alongside Book** — or via a separate endpoint in Phase 3.

---

## Phase 3: Inventory & Borrowing

### Dependency: Phase 1 + Phase 2d (Book) needed.

### 3a — BookCopy Module

**Path**: `src/book-copy/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/book-copy` | JWT + SELLER/ADMIN | Add copy for a book |
| GET | `/book-copy/book/:bookId` | No | List copies of a book |
| GET | `/book-copy/:id` | No | Get copy details |
| PATCH | `/book-copy/:id` | JWT + ADMIN | Update status |
| DELETE | `/book-copy/:id` | JWT + ADMIN | Remove copy |

**DTO**:
```typescript
class CreateBookCopyDto {
  @IsUUID() bookId: string;
  @IsString() copyNumber: string;  // e.g. "COPY-001"
}
```

**Key logic**:
- Generate `copyNumber` auto if not provided (e.g. `BOOK-ISBN-001`)
- `findAll()` — filter by bookId, status
- Only AVAILABLE copies can be deleted (guard against active borrows)

---

### 3b — BorrowRecord Module

**Path**: `src/borrow-record/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/borrow-record` | JWT + STUDENT | Borrow a book copy |
| GET | `/borrow-record` | JWT + ADMIN | List all (admin) |
| GET | `/borrow-record/my` | JWT | Current user's borrows |
| GET | `/borrow-record/:id` | JWT | Get detail (owner/admin) |
| PATCH | `/borrow-record/:id/return` | JWT + ADMIN | Mark as returned |
| PATCH | `/borrow-record/:id/fine` | JWT + ADMIN | Update fine amount |

**DTOs**:
```typescript
class CreateBorrowRecordDto {
  @IsUUID() bookCopyId: string;
}

class ReturnBorrowDto {
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsNumber() fineAmount?: number;
}
```

**Key logic**:
- `create()` — check copy is AVAILABLE → set it to BORROWED → create record with `dueDate` = now + membership.maxBorrowLimit days (or a default 14 days)
- `return()` — set status RETURNED, set returnDate, set copy to AVAILABLE, calculate fine if overdue
- `findAll()` — admin can see all; `my` endpoint filtered by `userId` from JWT
- Fine calculation: if `returnDate > dueDate`, fine = days overdue * perDayRate (configurable)

---

## Phase 4: Cart & Order

### Dependency: Phase 1 + Phase 2d (Book) needed.

### 4a — Cart Module

**Path**: `src/cart/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/cart` | JWT | Get current user's cart |
| POST | `/cart/item` | JWT | Add item to cart |
| PATCH | `/cart/item/:itemId` | JWT | Update quantity |
| DELETE | `/cart/item/:itemId` | JWT | Remove item |
| DELETE | `/cart` | JWT | Clear cart |

**DTOs**:
```typescript
class AddCartItemDto {
  @IsUUID() bookId: string;
  @IsOptional() @IsInt() @Min(1) quantity?: number;
}

class UpdateCartItemDto {
  @IsInt() @Min(0) quantity: number;  // 0 = remove
}
```

**Key logic**:
- Cart is auto-created when first item is added (lazy creation)
- Use `prisma.cart.upsert()` on first add
- Only books with `isForSale: true` can be added to cart
- `quantity: 0` in update = remove item

---

### 4b — Order Module

**Path**: `src/order/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/order` | JWT | Place order (from cart) |
| GET | `/order` | JWT | Current user's orders |
| GET | `/order/admin` | JWT + ADMIN | All orders |
| GET | `/order/:id` | JWT | Order details (owner/admin) |
| PATCH | `/order/:id/status` | JWT + ADMIN | Update order status |

**DTOs**:
```typescript
class CreateOrderDto {
  // empty — order is created from current cart
}

class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
}
```

**Key logic**:
- `create()` — fetch current user's cart with items → calculate totalAmount → create Order + OrderItems → clear cart
- Only SELLER/ADMIN can update order status
- Order status flow: PENDING → PAID → SHIPPED → DELIVERED or CANCELLED
- Validate stock availability before creating order
- Wrap in a Prisma transaction (`$transaction`)

---

## Phase 5: Payment Module

### Dependency: Phase 4b (Order) needed.

### Payment Module

**Path**: `src/payment/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/payment/order` | JWT | Pay for an order |
| POST | `/payment/subscription` | JWT | Pay for subscription |
| GET | `/payment/:id` | JWT | Payment details |
| GET | `/payment` | JWT | Current user's payments |

**DTO**:
```typescript
class CreateOrderPaymentDto {
  @IsUUID() orderId: string;
  @IsString() method: string;      // bkash, card, sslcommerz
  @IsOptional() @IsString() transactionId?: string;
}

class CreateSubscriptionPaymentDto {
  @IsUUID() subscriptionId: string;
  @IsString() method: string;
  @IsOptional() @IsString() transactionId?: string;
}
```

**Key logic**:
- `createOrderPayment()` — validate order belongs to user, validate order status is PENDING → create payment → update order status to PAID
- `createSubscriptionPayment()` — create payment → update subscription status to ACTIVE
- This is a simplified payment gateway stub — real gateway integration (SSLCommerz, Stripe, etc.) would go here later

---

## Phase 6: Review Module

### Dependency: Phase 2d (Book) needed.

### Review Module

**Path**: `src/review/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/review` | JWT | Add review |
| GET | `/review/book/:bookId` | No | Reviews for a book |
| GET | `/review/my` | JWT | My reviews |
| PATCH | `/review/:id` | JWT | Edit my review (owner only) |
| DELETE | `/review/:id` | JWT | Delete my review (owner or admin) |

**DTO**:
```typescript
class CreateReviewDto {
  @IsUUID() bookId: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() comment?: string;
}
```

**Key logic**:
- One review per user per book (enforce with unique constraint check or upsert)
- Include average rating calculation (optional: add a `rating` field to Book model or compute on read)
- Only users who have purchased/borrowed the book can review (optional hard requirement)

---

## Phase 7: Membership & Subscription

### 7a — Membership Module

**Path**: `src/membership/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/membership` | JWT + ADMIN | Create plan |
| GET | `/membership` | No | List all plans |
| GET | `/membership/:id` | No | Get plan details |
| PATCH | `/membership/:id` | JWT + ADMIN | Update plan |
| DELETE | `/membership/:id` | JWT + ADMIN | Delete plan |

**DTO**:
```typescript
class CreateMembershipDto {
  @IsString() name: string;
  @IsNumber() @IsPositive() price: number;
  @IsInt() @IsPositive() durationInDays: number;
  @IsInt() @IsPositive() maxBorrowLimit: number;
}
```

---

### 7b — Subscription Module

**Path**: `src/subscription/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/subscription` | JWT | Subscribe to a plan |
| GET | `/subscription` | JWT | My subscriptions |
| GET | `/subscription/admin` | JWT + ADMIN | All subscriptions |
| GET | `/subscription/:id` | JWT | Details (owner/admin) |
| PATCH | `/subscription/:id/cancel` | JWT | Cancel subscription |

**DTO**:
```typescript
class CreateSubscriptionDto {
  @IsUUID() membershipId: string;
}
```

**Key logic**:
- `create()` — set `endDate` = now + `membership.durationInDays` days
- `cancel()` — set status to CANCELLED
- Auto-expire: a scheduled job (or check on borrow) to set EXPIRED when `endDate < now()`

---

## Phase 8: Notification Module

### Dependency: Phase 1 (User) needed.

### Notification Module

**Path**: `src/notification/`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/notification` | JWT | My notifications |
| GET | `/notification/unread-count` | JWT | Unread count |
| PATCH | `/notification/:id/read` | JWT | Mark as read |
| PATCH | `/notification/read-all` | JWT | Mark all as read |
| DELETE | `/notification/:id` | JWT | Delete (owner only) |

**DTO**:
```typescript
class CreateNotificationDto {
  @IsUUID() userId: string;
  @IsString() message: string;
  @IsString() type: string;   // OVERDUE, ORDER_UPDATE, MEMBERSHIP_EXPIRY
}
```

> `CreateNotificationDto` is used internally by services (not exposed via API).

**Key logic**:
- Notifications are auto-created by other services (e.g., BorrowRecord creates OVERDUE notification, Order creates ORDER_UPDATE notification)
- Use a simple internal `NotificationService.create()` method called from other services
- Notifications can be trigger-based (when an event happens) or via a scheduled cron job (for overdue checks)

---

## Phase 9: Polish & Cross-cutting Fixes

### Fix existing bugs

| Issue | Location | Fix |
|-------|----------|-----|
| `singin` → `signin` | auth module | Rename endpoint, DTO, method |
| `handelar` → `handler` | common/ | Rename file and class |
| `borrowRecort` → `borrowRecord` | prisma/schema/ | Rename filename only |
| Hardcoded JWT secret | 2 files | Use `ConfigService` |
| `+id` in Book controller | book.controller.ts | Remove unary plus (string → string) |
| `dist/` in git | root | Add to `.gitignore` if already there, remove from git |

### Add Swagger / OpenAPI

```bash
pnpm add @nestjs/swagger
```

- Enable in `main.ts` with `SwaggerModule.setup('api-docs', app, document)`
- Add `@ApiTags()`, `@ApiBearerAuth()` decorators
- Add `@ApiProperty()` to DTOs

### Add Role-Based Access Control (RBAC)

Create a reusable guard:

```typescript
// common/guards/roles.guard.ts
// Uses @SetMetadata('roles', ['ADMIN', 'SELLER']) decorator
// Reads user.role from JWT payload
// Checks if user.role is in the allowed roles
// Combine with JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard)
```

### Add Pagination / Filtering / Sorting

- Create reusable `PaginationDto` with `page`, `limit`, `sortBy`, `sortOrder`
- Create a `PrismaPaginationHelper` utility
- Apply to `findAll()` endpoints:
  - `GET /book?page=1&limit=20&authorId=...&categoryId=...&search=...`
  - `GET /user?page=1&limit=10&role=STUDENT`
  - `GET /order?page=1&limit=10&status=PENDING`

### Add Global Validation

- In `main.ts`, add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`
- This auto-applies to all controllers without needing `@UsePipes(ValidationPipe)` on each

---

## Complete Endpoint Map (Final)

| # | Method | Path | Auth | Module | Phase |
|---|--------|------|------|--------|-------|
| 1 | GET | `/` | No | App | 1 |
| 2 | POST | `/auth/signin` | No | Auth | 1 |
| 3 | GET | `/auth/profile` | JWT | Auth | 1 |
| 4 | POST | `/user` | No | User | 1 |
| 5 | GET | `/user` | JWT | User | 1 |
| 6 | GET | `/user/:id` | JWT | User | 1 |
| 7 | PATCH | `/user/:id` | JWT + Owner | User | 1 |
| 8 | DELETE | `/user/:id` | JWT + Owner | User | 1 |
| 9 | POST | `/author` | JWT + ADMIN | Author | 2a |
| 10 | GET | `/author` | No | Author | 2a |
| 11 | GET | `/author/:id` | No | Author | 2a |
| 12 | PATCH | `/author/:id` | JWT + ADMIN | Author | 2a |
| 13 | DELETE | `/author/:id` | JWT + ADMIN | Author | 2a |
| 14 | POST | `/category` | JWT + ADMIN | Category | 2b |
| 15 | GET | `/category` | No | Category | 2b |
| 16 | GET | `/category/:id` | No | Category | 2b |
| 17 | PATCH | `/category/:id` | JWT + ADMIN | Category | 2b |
| 18 | DELETE | `/category/:id` | JWT + ADMIN | Category | 2b |
| 19 | POST | `/publisher` | JWT + ADMIN | Publisher | 2c |
| 20 | GET | `/publisher` | No | Publisher | 2c |
| 21 | GET | `/publisher/:id` | No | Publisher | 2c |
| 22 | PATCH | `/publisher/:id` | JWT + ADMIN | Publisher | 2c |
| 23 | DELETE | `/publisher/:id` | JWT + ADMIN | Publisher | 2c |
| 24 | POST | `/book` | JWT + SELLER | Book | 2d |
| 25 | GET | `/book` | No | Book | 2d |
| 26 | GET | `/book/:id` | No | Book | 2d |
| 27 | PATCH | `/book/:id` | JWT + Owner | Book | 2d |
| 28 | DELETE | `/book/:id` | JWT + Owner | Book | 2d |
| 29 | POST | `/book-copy` | JWT + SELLER | BookCopy | 3a |
| 30 | GET | `/book-copy/book/:bookId` | No | BookCopy | 3a |
| 31 | GET | `/book-copy/:id` | No | BookCopy | 3a |
| 32 | PATCH | `/book-copy/:id` | JWT + ADMIN | BookCopy | 3a |
| 33 | DELETE | `/book-copy/:id` | JWT + ADMIN | BookCopy | 3a |
| 34 | POST | `/borrow-record` | JWT | BorrowRecord | 3b |
| 35 | GET | `/borrow-record` | JWT + ADMIN | BorrowRecord | 3b |
| 36 | GET | `/borrow-record/my` | JWT | BorrowRecord | 3b |
| 37 | GET | `/borrow-record/:id` | JWT | BorrowRecord | 3b |
| 38 | PATCH | `/borrow-record/:id/return` | JWT + ADMIN | BorrowRecord | 3b |
| 39 | PATCH | `/borrow-record/:id/fine` | JWT + ADMIN | BorrowRecord | 3b |
| 40 | GET | `/cart` | JWT | Cart | 4a |
| 41 | POST | `/cart/item` | JWT | Cart | 4a |
| 42 | PATCH | `/cart/item/:itemId` | JWT | Cart | 4a |
| 43 | DELETE | `/cart/item/:itemId` | JWT | Cart | 4a |
| 44 | DELETE | `/cart` | JWT | Cart | 4a |
| 45 | POST | `/order` | JWT | Order | 4b |
| 46 | GET | `/order` | JWT | Order | 4b |
| 47 | GET | `/order/admin` | JWT + ADMIN | Order | 4b |
| 48 | GET | `/order/:id` | JWT | Order | 4b |
| 49 | PATCH | `/order/:id/status` | JWT + ADMIN | Order | 4b |
| 50 | POST | `/payment/order` | JWT | Payment | 5 |
| 51 | POST | `/payment/subscription` | JWT | Payment | 5 |
| 52 | GET | `/payment/:id` | JWT | Payment | 5 |
| 53 | GET | `/payment` | JWT | Payment | 5 |
| 54 | POST | `/review` | JWT | Review | 6 |
| 55 | GET | `/review/book/:bookId` | No | Review | 6 |
| 56 | GET | `/review/my` | JWT | Review | 6 |
| 57 | PATCH | `/review/:id` | JWT | Review | 6 |
| 58 | DELETE | `/review/:id` | JWT | Review | 6 |
| 59 | POST | `/membership` | JWT + ADMIN | Membership | 7a |
| 60 | GET | `/membership` | No | Membership | 7a |
| 61 | GET | `/membership/:id` | No | Membership | 7a |
| 62 | PATCH | `/membership/:id` | JWT + ADMIN | Membership | 7a |
| 63 | DELETE | `/membership/:id` | JWT + ADMIN | Membership | 7a |
| 64 | POST | `/subscription` | JWT | Subscription | 7b |
| 65 | GET | `/subscription` | JWT | Subscription | 7b |
| 66 | GET | `/subscription/admin` | JWT + ADMIN | Subscription | 7b |
| 67 | GET | `/subscription/:id` | JWT | Subscription | 7b |
| 68 | PATCH | `/subscription/:id/cancel` | JWT | Subscription | 7b |
| 69 | GET | `/notification` | JWT | Notification | 8 |
| 70 | GET | `/notification/unread-count` | JWT | Notification | 8 |
| 71 | PATCH | `/notification/:id/read` | JWT | Notification | 8 |
| 72 | PATCH | `/notification/read-all` | JWT | Notification | 8 |
| 73 | DELETE | `/notification/:id` | JWT | Notification | 8 |

---

## Recommended Build Order (Week-by-Week)

| Week | Focus | Modules | Total New Endpoints |
|------|-------|---------|-------------------|
| 1 | Fix Phase 1 + Author/Category | Auth fix, Author, Category | 10 |
| 2 | Publisher + Book rewrite | Publisher, Book rewrite | 10 |
| 3 | BookCopy + BorrowRecord | BookCopy, BorrowRecord | 11 |
| 4 | Cart + Order | Cart, Order | 10 |
| 5 | Payment + Membership | Payment, Membership | 9 |
| 6 | Subscription + Review | Subscription, Review | 10 |
| 7 | Notification + Polish | Notification + all fixes | 9 |
| 8 | RBAC + Pagination + Swagger | Cross-cutting | — |

> Each NestJS module follows the same pattern:
> 1. `nest g module <name>`
> 2. `nest g controller <name>`
> 3. `nest g service <name>`
> 4. Create DTOs in `dto/`
> 5. Inject `PrismaService`
> 6. Write service logic
> 7. Wire controller with guards + validation pipes
> 8. Register in `app.module.ts`
