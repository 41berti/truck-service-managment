const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const CsvStockItemRepository = require("../Data/repositories/CsvStockItemRepository");
const StockItemService = require("../Services/StockItemService");

const rl = readline.createInterface({ input, output });
const service = new StockItemService(new CsvStockItemRepository());

function yesNoToBool(value) {
  return ["po", "p", "yes", "y", "1", "true"].includes(
    String(value).trim().toLowerCase()
  );
}

async function ask(text) {
  return (await rl.question(text)).trim();
}

function showItems(items) {
  if (!items.length) {
    console.log("\nNuk u gjet asnjë artikull.\n");
    return;
  }

  console.table(
    items.map((item) => ({
      ID: item.id,
      Kodi: item.item_code,
      Emri: item.name,
      Kategoria: item.category,
      Njesia: item.unit,
      Sasia: item.current_qty,
      Minimumi: item.min_qty,
      "Cmimi (€)": item.unit_cost,
      Furnitori: item.supplier,
      Lokacioni: item.location,
      Aktiv: item.is_active ? "Po" : "Jo",
      "Low stock": item.is_low_stock ? "PO" : "Jo",
    }))
  );
}

async function listoArtikujt() {
  const search = await ask("Kërko sipas emrit/kodit/furnitorit (Enter për skip): ");
  const category = await ask("Filtro sipas kategorisë (Enter për skip): ");
  const onlyLowStock = await ask("Vetëm low stock? (po/jo): ");
  const onlyActive = await ask("Vetëm aktivë? (po/jo): ");

  const items = await service.listo({
    search,
    category,
    onlyLowStock: yesNoToBool(onlyLowStock),
    onlyActive: yesNoToBool(onlyActive),
  });

  console.log("\nRezultatet e listimit:");
  showItems(items);
}

async function gjejArtikullin() {
  const id = await ask("Jep ID-në e artikullit: ");
  const item = await service.gjejSipasId(id);
  console.log("\nArtikulli u gjet:");
  showItems([item]);
}

async function shtoArtikull() {
  const item = {
    item_code: await ask("Kodi i artikullit: "),
    name: await ask("Emri i artikullit: "),
    category: await ask("Kategoria: "),
    unit: await ask("Njësia (pcs/set/L): "),
    current_qty: await ask("Sasia aktuale: "),
    min_qty: await ask("Sasia minimale: "),
    unit_cost: await ask("Çmimi për njësi: "),
    supplier: await ask("Furnitori: "),
    location: await ask("Lokacioni në depo: "),
    is_active: await ask("Aktiv? (po/jo): "),
  };

  const created = await service.shto(item);
  console.log("\nArtikulli u shtua me sukses:");
  showItems([created]);
}

async function perditesoArtikull() {
  const id = await ask("Jep ID-në e artikullit për update: ");
  const current = await service.gjejSipasId(id);

  console.log("\nVlera aktuale:");
  showItems([current]);
  console.log("Lëri fushat bosh nëse nuk do t’i ndryshosh.\n");

  const updated = await service.perditeso(id, {
    item_code: (await ask(`Kodi [${current.item_code}]: `)) || current.item_code,
    name: (await ask(`Emri [${current.name}]: `)) || current.name,
    category: (await ask(`Kategoria [${current.category}]: `)) || current.category,
    unit: (await ask(`Njësia [${current.unit}]: `)) || current.unit,
    current_qty:
      (await ask(`Sasia aktuale [${current.current_qty}]: `)) || current.current_qty,
    min_qty: (await ask(`Sasia minimale [${current.min_qty}]: `)) || current.min_qty,
    unit_cost:
      (await ask(`Çmimi për njësi [${current.unit_cost}]: `)) || current.unit_cost,
    supplier: (await ask(`Furnitori [${current.supplier}]: `)) || current.supplier,
    location: (await ask(`Lokacioni [${current.location}]: `)) || current.location,
    is_active:
      (await ask(`Aktiv (${current.is_active ? "po" : "jo"}): `)) ||
      current.is_active,
  });

  console.log("\nArtikulli u përditësua me sukses:");
  showItems([updated]);
}

async function fshiArtikull() {
  const id = await ask("Jep ID-në e artikullit për fshirje: ");
  const item = await service.gjejSipasId(id);

  console.log("\nDo të fshihet ky artikull:");
  showItems([item]);

  const confirm = await ask("A je i sigurt? (po/jo): ");
  if (!yesNoToBool(confirm)) {
    console.log("\nFshirja u anulua.\n");
    return;
  }

  const result = await service.fshi(id);
  console.log(`\n${result.message}\n`);
}

async function main() {
  console.log("\n=== STOCK CRUD CONSOLE UI ===");
  console.log("Rrjedha: UI -> Service -> Repository -> CSV file\n");

  let running = true;

  while (running) {
    console.log("1. Listo artikujt");
    console.log("2. Gjej artikull sipas ID");
    console.log("3. Shto artikull");
    console.log("4. Përditëso artikull");
    console.log("5. Fshi artikull");
    console.log("0. Dil");

    const choice = await ask("\nZgjedhja jote: ");

    try {
      switch (choice) {
        case "1":
          await listoArtikujt();
          break;
        case "2":
          await gjejArtikullin();
          break;
        case "3":
          await shtoArtikull();
          break;
        case "4":
          await perditesoArtikull();
          break;
        case "5":
          await fshiArtikull();
          break;
        case "0":
          running = false;
          console.log("\nProgrami u mbyll me sukses.");
          break;
        default:
          console.log("\nZgjedhje e pavlefshme. Provo përsëri.\n");
      }
    } catch (error) {
      console.error(`\nGabim: ${error.message}\n`);
    }
  }

  rl.close();
}

main().catch((error) => {
  console.error("Gabim fatal:", error);
  rl.close();
});
