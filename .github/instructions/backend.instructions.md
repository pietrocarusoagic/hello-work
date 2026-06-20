---
applyTo: "src/backend/**"
---

# Backend — ASP.NET Core 10 C# conventions

## Project structure

```
src/backend/HelloWork.Api/
├── Controllers/     ← thin — delegate to Services
├── Models/          ← EF Core entities (source of truth for DB schema)
├── DTOs/            ← request/response record types
├── Services/        ← business logic (MatchingService, AadGraphService)
└── Infrastructure/  ← AppDbContext, JwtValidationMiddleware
```

## Key rules

- Controllers are thin — validation + delegation to Services only. No business logic in controllers.
- EF Core entities in `Models/` are the DB schema source of truth. Never duplicate schema in docs.
- JWT validation happens in `JwtValidationMiddleware` — do not re-implement in controllers.
- All secrets via `DefaultAzureCredential` + Key Vault. No hardcoded strings.
- Use `record` types for DTOs (immutable, value equality).

## Matching engine

`MatchingService.ComputeMatchScore` implements weighted Jaccard:
- Professional (skills): 35%
- Agentic (ai_tools): 40%  
- Human (hobbies + interests): 25%

Do not change weights or add ML in POC.

## Testing

- Use `dotnet test` — xUnit + EF Core InMemory provider
- Test at HTTP level (WebApplicationFactory) when possible
- Never test private methods
- Boundary cases for MatchingService: identical profiles → 1.0, empty → 0.0
