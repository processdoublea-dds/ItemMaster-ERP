// app.js — Supabase client and auth are loaded from auth.js

// Collect all form data as JSON object
function collectFormData() {
    const formDataObj = {};
    const allFields = document.querySelectorAll('.form-group input, .form-group select, .checkbox-group-container');
    allFields.forEach(field => {
        const lbl = field.closest('.form-group')?.querySelector('label');
        if (lbl) {
            const key = lbl.innerText.trim();
            let val = '';
            if (field.classList.contains('checkbox-group-container')) {
                const checked = field.querySelectorAll('input[type="checkbox"]:checked');
                val = Array.from(checked).map(c => c.value).join(', ');
            } else if (field.tagName === 'SELECT' && field.selectedIndex >= 0) {
                const t = field.options[field.selectedIndex].text;
                val = t.startsWith('Select ') ? '' : t;
            } else if (field.tagName === 'INPUT') {
                val = field.value || '';
            }
            formDataObj[key] = val;
        }
    });
    return formDataObj;
}

document.addEventListener('DOMContentLoaded', () => {
    // === Auth Guard ===
    if (!requireAuth()) return;
    renderUserBar('userBar');
    const form = document.getElementById('itemForm');
    
    // Banner elements
    const bannerItemCode = document.getElementById('bannerItemCode');
    const bannerItemName = document.getElementById('bannerItemName');
    
    // Output form fields (by name attribute)
    const getOutput = (name) => document.querySelector(`.output-section [name="${name}"]`);
    
    const duplicateAlert = document.getElementById('duplicateAlert');
    const btnReset = document.getElementById('btnReset');

    // --- UI Toggle Logic (Dashboard vs Form) ---
    const btnShowRequestForm = document.getElementById('btnShowRequestForm');
    const btnHideRequestForm = document.getElementById('btnHideRequestForm');
    const requestFormContainer = document.getElementById('requestFormContainer');
    const myRequestsSection = document.getElementById('myRequestsSection');
    const resultBanner = document.getElementById('resultBanner');

    if (resultBanner) resultBanner.style.display = 'none';

    if (btnShowRequestForm && requestFormContainer) {
        btnShowRequestForm.addEventListener('click', () => {
            requestFormContainer.classList.remove('hidden');
            myRequestsSection.classList.add('hidden');
            if (resultBanner) resultBanner.style.display = 'flex';
        });
    }

    if (btnHideRequestForm) {
        btnHideRequestForm.addEventListener('click', () => {
            requestFormContainer.classList.add('hidden');
            myRequestsSection.classList.remove('hidden');
            if (resultBanner) resultBanner.style.display = 'none';
        });
    }

    // Add event listeners to all form inputs (inside input-section only)
    const inputSection = document.querySelector('.input-section');
    const inputs = inputSection.querySelectorAll('form input, form select');
    inputs.forEach(input => {
        input.addEventListener('input', updateCalculations);
        input.addEventListener('change', updateCalculations);
    });

    btnReset.addEventListener('click', () => {
        form.reset();
        updateCalculations();
    });



    // --- Dynamic Location based on Sub-Group ---
    const locationsBySubGroup = {
        'CZ': [
            'AE_Production',
            'CZ1_Production',
            'CZ10_Production',
            'CZ11_Production',
            'CZ2_Production',
            'CZ3_Production',
            'CZ4_Production',
            'CZ5_Production',
            'CZ6_Production',
            'CZ7_Production',
            'CZ9_Production',
            'Guillotine_Production',
            'HTP CZ8_Production'
        ],
        'GC': ['Guillotine_Production'],
        'GK': ['Guillotine_Production'],
        'CK': [
            'CZ1_Production',
            'CZ10_Production',
            'CZ2_Production',
            'CZ3_Production',
            'CZ4_Production',
            'CZ5_Production',
            'CZ6_Production',
            'CZ7_Production',
            'CZ9_Production'
        ],
        'FO': ['Folio_Production']
    };

    const subGroupSelect = document.getElementById('subGroup');
    const locationSelect = document.getElementById('location');

    function updateLocationOptions() {
        const subGroupName = subGroupSelect.value;
        const patternRow = (patternData || []).find(r => r['Item Sub-Group'] === subGroupName);
        const subGroupDigit = patternRow ? patternRow['Digit'] : '';
        const locations = locationsBySubGroup[subGroupDigit] || [];

        // Clear existing
        locationSelect.innerHTML = '';

        if (locations.length === 0) {
            locationSelect.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted);">Select Sub-Group first</p>';
            return;
        }

        // Add checkboxes
        locations.forEach((loc, index) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'location_choice';
            checkbox.value = loc;
            checkbox.id = `loc_${index}`;
            checkbox.addEventListener('change', updateCalculations);
            
            const span = document.createElement('span');
            span.textContent = loc;
            
            wrapper.appendChild(checkbox);
            wrapper.appendChild(span);
            locationSelect.appendChild(wrapper);
        });
    }

    subGroupSelect.addEventListener('change', () => {
        updateLocationOptions();
        updateCalculations();
    });

    // --- Dynamic MPS Color based on Grade ---
    const mpsColorByGrade = {
        'A-COPY': 'เหลือง',
        'A-COPY HIGH SHADE': 'เขียวอ่อน',
        'aA-COPY (CIE150)': 'น้ำเงิน',
        'aA-COPY 150 (FSC MIX70%)': 'น้ำเงิน',
        'aA-COPY 150 (PEFC)': 'น้ำเงิน',
        'aA-Copy Green': 'น้ำเงิน',
        'aA-PRINT': 'เหลือง',
        'B-A-COPY': 'เหลือง',
        'B-A-COPY HIGH SHADE': 'เขียวอ่อน',
        'B-aA-COPY (CIE150)': 'น้ำเงิน',
        'B-aA-PRINT': 'เหลือง',
        'B-Hi Copy': 'ฟ้า',
        'B-Hi Copy+': 'ฟ้า',
        'B-NEW Q COPY (CIE145)': 'เขียวอ่อน',
        'B-SMART COPY (CIE145)': 'เขียวอ่อน',
        'C-A-COPY': 'เหลือง',
        'C-aA-COPY (CIE150)': 'น้ำเงิน',
        'C-aA-COPY GREEN': 'น้ำเงิน',
        'C-aA-PRINT': 'เหลือง',
        'C-SMART PRINT': 'เหลือง',
        'CM': 'น้ำตาล',
        'DA COLOUR PRINT 150': 'น้ำเงิน',
        'DA COLOUR PRINT 150 (FSC MIX70%)': 'น้ำเงิน',
        'DA COLOUR PRINT 150 (PEFC)': 'น้ำเงิน',
        'HI COPY': 'ม่วง',
        'HI COPY+': 'ฟ้า',
        'HI-WC': 'เขียวแก่',
        'HONEY COMB': 'ส้มเข้ม',
        'JING JAI': 'ส้มอ่อน',
        'KT': 'น้ำตาลเข้ม',
        'NEW Q COPY (CIE145)': 'เขียวอ่อน',
        'NEW Q COPY (FSC MIX70%)': 'เขียวอ่อน',
        'NEW Q COPY (PEFC)': 'เขียวอ่อน',
        'REFLEX (FSC MIX70%)': 'เขียวอ่อน',
        'REFLEX (PEFC)': 'เขียวอ่อน',
        'Reject': 'น้ำเงิน',
        'SMART COPY (CIE145)': 'เขียวอ่อน',
        'SMART PRINT': 'เหลือง',
        'WOL': 'เขียวขี้ม้า'
    };

    // --- CSV Data Loading ---
    let sizeData = [];
    let listData = [];
    let glData = [];
    let patternData = [];
    let itemMasterData = [];
    let dbItems = []; // Real-time data from Supabase

    const itemGroupMapping = {
        "Finished Goods - Paper": "1",
        "Finished Goods - Non Paper": "2",
        "Semi Product": "3",
        "Raw Material": "4",
        "Consume": "5",
        "Packaging": "6",
        "Fixed Asset": "F",
        "Service": "S",
        "Sales - Discounts, DN, CN": "L",
        "Marketing": "M"
    };

    function populateSubGroups() {
        if (!patternData || patternData.length === 0) return;
        
        const subGroupSelect = document.getElementById('subGroup');
        const currentVal = subGroupSelect.value;
        
        // Clear except placeholder
        subGroupSelect.innerHTML = '<option value="">Select Sub-Group</option>';
        
        // Get unique, active sub-groups
        const activePatterns = patternData.filter(r => r['Inactive'] !== 'Yes' && r['Item Sub-Group']);
        
        // Sort by name
        const sortedPatterns = [...activePatterns].sort((a, b) => 
            a['Item Sub-Group'].localeCompare(b['Item Sub-Group'])
        );

        sortedPatterns.forEach(r => {
            const name = r['Item Sub-Group'].trim();
            const option = document.createElement('option');
            option.value = name; // Use name as value to ensure uniqueness
            option.textContent = name;
            subGroupSelect.appendChild(option);
        });

        // Restore value if possible
        if (currentVal) subGroupSelect.value = currentVal;
    }

    function populateCountries() {
        if (!listData || listData.length === 0) return;
        
        const countrySelect = document.getElementById('calcShipCountry');
        if (!countrySelect) return;
        
        const currentVal = countrySelect.value;
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        
        // Extract unique countries and their prefixes from listData
        const countriesMap = new Map();
        listData.forEach(r => {
            const country = r['Country']?.trim();
            const prefix = r['Country Prefix NS']?.trim();
            if (country && !countriesMap.has(country)) {
                countriesMap.set(country, prefix || country);
            }
        });

        // Sort names alphabetically
        const sortedCountries = Array.from(countriesMap.keys()).sort();

        sortedCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = countriesMap.get(country);
            option.textContent = country;
            countrySelect.appendChild(option);
        });

        // Restore value if possible
        if (currentVal) countrySelect.value = currentVal;
    }

    async function loadCSVData() {
        try {
            const timestamp = new Date().getTime();
            const [sizeRes, listRes, glRes, patternRes, itemMasterRes] = await Promise.all([
                fetch('Size.csv?t=' + timestamp).then(r => r.text()),
                fetch('List.csv?t=' + timestamp).then(r => r.text()),
                fetch('GL.csv?t=' + timestamp).then(r => r.text()),
                fetch(encodeURI('Item Code Pattern.csv') + '?t=' + timestamp).then(r => r.text()),
                fetch('ItemMaster.csv?t=' + timestamp).then(r => r.text()).catch(() => '') // Optional if not exists yet
            ]);
            
            sizeData = parseCSV(sizeRes);
            listData = parseCSV(listRes);
            glData = parseCSV(glRes);
            patternData = parseCSV(patternRes);
            itemMasterData = parseCSV(itemMasterRes);
            
            populateSubGroups();
            populateCountries();

            // Fetch real-time data from Supabase if available
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('item_requests')
                    .select('item_code, item_name, internal_id');
                if (!error && data) {
                    dbItems = data.map(r => ({
                        'Item Code': r.item_code,
                        'Item Name': r.item_name,
                        'Internal ID': r.internal_id
                    }));
                }
            }

            console.log('Data loaded:', { 
                size: sizeData.length, 
                list: listData.length, 
                gl: glData.length, 
                pattern: patternData.length, 
                master: itemMasterData.length,
                db: dbItems.length
            });
            updateCalculations();
        } catch (error) {
            console.error('Error loading CSV data:', error);
        }
    }

    function parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
        return lines.slice(1).map(line => {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            
            const obj = {};
            headers.forEach((h, i) => {
                let val = values[i] || '';
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1);
                }
                obj[h] = val;
            });
            return obj;
        });
    }

    loadCSVData();

    // Helper: safely get value from element by ID
    function getVal(id) {
        const el = document.getElementById(id);
        if (!el) return '';
        
        // Handle checkbox group for location
        if (id === 'location' && el.classList.contains('checkbox-group-container')) {
            const checked = el.querySelectorAll('input[type="checkbox"]:checked');
            return Array.from(checked).map(c => c.value).join(', ');
        }
        
        return el.value;
    }

    // Helper: safely set output field value
    function setOutput(name, value) {
        const el = getOutput(name);
        if (el) el.value = value || '';
    }

    // Calculate all values
    function updateCalculations() {
        // Size normalization: change lowercase to uppercase automatically
        const sizeInput = document.getElementById('size');
        if (sizeInput && sizeInput.value !== sizeInput.value.toUpperCase()) {
            sizeInput.value = sizeInput.value.toUpperCase();
        }

        const vals = {
            type: getVal('type'),
            itemGroup: getVal('itemGroup'),
            subGroup: getVal('subGroup'),
            domExp: getVal('domExp'),
            brand: getVal('brand'),
            gram: getVal('gram'),
            size: getVal('size'),
            sheet: getVal('sheet'),
            layer: getVal('layer'),
            wrapType: getVal('wrapType'),
            palletType: getVal('palletType'),
            reamBox: getVal('reamBox'),
            palletSize: getVal('palletSize'),
            location: getVal('location'),
            category: getVal('category'),
            grade: getVal('grade'),
            reamPallet: getVal('reamPallet'),
            isSpecialReam: document.getElementById('isSpecialReam')?.checked || false,
            calcShipCountry: getVal('calcShipCountry')
        };

        // Visibility toggle for Special Ream
        const specialReamContainer = document.getElementById('specialReamContainer');
        const isSpecialReamCheckbox = document.getElementById('isSpecialReam');
        if (specialReamContainer && isSpecialReamCheckbox) {
            const isReamBoxSelected = vals.reamBox && vals.reamBox !== 'None';
            specialReamContainer.style.display = isReamBoxSelected ? 'flex' : 'none';
            if (!isReamBoxSelected) {
                isSpecialReamCheckbox.checked = false;
                vals.isSpecialReam = false;
            }
        }

        const brandSelect = document.getElementById('brand');
        const brandText = vals.brand && brandSelect && brandSelect.selectedIndex > 0 
            ? brandSelect.options[brandSelect.selectedIndex].text 
            : '';

        const subGroupSelect = document.getElementById('subGroup');
        const subGroupText = vals.subGroup && subGroupSelect && subGroupSelect.selectedIndex > 0
            ? subGroupSelect.options[subGroupSelect.selectedIndex].text
            : '';

        let patternRow = null;
        let subGroupDigit = '';
        if (vals.subGroup && patternData && patternData.length > 0) {
            // vals.subGroup is now the full name from the select value
            patternRow = patternData.find(r => r['Item Sub-Group'] === vals.subGroup);
            if (patternRow) {
                subGroupDigit = patternRow['Digit'] || '';
                const groupNames = (patternRow['Item Group'] || '').split(',').map(g => g.trim());
                const itemGroupSelect = document.getElementById('itemGroup');
                if (itemGroupSelect && groupNames.length > 0) {
                    const firstGroupName = groupNames[0];
                    for (let i = 0; i < itemGroupSelect.options.length; i++) {
                        if (itemGroupSelect.options[i].text === firstGroupName) {
                            if (itemGroupSelect.value !== itemGroupSelect.options[i].value) {
                                itemGroupSelect.value = itemGroupSelect.options[i].value;
                                vals.itemGroup = itemGroupSelect.value;
                            }
                            break;
                        }
                    }
                }
            }
        }

        const domExpSelect = document.getElementById('domExp');
        const domExpText = vals.domExp && domExpSelect && domExpSelect.selectedIndex > 0
            ? domExpSelect.options[domExpSelect.selectedIndex].text
            : '';

        // --- 1. Item Name Construction ---
        let itemNameParts = [];
        if (brandText) itemNameParts.push(brandText);
        let middlePart = '';
        if (vals.gram) middlePart += `${vals.gram}G `;
        if (vals.size) middlePart += `${vals.size} `;
        if (vals.sheet) middlePart += `(${vals.sheet})`;
        if (middlePart.trim()) itemNameParts.push(middlePart.trim());

        let wrapTypeAbbr = '';
        if (vals.wrapType === 'Box AUTO') wrapTypeAbbr = 'AUTO';
        else if (vals.wrapType === 'Box MN') wrapTypeAbbr = 'MN';
        else if (vals.wrapType === 'Box MN (CVB)') wrapTypeAbbr = 'CVB';
        else if (vals.wrapType === 'SHR') wrapTypeAbbr = 'SHR';

        if (wrapTypeAbbr && ['CZ', 'CK', 'GC', 'GK'].includes(subGroupDigit)) {
            itemNameParts.push(wrapTypeAbbr);
        }
        if (vals.layer && vals.layer !== 'None') itemNameParts.push(vals.layer);
        if (vals.reamBox && vals.reamBox !== 'None' && vals.isSpecialReam) {
            itemNameParts.push(vals.reamBox);
        }
        if (vals.reamPallet) {
            const rpCode = vals.sheet === '500' ? 'R/P' : 'PAC/P';
            itemNameParts.push(`${vals.reamPallet} ${rpCode}`);
        }
        if (vals.palletType && vals.palletType !== 'None') itemNameParts.push(vals.palletType);
        if (vals.grade && vals.grade.includes('FSC')) itemNameParts.push('FSC MIX70%');
        if (vals.palletSize === 'DIY') itemNameParts.push('T');
        if (vals.palletSize === 'EU/EURO') itemNameParts.push('E');

        const finalItemName = itemNameParts.join(' ').trim() || '-';

        // --- Size Code extraction ---
        let sizeCode = '';
        if (vals.size) {
            const match = vals.size.trim().match(/^([a-zA-Z]+)(\d+)$/);
            if (match) {
                sizeCode = `${match[1].toUpperCase()}${match[2].padStart(2, '0')}`;
            }
        }

        // --- Sheet Code mapping (e.g., 2500 -> 25C) ---
        const sheetCodePart = (vals.sheet === '2500') ? '25C' : String(vals.sheet || '').padStart(3, '0');

        // --- Item Code Construction based on Pattern Yes/No ---
        let itemCodeParts = [];
        let prefix = vals.itemGroup || '';
        
        if (patternRow) {
            prefix += patternRow['Digit'] || '';
            if (patternRow['Domistic&Export'] === 'Yes') {
                prefix += vals.domExp || '';
            }
            if (prefix) itemCodeParts.push(prefix);

            if (patternRow['Brand'] === 'Yes' && vals.brand) itemCodeParts.push(vals.brand);
            if (patternRow['Grade'] === 'Yes' && vals.grade) {
                // If there's a specific abbreviation logic for grade, it can be added here.
                // For now, appending it directly.
                itemCodeParts.push(vals.grade);
            }
            if (patternRow['Gram'] === 'Yes' && vals.gram) itemCodeParts.push(String(vals.gram).padStart(3, '0'));
            if (patternRow['Paper Size'] === 'Yes' && sizeCode) itemCodeParts.push(sizeCode);
            if (patternRow['Sheet'] === 'Yes' && vals.sheet) itemCodeParts.push(sheetCodePart);
            if (patternRow['Layer'] === 'Yes' && vals.layer && vals.layer !== 'None') itemCodeParts.push(vals.layer);
            if (patternRow['Wrap'] === 'Yes' && wrapTypeAbbr) itemCodeParts.push(wrapTypeAbbr);
            if (patternRow['Pallet'] === 'Yes' && vals.palletType && vals.palletType !== 'None') itemCodeParts.push(vals.palletType);
            
        } else {
            // Fallback to old logic if no pattern found
            prefix += (subGroupDigit === 'Extra' ? 'EX' : (subGroupDigit || '')) + (vals.domExp || '');
            if (prefix) itemCodeParts.push(prefix);
            if (vals.brand) itemCodeParts.push(vals.brand);
            if (vals.gram) itemCodeParts.push(String(vals.gram).padStart(3, '0'));
            if (sizeCode) itemCodeParts.push(sizeCode);
            if (vals.sheet) itemCodeParts.push(sheetCodePart);
            if (vals.layer && vals.layer !== 'None') itemCodeParts.push(vals.layer);
        }
        
        
        // Combine CSV and Database items for accurate running number and parent lookups
        const combinedMaster = itemMasterData.concat(dbItems);

        // --- Running No. lookup from ItemMaster.csv & DB ---
        const itemCodePrefix = itemCodeParts.join('-');
        let runningNo = '001';
        if (itemCodePrefix && combinedMaster.length > 0) {
            const searchPrefix = itemCodePrefix + '-';
            let maxRunning = 0;
            combinedMaster.forEach(row => {
                const code = (row['Item Code'] || '').trim();
                const segments = code.split('-');
                // Structural match: must have exactly 1 more segment than our prefix list (for the running number)
                if (segments.length === itemCodeParts.length + 1) {
                    const codePrefix = segments.slice(0, -1).join('-');
                    if (codePrefix === itemCodePrefix) {
                        const lastSeg = segments[segments.length - 1];
                        const num = parseInt(lastSeg, 10);
                        if (!isNaN(num) && num > maxRunning) {
                            maxRunning = num;
                        }
                    }
                }
            });
            runningNo = String(maxRunning + 1).padStart(3, '0');
        }
        itemCodeParts.push(runningNo);

        let finalItemCode = Object.values(vals).some(v => v !== '') && itemCodeParts.length > 2 
            ? itemCodeParts.join('-') 
            : '-';

        setOutput('calcItemCode', finalItemCode);
        setOutput('calcItemName', finalItemName);
        bannerItemCode.textContent = finalItemCode;
        bannerItemName.textContent = finalItemName;

        // --- SubItem Construction ---
        let subitemName = '';
        if (brandText) subitemName += brandText + ' ';
        if (vals.gram) subitemName += vals.gram + 'G ';
        if (vals.size) subitemName += vals.size + ' ';
        if (vals.sheet) subitemName += '(' + vals.sheet + ')';
        const subItemNameTrimmed = subitemName.trim();
        setOutput('subitemItemName', subItemNameTrimmed);

        // --- Lookups and Calculations ---
        const sizeRow = sizeData.find(r => r.Type === 'Paper' && (r.Size === vals.size || r['Paper Size'] === vals.size) && r.Gram === vals.gram && r.Sheet === vals.sheet);
        const listRow = listData.find(r => r['Digit (Update)'] === vals.brand);
        const palletRow = sizeData.find(row => row.Type === 'Pallet' && (row['Paper Size'] === vals.palletSize || row.Size === vals.palletSize));

        // Internal ID_Parent & SubItem of Item Code lookups from combined data
        const rowForParent = combinedMaster.find(r => (r['Item Name'] || '').trim() === subItemNameTrimmed);
        
        let parentCodeVal = finalItemCode;
        if (rowForParent) {
            // Clean up prefix like "notuse_" if it exists
            parentCodeVal = (rowForParent['Item Code'] || '').replace(/^(notuse|not use|not-use|not_use)_/i, '');
        }

        setOutput('internalIdParent', rowForParent ? rowForParent['Internal ID'] : '');
        setOutput('subitemItemCode', parentCodeVal);

        // 1. Ream/Pack
        let reamPackValNum = 0;
        let reamPackStr = '';
        if (vals.sheet !== '2500' && sizeRow) {
            let val = vals.sheet === '500' ? sizeRow['Weight / Ream (KG)'] : sizeRow['Weight / Pack (KG)'];
            if (val) {
                reamPackValNum = parseFloat(val);
                const dec = (vals.subGroup || '').includes('LTA') ? 2 : 3;
                reamPackStr = reamPackValNum.toFixed(dec);
            }
        }
        setOutput('reamPack', reamPackStr);

        // 2. UOM1
        let uom1 = '';
        if (vals.sheet === '500') uom1 = 'Ream';
        else if (vals.sheet !== '2500' && vals.sheet !== '') uom1 = 'Pack';
        setOutput('uom1', uom1);

        // 3. UOM2
        let uom2 = '';
        if (vals.domExp === 'E' || vals.domExp === 'M') uom2 = 'Carton';
        else if (vals.domExp === 'D') uom2 = 'Box';
        setOutput('uom2', uom2);

        // 4. Box
        let boxValNum = 0;
        let boxStr = '';
        if (sizeRow) {
            if (vals.sheet === '2500') {
                let val = sizeRow['Weight / Box (KG)'];
                if (val) {
                    boxValNum = parseFloat(val);
                    boxStr = boxValNum.toFixed(3);
                }
            } else if (reamPackValNum && vals.reamBox && vals.reamBox !== 'None') {
                // Handle both 'R' and 'P' suffixes
                const rbValue = parseFloat(vals.reamBox.replace(/[RP]/g, ''));
                if (!isNaN(rbValue)) {
                    boxValNum = reamPackValNum * rbValue;
                    boxStr = boxValNum.toFixed(3);
                }
            }
        }
        setOutput('box', boxStr);

        // 5. Pallet
        let palletValNum = 0;
        let palletStr = '';
        if (vals.type === 'Child' && vals.reamPallet) {
            const rp = parseFloat(vals.reamPallet);
            if (vals.sheet === '2500' && boxValNum) {
                palletValNum = boxValNum * rp;
            } else if (reamPackValNum) {
                palletValNum = reamPackValNum * rp;
            }
            if (palletValNum) palletStr = palletValNum.toFixed(3);
        }
        setOutput('palletUom', palletStr);

        // 6. Primary Sale Unit
        let primarySaleUnit = '';
        if (vals.type === 'Parent') {
            primarySaleUnit = 'KG';
        } else if (vals.domExp === 'E' || vals.domExp === 'M') {
            primarySaleUnit = 'MT';
        } else if (vals.domExp === 'D') {
            primarySaleUnit = 'Ream';
        } else if (['Australia', 'Germany'].includes(vals.category)) {
            primarySaleUnit = 'Carton';
        }
        setOutput('primarySaleUnit', primarySaleUnit);

        // 7. Country of Origin & 8. HS Code
        if (vals.itemGroup === '1') {
            setOutput('countryOfOrigin', 'Thailand');
            setOutput('hsCode', '48025690');
        } else {
            setOutput('countryOfOrigin', '');
            setOutput('hsCode', '');
        }

        // 9. Commodities
        setOutput('commodities', brandText ? `Photocopy Paper "${brandText}" Brand` : '');

        // 10. Block PM
        let blockPm = '';
        if (vals.itemGroup === '3') {
            blockPm = vals.location;
        } else {
            // Normalize gram values for comparison (handles cases like '070' vs '70')
            const normalizedGram = vals.gram ? String(parseInt(vals.gram, 10)) : '';
            const match = listData.find(r => {
                const csvGram = r.Gram_ ? String(parseInt(r.Gram_, 10)) : '';
                return r.Grade_ === vals.grade && csvGram === normalizedGram;
            });
            if (match) {
                blockPm = match['Location Default'] || '';
            }
        }
        setOutput('blockPm', blockPm);

        // Sheet/Pallet calculation
        let sheetPerPalletVal = '';
        if (vals.sheet && vals.reamPallet) {
            const s = parseFloat(vals.sheet);
            const rp = parseFloat(vals.reamPallet);
            if (!isNaN(s) && !isNaN(rp)) {
                sheetPerPalletVal = (s * rp).toString();
            }
        }
        setOutput('sheetPallet', sheetPerPalletVal);

        // 11. Category Group
        let catGroup = 'Non DA';
        if (brandText) {
            const b = brandText.toUpperCase().trim();
            const gr = parseInt(vals.gram) || 0;
            
            if (b.startsWith('DOUBLE A')) {
                if (gr === 70 || gr === 75) {
                    catGroup = 'DA-70,75';
                } else if ([80, 90, 100, 120].includes(gr)) {
                    catGroup = 'DA-80';
                }
            } else {
                const oemBrands = [
                    'SIMON', 'GLOBAL', 'GIANT KING KONG', 'LINK MAX', 'LYRECO', 
                    'OFM', 'ONE GREEN', 'ONPOINT', 'PREMIER', 'Q-BIZ BLUE', 
                    'Q-BIZ RED', 'TOP PRINT 92', 'TOP PRINT 97', 'W.B MASON', 'WHITE BOX'
                ];
                if (oemBrands.includes(b)) {
                    catGroup = 'OEM';
                }
            }
        }
        setOutput('catagoryGroup', catGroup);

        // 12. Mixed Pallet
        let mixedPalletVal = '';
        if (vals.type === 'Child' && finalItemCode !== '-') {
            if (/^(1CL|2CL)/.test(finalItemCode)) {
                mixedPalletVal = 'Yes';
            } else if (/^(1CZ|1CG|1FO|1 FG|1CM|1RG|1RC|1GC|1CK|1GK)/.test(finalItemCode)) {
                mixedPalletVal = 'No';
            }
        }
        setOutput('mixedPallet', mixedPalletVal);

        // --- Brand Group ---
        let brandGroup = '';
        if (listRow && vals.gram && sizeCode) {
            const groupRunning = listRow['Group Running'];
            const gram3 = String(vals.gram).padStart(3, '0');
            brandGroup = `${groupRunning}${gram3}${sizeCode}`;
        }
        setOutput('brandGroup', brandGroup);

        // --- Standard/Net Weight (KG) ---
        let netWeight = palletValNum || boxValNum || reamPackValNum || 0;
        setOutput('stdNetWeightKg', netWeight > 0 ? netWeight.toFixed(3) : '-');

        // --- Weight of Unit ---
        let weightOfUnitVal = (subGroupDigit === 'CZ') ? 'Pallet' : '';
        setOutput('weightOfUnit', weightOfUnitVal);

        // --- Gross Weight ---
        const markup = vals.subGroup === 'FO' ? 6.54 : 7;
        setOutput('grossWeightMarkup', markup + '%');
        let grossWeight = netWeight * (1 + markup / 100);
        setOutput('calcGrossWeight', netWeight > 0 ? grossWeight.toFixed(3) : '-');

        // --- Heights ---
        let productHeight = '-';
        if (sizeRow && vals.layer) {
            const cmHeight = parseFloat(sizeRow['ความสูงต่อ 1 Layer (CM)']);
            if (!isNaN(cmHeight)) {
                productHeight = ((cmHeight / 2.54) * parseFloat(vals.layer)).toFixed(2);
            }
        }
        setOutput('heightInch', productHeight);

        let palletHeight = '-';
        if (palletRow) {
            const pHeight = parseFloat(palletRow['ความสูง/Layer (นิ้ว)']);
            if (!isNaN(pHeight)) {
                palletHeight = pHeight.toFixed(2);
            }
        }
        setOutput('palletHeightInch', palletHeight);

        // --- GL Account Lookups ---
        if (glData.length > 0) {
            const glMatches = glData.filter(r => r['Item Sub-Group'] === subGroupText);
            let glRow = glMatches.find(r => r['Domestic / Export'] === domExpText);
            if (!glRow) {
                glRow = glMatches.find(r => r['Domestic / Export'] === 'Domestic/Export' || r['Domestic / Export'] === '');
            }
            if (glRow) {
                const expAcc = glRow['Expense/COGS Account'];
                const assetAcc = glRow['Asset Account'];
                const incomeAcc = glRow['Income Account'];
                setOutput('expenseCogsAccount', expAcc);
                setOutput('assetAccount', assetAcc);
                setOutput('incomeAccount', incomeAcc);
                const findId = (accName) => {
                    const row = glData.find(r => r['Account'] === accName);
                    return row ? row['Internal ID (Account)'] : '';
                };
                setOutput('expenseCogsAccountId', findId(expAcc));
                setOutput('assetAccountId', findId(assetAcc));
                setOutput('incomeAccountId', findId(incomeAcc));
            } else {
                ['expenseCogsAccount', 'assetAccount', 'incomeAccount', 'expenseCogsAccountId', 'assetAccountId', 'incomeAccountId'].forEach(f => setOutput(f, ''));
            }
        }

        // --- Tax Schedule ---
        let taxSchedule = '';
        if (vals.domExp === 'E' || vals.domExp === 'M') taxSchedule = 'Export 0%';
        else if (vals.domExp === 'D') taxSchedule = 'P7S7';
        setOutput('taxSchedule', taxSchedule);

        // --- Web Store Fields ---
        setOutput('displayInWebSite', vals.type === 'Parent' ? 'Yes' : 'No');
        setOutput('pageTitle', `${brandText} ${vals.gram} GSM ${vals.size} (${vals.sheet})`);
        
        const sizeUnit = sizeRow ? sizeRow['Unit'] : '';
        const displaySize = sizeRow ? sizeRow['Size'] : vals.size;
        setOutput('webStoreDisplayName', `${brandText} ${vals.gram}G ${vals.size} (${vals.sheet}) ${displaySize} ${sizeUnit}`);

        // --- URL Component ---
        const dimensions = sizeRow ? `${sizeRow['กว้าง']}x${sizeRow['ยาว']}` : '';
        const baseName = vals.type === 'Parent' ? finalItemName : subItemNameTrimmed;
        // Count items with the same base name in ItemMaster.csv
        const countCheck = itemMasterData.filter(r => r['Item Name'] === baseName).length + 1;
        const brandTrim = brandText.trim().replace(/\s+/g, '');
        setOutput('urlComponent', `${brandTrim}-${vals.gram}G-${vals.size}-${vals.sheet}-${dimensions}-mm_${countCheck}`);

        // --- TWMS Fields ---
        const twmsVal = vals.type === 'Child' ? 'Yes' : 'No';
        setOutput('twmsUsePallet', twmsVal);
        setOutput('twmsPreAssignLot', twmsVal);
        setOutput('calcTwmsPreAssignPallet', twmsVal);

        // Other static/derived fields
        setOutput('calcType', vals.type);
        setOutput('calcMpsColor', mpsColorByGrade[vals.grade] || '');
        setOutput('calcBoi', 'Non BOI');
        setOutput('subsidiary', '2');
        setOutput('classNoHierarchy', 'Paper Segment');
        setOutput('kg', '1');
        setOutput('primaryUnitsType', 'KG');
        setOutput('primaryStockUnit', 'KG');
        setOutput('primaryPurchaseUnit', 'KG');
        setOutput('primaryConsumptionUnit', 'KG');
        setOutput('mfgItemBatchQty', '1,000');
        setOutput('itemMappingDcs', 'No');
        setOutput('mrpActive', 'Yes');
        setOutput('mfgIncludeAutoTransfer', 'No');
        setOutput('scrapAccount', '4849');
        setOutput('wipAccount', '1368');
        setOutput('scaItemSubType', 'Copy Paper');
        setOutput('unitTypeUom', '');
        setOutput('primaryUnitType', finalItemCode);

        let matchedItem = null;
        let historyItems = [];
        if (itemMasterData && itemMasterData.length > 0) {
            // Find specific duplicate
            matchedItem = itemMasterData.find(r => 
                (finalItemCode !== '-' && r['Item Code'] === finalItemCode) || 
                (finalItemName !== '-' && r['Item Name'] === finalItemName)
            );

            // Find history (same prefix)
                const targetPrefix = itemCodeParts.slice(0, -1).join('-');
                historyItems = itemMasterData
                    .filter(r => {
                        const code = (r['Item Code'] || '').trim();
                        const segments = code.split('-');
                        // Match codes with the same number of segments as the one we just generated
                        return segments.length === itemCodeParts.length && segments.slice(0, -1).join('-') === targetPrefix;
                    })
                    .sort((a, b) => (a['Item Code'] || '').localeCompare(b['Item Code'] || ''))
                    .slice(-5); // Show last 5

        }

        // Update Duplicate Alert & History
        if (matchedItem || historyItems.length > 0) {
            duplicateAlert.classList.remove('hidden');
            const alertContent = duplicateAlert.querySelector('.alert-content');
            if (alertContent) {
                let html = '';
                
                if (matchedItem) {
                    html += `
                        <strong style="color: #b91c1c;">⚠️ พบข้อมูลซ้ำในระบบ! (Duplicate Found)</strong>
                        <div style="margin: 0.5rem 0; padding: 0.5rem; background: #fee2e2; border-radius: 4px; font-size: 0.85rem;">
                            <p><strong>Code:</strong> ${matchedItem['Item Code']}</p>
                            <p><strong>Name:</strong> ${matchedItem['Item Name']}</p>
                        </div>
                    `;
                }

                if (historyItems.length > 0) {
                    html += `
                        <div style="margin-top: 0.8rem;">
                            <strong style="font-size: 0.9rem;">📚 รายการที่มีอยู่ก่อนหน้า (History):</strong>
                            <table style="width: 100%; margin-top: 0.3rem; border-collapse: collapse; font-size: 0.8rem;">
                                <thead style="border-bottom: 1px solid #fed7aa;">
                                    <tr>
                                        <th style="text-align: left; padding: 2px;">Item Code</th>
                                        <th style="text-align: left; padding: 2px;">Item Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${historyItems.map(h => `
                                        <tr>
                                            <td style="padding: 2px; color: #4338ca;">${h['Item Code']}</td>
                                            <td style="padding: 2px;">${h['Item Name']}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                alertContent.innerHTML = html;
            }
        } else {
            duplicateAlert.classList.add('hidden');
        }
    }
    
    // Export CSV Template logic
    const btnExportCsv = document.getElementById('btnExportCsv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const headers = [];
            const values = [];
            
            const allFields = document.querySelectorAll('.form-group input, .form-group select, .checkbox-group-container');
            allFields.forEach(field => {
                const label = field.closest('.form-group').querySelector('label');
                if (label) {
                    headers.push('"' + label.innerText.replace(/"/g, '""') + '"');
                    let val = '';
                    
                    if (field.classList.contains('checkbox-group-container')) {
                        val = getVal(field.id);
                    } else if (field.tagName === 'SELECT' && field.selectedIndex >= 0) {
                        const textVal = field.options[field.selectedIndex].text;
                        if (!textVal.startsWith('Select ')) {
                            val = textVal;
                        } else {
                            val = '';
                        }
                    } else if (field.tagName === 'INPUT') {
                        val = field.value || '';
                    }
                    
                    values.push('"' + val.replace(/"/g, '""') + '"');
                }
            });
            
            const csvContent = headers.join(',') + '\n' + values.join(',');
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'Item_Master_Template.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // === Submit Request ===
    const btnSubmitRequest = document.getElementById('btnSubmitRequest');
    if (btnSubmitRequest) {
        btnSubmitRequest.addEventListener('click', async () => {
            const itemCode = bannerItemCode.textContent || '-';
            const itemName = bannerItemName.textContent || '-';

            if (itemCode === '-' || itemName === '-') {
                alert('กรุณากรอกข้อมูลให้ครบก่อน Submit');
                return;
            }

            const user = getUser();
            const formData = collectFormData();

            btnSubmitRequest.disabled = true;
            btnSubmitRequest.textContent = '⏳ กำลังส่ง...';

            try {
                const { error } = await supabaseClient
                    .from('item_requests')
                    .insert({
                        requested_by: user.emp_id,
                        requested_name: user.full_name,
                        item_code: itemCode,
                        item_name: itemName,
                        form_data: formData,
                        status: 'pending'
                    });

                if (error) throw error;

                // Show success
                const submitSuccess = document.getElementById('submitSuccess');
                submitSuccess.classList.remove('hidden');
                setTimeout(() => submitSuccess.classList.add('hidden'), 4000);

                // Reload requests
                loadMyRequests();

                // Reset form
                form.reset();
                updateCalculations();

                // Go back to Dashboard after 1.5 seconds
                setTimeout(() => {
                    const btnHideRequestForm = document.getElementById('btnHideRequestForm');
                    if (btnHideRequestForm) btnHideRequestForm.click();
                }, 1500);

            } catch (err) {
                alert('เกิดข้อผิดพลาด: ' + (err.message || 'ลองใหม่อีกครั้ง'));
            } finally {
                btnSubmitRequest.disabled = false;
                btnSubmitRequest.textContent = '📤 Submit Request';
            }
        });
    }

    // === My Requests ===
    let currentFilter = 'all';

    async function loadMyRequests() {
        const user = getUser();
        if (!user) return;

        let query = supabaseClient
            .from('item_requests')
            .select('*')
            .eq('requested_by', user.emp_id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (currentFilter !== 'all') {
            query = query.eq('status', currentFilter);
        }

        const { data, error } = await query;
        const requestList = document.getElementById('requestList');

        if (error) {
            requestList.innerHTML = '<div class="request-empty">โหลดข้อมูลไม่สำเร็จ</div>';
            return;
        }

        if (!data || data.length === 0) {
            requestList.innerHTML = '<div class="request-empty">ยังไม่มีคำขอ</div>';
            return;
        }

        requestList.innerHTML = data.map(req => {
            const date = new Date(req.created_at);
            const dateStr = date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
                + ' ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            const statusMap = {
                pending: { label: '⏳ รออนุมัติ', cls: 'status-pending' },
                in_progress: { label: '🔄 กำลังดำเนินการ', cls: 'status-progress' },
                completed: { label: '✅ เสร็จสิ้น', cls: 'status-completed' },
                rejected: { label: '❌ ปฏิเสธ', cls: 'status-rejected' }
            };
            const st = statusMap[req.status] || { label: req.status, cls: '' };

            return `<div class="request-row">
                <div class="request-info">
                    <span class="request-code">${req.item_code || '-'}</span>
                    <span class="request-name">${req.item_name || '-'}</span>
                </div>
                <div class="request-meta">
                    <span class="request-date">${dateStr}</span>
                    <span class="request-status ${st.cls}">${st.label}</span>
                </div>
                ${req.admin_note ? `<div class="request-note">💬 ${req.admin_note}</div>` : ''}
                ${req.erp_internal_id ? `<div class="request-note">🔗 ERP ID: ${req.erp_internal_id}</div>` : ''}
            </div>`;
        }).join('');
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadMyRequests();
        });
    });

    // ==========================================================================
    // ✨ PREMIUM GEMINI AI AUTO-FILL LOGIC
    // ==========================================================================
    let lastExtractedData = null;

    const aiModal = document.getElementById('aiModal');
    const btnTriggerAI = document.getElementById('btnTriggerAI');
    const btnCloseAI = document.getElementById('btnCloseAI');
    const btnAnalyzeAI = document.getElementById('btnAnalyzeAI');
    const btnApplyAI = document.getElementById('btnApplyAI');
    const aiInput = document.getElementById('aiInput');
    const aiKey = document.getElementById('aiKey');
    const aiError = document.getElementById('aiError');
    const aiPreviewContainer = document.getElementById('aiPreviewContainer');
    const aiPreviewGrid = document.getElementById('aiPreviewGrid');

    // Load saved key
    if (localStorage.getItem('gemini_api_key')) {
        aiKey.value = localStorage.getItem('gemini_api_key');
    }
    aiKey.addEventListener('input', () => {
        localStorage.setItem('gemini_api_key', aiKey.value.trim());
    });

    if (btnTriggerAI) {
        btnTriggerAI.addEventListener('click', () => {
            aiModal.classList.remove('hidden');
            aiError.classList.add('hidden');
            aiPreviewContainer.classList.add('hidden');
            btnApplyAI.classList.add('hidden');
            aiInput.value = '';
            setTimeout(() => aiInput.focus(), 100);
        });
    }

    if (btnCloseAI) {
        btnCloseAI.addEventListener('click', () => {
            aiModal.classList.add('hidden');
        });
    }

    aiModal.addEventListener('click', (e) => {
        if (e.target === aiModal) {
            aiModal.classList.add('hidden');
        }
    });

    async function runGeminiExtraction(text) {
        // Collect dynamic domain options directly from loaded database options
        const brandSelect = document.getElementById('brand');
        const allowedBrands = Array.from(brandSelect?.options || []).map(opt => ({
            code: opt.value,
            name: opt.text
        })).filter(o => o.code);

        const gradeSelect = document.getElementById('grade');
        const allowedGrades = Array.from(gradeSelect?.options || []).map(opt => opt.value).filter(Boolean);

        const allowedSubGroups = (patternData || [])
            .filter(r => r['Inactive'] !== 'Yes' && r['Item Sub-Group'])
            .map(r => r['Item Sub-Group'].trim());

        const countriesMap = new Map();
        listData.forEach(r => {
            const country = r['Country']?.trim();
            const prefix = r['Country Prefix NS']?.trim();
            if (country) {
                countriesMap.set(country, prefix || country);
            }
        });
        const allowedCountries = Array.from(countriesMap.keys());

        const systemPrompt = `You are an expert product spec analyzer for an ERP item master creation screen.
Your job is to read unstructured text describing a paper product and extract its properties in JSON format.

IMPORTANT: You must return a valid JSON object ONLY. Do not include any markdown formatting (like \`\`\`json) or extra text.

Here are the precise allowed values for key options from our database schema. You MUST classify to these values if mentioned, otherwise return null:

1. Brand:
${JSON.stringify(allowedBrands, null, 2)}
Return the "code" of the matching brand (e.g., "DA" for Double A, "AL" for Alpine).

2. Grade (Paper grade):
${JSON.stringify(allowedGrades, null, 2)}
Match to the exact grade name in the list.

3. Item Sub-Group:
${JSON.stringify(allowedSubGroups, null, 2)}
Match to the exact sub-group name in the list (e.g. "CZ", "GC", "GK", "CK", "FO").

4. Ship to Country:
${JSON.stringify(allowedCountries, null, 2)}
Return the matching country name.

5. Type:
Only choose from: "Parent" or "Child". If size, sheets, or grams are specified, it is usually a "Child" item.

6. Domestic/Export:
Select "D" (for Domestic / ส่งในประเทศ) or "E" (for Export / ส่งออกนอก).

Extract the following numeric/text details:
- gram: GSM weight as integer (e.g., 80)
- size: Dimensions as text (e.g., "A4", "A3", "8.5x11", "210x297")
- sheet: Count of sheets as text (e.g., "500")
- reamPallet: Ream per Pallet as integer
- layer: Selected layer option (e.g., "2L", "3L", "4L", "5L", "6L", "8L", "10L", "12L", "16L", "17L")
- wrapType: Selected wrap type option (e.g., "Box AUTO", "Box MN", "Box MN (CVB)", "SHR")
- palletType: Selected pallet type option (e.g., "N", "S", "SS")
- reamBox: Selected ream/box option (e.g., "1R", "2R", "3R", "4R", "5R", "8R", "10R", "5P", "6P", "10P", "24P", "40P", "48P", "CVB ไม่ห่อรีม")

Your output JSON must strictly follow this structure:
{
  "type": "Parent" | "Child" | null,
  "subGroup": string | null,
  "domExp": "D" | "E" | null,
  "calcShipCountry": string | null,
  "brand": string | null,
  "grade": string | null,
  "gram": number | null,
  "size": string | null,
  "sheet": string | null,
  "reamPallet": number | null,
  "layer": string | null,
  "wrapType": string | null,
  "palletType": string | null,
  "reamBox": string | null
}`;

        const key = aiKey.value.trim() || 'DUMMY_KEY_FOR_IFRAME_SHIM';
        
        if ((key === 'DUMMY_KEY_FOR_IFRAME_SHIM' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) || key.toUpperCase() === 'MOCK') {
            console.log("Mocking Gemini response on localhost");
            await new Promise(resolve => setTimeout(resolve, 1500));
            const lowerText = text.toLowerCase();
            if (lowerText.includes('double a') || lowerText.includes('ดับเบิ้ลเอ')) {
                return {
                    "type": "Child",
                    "subGroup": "CZ",
                    "domExp": "E",
                    "calcShipCountry": "France",
                    "brand": "DA",
                    "grade": "A-COPY",
                    "gram": 80,
                    "size": "A4",
                    "sheet": "500",
                    "reamPallet": 150,
                    "layer": "5L",
                    "wrapType": "Box AUTO",
                    "palletType": "N",
                    "reamBox": "5R"
                };
            } else if (lowerText.includes('alpine')) {
                return {
                    "type": "Child",
                    "subGroup": "FO",
                    "domExp": "E",
                    "calcShipCountry": "Australia",
                    "brand": "AL",
                    "grade": "WOL",
                    "gram": 120,
                    "size": "A3",
                    "sheet": "250",
                    "reamPallet": 100,
                    "layer": "4L",
                    "wrapType": "SHR",
                    "palletType": "S",
                    "reamBox": "4R"
                };
            } else {
                return {
                    "type": "Parent",
                    "subGroup": "CZ",
                    "domExp": "D",
                    "calcShipCountry": "Thailand",
                    "brand": "ST",
                    "grade": "WOL",
                    "gram": 80,
                    "size": null,
                    "sheet": null,
                    "reamPallet": null,
                    "layer": null,
                    "wrapType": null,
                    "palletType": null,
                    "reamBox": null
                };
            }
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: systemPrompt },
                        { text: `Raw product text to extract: "${text}"` }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API error (${response.status}): ${errText}`);
        }

        const resJson = await response.json();
        const resultText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) {
            throw new Error("No extraction result returned from Gemini");
        }

        return JSON.parse(resultText);
    }

    function renderAIPreview(result) {
        aiPreviewGrid.innerHTML = '';
        
        const brandSelect = document.getElementById('brand');
        const allowedBrands = Array.from(brandSelect?.options || []).map(opt => ({
            code: opt.value,
            name: opt.text
        })).filter(o => o.code);

        const fieldsToDisplay = [
            { id: 'type', label: 'Type' },
            { id: 'subGroup', label: 'Item Sub-Group' },
            { id: 'domExp', label: 'Domestic/Export', displayVal: v => v === 'D' ? 'Domestic (D)' : v === 'E' ? 'Export (E)' : v },
            { id: 'calcShipCountry', label: 'Ship to Country' },
            { id: 'brand', label: 'Brand', displayVal: v => {
                const found = allowedBrands.find(b => b.code === v);
                return found ? `${found.name} (${v})` : v;
            }},
            { id: 'grade', label: 'Grade' },
            { id: 'gram', label: 'Gram (GSM)' },
            { id: 'size', label: 'Size' },
            { id: 'sheet', label: 'Sheet' },
            { id: 'reamPallet', label: 'Ream per Pallet' },
            { id: 'layer', label: 'Layer' },
            { id: 'wrapType', label: 'Wrap Type' },
            { id: 'palletType', label: 'Pallet Type' },
            { id: 'reamBox', label: 'Ream/Box' }
        ];

        fieldsToDisplay.forEach(f => {
            const val = result[f.id];
            if (val !== undefined && val !== null && val !== '') {
                const displayString = f.displayVal ? f.displayVal(val) : val;
                
                const card = document.createElement('div');
                card.className = 'preview-card extracted';
                
                const label = document.createElement('span');
                label.className = 'preview-card-label';
                label.textContent = f.label;
                
                const value = document.createElement('span');
                value.className = 'preview-card-value';
                value.textContent = displayString;
                
                card.appendChild(label);
                card.appendChild(value);
                aiPreviewGrid.appendChild(card);
            }
        });

        if (aiPreviewGrid.children.length === 0) {
            aiPreviewGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No matching attributes could be extracted. Please try different or more detailed text.</p>';
        }
    }

    function showAIError(msg) {
        aiError.textContent = msg;
        aiError.classList.remove('hidden');
    }

    if (btnAnalyzeAI) {
        btnAnalyzeAI.addEventListener('click', async () => {
            const text = aiInput.value.trim();
            if (!text) {
                showAIError("Please enter some text or specifications to analyze.");
                return;
            }

            aiError.classList.add('hidden');
            aiPreviewContainer.classList.add('hidden');
            btnApplyAI.classList.add('hidden');
            
            btnAnalyzeAI.disabled = true;
            btnAnalyzeAI.classList.add('btn-ai-analyzing');
            const originalBtnText = btnAnalyzeAI.innerHTML;
            btnAnalyzeAI.innerHTML = '⚡ Analyzing with Gemini...';

            try {
                const result = await runGeminiExtraction(text);
                lastExtractedData = result;

                renderAIPreview(result);
                
                aiPreviewContainer.classList.remove('hidden');
                btnApplyAI.classList.remove('hidden');
            } catch (err) {
                console.error("Gemini Extraction Error:", err);
                showAIError(`Extraction failed: ${err.message || err}`);
            } finally {
                btnAnalyzeAI.disabled = false;
                btnAnalyzeAI.classList.remove('btn-ai-analyzing');
                btnAnalyzeAI.innerHTML = originalBtnText;
            }
        });
    }

    if (btnApplyAI) {
        btnApplyAI.addEventListener('click', () => {
            if (!lastExtractedData) return;
            
            const data = lastExtractedData;
            
            if (data.type) {
                const el = document.getElementById('type');
                if (el) el.value = data.type;
            }
            
            if (data.subGroup) {
                const el = document.getElementById('subGroup');
                if (el) {
                    el.value = data.subGroup;
                    el.dispatchEvent(new Event('change'));
                }
            }
            
            if (data.domExp) {
                const el = document.getElementById('domExp');
                if (el) el.value = data.domExp;
            }
            
            if (data.calcShipCountry) {
                const countrySelect = document.getElementById('calcShipCountry');
                if (countrySelect) {
                    const opt = Array.from(countrySelect.options).find(o => o.text.trim().toLowerCase() === data.calcShipCountry.trim().toLowerCase());
                    if (opt) {
                        countrySelect.value = opt.value;
                    } else {
                        countrySelect.value = data.calcShipCountry;
                    }
                }
            }
            
            if (data.brand) {
                const el = document.getElementById('brand');
                if (el) el.value = data.brand;
            }
            
            if (data.grade) {
                const el = document.getElementById('grade');
                if (el) el.value = data.grade;
            }
            
            if (data.gram) {
                const el = document.getElementById('gram');
                if (el) el.value = data.gram;
            }
            
            if (data.size) {
                const el = document.getElementById('size');
                if (el) el.value = data.size;
            }
            
            if (data.sheet) {
                const el = document.getElementById('sheet');
                if (el) el.value = data.sheet;
            }
            
            if (data.reamPallet) {
                const el = document.getElementById('reamPallet');
                if (el) el.value = data.reamPallet;
            }
            
            if (data.layer) {
                const el = document.getElementById('layer');
                if (el) el.value = data.layer;
            }
            
            if (data.wrapType) {
                const el = document.getElementById('wrapType');
                if (el) el.value = data.wrapType;
            }
            
            if (data.palletType) {
                const el = document.getElementById('palletType');
                if (el) el.value = data.palletType;
            }
            
            if (data.reamBox) {
                const el = document.getElementById('reamBox');
                if (el) el.value = data.reamBox;
            }

            // Recalculate NetSuite codes!
            updateCalculations();
            
            // Hide modal
            aiModal.classList.add('hidden');
            
            // Flash the Result Banner to show the user the generated values!
            const banner = document.getElementById('resultBanner');
            if (banner) {
                banner.style.animation = 'none';
                setTimeout(() => {
                    banner.style.animation = 'bannerSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                }, 10);
            }
        });
    }

    loadCSVData();
    loadMyRequests();
});
