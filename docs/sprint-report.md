# Sprint 2 Report — Albert

## Çka Përfundova
- Implementova endpoint-e të mbrojtura për modulin e stokut: `GET /stock`, `GET /stock/:id`, `GET /stock/low-stock` dhe `GET /stock/summary`.
- Shtova kërkim/filtrim sipas emrit, kodit, furnitorit dhe kategorisë, me sortim të kontrolluar.
- Shtova logjikë të qartë për low-stock alert bazuar në rregullin `current_qty <= min_qty`.
- Shtova validim dhe error handling për ID jo valide, query params jo valide, artikuj që nuk ekzistojnë dhe gabime të repository-t.
- Shtova unit tests për `StockItemService` me `node:test`.
- Përditësova console UI dhe demo script që të shfaqin artikujt me stok të ulët dhe statistikat.

Output që dëshmon:
- `npm test`
- `npm run stock:demo`
- endpoint-et `/stock`, `/stock/low-stock`, `/stock/summary`

## Çka Mbeti
- Frontend-i web ende nuk është implementuar.
- Modulet `attendance`, `appointments`, `clients` dhe `trucks` nuk janë ende të ekspozuara si funksionalitete të plota në backend/UI.

## Çka Mësova
- Ndarja e validimit në service dhe aksesit në të dhëna në repository e bën kodin më të pastër, më të testueshëm dhe më të lehtë për t’u vlerësuar.
