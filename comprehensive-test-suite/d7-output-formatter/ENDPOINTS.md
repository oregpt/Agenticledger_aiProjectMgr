# D7: Output Formatter - API Endpoints

## Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/format/markdown | Format data as Markdown |
| POST | /api/format/pptx | Format data as PowerPoint |

## Test Cases

### Markdown Export
- [x] Format as markdown endpoint exists
- [x] Format markdown with valid data succeeds

### PowerPoint Export
- [x] Format as PPTX endpoint exists
- [x] Format PPTX without auth returns 401
