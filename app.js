document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('itemForm');
    
    // Result elements
    const resItemCode = document.getElementById('resItemCode');
    const resItemName = document.getElementById('resItemName');
    const resUom = document.getElementById('resUom');
    const resWeight = document.getElementById('resWeight');
    const duplicateAlert = document.getElementById('duplicateAlert');
    const btnReset = document.getElementById('btnReset');

    // Add event listeners to all form inputs
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', updateCalculations);
        input.addEventListener('change', updateCalculations);
    });

    btnReset.addEventListener('click', () => {
        form.reset();
        updateCalculations();
    });

    document.getElementById('btnSubmit').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Data would be submitted to NetSuite here!');
    });

    // Mock Data Helpers


    // Calculate all values
    function updateCalculations() {
        // Gather values
        const vals = {
            type: document.getElementById('type').value,
            itemGroup: document.getElementById('itemGroup').value,
            subGroup: document.getElementById('subGroup').value,
            domExp: document.getElementById('domExp').value,
            brand: document.getElementById('brand').value,
            gram: document.getElementById('gram').value,
            size: document.getElementById('size').value,
            sheet: document.getElementById('sheet').value,
            layer: document.getElementById('layer').value,
            wrapType: document.getElementById('wrapType').value,
            palletType: document.getElementById('palletType').value,
            reamBox: document.getElementById('reamBox').value,
            palletSize: document.getElementById('palletSize').value,
            location: document.getElementById('location').value,
            category: document.getElementById('category').value,
            grade: document.getElementById('grade').value,
            reamPallet: document.getElementById('reamPallet').value
        };

        const brandSelect = document.getElementById('brand');
        const brandText = vals.brand && brandSelect.selectedIndex > 0 ? brandSelect.options[brandSelect.selectedIndex].text : '';

        // --- 1. Item Name Construction ---
        let itemNameParts = [];
        
        // 1. Brand
        if (brandText) itemNameParts.push(brandText);
        
        // 2. Gram&G + Size + (Sheet)
        let middlePart = '';
        if (vals.gram) middlePart += `${vals.gram}G `;
        if (vals.size) middlePart += `${vals.size} `;
        if (vals.sheet) middlePart += `(${vals.sheet})`;
        if (middlePart.trim()) itemNameParts.push(middlePart.trim());

        // 3. Wrap Type (only for Sub-Group: Cutsize, Small pack)
        let wrapTypeAbbr = '';
        if (vals.wrapType === 'Box AUTO') wrapTypeAbbr = 'AUTO';
        else if (vals.wrapType === 'Box MN') wrapTypeAbbr = 'MN';
        else if (vals.wrapType === 'Box MN (CVB)') wrapTypeAbbr = 'CVB';
        else if (vals.wrapType === 'SHR') wrapTypeAbbr = 'SHR';

        if (wrapTypeAbbr && ['CZ', 'CK', 'GC', 'GK'].includes(vals.subGroup)) {
            itemNameParts.push(wrapTypeAbbr);
        }

        // 4. Layer
        if (vals.layer && vals.layer !== 'None') itemNameParts.push(vals.layer);

        // 5. REAM / BOX (displayed only for Extra group: 1R, 2R, 3R, 4R, 8R, CVB)
        const extraGroups = ['1R', '2R', '3R', '4R', '8R', 'CVB'];
        if (vals.reamBox && vals.reamBox !== 'None' && extraGroups.includes(vals.reamBox)) {
            itemNameParts.push(vals.reamBox);
        }

        // 6. Ream per Pallet + RP Code
        if (vals.reamPallet) {
            const rpCode = vals.sheet === '500' ? 'R/P' : 'PAC/P';
            itemNameParts.push(`${vals.reamPallet}${rpCode}`);
        }

        // 7. Pallet Type
        if (vals.palletType && vals.palletType !== 'None') {
            itemNameParts.push(vals.palletType);
        }

        // 8. FSC Suffix
        if (vals.grade && vals.grade.includes('FSC')) {
            itemNameParts.push('FSC MIX70%');
        }

        // 9. Pallet Size Suffix
        if (vals.palletSize === 'DIY') itemNameParts.push('T');
        if (vals.palletSize === 'EU/EURO') itemNameParts.push('E');

        const finalItemName = itemNameParts.join(' ').trim() || '-';
        resItemName.textContent = finalItemName;


        // --- 2. Item Code Construction ---
        // Format: [Item Group][Sub-Group][Dom/Exp]-[Brand]-[Gram]-[Size]-[Sheet]-[Layer]-[Running No.]
        let itemCodeParts = [];
        
        let prefix = '';
        if (vals.itemGroup) prefix += vals.itemGroup;
        if (vals.subGroup) prefix += vals.subGroup === 'Extra' ? 'EX' : vals.subGroup;
        if (vals.domExp) prefix += vals.domExp;
        if (prefix) itemCodeParts.push(prefix);

        if (vals.brand) itemCodeParts.push(vals.brand);
        
        if (vals.gram) itemCodeParts.push(String(vals.gram).padStart(3, '0'));
        
        if (vals.size) {
            const match = vals.size.trim().match(/^([a-zA-Z]+)(\d+)$/);
            if (match) {
                const letters = match[1].toUpperCase();
                const numbers = match[2].padStart(2, '0');
                itemCodeParts.push(`${letters}${numbers}`);
            }
        }
        
        if (vals.sheet) itemCodeParts.push(String(vals.sheet).padStart(3, '0'));
        if (vals.layer && vals.layer !== 'None') itemCodeParts.push(vals.layer);

        // Mock Running Number
        let runningNo = '0001'; 
        // Simple hash to create a deterministic but changing mock running number
        if (prefix && vals.brand) {
            const hash = Array.from(prefix + vals.brand).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            runningNo = String((hash % 9000) + 1000); 
        }
        itemCodeParts.push(runningNo);

        const finalItemCode = Object.values(vals).some(v => v !== '') && itemCodeParts.length > 2 
            ? itemCodeParts.join('-') 
            : '-';
        
        resItemCode.textContent = finalItemCode;

        // --- 3. UOM & Weight Construction ---
        // UOM
        let uom = 'Unit';
        if (vals.domExp === 'E') {
            uom = 'Carton';
        } else if (vals.sheet === '500') {
            uom = 'Ream';
        } else {
            uom = 'Pack'; // Default fallback
        }
        resUom.textContent = uom;

        // Weight (Mock Calculation)
        // Uses Ream/Pallet * (Mock Weight based on Gram/Size)
        let weightStr = '-';
        if (vals.gram && vals.size) {
            // Mock base weight: e.g. 80gsm A4 is ~2.5kg per ream
            const baseWeight = (parseInt(vals.gram) || 80) * 0.03125; 
            const multiplier = parseFloat(vals.reamPallet) || 5; // Default to 5 if empty/0
            const totalWeight = (baseWeight * multiplier).toFixed(2);
            weightStr = `${totalWeight} kg`;
        }
        resWeight.textContent = weightStr;

        // --- 4. Duplicate Checking (Mock) ---
        // If Item Code ends with a specific number, or if certain combinations are made, show alert.
        if (finalItemCode !== '-' && finalItemCode.includes('DA-080')) {
            duplicateAlert.classList.remove('hidden');
        } else {
            duplicateAlert.classList.add('hidden');
        }
    }
    
    // Initial run
    updateCalculations();
});
