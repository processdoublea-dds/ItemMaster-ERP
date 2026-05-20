// app.js — Supabase client and auth are loaded from auth.js

// Collect all form data as JSON object
function collectFormData() {
    const formDataObj = {};
    const allFields = document.querySelectorAll('.form-group input, .form-group select, .checkbox-group-container');
    
    allFields.forEach(field => {
        // Skip search inputs from the custom select component to prevent overwriting
        if (field.classList.contains('searchable-select-search')) return;
        
        // Find the most specific label for this field
        let lbl = null;
        if (field.id) {
            lbl = document.querySelector(`label[for="${field.id}"]`);
        }
        
        // Fallback to the first label in the group if no specific label is found
        if (!lbl) {
            if (field.classList.contains('checkbox-group-container')) {
                lbl = field.parentElement.querySelector('label');
            } else {
                lbl = field.closest('.form-group')?.querySelector('label');
            }
        }
        
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
                if (field.type === 'checkbox') {
                    val = field.checked ? 'Yes' : 'No';
                } else if (field.type === 'radio') {
                    if (field.checked) val = field.value || 'Yes';
                    else return; // Ignore unchecked radios
                } else {
                    val = field.value || '';
                }
            }
            
            // Don't overwrite a valid value with an empty one (helps with grouped inputs)
            if (val !== '' || !formDataObj[key]) {
                formDataObj[key] = val;
            }
        }
    });
    return formDataObj;
}

// Dynamic Searchable Select Component for dropdowns with > 10 options
function updateSearchableSelect(select) {
    if (!select) return;
    
    // Count active options (excluding empty placeholder)
    const optionsCount = Array.from(select.options).filter(opt => opt.value !== "").length;
    
    if (optionsCount <= 10) {
        // If it previously had a search wrapper, remove it and restore native select
        const wrapper = select.nextElementSibling;
        if (wrapper && wrapper.classList.contains('searchable-select-wrapper')) {
            wrapper.remove();
            select.style.display = '';
        }
        return;
    }
    
    // Find or create wrapper
    let wrapper = select.nextElementSibling;
    if (!wrapper || !wrapper.classList.contains('searchable-select-wrapper')) {
        wrapper = document.createElement('div');
        wrapper.className = 'searchable-select-wrapper';
        
        const toggle = document.createElement('div');
        toggle.className = 'searchable-select-toggle';
        
        const toggleText = document.createElement('span');
        toggleText.className = 'searchable-select-text';
        toggle.appendChild(toggleText);
        
        const toggleArrow = document.createElement('span');
        toggleArrow.innerHTML = '&#9662;';
        toggleArrow.style.color = '#64748b';
        toggleArrow.style.fontSize = '0.75rem';
        toggle.appendChild(toggleArrow);
        
        const panel = document.createElement('div');
        panel.className = 'searchable-select-panel hidden';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'searchable-select-search';
        searchInput.placeholder = 'ค้นหา...';
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'searchable-select-options';
        
        panel.appendChild(searchInput);
        panel.appendChild(optionsContainer);
        wrapper.appendChild(toggle);
        wrapper.appendChild(panel);
        
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        select.style.display = 'none';
        
        // Toggle panel open/close
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.searchable-select-panel').forEach(p => {
                if (p !== panel) p.classList.add('hidden');
            });
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                searchInput.focus();
                searchInput.value = '';
                // Trigger option filter reset
                const items = optionsContainer.querySelectorAll('.searchable-select-option');
                items.forEach(item => item.style.display = '');
            }
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                panel.classList.add('hidden');
            }
        });
        
        // Search filter logic
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const items = optionsContainer.querySelectorAll('.searchable-select-option');
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
    
    const toggleText = wrapper.querySelector('.searchable-select-text');
    const optionsContainer = wrapper.querySelector('.searchable-select-options');
    
    // Sync current select value to UI
    const currentOpt = select.options[select.selectedIndex];
    toggleText.textContent = currentOpt ? currentOpt.textContent : 'Select...';
    
    // Populate options
    optionsContainer.innerHTML = '';
    Array.from(select.options).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'searchable-select-option';
        item.textContent = opt.textContent;
        item.dataset.value = opt.value;
        
        if (opt.selected) {
            item.classList.add('selected');
        }
        
        item.addEventListener('click', () => {
            select.value = opt.value;
            // Dispatch standard change event on native select
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            toggleText.textContent = opt.textContent;
            wrapper.querySelector('.searchable-select-panel').classList.add('hidden');
        });
        
        optionsContainer.appendChild(item);
    });
    
    // Sync external/programmatic updates to native select back to the custom select wrapper
    if (!select._hasSearchableObserver) {
        select._hasSearchableObserver = true;
        select.addEventListener('change', () => {
            const activeOpt = select.options[select.selectedIndex];
            toggleText.textContent = activeOpt ? activeOpt.textContent : 'Select...';
            
            const items = optionsContainer.querySelectorAll('.searchable-select-option');
            items.forEach(item => {
                if (item.dataset.value === select.value) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        });
    }
}

function initSearchableSelects() {
    const selects = document.querySelectorAll('#itemForm select');
    selects.forEach(select => {
        updateSearchableSelect(select);
    });
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

    // --- UI Toggle Logic (Dashboard vs Form) & Navigation Bar Sync ---
    const btnShowRequestForm = document.getElementById('btnShowRequestForm');
    const btnHideRequestForm = document.getElementById('btnHideRequestForm');
    const requestFormContainer = document.getElementById('requestFormContainer');
    const myRequestsSection = document.getElementById('myRequestsSection');
    const resultBanner = document.getElementById('resultBanner');
    const headerSearch = document.querySelector('.header-search');

    const navDashboard = document.getElementById('navDashboard');
    const navItemRequests = document.getElementById('navItemRequests');

    if (resultBanner) resultBanner.style.display = 'none';

    // Wizard Stepper Control Logic
    window.goToWizardStep = function(stepNum) {
        const steps = [1, 2, 3];
        steps.forEach(num => {
            const content = document.getElementById(`step${num}Content`);
            const header = document.getElementById(`step${num}Header`);
            if (content) {
                if (num === stepNum) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            }
            if (header) {
                header.classList.remove('active', 'completed');
                if (num === stepNum) {
                    header.classList.add('active');
                } else if (num < stepNum) {
                    header.classList.add('completed');
                }
            }
        });

        // Progress line transition
        const progressBar = document.getElementById('stepProgressBar');
        if (progressBar) {
            const percent = ((stepNum - 1) / 2) * 100;
            progressBar.style.width = `${percent}%`;
        }

        // Review data populations on Step 3
        if (stepNum === 3) {
            const rCode = document.getElementById('reviewItemCode');
            const rName = document.getElementById('reviewItemName');
            const rGroup = document.getElementById('reviewSubGroup');
            const subGroupSelect = document.getElementById('subGroup');
            
            if (rCode && bannerItemCode) rCode.textContent = bannerItemCode.textContent || '-';
            if (rName && bannerItemName) rName.textContent = bannerItemName.textContent || '-';
            if (rGroup && subGroupSelect) {
                const opt = subGroupSelect.options[subGroupSelect.selectedIndex];
                rGroup.textContent = (opt && opt.value) ? opt.text : '-';
            }
        }
    };

    if (btnShowRequestForm && requestFormContainer) {
        btnShowRequestForm.addEventListener('click', () => {
            requestFormContainer.classList.remove('hidden');
            myRequestsSection.classList.add('hidden');
            if (resultBanner) resultBanner.style.display = 'flex';
            if (headerSearch) headerSearch.style.display = 'none';
            
            if (navItemRequests) navItemRequests.classList.add('active');
            if (navDashboard) navDashboard.classList.remove('active');
            
            goToWizardStep(1);
        });
    }

    if (btnHideRequestForm) {
        btnHideRequestForm.addEventListener('click', () => {
            requestFormContainer.classList.add('hidden');
            myRequestsSection.classList.remove('hidden');
            if (resultBanner) resultBanner.style.display = 'none';
            if (headerSearch) headerSearch.style.display = 'block';
            
            if (navDashboard) navDashboard.classList.add('active');
            if (navItemRequests) navItemRequests.classList.remove('active');
            
            // Clear URL param to keep path clean
            if (window.history.pushState) {
                const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.pushState({path:newurl}, '', newurl);
            }
        });
    }

    // Handle URL ?tab=create parameter on load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'create') {
        if (requestFormContainer && myRequestsSection) {
            requestFormContainer.classList.remove('hidden');
            myRequestsSection.classList.add('hidden');
            if (resultBanner) resultBanner.style.display = 'flex';
            if (headerSearch) headerSearch.style.display = 'none';
            if (navItemRequests) navItemRequests.classList.add('active');
            if (navDashboard) navDashboard.classList.remove('active');
            goToWizardStep(1);
        }
    }

    // Set User Initials avatar + Profile Dropdown
    const user = getUser();
    if (user) {
        const userInitials = document.getElementById('userInitials');
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        const dropdownName = document.getElementById('dropdownName');
        const dropdownRole = document.getElementById('dropdownRole');
        const dropdownMeta = document.getElementById('dropdownMeta');

        const nameParts = (user.full_name || '').split(' ');
        let initials = '';
        if (nameParts.length > 0 && nameParts[0]) initials += nameParts[0][0];
        if (nameParts.length > 1 && nameParts[1]) initials += nameParts[1][0];
        const initialsText = (initials || user.email || 'US').substring(0, 2).toUpperCase();

        if (userInitials) userInitials.textContent = initialsText;
        if (dropdownAvatar) dropdownAvatar.textContent = initialsText;
        if (dropdownName) dropdownName.textContent = user.full_name || user.email || 'User';
        if (dropdownRole) {
            const roleLabel = user.role === 'admin' ? '🛡️ Admin' : '👤 User';
            dropdownRole.textContent = roleLabel;
        }
        if (dropdownMeta) {
            let metaParts = [];
            if (user.department) metaParts.push(`📂 ${user.department}`);
            if (user.position) metaParts.push(`💼 ${user.position}`);
            if (user.email) metaParts.push(`✉️ ${user.email}`);
            dropdownMeta.innerHTML = metaParts.join('<br>');
        }


    }

    // Global Top Search filter for Dashboard Table rows
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('.request-row');
            rows.forEach(row => {
                const code = row.querySelector('.request-code')?.textContent.toLowerCase() || '';
                const name = row.querySelector('.request-name')?.textContent.toLowerCase() || '';
                if (code.includes(query) || name.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
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
        initSearchableSelects();
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
        updateSearchableSelect(subGroupSelect);
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
        updateSearchableSelect(countrySelect);
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
                    .select('item_code, item_name, erp_internal_id');
                if (!error && data) {
                    dbItems = data.map(r => ({
                        'Item Code': r.item_code,
                        'Item Name': r.item_name,
                        'Internal ID': r.erp_internal_id
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
            initSearchableSelects();
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
            isSpecialSticker: document.getElementById('isSpecialSticker')?.checked || false,
            calcShipCountry: getVal('calcShipCountry')
        };

        // Visibility toggle for Special Ream
        const specialReamContainer = document.getElementById('specialReamContainer');
        const isSpecialReamCheckbox = document.getElementById('isSpecialReam');
        if (specialReamContainer && isSpecialReamCheckbox) {
            const isReamBoxSelected = vals.reamBox && vals.reamBox !== 'None' && vals.reamBox !== '';
            specialReamContainer.style.display = isReamBoxSelected ? 'flex' : 'none';
            if (isReamBoxSelected) {
                // Auto-determine special ream: any value except 5R, 10R, and CVB (like CVB ไม่ห่อรีม)
                const isSpecial = !['5R', '10R'].includes(vals.reamBox) && !vals.reamBox.includes('CVB');
                isSpecialReamCheckbox.checked = isSpecial;
                vals.isSpecialReam = isSpecial;
            } else {
                isSpecialReamCheckbox.checked = false;
                vals.isSpecialReam = false;
            }
        }

        // Visibility toggle for Special Sticker
        const specialStickerContainer = document.getElementById('specialStickerContainer');
        const isSpecialStickerCheckbox = document.getElementById('isSpecialSticker');
        if (specialStickerContainer && isSpecialStickerCheckbox) {
            const isCountrySelected = vals.calcShipCountry && vals.calcShipCountry !== 'None' && vals.calcShipCountry !== '';
            specialStickerContainer.style.display = isCountrySelected ? 'flex' : 'none';
            if (!isCountrySelected) {
                isSpecialStickerCheckbox.checked = false;
                vals.isSpecialSticker = false;
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

        if (wrapTypeAbbr) {
            if (wrapTypeAbbr === 'CVB') {
                itemNameParts.push('CVB');
            } else if (['CZ', 'CK', 'GC', 'GK'].includes(subGroupDigit)) {
                itemNameParts.push(wrapTypeAbbr);
            }
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
        if (vals.isSpecialSticker && listData) {
            const countrySelect = document.getElementById('calcShipCountry');
            const countryName = countrySelect && countrySelect.selectedIndex >= 0 ? countrySelect.options[countrySelect.selectedIndex].text : '';
            if (countryName && !countryName.startsWith('Select ')) {
                const countryRow = listData.find(r => (r['Country'] || '').trim().toLowerCase() === countryName.trim().toLowerCase());
                if (countryRow && countryRow['Country Prefix NS']) {
                    itemNameParts.push(countryRow['Country Prefix NS'].trim());
                }
            }
        }

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
        
        // Check if Domestic/Export contains Matchange, Type is Child, and look up the Country Prefix NS
        const isMatchange = vals.domExp === 'M' || domExpText.toLowerCase().includes('matchange') || domExpText.toLowerCase().includes('mat change');
        const isChild = vals.type && vals.type.toLowerCase() === 'child';
        let countryPrefix = '';
        if (isMatchange && isChild && vals.category && listData) {
            const countryRow = listData.find(r => (r['Country'] || '').trim().toLowerCase() === vals.category.trim().toLowerCase());
            if (countryRow && countryRow['Country Prefix NS']) {
                countryPrefix = countryRow['Country Prefix NS'].trim();
            }
        }

        if (patternRow) {
            prefix += patternRow['Digit'] || '';
            if (patternRow['Domistic&Export'] === 'Yes') {
                prefix += vals.domExp || '';
            }
            if (prefix) itemCodeParts.push(prefix);
            if (countryPrefix) itemCodeParts.push(countryPrefix);

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
            if (countryPrefix) itemCodeParts.push(countryPrefix);
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
        let existingMatchItems = [];
        let pendingMatchItems = [];

        if (itemCodePrefix && combinedMaster.length > 0) {
            let maxRunning = 0;
            
            // Check in ItemMaster (Existing)
            itemMasterData.forEach(row => {
                const code = (row['Item Code'] || '').trim();
                const segments = code.split('-');
                if (segments.length === itemCodeParts.length + 1) {
                    const codePrefix = segments.slice(0, -1).join('-');
                    if (codePrefix === itemCodePrefix) {
                        existingMatchItems.push({
                            code: code,
                            name: row['Item Name'] || '-'
                        });
                        const lastSeg = segments[segments.length - 1];
                        const num = parseInt(lastSeg, 10);
                        if (!isNaN(num) && num > maxRunning) {
                            maxRunning = num;
                        }
                    }
                }
            });

            // Check in DB Items (Pending Requests)
            dbItems.forEach(row => {
                const code = (row['Item Code'] || '').trim();
                const segments = code.split('-');
                if (segments.length === itemCodeParts.length + 1) {
                    const codePrefix = segments.slice(0, -1).join('-');
                    if (codePrefix === itemCodePrefix) {
                        pendingMatchItems.push({
                            code: code,
                            name: row['Item Name'] || '-',
                            status: row['Status'] || 'pending'
                        });
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

        // Update Summary Tables UI
        const runningSummarySection = document.getElementById('runningSummarySection');
        const existingItemsTableBody = document.getElementById('existingItemsTableBody');
        const pendingItemsTableBody = document.getElementById('pendingItemsTableBody');

        if (runningSummarySection && existingItemsTableBody && pendingItemsTableBody) {
            if (existingMatchItems.length > 0 || pendingMatchItems.length > 0) {
                runningSummarySection.style.display = 'block';

                // Populate Existing
                if (existingMatchItems.length > 0) {
                    existingItemsTableBody.innerHTML = existingMatchItems.map(item => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.code}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
                        </tr>
                    `).join('');
                } else {
                    existingItemsTableBody.innerHTML = `<tr><td colspan="2" style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">ไม่มีรายการในระบบ</td></tr>`;
                }

                // Populate Pending
                if (pendingMatchItems.length > 0) {
                    const statusMap = {
                        pending: { label: '⏳ รออนุมัติ', cls: 'status-pending' },
                        in_progress: { label: '🔄 กำลังดำเนินการ', cls: 'status-progress' },
                        completed: { label: '✅ เสร็จสิ้น', cls: 'status-completed' },
                        rejected: { label: '❌ ปฏิเสธ', cls: 'status-rejected' }
                    };
                    
                    pendingItemsTableBody.innerHTML = pendingMatchItems.map(item => {
                        const st = statusMap[item.status] || { label: item.status, cls: '' };
                        return `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.code}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><span class="request-status ${st.cls}" style="padding: 2px 6px; font-size: 0.75rem;">${st.label}</span></td>
                        </tr>
                        `;
                    }).join('');
                } else {
                    pendingItemsTableBody.innerHTML = `<tr><td colspan="3" style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">ไม่มีรายการรอสร้าง</td></tr>`;
                }
            } else {
                runningSummarySection.style.display = 'none';
            }
        }

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
        const hasLayer = vals.layer && vals.layer !== 'None' && vals.layer !== '';
        
        if (vals.type === 'Parent') {
            if (vals.category && ['australia', 'germany'].includes(vals.category.trim().toLowerCase())) {
                primarySaleUnit = 'Carton';
            } else {
                primarySaleUnit = 'KG';
            }
        } else if (vals.type === 'Child') {
            if (vals.domExp === 'E' || vals.domExp === 'M') {
                primarySaleUnit = hasLayer ? 'MT' : 'Carton';
            } else if (vals.domExp === 'D') {
                primarySaleUnit = hasLayer ? 'Ream' : 'Box';
            }
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
        if (matchedItem || historyItems.length > 0 || pendingMatchItems.length > 0) {
            duplicateAlert.classList.remove('hidden');
            
            const alertIcon = document.getElementById('duplicateAlertIcon');
            const alertTitle = document.getElementById('duplicateAlertTitle');
            const alertDesc = document.getElementById('duplicateAlertDesc');
            
            if (matchedItem) {
                // Style as red warning alert
                duplicateAlert.style.backgroundColor = '#fef2f2';
                duplicateAlert.style.border = '1px solid #fecaca';
                duplicateAlert.style.color = '#991b1b';
                if (alertIcon) alertIcon.textContent = '🚨';
                if (alertTitle) alertTitle.textContent = 'ตรวจพบรหัสสินค้าซ้ำในระบบ! (Duplicate Item Code)';
                if (alertDesc) alertDesc.textContent = 'รหัสสินค้านี้มีอยู่แล้วในฐานข้อมูล ERP กรุณาแก้ไขคุณสมบัติทางเทคนิคเพื่อป้องกันปัญหารหัสทับซ้อน';
            } else {
                // Style as blue info alert
                duplicateAlert.style.backgroundColor = '#f0f9ff';
                duplicateAlert.style.border = '1px solid #bae6fd';
                duplicateAlert.style.color = '#0369a1';
                if (alertIcon) alertIcon.textContent = 'ℹ️';
                if (alertTitle) alertTitle.textContent = 'ประวัติรหัสสินค้าที่มีอยู่ก่อนหน้า (Existing Item History)';
                if (alertDesc) alertDesc.textContent = 'รหัสสินค้านี้ยังไม่มีการสร้างในระบบ สามารถสร้างได้ทันที ด้านล่างคือรายการรหัสสินค้าที่เคยมีอยู่ก่อนหน้า หรืออยู่ระหว่างรออนุมัติในกลุ่มเดียวกัน';
            }

            const alertContent = duplicateAlert.querySelector('.alert-content');
            if (alertContent) {
                let html = '';
                if (matchedItem) {
                    html += `
                        <div style="margin: 0.5rem 0; padding: 0.75rem; background: #ffffff; border: 1.5px solid #b91c1c; border-radius: 8px; font-size: 0.85rem; color: #000000; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                            <p style="margin: 0 0 0.25rem 0;"><strong>Duplicate Code:</strong> <span style="font-family: monospace; font-weight: bold; color: #b91c1c;">${matchedItem['Item Code']}</span></p>
                            <p style="margin: 0;"><strong>Duplicate Name:</strong> ${matchedItem['Item Name']}</p>
                        </div>
                    `;
                }

                if (historyItems.length > 0) {
                    const sectionTitleColor = matchedItem ? '#991b1b' : '#0369a1';
                    html += `
                        <div style="margin-top: 0.8rem;">
                            <strong style="font-size: 0.85rem; color: ${sectionTitleColor}; display: block; margin-bottom: 0.25rem;">📚 รายการที่มีอยู่ก่อนหน้าในระบบ (Existing Items):</strong>
                            <table style="width: 100%; border-collapse: separate; border-spacing: 0; background-color: #ffffff; border: 1px solid #000000; border-radius: 8px; overflow: hidden; font-size: 0.8rem; color: #000000;">
                                <thead>
                                    <tr style="background-color: #f3f4f6;">
                                        <th style="text-align: left; padding: 6px 10px; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: 700;">Item Code</th>
                                        <th style="text-align: left; padding: 6px 10px; border-bottom: 1px solid #000000; font-weight: 700;">Item Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${historyItems.map((h, index) => {
                                        const isLast = index === historyItems.length - 1;
                                        const borderBottom = isLast ? '' : 'border-bottom: 1px solid #000000;';
                                        return `
                                            <tr>
                                                <td style="padding: 6px 10px; border-right: 1px solid #000000; ${borderBottom} font-family: monospace; font-weight: bold; color: #000000;">${h['Item Code']}</td>
                                                <td style="padding: 6px 10px; ${borderBottom} color: #334155;">${h['Item Name']}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                if (pendingMatchItems && pendingMatchItems.length > 0) {
                    const statusMap = {
                        pending: { label: '⏳ รออนุมัติ', cls: 'status-pending' },
                        in_progress: { label: '🔄 กำลังดำเนินการ', cls: 'status-progress' },
                        completed: { label: '✅ เสร็จสิ้น', cls: 'status-completed' },
                        rejected: { label: '❌ ปฏิเสธ', cls: 'status-rejected' }
                    };

                    html += `
                        <div style="margin-top: 1.2rem;">
                            <strong style="font-size: 0.85rem; color: #b45309; display: block; margin-bottom: 0.25rem;">⏳ รายการรอสร้าง (Pending Requests):</strong>
                            <table style="width: 100%; border-collapse: separate; border-spacing: 0; background-color: #fffbeb; border: 1px solid #d97706; border-radius: 8px; overflow: hidden; font-size: 0.8rem; color: #000000;">
                                <thead>
                                    <tr style="background-color: #fde68a;">
                                        <th style="text-align: left; padding: 6px 10px; border-bottom: 1px solid #d97706; border-right: 1px solid #d97706; font-weight: 700; width: 30%;">Item Code</th>
                                        <th style="text-align: left; padding: 6px 10px; border-bottom: 1px solid #d97706; border-right: 1px solid #d97706; font-weight: 700;">Item Name</th>
                                        <th style="text-align: left; padding: 6px 10px; border-bottom: 1px solid #d97706; font-weight: 700; width: 25%;">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pendingMatchItems.map((h, index) => {
                                        const isLast = index === pendingMatchItems.length - 1;
                                        const borderBottom = isLast ? '' : 'border-bottom: 1px solid #d97706;';
                                        const st = statusMap[h.status] || { label: h.status };
                                        return `
                                            <tr>
                                                <td style="padding: 6px 10px; border-right: 1px solid #d97706; ${borderBottom} font-family: monospace; font-weight: bold; color: #000000;">${h.code}</td>
                                                <td style="padding: 6px 10px; border-right: 1px solid #d97706; ${borderBottom} color: #334155;">${h.name}</td>
                                                <td style="padding: 6px 10px; ${borderBottom} font-weight: bold; color: #b45309;">${st.label}</td>
                                            </tr>
                                        `;
                                    }).join('')}
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
    let allUserRequests = [];
    let selectedRequest = null;

    async function loadStats() {
        const user = getUser();
        if (!user) return;

        let query = supabaseClient.from('item_requests').select('status');
        if (user.role !== 'admin') {
            query = query.eq('requested_by', user.emp_id);
        }

        const { data, error } = await query;

        if (error || !data) return;

        const counts = { total: data.length, pending: 0, completed: 0, rejected: 0 };
        data.forEach(r => {
            if (r.status === 'pending') counts.pending++;
            else if (r.status === 'completed' || r.status === 'in_progress') counts.completed++;
            else if (r.status === 'rejected') counts.rejected++;
        });

        const totalEl = document.getElementById('statTotalRequests');
        const pendingEl = document.getElementById('statPendingRequests');
        const approvedEl = document.getElementById('statApprovedRequests');
        const rejectedEl = document.getElementById('statRejectedRequests');

        if (totalEl) totalEl.textContent = counts.total;
        if (pendingEl) pendingEl.textContent = counts.pending;
        if (approvedEl) approvedEl.textContent = counts.completed;
        if (rejectedEl) rejectedEl.textContent = counts.rejected;
    }

    async function loadMyRequests() {
        const user = getUser();
        if (!user) return;

        // Load stats to keep counts up to date
        loadStats();

        let query = supabaseClient
            .from('item_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (user.role !== 'admin') {
            query = query.eq('requested_by', user.emp_id);
        }

        if (currentFilter !== 'all') {
            query = query.eq('status', currentFilter);
        }

        const { data, error } = await query;
        allUserRequests = data || [];
        const requestList = document.getElementById('requestList');

        if (error) {
            requestList.innerHTML = '<tr><td colspan="8" class="table-empty" style="text-align: center; padding: 2rem; color: #64748b;">โหลดข้อมูลไม่สำเร็จ</td></tr>';
            return;
        }

        if (!data || data.length === 0) {
            requestList.innerHTML = '<tr><td colspan="8" class="table-empty" style="text-align: center; padding: 2rem; color: #64748b;">ยังไม่มีคำขอ</td></tr>';
            return;
        }

        // Fetch users to get department info for the requesters
        const { data: usersData } = await supabaseClient.from('users').select('emp_id, department');
        const deptMap = {};
        if (usersData) {
            usersData.forEach(u => deptMap[u.emp_id] = u.department || '-');
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

            const dept = deptMap[req.requested_by] || '-';
            const requesterHtml = `
                <div style="font-weight: 600; white-space: nowrap;">${req.requested_name || req.requested_by}</div>
                <div style="font-size: 0.75rem; color: #64748b; white-space: nowrap;">${dept}</div>
            `;

            return `<tr class="request-row" onclick="openUserDetail('${req.id}')" style="border-bottom: 1px solid #e2e8f0; transition: background 0.15s; cursor: pointer;">
                <td style="padding: 12px; white-space: nowrap;" class="request-date">${dateStr}</td>
                <td style="padding: 12px; white-space: nowrap;">${requesterHtml}</td>
                <td style="padding: 12px; white-space: nowrap;" class="request-code"><strong>${req.item_code || '-'}</strong></td>
                <td style="padding: 12px; white-space: nowrap;" class="request-name">${req.item_name || '-'}</td>
                <td style="padding: 12px; white-space: nowrap;"><span class="request-status ${st.cls}">${st.label}</span></td>
                <td style="padding: 12px; white-space: nowrap;"><code>${req.erp_internal_id || '-'}</code></td>
                <td style="padding: 12px; color: #64748b; font-size: 0.85rem;">${req.admin_note ? `💬 ${req.admin_note}` : '-'}</td>
            </tr>`;
        }).join('');
    }

    // === Open Detail Modal ===
    window.openUserDetail = function(requestId) {
        selectedRequest = allUserRequests.find(r => r.id === requestId);
        if (!selectedRequest) return;

        const modal = document.getElementById('detailModal');
        const modalBody = document.getElementById('modalBody');
        const formData = selectedRequest.form_data || {};

        const sections = [
            // ── Step 1: ข้อมูลพื้นฐาน ──────────────────────────────────
            {
                title: '📋 General Information (ข้อมูลทั่วไป)',
                keys: [
                    'Type', 'Item Sub-Group', 'Item Group',
                    'Domestic/Export', 'Ship to Country',
                    'Brand', 'Grade', 'Gram (GSM)', 'Size', 'Sheet',
                    'Ream per Pallet', 'Layer', 'Wrap Type',
                    'Pallet Type', 'REAM / BOX', 'Pallet Size',
                    'Location for Work Order', 'Item Category'
                ]
            },
            {
                title: '🔗 SAP Information (การจับคู่ระบบเดิม)',
                keys: ['SAP Code1', 'SAP Code2', 'SAP Name']
            },
            // ── Step 2: ผลการคำนวณอัตโนมัติ ────────────────────────────
            {
                title: '📦 Item Information (ข้อมูลสินค้าที่คำนวณได้)',
                keys: [
                    'MPS Color', 'BOI', 'Weight of Unit',
                    'Internal ID_Parent', 'SubItem of Item Code',
                    'SubItem of Item Name', 'Brand Group'
                ]
            },
            {
                title: '⚖️ Other & Weight Information (น้ำหนักและข้อมูลอื่น)',
                keys: [
                    'ความสูงสินค้า (Inch)', 'Pallet Height (inch)',
                    'Standard/Net Weight (KG)', 'Gross Weight Markup (%)',
                    'Gross Weight', 'Country of Origin',
                    'HS Code', 'Commodities', 'Block PM', 'Sheet/Pallet'
                ]
            },
            {
                title: '📐 Class & UOM Detail (คลาสและหน่วยนับ)',
                keys: [
                    'Subsidiary', 'Class (no hierarchy)', 'Catagory Group',
                    'Mixed Pallet', 'Unit Type', 'KG', 'Ream/Pack',
                    'UOM1', 'UOM2', 'Box', 'Pallet'
                ]
            },
            {
                title: '📏 Primary Units of Measure (หน่วยนับหลัก)',
                keys: [
                    'Primary Units Type', 'Primary Stock Unit',
                    'Primary Purchase Unit', 'Primary Sale Unit',
                    'Primary Consumption Unit', 'Primary Unit Type'
                ]
            },
            {
                title: '🏭 MFG, MRP & Account Mapping (การผลิตและบัญชี)',
                keys: [
                    'MFG Item Batch Qty', 'Item Mapping DCS',
                    'MRP Active', 'MFG Include in Auto TO',
                    'Expense/COGS Account', 'Expense/COGS Account_ID',
                    'Asset Account', 'Asset Account_ID',
                    'Income Account', 'Income Account_ID',
                    'Scrap Account', 'WIP Account', 'Tax Schedule'
                ]
            },
            {
                title: '🌐 Web Store & WMS Detail (เว็บสโตร์และคลังสินค้า)',
                keys: [
                    'Display in Web Site', 'Page Title',
                    'Web Store Display Name', 'SCA Item Sub-Type',
                    'URL Component', 'TWMS Use Pallet',
                    'TWMS PRE-ASSIGN LOT', 'TWMS PRE-ASSIGN PALLET'
                ]
            }
        ];

        // ── Summary banner at top of modal ──────────────────────────────
        const statusMap = {
            pending:     { label: '⏳ รออนุมัติ',         color: '#b45309', bg: '#fef9c3', border: '#fde68a' },
            in_progress: { label: '🔄 กำลังดำเนินการ',    color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
            completed:   { label: '✅ เสร็จสิ้น',          color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
            rejected:    { label: '❌ ถูกปฏิเสธ',         color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
        };
        const st = statusMap[selectedRequest.status] || { label: selectedRequest.status || '-', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
        const createdDate = selectedRequest.created_at
            ? new Date(selectedRequest.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
            : '-';

        let html = `
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border-radius: 10px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.75; margin-bottom: 0.25rem;">Item Code</div>
                    <div style="font-family: monospace; font-size: 1.5rem; font-weight: 800; letter-spacing: 0.05em;">${selectedRequest.item_code || '-'}</div>
                </div>
                <span style="background: ${st.bg}; color: ${st.color}; border: 1px solid ${st.border}; padding: 0.3rem 0.85rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; white-space: nowrap;">${st.label}</span>
            </div>
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 0.7rem; opacity: 0.75; margin-bottom: 0.2rem;">Item Name</div>
                <div style="font-size: 0.95rem; font-weight: 600; line-height: 1.4;">${selectedRequest.item_name || '-'}</div>
            </div>
            ${selectedRequest.erp_internal_id ? `<div style="margin-top: 0.5rem; font-size: 0.78rem; opacity: 0.75;">ERP ID: <strong>${selectedRequest.erp_internal_id}</strong></div>` : ''}
            <div style="margin-top: 0.35rem; font-size: 0.75rem; opacity: 0.6;">🕐 ส่งคำขอ: ${createdDate}</div>
        </div>`;

        let processedKeys = [];

        sections.forEach(sec => {
            let itemsHtml = '';
            sec.keys.forEach(k => {
                processedKeys.push(k);
                const val = formData[k];
                if (val !== undefined && val !== '') {
                    itemsHtml += `<div class="detail-item"><span class="detail-label">${k}</span><span class="detail-value">${val}</span></div>`;
                }
            });

            if (itemsHtml) {
                html += `
                <div class="detail-section">
                    <div class="detail-section-header">${sec.title}</div>
                    <div class="detail-section-body">
                        ${itemsHtml}
                    </div>
                </div>`;
            }
        });

        let extraHtml = '';
        Object.keys(formData).forEach(k => {
            if (!processedKeys.includes(k) && formData[k] !== undefined && formData[k] !== '') {
                extraHtml += `<div class="detail-item"><span class="detail-label">${k}</span><span class="detail-value">${formData[k]}</span></div>`;
            }
        });

        if (extraHtml) {
            html += `
            <div class="detail-section">
                <div class="detail-section-header">ข้อมูลเพิ่มเติม (Additional Info)</div>
                <div class="detail-section-body">
                    ${extraHtml}
                </div>
            </div>`;
        }

        if (!html) {
            html = '<div style="text-align:center; padding: 2rem; color: #64748b;">ไม่มีข้อมูลฟอร์ม</div>';
        }

        modalBody.innerHTML = html;

        // Populate Footer actions based on user role and status
        const currentUser = getUser();
        const modalFooter = document.getElementById('modalFooter');
        if (modalFooter) {
            if (currentUser && currentUser.role === 'admin' && (selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress')) {
                modalFooter.innerHTML = `
                    <div class="modal-action-group">
                        <div class="action-field">
                            <label>ERP Internal ID</label>
                            <input type="text" id="erpInternalId" placeholder="ใส่ Internal ID จาก NetSuite" value="${selectedRequest.erp_internal_id || ''}">
                        </div>
                        <div class="action-field">
                            <label>หมายเหตุ</label>
                            <input type="text" id="adminNote" placeholder="หมายเหตุ (optional)" value="${selectedRequest.admin_note || ''}">
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn-action btn-export-csv" onclick="exportRequestCSV()">📥 Export CSV</button>
                        ${selectedRequest.status === 'pending' ? `<button type="button" class="btn-action btn-in-progress" onclick="updateStatus('in_progress')">🔄 Mark In Progress</button>` : ''}
                        <button type="button" class="btn-action btn-complete" onclick="updateStatus('completed')">✅ Mark Completed</button>
                        <button type="button" class="btn-action btn-reject" onclick="updateStatus('rejected')">❌ Reject</button>
                    </div>
                `;
            } else {
                modalFooter.innerHTML = `
                    <div class="modal-buttons" style="justify-content: flex-end; width: 100%;">
                        <button type="button" class="btn-action btn-export-csv" onclick="exportRequestCSV()">📥 Export CSV</button>
                        <button type="button" class="btn-action btn-secondary-action" onclick="closeUserDetailModal()">ปิด</button>
                    </div>
                `;
            }
        }

        modal.classList.remove('hidden');
    };

    window.closeUserDetailModal = function() {
        document.getElementById('detailModal')?.classList.add('hidden');
    };

    // === Update Status ===
    window.updateStatus = async function(newStatus) {
        if (!selectedRequest) return;

        const erpId = document.getElementById('erpInternalId')?.value || '';
        const note = document.getElementById('adminNote')?.value || '';
        const admin = getUser();

        const updateData = {
            status: newStatus,
            processed_by: admin.emp_id,
            processed_at: new Date().toISOString()
        };

        if (erpId) updateData.erp_internal_id = erpId;
        if (note) updateData.admin_note = note;

        const { error } = await supabaseClient
            .from('item_requests')
            .update(updateData)
            .eq('id', selectedRequest.id);

        if (error) {
            alert('อัพเดตไม่สำเร็จ: ' + error.message);
            return;
        }

        closeUserDetailModal();
        loadMyRequests();
    };

    // === Export Request as CSV ===
    window.exportRequestCSV = function() {
        if (!selectedRequest || !selectedRequest.form_data) return;

        const formData = selectedRequest.form_data;
        const headers = Object.keys(formData).map(k => `"${k.replace(/"/g, '""')}"`);
        const values = Object.values(formData).map(v => `"${String(v || '').replace(/"/g, '""')}"`);

        const csvContent = headers.join(',') + '\n' + values.join(',');
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Item_${selectedRequest.item_code || 'export'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const detailModal = document.getElementById('detailModal');
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') closeUserDetailModal();
        });
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', closeUserDetailModal);
        }
    }

    // Filter stats cards
    const statCards = document.querySelectorAll('.stat-card');
    
    function applyFilter(filterValue) {
        if (currentFilter === filterValue) {
            currentFilter = 'all';
        } else {
            currentFilter = filterValue;
        }

        statCards.forEach(c => {
            if (c.dataset.filter === currentFilter) {
                c.classList.add('active');
                c.style.borderColor = '#1e3a8a';
                c.style.backgroundColor = '#eff6ff';
            } else {
                c.classList.remove('active');
                c.style.borderColor = '#e2e8f0';
                c.style.backgroundColor = '#ffffff';
            }
        });

        loadMyRequests();
    }

    statCards.forEach(card => {
        card.addEventListener('click', () => applyFilter(card.dataset.filter));
    });

    loadCSVData();
    applyFilter('all');
});
