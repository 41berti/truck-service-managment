# Sprint 2 Plan — Albert

Data: 1 Prill 2026

## Gjendja Aktuale
### Çka funksionon tani?
- Backend-i `Node.js + Express` ekzekutohet me sukses; endpoint-i `/health` kthen përgjigje `200 OK`.
- Lidhja me databazën `PostgreSQL` është funksionale; `/health/db` u verifikua me sukses.
- Projekti ka schema të krijuar për `users`, `attendance`, `transactions`, `clients`, `trucks`, `appointments`, `stock_items` dhe `stock_movements`.
- Authentication është funksional; u verifikuan 3 llogari testuese: `admin@test.local` (`ADMIN`), `mechanic@test.local` (`MECHANIC`) dhe `guard@test.local` (`GUARD`).
- Ekzistojnë route dhe service për login, `me`, admin dashboard dhe transaksione.
- Është implementuar moduli i stokut me arkitekturë `UI -> Service -> Repository -> CSV`.
- `CsvStockItemRepository` funksionon për lexim, shtim, përditësim dhe fshirje të artikujve në file.
- `StockItemService` ka validime bazë dhe filtrim sipas kërkimit, kategorisë, artikujve aktivë dhe low stock.
- Console UI për stokun funksionon për listim, kërkim sipas ID, shtim, përditësim dhe fshirje.
- Script-i `npm run stock:demo` ekzekutohet me sukses dhe e provon CRUD flow end-to-end.
- Dokumentimi bazë ekziston në repo: `README`, `architecture.md`, `class-diagram.md`, `implementation.md`.

### Çka nuk funksionon?
- `frontend/` është aktualisht bosh; nuk ka ende frontend real web edhe pse dokumentimi e përmend React.
- Moduli i stokut përdoret vetëm nga console demo; nuk ka ende route/API të dedikuara në Express për stokun.
- Nuk ka unit tests. `npm test` aktualisht është placeholder dhe dështon me mesazhin `Error: no test specified`.
- Error handling është vetëm pjesërisht i mbuluar; disa raste ende mbështeten te `throw`/`catch` teknike dhe jo te mesazhe të standardizuara për userin.
- Disa gjëra të përmendura në dokumentim janë më të avancuara sesa kodi real aktual, p.sh. statistikat e stokut dhe një menu e dedikuar për to nuk janë ende të ekspozuara në UI.
- Modulet `attendance`, `clients`, `trucks` dhe `appointments` ekzistojnë në schema të databazës, por nuk janë ende funksionalitete të plota në backend dhe frontend.

### A kompajlohet dhe ekzekutohet programi?
- Po për backend-in: serveri ngrihet, lidhet me databazë dhe përgjigjet.
- Jo ende si aplikacion i plotë full-stack, sepse frontend-i web nuk është ndërtuar.

## Plani i Sprintit

### Feature e Re (çka do të ndërtoj)
- Do të ndërtoj API për modulin e stokut me kërkim/filtrim sipas emrit dhe kategorisë, me sortim dhe low-stock alert.
- Administratori do të mund të kërkojë artikujt e stokut përmes endpoint-eve si `GET /stock`, `GET /stock/:id`, `GET /stock/low-stock` dhe `GET /stock/summary`.
- Rrjedha do të jetë e qartë: `Route -> StockItemService -> CsvStockItemRepository`.
- Kjo është feature konkrete dhe reale për sprintin, sepse logjika bazë në service/repository ekziston tashmë, por mungojnë endpoint-et e pastra për përdorim dhe vlerësim.
- Frontend-i web mbetet si punë e ardhshme, por Sprint 2 do ta forcojë pjesën e stokut në backend me funksionalitet të plotë dhe të testueshëm.

### Error Handling (çka do të shtoj)
- Rasti 1: nëse mungon file-i `stock-items.csv` ose nuk hapet, repository nuk duhet ta rrëzojë programin; do të kthehet mesazh i qartë si `File nuk u gjet, po krijoj file të ri...`.
- Rasti 2: nëse useri jep input jo valid si `abc` për ID, sasi ose çmim, UI dhe service duhet të shfaqin mesazh si `Ju lutem shkruani numër valid` pa crash.
- Rasti 3: nëse kërkohet një artikull që nuk ekziston, backend/frontendi duhet të shfaqin `Itemi nuk u gjet` dhe aplikacioni të vazhdojë normalisht.

### Teste (çka do të testoj)
- Do të krijoj projekt testimi për backend-in dhe do të shtoj minimum 3 teste për modulin e stokut.

#### Cilat metoda do t'i testoj?
- `StockItemService.listo()`
- `StockItemService.gjejSipasId()`
- `StockItemService.shto()`
- `StockItemService.statistika()`

#### Cilat raste kufitare do t'i kontrolloj?
- kërkim për artikull ekzistues kthen rezultat
- kërkim për artikull që nuk ekziston kthen listë bosh ose error të kontrolluar
- shtim i artikullit valid kalon me sukses
- shtim i artikullit me emër bosh ose çmim jo valid refuzohet
- kërkim me ID jo valide kthen mesazh validimi dhe jo crash

## Afati
- Deadline: Martë, 8 Prill 2026, ora 08:30
