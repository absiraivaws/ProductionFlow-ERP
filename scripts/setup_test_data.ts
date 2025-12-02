
import { ItemService } from "../src/lib/services/ItemService";
import { BOMService } from "../src/lib/services/BOMService";

async function setup() {
    console.log("Setting up test data...");

    // 1. Create Raw Material
    const flour = await ItemService.createItem({
        sku: "RM-TEST-FLOUR",
        name: "Test Flour",
        type: "RAW_MATERIAL",
        unit: "kg",
        costPrice: 10,
        sellingPrice: 0,
        openingStockQty: 0,
        openingStockValue: 0,
        minimumStock: 0,
        isActive: true,
    });
    console.log("Created Flour:", flour.id);

    // 2. Create Finished Good
    const bread = await ItemService.createItem({
        sku: "FG-TEST-BREAD",
        name: "Test Bread",
        type: "FINISHED_GOOD",
        unit: "pcs",
        costPrice: 30,
        sellingPrice: 50,
        openingStockQty: 0,
        openingStockValue: 0,
        minimumStock: 0,
        isActive: true,
    });
    console.log("Created Bread:", bread.id);

    // 3. Create BOM
    const bom = await BOMService.createBOM({
        fgItemId: bread.id,
        versionNo: 1,
        status: "ACTIVE",
        lines: [{
            rmItemId: flour.id,
            qtyPerUnit: 0.5,
        }],
        remarks: "Test BOM",
        createdBy: "setup-script",
    });

    if (bom) {
        console.log("Created BOM:", bom.id);
    }
}

setup().catch(console.error);
