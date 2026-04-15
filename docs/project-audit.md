# Project Audit

## 1. Përshkrimi i shkurtër i projektit

Ky projekt është një sistem për menaxhimin e një servisi kamionësh. Bazuar në gjendjen aktuale të repository-t, pjesa e implementuar është kryesisht një backend i ndërtuar me Node.js dhe Express, i mbështetur nga një skemë databaze në PostgreSQL, si dhe një modul i stokut i bazuar në CSV, i përdorur për demonstrimin e repository pattern dhe operacioneve CRUD.

Përdoruesit kryesorë të sistemit janë:
- **Administratori**, i cili menaxhon qasjen në dashboard, transaksionet financiare dhe informacionin e stokut.
- **Mekanikët**, të cilët përfaqësohen në rolet e sistemit dhe pritet të përdorin funksionalitete që lidhen me punën në servis.
- **Roja ose stafi i evidencës së orarit**, që përfaqësohen në rolet dhe strukturën e attendance.

Funksionalitetet kryesore që aktualisht ekzistojnë në projekt janë:
- autentikimi me JWT dhe marrja e përdoruesit aktual përmes `/auth/login` dhe `/auth/me`
- kontrolli i qasjes sipas roleve për routat e mbrojtura të administratorit
- krijimi i transaksioneve financiare dhe përmbledhja e hyrjeve/daljeve
- menaxhimi i artikujve të stokut përmes `StockItemService`, `CsvStockItemRepository`, një console UI dhe endpoint-eve vetëm për lexim
- një skemë PostgreSQL për `users`, `attendance`, `transactions`, `clients`, `trucks`, `appointments`, `stock_items` dhe `stock_movements`

Repository përmban gjithashtu dokumentim për arkitekturën, implementimin, diagramin e klasave, sprint plan-in dhe sprint report-in.

## 2. Çka funksionon mirë?

1. **Backend-i ka strukturë të qartë me shtresa.** Kodi është i ndarë në routes, services, models, middleware, konfigurim të databazës dhe data repositories. Kjo e bën projektin më të lehtë për t’u kuptuar, testuar dhe përmirësuar.

2. **Autentikimi dhe autorizimi janë të implementuara në mënyrë praktike.** Projekti përmban gjenerim të JWT token-it, middleware për verifikimin e token-it dhe middleware për kufizimin e qasjes sipas rolit të përdoruesit.

3. **Moduli i stokut është pjesa më e plotë e projektit.** Ai përfshin modelin `StockItem`, repository në CSV, service layer me validim dhe filtrim, console UI, skripta demo, identifikim të stokut të ulët dhe statistika bazë të stokut.

4. **Skema e databazës është më e gjerë se API-ja aktuale dhe tregon një plan realist për sistemin.** Ajo përfshin tabela për përdoruesit, attendance, transaksionet, klientët, kamionët, terminet, artikujt e stokut dhe lëvizjet e stokut, së bashku me kufizime dhe indekse të dobishme.

5. **Ekzistojnë teste për modulin e stokut.** Komanda `npm test` ekzekuton gjashtë teste me `node:test`, dhe gjatë auditimit të gjitha këto teste kaluan me sukses.

6. **Projekti tashmë ka dokumentim të dobishëm.** Skedarët `README.md`, `docs/architecture.md`, `docs/implementation.md`, `docs/sprint-plan.md` dhe `docs/sprint-report.md` e bëjnë më të lehtë kuptimin e asaj që është ndërtuar dhe planifikuar.

## 3. Dobësitë e projektit

1. **Frontend-i ende nuk është i implementuar realisht.** Në repository ekziston folder-i `frontend/` dhe dokumentimi përmend React, por aktualisht kjo pjesë nuk ka implementim funksional. UI-ja e vetme që shihet qartë në projekt është console UI për modulin e stokut.

2. **Moduli i stokut nuk është i ekspozuar plotësisht përmes web API-së.** Service, repository, demo script dhe console UI mbështesin krijimin, përditësimin dhe fshirjen e artikujve, por `backend/src/routes/stockRoutes.js` aktualisht ofron vetëm endpoint-e `GET`. Kjo krijon një mospërputhje mes logjikës së backend-it dhe API-së së ekspozuar.

3. **Disa module të domenit janë ende vetëm pjesërisht të implementuara.** Skema përfshin attendance, clients, trucks, appointments dhe stock movements, dhe ekziston edhe modeli `Attendance`, por këto pjesë ende nuk kanë route, service, UI flow ose testim të plotë.

4. **Validimi nuk është njësoj i fortë në të gjitha modulet.** `StockItemService` ka validim të mirë për ID, sortim, filtra, emra, sasi dhe çmime, ndërsa në modulet e tjera validimi është më bazik. Për shembull, te transaksionet kontrollohen disa fusha kryesore, por filtrat si `type`, `from` dhe `to` nuk trajtohen me të njëjtin kujdes.

5. **Error handling funksionon, por është i përsëritur nëpër route.** Shumë route përdorin `try/catch` të ngjashëm dhe formojnë manualisht JSON error responses. Një error-handling middleware i përbashkët ose response helper do ta bënte API-në më të qëndrueshme dhe më konsistente.

6. **Emërtimi dhe gjuha nuk janë plotësisht të standardizuara.** Disa metoda janë në shqip, si `listo`, `shto`, `gjejSipasId`, `perditeso` dhe `fshi`, ndërsa route dhe pjesë të tjera të projektit janë kryesisht në anglisht. Edhe emrat e folder-ëve përziejnë forma si `Models`, `Services` dhe `Data`. Kjo nuk e prish funksionimin, por e bën projektin pak më të vështirë për t’u lexuar shpejt nga një zhvillues tjetër ose nga vlerësuesi.

7. **Një pjesë e dokumentimit është e vjetruar ose jo plotësisht në përputhje me kodin aktual.** Për shembull, `README.md` dhe `docs/architecture.md` përmendin frontend në React, ndërsa kjo pjesë nuk është implementuar realisht. Sprint plan-i gjithashtu mund të mos reflektojë më gjendjen aktuale të testeve dhe stock API-së, ndërsa class diagram-i nuk e paraqet plotësisht modulin e stokut.

8. **Setup-i i mjedisit nuk është i dokumentuar plotësisht.** Backend-i kërkon `DATABASE_URL` dhe `JWT_SECRET`, dhe ekziston një `.env` lokal, por mungon një `.env.example` që do t’i tregonte qartë variablat e nevojshme pa ekspozuar sekrete reale.

9. **Burimi i të dhënave për stokun nuk është ende plotësisht i qartë.** Skema e PostgreSQL përfshin tabelën `stock_items`, ndërsa implementimi aktual i stokut përdor skedar CSV. Kjo kuptohet për shkak të kërkesës së assignment-it për repository pattern, por projekti duhet ta shpjegojë më qartë nëse CSV është vetëm për demonstrim apo nëse stoku do të migrojë më vonë në PostgreSQL.

## 4. 3 përmirësime që do t’i implementoj

### Përmirësimi 1: Përditësimi dhe harmonizimi i dokumentimit

**Problemi:** Dokumentimi është i dobishëm, por disa pjesë të tij nuk përputhen më me gjendjen reale të kodit. Frontend-i përshkruhet si React edhe pse nuk është implementuar, sprint plan-i mund të mos reflektojë ndryshimet më të fundit, ndërsa class diagram-i nuk përfshin modulin e stokut.

**Zgjidhja:** Do të përditësoj `README.md`, `docs/architecture.md` dhe `docs/class-diagram.md` në mënyrë që të pasqyrojnë backend-in aktual, modulin e stokut, komandat e testimit, hapat e setup-it dhe statusin real të frontend-it. Gjithashtu do të shtoj një `.env.example` me variablat e nevojshme pa përfshirë sekrete reale.

**Pse ka rëndësi:** Ky është një përmirësim i sigurt, sepse nuk rrezikon të prishë kodin funksional. Për më tepër, e bën projektin më të lehtë për t’u kuptuar, ekzekutuar dhe vlerësuar.

### Përmirësimi 2: Ekspozimi i CRUD-it të plotë të stokut përmes Express routes

**Problemi:** Moduli i stokut tashmë mbështet shtimin, përditësimin dhe fshirjen përmes service layer dhe console UI, por këto operacione nuk janë ende të ekspozuara në mënyrë të plotë përmes Express API-së. Aktualisht web API-ja ofron vetëm leximin, filtrimin dhe statistikat.

**Zgjidhja:** Do të shtoj route të mbrojtura për administratorin, si `POST /stock`, `PUT` ose `PATCH /stock/:id`, dhe `DELETE /stock/:id`, duke ripërdorur metodat ekzistuese të `StockItemService` dhe pa duplikuar logjikën e biznesit.

**Pse ka rëndësi:** Ky përmirësim mbështetet në funksionalitet që tashmë ekziston, prandaj është realist dhe me rrezik të ulët. Ai do ta bëjë modulin e stokut më të plotë nga perspektiva e API-së dhe do të forcojë ndjeshëm pjesën praktike të projektit.

### Përmirësimi 3: Përmirësimi i validimit, konsistencës së gabimeve dhe testimit përtej modulit të stokut

**Problemi:** Moduli i stokut ka validim dhe teste relativisht të mira, por pjesë të tjera si transaksionet dhe autentikimi kanë më pak testim dhe më pak konsistencë në trajtimin e gabimeve. Aktualisht error responses formohen në mënyrë të përsëritur brenda route-ve.

**Zgjidhja:** Do të shtoj teste të fokusuara për validimin e transaksioneve dhe sjelljen e autentikimit. Gjithashtu do të përmirësoj validimin për filtrat e transaksioneve dhe do të krijoj një mënyrë më të unifikuar për error responses, për shembull përmes një helper-i ose middleware të përbashkët.

**Pse ka rëndësi:** Ky përmirësim rrit besueshmërinë e projektit pa shtuar feature të panevojshme. Po ashtu jep dëshmi më të qarta të cilësisë inxhinierike, sepse projekti bëhet më i testueshëm dhe më i qëndrueshëm.

## 5. Një pjesë që ende nuk e kuptoj plotësisht

Pjesa që ende nuk e kuptoj plotësisht është burimi afatgjatë i të dhënave për modulin e stokut. Aktualisht kodi përdor `CsvStockItemRepository` dhe `stock-items.csv`, gjë që përputhet mirë me kërkesën e assignment-it për repository pattern. Megjithatë, skema e databazës përfshin edhe `stock_items` dhe `stock_movements`, ndërsa `README.md` e paraqet PostgreSQL si databazën kryesore të projektit. Para se të bëj përmirësime më të mëdha, do të ishte e rëndësishme të qartësohej nëse moduli i stokut do të mbetet në CSV vetëm për demonstrim, apo do të kalojë më vonë plotësisht në PostgreSQL si pjesët e tjera të backend-it.
