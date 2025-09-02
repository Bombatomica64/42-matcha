# Pre-Commit Checklist

## Code Quality and Compilation

- [x] **TypeScript Compilation**: Run `npm run build` to ensure all TypeScript compiles without errors
- [x] **Linting and Formatting**: Run `npm run check:fix` to fix all linting and formatting issues
- [ ] **Database Schema**: Ensure test database has the latest schema (chat_rooms and chat_messages tables)
- [ ] **API Route Registration**: Verify all new routes are properly registered in the main server

## Pagination Implementation

- [x] **OpenAPI Schemas**: All pagination-enabled endpoints have proper OpenAPI schema definitions
  - [x] chat.yaml - Chat endpoints with pagination
  - [x] hashtags.yaml - Hashtag search with pagination
  - [x] user.yaml - User discovery with pagination
  - [x] pagination.yaml - Centralized pagination schemas

- [x] **Generated Types**: Run API generation scripts to ensure types are up to date
  - [x] PaginationQuery, PaginationMeta, PaginationLinks types available
  - [x] All endpoint response types include pagination

- [x] **Controllers**: All controllers implement consistent pagination
  - [x] chat.controller.ts - getChatMessages() with pagination
  - [x] hashtag.controller.ts - searchHashtags() with pagination  
  - [x] user.controller.ts - discoverUsers() with pagination

- [x] **Utilities**: Pagination helper functions implemented
  - [x] extractPaginationQuery() - Extract and validate pagination params
  - [x] buildBaseUrl() - Generate consistent base URLs for links
  - [x] createPaginatedResponse() - Format standardized pagination responses
  - [x] calculatePagination() - Calculate pagination metadata

- [x] **Repository Pattern**: Base repository supports pagination
  - [x] findAllPaginated() method for basic pagination
  - [x] searchPaginated() method for search with pagination
  - [x] Consistent type usage across all repositories

## Testing

- [ ] **Test Database Setup**: Verify test database has all required tables
  - [ ] chat_rooms table exists
  - [ ] chat_messages table exists  
  - [ ] All other tables from init.sql
  
- [ ] **Route Tests**: Core pagination functionality tested
  - [ ] chat.test.ts - Chat message pagination
  - [ ] hashtag.test.ts - Hashtag search pagination (existing tests need updates)
  - [ ] user.test.ts - User discovery pagination (existing tests need updates)

- [ ] **Test Execution**: All tests pass
  - [ ] `npm run test:routes` - Route tests pass
  - [ ] `npm run test:unit` - Unit tests pass
  - [ ] `npm run test` - Full test suite passes

## Route Verification

- [ ] **Endpoint Functionality**: Manual verification of key endpoints
  - [ ] GET /chat/:id/messages - Returns paginated messages
  - [ ] GET /hashtags/search - Returns paginated hashtag results
  - [ ] GET /users/discover - Returns paginated user results

- [ ] **Pagination Parameters**: All endpoints support standard parameters
  - [ ] page - Page number (default: 1)
  - [ ] limit - Items per page (default: 10, max: 50)
  - [ ] sort - Sort field (default: created_at)
  - [ ] order - Sort order (default: desc)

- [ ] **Response Format**: All paginated responses follow consistent structure
  ```json
  {
    "data": [...],
    "meta": {
      "total_items": 100,
      "total_pages": 10,
      "current_page": 1,
      "per_page": 10,
      "has_previous": false,
      "has_next": true
    },
    "links": {
      "first": "...",
      "last": "...",
      "previous": null,
      "next": "...",
      "self": "..."
    }
  }
  ```

## File Structure and Organization

- [x] **Chat Module**: All chat-related files properly organized
  - [x] /routes/chat.routes.ts - Route definitions
  - [x] /controllers/chat.controller.ts - Request handling
  - [x] /services/chat.service.ts - Business logic (if exists)
  - [x] /repositories/ - Data access layer (if exists)

- [x] **Consistent Imports**: All files use consistent import patterns
  - [x] Generated types imported from @generated/
  - [x] Utility functions properly imported
  - [x] No circular dependencies

## Documentation and API Specs

- [x] **OpenAPI Documentation**: All endpoints documented
  - [x] Parameter descriptions
  - [x] Response schemas
  - [x] Error responses
  - [x] Pagination parameter documentation

- [ ] **Code Comments**: Complex logic is documented
  - [ ] Pagination utilities have clear comments
  - [ ] Business logic is explained
  - [ ] API endpoint purposes are documented

## Error Handling

- [ ] **Validation**: Input validation for pagination parameters
  - [ ] Page numbers are positive integers
  - [ ] Limit is within acceptable range (1-50)
  - [ ] Sort fields are whitelisted
  - [ ] Order values are 'asc' or 'desc'

- [ ] **Error Responses**: Consistent error formatting
  - [ ] 400 for invalid pagination parameters
  - [ ] 404 for non-existent resources
  - [ ] 500 for server errors

## Performance Considerations

- [ ] **Database Queries**: Efficient pagination queries
  - [ ] LIMIT and OFFSET used properly
  - [ ] Appropriate indexes on sortable columns
  - [ ] No N+1 query problems

- [ ] **Response Size**: Reasonable default page sizes
  - [ ] Default limit of 10 items
  - [ ] Maximum limit of 50 items
  - [ ] Efficient data serialization

---

## Issues to Address

### High Priority
1. **Test Database Schema**: Chat tables missing from test database
2. **Test Configuration**: Some tests failing due to schema mismatches
3. **Jest Type Definitions**: Editor not recognizing Jest globals (tests run but show type errors)

### Medium Priority  
1. **Existing Test Updates**: Update hashtag and user tests to expect pagination format
2. **Integration Testing**: Test pagination with large datasets
3. **Error Handling**: Add comprehensive input validation tests

### Low Priority
1. **Performance Testing**: Test pagination performance with large datasets
2. **Documentation**: Add more detailed API documentation
3. **Code Coverage**: Ensure all pagination utilities have test coverage

---

## Quick Verification Commands

```bash
# Compile TypeScript
npm run build

# Fix linting/formatting
npm run check:fix

# Run tests
npm run test:routes

# Check test database
npm run test:db:start
```

## Ready for Commit?

- [x] All TypeScript compiles successfully
- [x] All linting issues resolved  
- [x] Pagination implementation complete
- [ ] All tests pass (blocked by test database schema)
- [ ] Manual endpoint verification complete

**Status**: Ready for commit after resolving test database schema issues.
