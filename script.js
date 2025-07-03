document.addEventListener('DOMContentLoaded', () => {

    // --- COSTANTI E STATO DELL'APPLICAZIONE ---

    const STORAGE_KEYS = {
        LOG: 'workLog',
        LOCATIONS: 'workLocations',
        THEME: 'theme'
    };

    let state = {
        logEntries: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOG)) || [],
        workLocations: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCATIONS)) || [],
        theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
    };

    // --- SELETTORI ELEMENTI DOM ---
    
    const DOMElements = {
        menuBtn: document.getElementById('menu-btn'),
        sideNav: document.getElementById('side-nav'),
        overlay: document.getElementById('overlay'),
        registroOreLink: document.getElementById('registro-ore-link'),
        formularioLink: document.getElementById('formulario-link'),
        allPages: document.querySelectorAll('.page-container'),
        registroOrePage: document.getElementById('registro-ore-page'),
        dateInput: document.getElementById('entry-date'),
        prevDayBtn: document.getElementById('prev-day-btn'),
        nextDayBtn: document.getElementById('next-day-btn'),
        newLocationInput: document.getElementById('new-location-input'),
        addLocationBtn: document.getElementById('add-location-btn'),
        morningSelect: document.getElementById('location-morning'),
        afternoonSelect: document.getElementById('location-afternoon'),
        hourSelectorMorning: document.getElementById('hour-selector-morning'),
        hourSelectorAfternoon: document.getElementById('hour-selector-afternoon'),
        hoursMorningInput: document.getElementById('hours-morning'),
        hoursAfternoonInput: document.getElementById('hours-afternoon'),
        addEntryBtn: document.getElementById('add-entry-btn'),
        logBody: document.getElementById('log-body'),
        totalHoursEl: document.getElementById('total-hours'),
        currentMonthEl: document.getElementById('current-month'),
        locationSummaryEl: document.getElementById('location-summary'),
        exportBtn: document.getElementById('export-btn'),
        shareBtn: document.getElementById('share-btn'),
        resetBtn: document.getElementById('reset-btn'),
        themeToggle: document.getElementById('theme-toggle'),
    };

    // --- FUNZIONI LOGICHE ---

    const saveState = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const showPage = (pageId) => {
        DOMElements.allPages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        if (DOMElements.sideNav.classList.contains('open')) {
            toggleMenu();
        }
    };

    const toggleMenu = () => {
        DOMElements.sideNav.classList.toggle('open');
        DOMElements.overlay.classList.toggle('show');
    };

    const populateLocationDropdowns = () => {
        [DOMElements.morningSelect, DOMElements.afternoonSelect].forEach((select, index) => {
            select.innerHTML = '';
            const placeholder = index === 0 ? 'Seleziona Cantiere 1...' : 'Seleziona Cantiere 2...';
            select.add(new Option(placeholder, ''));
            state.workLocations.forEach(location => select.add(new Option(location, location)));
        });
    };

    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        DOMElements.themeToggle.checked = theme === 'dark';
    };

    const createHourButtons = (container) => {
        for (let i = 0; i <= 10; i++) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'hour-button';
            button.textContent = i;
            button.dataset.hours = i;
            container.appendChild(button);
        }
    };
    
    const renderLog = () => {
        DOMElements.logBody.innerHTML = '';
        DOMElements.locationSummaryEl.innerHTML = '';

        let totalHours = 0;
        const locationTotals = {};

        const selectedDate = new Date(DOMElements.dateInput.value + 'T00:00:00');
        const viewingMonth = selectedDate.getMonth();
        const viewingYear = selectedDate.getFullYear();

        DOMElements.currentMonthEl.textContent = selectedDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

        const filteredEntries = state.logEntries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === viewingMonth && entryDate.getFullYear() === viewingYear;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        filteredEntries.forEach(entry => {
            const hoursM = parseFloat(entry.hoursM || 0);
            const hoursA = parseFloat(entry.hoursA || 0);
            const dailyTotal = hoursM + hoursA;
            const originalIndex = state.logEntries.findIndex(e => e.id === entry.id);

            const row = DOMElements.logBody.insertRow();
            row.innerHTML = `
                <td>${new Date(entry.date).toLocaleDateString('it-IT', {day: '2-digit', month: 'short'})}</td>
                <td>${entry.locationM || '-'}</td>
                <td>${hoursM > 0 ? hoursM.toFixed(1) : '-'}</td>
                <td>${entry.locationA || '-'}</td>
                <td>${hoursA > 0 ? hoursA.toFixed(1) : '-'}</td>
                <td style="font-weight: bold;">${dailyTotal > 0 ? dailyTotal.toFixed(1) : '-'}</td>
                <td><button class="delete-btn" data-index="${originalIndex}"><i class="fa-solid fa-xmark"></i></button></td>
            `;

            totalHours += dailyTotal;
            if (hoursM > 0 && entry.locationM) {
                locationTotals[entry.locationM] = (locationTotals[entry.locationM] || 0) + hoursM;
            }
            if (hoursA > 0 && entry.locationA) {
                locationTotals[entry.locationA] = (locationTotals[entry.locationA] || 0) + hoursA;
            }
        });

        DOMElements.totalHoursEl.textContent = totalHours.toFixed(1);
        Object.keys(locationTotals).sort().forEach(location => {
            const p = document.createElement('p');
            p.innerHTML = `Ore ${location}: <strong>${locationTotals[location].toFixed(1)}</strong>`;
            DOMElements.locationSummaryEl.appendChild(p);
        });
    };

    /**
     * MODIFICATA: La logica di creazione della tabella ora divide i giorni in due colonne.
     */
    const createReportImage = async (share = false) => {
        const name = prompt("Inserisci il tuo nome per personalizzare il report:");
        if (!name) return;

        const selectedDate = new Date(DOMElements.dateInput.value + 'T00:00:00');
        const viewingMonth = selectedDate.getMonth();
        const viewingYear = selectedDate.getFullYear();

        const filteredEntries = state.logEntries
            .filter(entry => new Date(entry.date).getMonth() === viewingMonth && new Date(entry.date).getFullYear() === viewingYear)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    
        if (filteredEntries.length === 0) {
            alert("Nessun dato da esportare per il mese selezionato.");
            return;
        }
    
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        Object.assign(printContainer.style, {
            position: 'absolute', left: '-9999px', padding: '20px',
            width: '800px', display: 'flex', flexDirection: 'column', gap: '20px',
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color'),
            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
            fontFamily: getComputedStyle(document.body).getPropertyValue('font-family')
        });

        let grandTotalHours = 0;
        const locationTotals = {};
        filteredEntries.forEach(entry => {
            const hoursM = parseFloat(entry.hoursM || 0);
            const hoursA = parseFloat(entry.hoursA || 0);
            grandTotalHours += hoursM + hoursA;
            if (hoursM > 0 && entry.locationM) locationTotals[entry.locationM] = (locationTotals[entry.locationM] || 0) + hoursM;
            if (hoursA > 0 && entry.locationA) locationTotals[entry.locationA] = (locationTotals[entry.locationA] || 0) + hoursA;
        });

        let locationSummaryHTML = '';
        Object.keys(locationTotals).sort().forEach(loc => {
            locationSummaryHTML += `<p style="margin: 4px 0; font-size: 16px;">Ore ${loc}: <strong>${locationTotals[loc].toFixed(1)}</strong></p>`;
        });

        const bodyStyles = getComputedStyle(document.body);
        const summaryHTML = `
            <div style="text-align: center; background-color: ${bodyStyles.getPropertyValue('--card-bg-color')}; border-radius: 12px; padding: 18px;">
                <h2>Resoconto Ore di ${name}</h2>
                <p>Mese: <strong>${DOMElements.currentMonthEl.textContent}</strong></p>
                <div style="text-align: center; margin: 15px 0;">${locationSummaryHTML}</div>
                <p style="font-size: 24px; font-weight: 500; border-top: 1px solid ${bodyStyles.getPropertyValue('--border-color')}; padding-top: 15px; margin-top: 15px;">
                    Totale Ore Complessive: <strong style="color: ${bodyStyles.getPropertyValue('--primary-accent-color')};">${grandTotalHours.toFixed(1)}</strong>
                </p>
            </div>`;

        // ==================================================================
        // MODIFICA PRINCIPALE: Suddivisione della tabella in due colonne
        // ==================================================================

        const createTableHTML = (data) => {
            if (data.length === 0) return '<div></div>'; // Restituisce un div vuoto se non ci sono dati
            const rows = data.map(entry => {
                const hoursM = parseFloat(entry.hoursM || 0);
                const hoursA = parseFloat(entry.hoursA || 0);
                const dailyTotal = hoursM + hoursA;
                return `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${new Date(entry.date).toLocaleDateString('it-IT', {day: '2-digit', month: 'short'})}</td>
                        <td style="padding: 10px; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${entry.locationM || '-'}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${hoursM > 0 ? hoursM.toFixed(1) : '-'}</td>
                        <td style="padding: 10px; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${entry.locationA || '-'}</td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${hoursA > 0 ? hoursA.toFixed(1) : '-'}</td>
                        <td style="padding: 10px; text-align: center; font-weight: bold; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${dailyTotal > 0 ? dailyTotal.toFixed(1) : '-'}</td>
                    </tr>`;
            }).join('');
    
            return `
                <table style="width: 100%; border-collapse: collapse; background-color: ${bodyStyles.getPropertyValue('--card-bg-color')}; border-radius: 12px; overflow: hidden; font-size: 14px;">
                    <thead>
                        <tr>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Data</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Cantiere 1</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Ore</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Cantiere 2</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Ore</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Tot. Giorno</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;
        };

        // Suddividi i dati per le due colonne
        const firstHalfEntries = filteredEntries.filter(e => new Date(e.date).getDate() <= 15);
        const secondHalfEntries = filteredEntries.filter(e => new Date(e.date).getDate() > 15);

        // Crea il contenitore flessibile per le due tabelle
        const tablesHTML = `
            <div style="display: flex; gap: 20px; align-items: flex-start;">
                <div style="flex: 1;">
                    ${createTableHTML(firstHalfEntries)}
                </div>
                <div style="flex: 1;">
                    ${createTableHTML(secondHalfEntries)}
                </div>
            </div>
        `;
        
        printContainer.innerHTML = summaryHTML + tablesHTML;
        // ==================================================================
        // FINE MODIFICA
        // ==================================================================
        
        document.body.appendChild(printContainer);
    
        try {
            const canvas = await html2canvas(printContainer, { scale: 2 });
            const fileName = `Report-Ore-${DOMElements.currentMonthEl.textContent.replace(/\s/g, '-')}-${name.replace(/\s/g, '_')}.png`;

            if (share && navigator.share) {
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], fileName, { type: "image/png" });
                    try {
                        await navigator.share({ files: [file], title: `Report Ore - ${DOMElements.currentMonthEl.textContent}` });
                    } catch (err) {
                        console.error("Errore condivisione:", err);
                        alert("Condivisione annullata o non riuscita.");
                    }
                }, 'image/png');
            } else {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = fileName;
                link.click();
            }
        } catch (err) {
            console.error("Errore creazione immagine:", err);
        } finally {
            document.body.removeChild(printContainer);
        }
    };


    // --- GESTIONE DEGLI EVENTI e FUNZIONI HANDLER ---
    
    function setupEventListeners() {
        DOMElements.menuBtn.addEventListener('click', toggleMenu);
        DOMElements.overlay.addEventListener('click', toggleMenu);
        DOMElements.registroOreLink.addEventListener('click', (e) => { e.preventDefault(); showPage('registro-ore-page'); });
        DOMElements.formularioLink.addEventListener('click', (e) => { e.preventDefault(); showPage('formulario-page'); });
        DOMElements.prevDayBtn.addEventListener('click', () => {
            const currentDate = new Date(DOMElements.dateInput.value);
            currentDate.setDate(currentDate.getDate() - 1);
            DOMElements.dateInput.value = currentDate.toISOString().split('T')[0];
            renderLog();
        });
        DOMElements.nextDayBtn.addEventListener('click', () => {
            const currentDate = new Date(DOMElements.dateInput.value);
            currentDate.setDate(currentDate.getDate() + 1);
            DOMElements.dateInput.value = currentDate.toISOString().split('T')[0];
            renderLog();
        });
        DOMElements.dateInput.addEventListener('change', renderLog);
        DOMElements.hourSelectorMorning.addEventListener('click', (e) => handleHourSelection(e, DOMElements.hourSelectorMorning, DOMElements.hoursMorningInput));
        DOMElements.hourSelectorAfternoon.addEventListener('click', (e) => handleHourSelection(e, DOMElements.hourSelectorAfternoon, DOMElements.hoursAfternoonInput));
        DOMElements.addEntryBtn.addEventListener('click', handleAddEntry);
        DOMElements.logBody.addEventListener('click', handleDeleteEntry);
        DOMElements.resetBtn.addEventListener('click', handleReset);
        DOMElements.exportBtn.addEventListener('click', () => createReportImage(false));
        DOMElements.shareBtn.addEventListener('click', () => createReportImage(true));
        DOMElements.themeToggle.addEventListener('change', handleThemeToggle);
        DOMElements.addLocationBtn.addEventListener('click', handleAddLocation);
        DOMElements.newLocationInput.addEventListener('input', () => {
             DOMElements.addLocationBtn.disabled = DOMElements.newLocationInput.value.trim() === '';
        });
    }

    function handleHourSelection(e, container, hiddenInput) {
        const clickedButton = e.target.closest('.hour-button');
        if (!clickedButton) return;

        const currentActive = container.querySelector('.hour-button.active');
        const hours = clickedButton.dataset.hours;

        if (currentActive === clickedButton) {
            clickedButton.classList.remove('active');
            hiddenInput.value = '0';
        } else {
            if (currentActive) currentActive.classList.remove('active');
            clickedButton.classList.add('active');
            hiddenInput.value = hours;
        }
    }

    function handleAddLocation() {
        const newLocation = DOMElements.newLocationInput.value.trim();
        if (newLocation && !state.workLocations.some(loc => loc.toLowerCase() === newLocation.toLowerCase())) {
            state.workLocations.push(newLocation);
            saveState(STORAGE_KEYS.LOCATIONS, state.workLocations);
            populateLocationDropdowns();
            DOMElements.newLocationInput.value = '';
            DOMElements.addLocationBtn.disabled = true;
        } else if (!newLocation) {
            alert("Il nome del luogo non può essere vuoto.");
        } else {
            alert("Questo luogo esiste già.");
        }
    }
    
    function handleThemeToggle() {
        state.theme = DOMElements.themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
        applyTheme(state.theme);
    }
    
    function handleAddEntry() {
        const date = DOMElements.dateInput.value;
        if (!date) {
            alert('Per favore, inserisci una data.');
            return;
        }
        if (state.logEntries.some(entry => entry.date === date)) {
            alert('Errore: Questa data è già presente nel registro.');
            return;
        }
        
        const hoursM = parseFloat(DOMElements.hoursMorningInput.value);
        const hoursA = parseFloat(DOMElements.hoursAfternoonInput.value);

        if (hoursM === 0 && hoursA === 0) {
            alert('Inserire almeno un valore di ore lavorate.');
            return;
        }

        state.logEntries.push({
            id: Date.now(),
            date: date,
            hoursM: hoursM.toFixed(1),
            hoursA: hoursA.toFixed(1),
            locationM: DOMElements.morningSelect.value,
            locationA: DOMElements.afternoonSelect.value
        });
        saveState(STORAGE_KEYS.LOG, state.logEntries);
        
        DOMElements.morningSelect.value = '';
        DOMElements.afternoonSelect.value = '';
        [DOMElements.hourSelectorMorning, DOMElements.hourSelectorAfternoon].forEach(sel => sel.querySelector('.active')?.classList.remove('active'));
        DOMElements.hoursMorningInput.value = '0';
        DOMElements.hoursAfternoonInput.value = '0';
        
        renderLog();
    }
    
    function handleDeleteEntry(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const indexToDelete = deleteBtn.dataset.index;
            state.logEntries.splice(indexToDelete, 1);
            saveState(STORAGE_KEYS.LOG, state.logEntries);
            renderLog();
        }
    }
    
    function handleReset() {
        if (confirm("Sei sicuro di voler cancellare TUTTI i dati? L'azione non è reversibile.")) {
            localStorage.removeItem(STORAGE_KEYS.LOG);
            localStorage.removeItem(STORAGE_KEYS.LOCATIONS);
            state.logEntries = [];
            state.workLocations = [];
            populateLocationDropdowns();
            renderLog();
        }
    }

    // --- INIZIALIZZAZIONE DELL'APP ---

    function init() {
        DOMElements.dateInput.value = new Date().toISOString().split('T')[0];
        DOMElements.addLocationBtn.disabled = true;
        
        applyTheme(state.theme);
        createHourButtons(DOMElements.hourSelectorMorning);
        createHourButtons(DOMElements.hourSelectorAfternoon);
        populateLocationDropdowns();
        setupEventListeners();
        renderLog();
    }

    init();
});