# 42-matcha

-- Example: Find potential matches nearby
SELECT u.* FROM users u 
WHERE ST_DWithin(u.location, $1, 5000) -- 5km radius
AND u.age BETWEEN $2 AND $3
AND u.id NOT IN (SELECT liked_user_id FROM likes WHERE user_id = $4)

## Ideal Folder Structure

Back-End/
├── src/
│   ├── controllers/           # Route handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── match.controller.ts
│   │   ├── chat.controller.ts
│   │   └── notification.controller.ts
│   ├── middleware/            # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── upload.middleware.ts
│   ├── models/               # Database models/schemas
│   │   ├── user.model.ts
│   │   ├── profile.model.ts
│   │   ├── match.model.ts
│   │   └── message.model.ts
│   ├── routes/               # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── match.routes.ts
│   │   └── chat.routes.ts
│   ├── services/             # Business logic
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── matching.service.ts
│   │   ├── location.service.ts
│   │   └── notification.service.ts
│   ├── utils/                # Helper functions
│   │   ├── database.ts
│   │   ├── validation.ts
│   │   ├── jwt.ts
│   │   └── constants.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   └── database.types.ts
│   ├── config/               # Configuration files
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   └── index.ts              # Main entry point
├── uploads/                  # File uploads (photos)
├── tests/                    # Test files
│   ├── auth.test.ts
│   ├── user.test.ts
│   └── matching.test.ts
├── dist/                     # Compiled TypeScript
├── package.json
├── tsconfig.json
└── .env

