# Demo Plan — Truck Service Management

## 1. Titulli i projektit

- Truck Service Management
- Projekt semestral për digjitalizimin gradual të punës në një servis real kamionësh.

## 2. Problemi që zgjidh

Ky projekt lidhet me një problem real në biznes familjar: shumë punë të përditshme në servis bëhen ende me letër ose me organizim manual.

Problemet kryesore janë:
- evidenca e punëtorëve dhe prezenca ruhen në mënyrë manuale;
- hyrjet dhe daljet financiare kërkojnë kontroll me letra ose shënime të ndara;
- pjesët rezervë në depo kontrollohen manualisht;
- organizimi i servisit merr kohë, sidomos kur duhet të gjendet shpejt një pjesë, një shpenzim, ose një regjistrim;
- ekziston rreziku që një pjesë e rëndësishme të mbarojë pa u vërejtur me kohë.

Sistemi synon që këto procese të kalojnë gradualisht në formë digjitale. Kjo e bën punën më të shpejtë, më të saktë dhe më të organizuar, ndërsa në të ardhmen mund të ruhet edhe mundësia për printim të raporteve kur biznesi ka nevojë për dokumente fizike.

## 3. Përdoruesit kryesorë

- Admin / owner: pronari ose menaxheri i servisit. Ka qasje në pjesët kryesore të sistemit, sheh të dhëna, kontrollon stokun, transaksionet dhe përdoruesit.
- Mechanics: mekanikët që punojnë në kamionë. Ata kanë nevojë të dinë cilat pjesë janë në dispozicion dhe mund të përdoren për servis.
- Guards / attendance staff: personat që mund të regjistrojnë prezencën ose hyrje-daljet e punëtorëve. Kjo pjesë është e modeluar në projekt, por ende nuk është flow i plotë.
- Receptionist / planner: rol i mundshëm për fazat e ardhshme, për planifikim të termineve dhe organizim të klientëve/kamionëve.

## 4. Flow-i që do ta demonstroj live

Flow-i kryesor për demo do të jetë:

Admin login -> stock list -> search/filter -> low-stock alert -> stock summary -> CRUD/validation.

Hapat konkretë:
- e startoj backend serverin me `npm start`;
- bëj login si admin me përdoruesin `admin@test.local`;
- përdor token-in JWT për të thirrur endpoint-et e mbrojtura të stokut;
- shfaq listën e artikujve në stok me `GET /stock`;
- kërkoj dhe filtroj artikuj, për shembull me `search=filter` ose `category=Engine`;
- shfaq artikujt me stok të ulët me `GET /stock/low-stock`;
- shfaq përmbledhjen e stokut me `GET /stock/summary`;
- krijoj një artikull testues me `POST /stock`;
- e përditësoj atë artikull me `PATCH /stock/:id`;
- e fshij artikullin testues me `DELETE /stock/:id`;
- tregoj validim dhe error handling, për shembull `sortBy=supplier_name` kthen `400`, ndërsa `GET /stock/9999` kthen `404`.

Ky flow është zgjedhur sepse është pjesa më e qartë dhe më funksionale e projektit për demo live. Teknikisht tregon autentikim me JWT, autorizim me rol `ADMIN`, Express routes, service layer, repository pattern, CRUD, validim dhe përgjigje të centralizuara të gabimeve. Për biznesin real tregon vlerë praktike: menaxhimi i pjesëve rezervë bëhet më i shpejtë dhe rreziku për mungesë të pjesëve të rëndësishme zvogëlohet.

## 5. Një problem real që e kam zgjidhur

Problemi konkret që do ta theksoj është menaxhimi manual i stokut dhe rreziku i low-stock.

Në biznes, pjesët rezervë si filtera, llamba, sete frenash ose pjesë të tjera mund të kontrollohen me letër ose me kujtesë. Kjo mund të shkaktojë vonesa kur mekaniku ka nevojë për një pjesë dhe ajo nuk gjendet në depo, ose kur sasia minimale nuk është kontrolluar me kohë.

Në projekt, ky problem zgjidhet me modulin e stokut:
- `backend/src/routes/stockRoutes.js` ekspozon endpoint-et HTTP për stok;
- `backend/src/Services/StockItemService.js` përmban logjikën e kërkimit, filtrimit, validimit, statistikave dhe low-stock;
- `backend/src/Data/repositories/CsvStockItemRepository.js` ruan dhe lexon të dhënat nga CSV si shembull i repository pattern;
- `backend/src/Data/sample-data/stock-items.csv` përmban artikuj realistikë për demo;
- `backend/src/middlewares/authenticateToken.js` dhe `backend/src/middlewares/authorizeRoles.js` mbrojnë endpoint-et që të përdoren vetëm nga admini.

Zgjidhja nuk është vetëm listë artikujsh. Ajo tregon menjëherë cilat pjesë janë nën sasinë minimale dhe jep përmbledhje të vlerës së stokut, numrit të artikujve aktivë dhe numrit të artikujve me stok të ulët.

## 6. Çka mbetet ende e dobët

Projekti është në fazë zhvillimi dhe është realist që disa pjesë të jenë ende jo të plota.

- Frontend-i nuk është ende i kompletuar; projekti aktualisht është kryesisht backend API dhe një console UI për stok.
- Disa module janë ende më shumë në nivel skeme PostgreSQL sesa flow i plotë në backend, për shembull attendance, clients, trucks, appointments dhe stock movements.
- Moduli i stokut aktualisht përdor CSV për të demonstruar repository pattern dhe CRUD, edhe pse skema PostgreSQL për `stock_items` ekziston.
- Flow-et për attendance dhe appointments duhet të zhvillohen më shumë që të jenë të gatshme për demo të plotë.
- Testet janë të dobishme për service layer, por në të ardhmen do të ishte mirë të shtohen edhe teste integruese për API routes.

Këto nuk e bëjnë projektin të pavlefshëm. Përkundrazi, tregojnë që projekti ka një bazë të qartë dhe po ndërtohet hap pas hapi, duke filluar nga pjesët që kanë më shumë vlerë për biznesin.

## 7. Struktura e prezantimit (5–7 min)

- 0:00-0:45 - Hyrje: prezantoj Truck Service Management dhe lidhjen me biznesin familjar.
- 0:45-1:30 - Problemi: shpjegoj punën me letra, humbjen e kohës dhe rrezikun në menaxhimin manual.
- 1:30-2:00 - Përdoruesit: admin/owner, mechanics, guards dhe rolet e ardhshme.
- 2:00-4:45 - Live demo: login si admin, listë stoku, search/filter, low-stock, summary, krijim/përditësim/fshirje e një artikulli testues dhe një shembull error handling.
- 4:45-5:45 - Shpjegim teknik: Express routes, JWT, role-based access control, service layer, repository pattern dhe CSV repository.
- 5:45-6:30 - Problemi real i zgjidhur: si low-stock dhe kërkimi i pjesëve ndihmon servisin në punë reale.
- 6:30-7:00 - Dobësitë dhe hapat e ardhshëm: frontend, attendance, appointments dhe kalimi më i plotë drejt PostgreSQL.

## 8. Demo readiness / Plan B

Për demo live do të mbaj të hapura README, këtë demo plan dhe terminalin me komandat kryesore.

Plan B nëse diçka nuk punon live:
- nëse serveri nuk starton, tregoj `npm test` dhe `npm run stock:demo`, sepse ato vërtetojnë logjikën e stokut pa varësi nga browser-i;
- nëse login dështon për shkak të databazës, tregoj kodin e `AuthService`, middleware për JWT/role dhe output-et e dokumentuara të API-së;
- nëse databaza PostgreSQL nuk lidhet, tregoj që stock demo funksionon me CSV repository dhe shpjegoj pse CSV është përdorur për repository-pattern demo;
- nëse një endpoint live jep problem, përdor komandat e ruajtura në README dhe shpjegoj përgjigjet e pritura `400` dhe `404`;
- nëse CRUD live nuk duhet të ndryshojë të dhënat para profesorit, përdor vetëm `GET /stock`, `GET /stock/low-stock`, `GET /stock/summary` dhe `npm run stock:demo`;
- mbaj gati screenshot-et ekzistuese në `docs/assets` dhe dokumentet `docs/architecture.md` e `docs/improvement-report.md` për të treguar strukturën dhe progresin.
