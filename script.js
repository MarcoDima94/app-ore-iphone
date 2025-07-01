document.addEventListener('DOMContentLoaded', () => {
    // Elementi del DOM
    const dateInput = document.getElementById('entry-date');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const hourSlider = document.getElementById('hour-slider');
    const sliderValue = document.getElementById('slider-value');
    const morningSelect = document.getElementById('location-morning');
    const afternoonSelect = document.getElementById('location-afternoon');
    const addBtn = document.getElementById('add-entry-btn');
    const logBody = document.getElementById('log-body');
    const totalHoursEl = document.getElementById('total-hours');
    const currentMonthEl = document.getElementById('current-month');
    const exportBtn = document.getElementById('export-btn');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const shareBtn = document.getElementById('share-btn');
    const newLocationInput = document.getElementById('new-location-input');
    const addLocationBtn = document.getElementById('add-location-btn');

    // Imposta data di oggi
    dateInput.value = new Date().toISOString().split('T')[0];

    // Carica dati dal localStorage
    let logEntries = JSON.parse(localStorage.getItem('workLog')) || [];
    // MODIFICA: La lista dei luoghi ora parte vuota
    let workLocations = JSON.parse(localStorage.getItem('workLocations')) || [];

    // --- LOGICA GESTIONE LUOGHI ---
    const populateLocationDropdowns = () => {
        morningSelect.innerHTML = '';
        afternoonSelect.innerHTML = '';
        const defaultOption = new Option('Seleziona luogo...', '');
        morningSelect.add(defaultOption.cloneNode(true));
        afternoonSelect.add(defaultOption);
        workLocations.forEach(location => {
            const option = new Option(location, location);
            morningSelect.add(option.cloneNode(true));
            afternoonSelect.add(option);
        });
    };

    addLocationBtn.addEventListener('click', () => {
        const newLocation = newLocationInput.value.trim();
        if (newLocation && !workLocations.some(loc => loc.toLowerCase() === newLocation.toLowerCase())) {
            workLocations.push(newLocation);
            localStorage.setItem('workLocations', JSON.stringify(workLocations));
            populateLocationDropdowns();
            newLocationInput.value = '';
            addLocationBtn.disabled = true; // Disattiva di nuovo il pulsante dopo l'aggiunta
        } else if (!newLocation) {
            alert("Il nome del luogo non può essere vuoto.");
        } else {
            alert("Questo luogo esiste già.");
        }
    });

    // MODIFICA: Attiva/disattiva il pulsante "Aggiungi"
    newLocationInput.addEventListener('input', () => {
        if (newLocationInput.value.trim() !== '') {
            addLocationBtn.disabled = false;
        } else {
            addLocationBtn.disabled = true;
        }
    });
    // Disattiva il pulsante all'avvio
    addLocationBtn.disabled = true;

    // --- LOGICA TEMA SCURO ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            themeToggle.checked = false;
        }
    };
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // --- LOGICA NAVIGAZIONE DATA ---
    const changeDate = (days) => {
        const currentDate = new Date(dateInput.value);
        currentDate.setDate(currentDate.getDate() + days);
        dateInput.value = currentDate.toISOString().split('T')[0];
        renderLog();
    };
    prevDayBtn.addEventListener('click', () => changeDate(-1));
    nextDayBtn.addEventListener('click', () => changeDate(1));
    dateInput.addEventListener('change', () => renderLog());

    // --- LOGICA SLIDER ORE ---
    hourSlider.addEventListener('input', () => {
        sliderValue.textContent = `${parseFloat(hourSlider.value).toFixed(1)} h`;
    });

    // --- LOGICA APP PRINCIPALE ---
    const renderLog = () => {
        logBody.innerHTML = '';
        let totalHours = 0;
        const selectedDate = new Date(dateInput.value + 'T00:00:00');
        const viewingMonth = selectedDate.getMonth();
        const viewingYear = selectedDate.getFullYear();

        currentMonthEl.textContent = selectedDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
        
        const filteredEntries = logEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === viewingMonth && entryDate.getFullYear() === viewingYear;
        });
        
        filteredEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        filteredEntries.forEach(entry => {
            const row = document.createElement('tr');
            const originalIndex = logEntries.findIndex(e => e.id === entry.id);
            row.innerHTML = `
                <td>${new Date(entry.date).toLocaleDateString('it-IT', {day: '2-digit', month: 'short'})}</td>
                <td>${entry.hours}</td>
                <td>${entry.locationM}</td>
                <td>${entry.locationA}</td>
                <td><button class="delete-btn" data-index="${originalIndex}">X</button></td>
            `;
            logBody.appendChild(row);
            totalHours += parseFloat(entry.hours) || 0;
        });
        totalHoursEl.textContent = totalHours.toFixed(2);
    };

    // --- FUNZIONE DI AGGIUNTA VOCE ---
    addBtn.addEventListener('click', () => {
        const date = dateInput.value;
        if (!date) {
            alert('Per favore, inserisci una data.');
            return;
        }
        const isDateDuplicate = logEntries.some(entry => entry.date === date);
        if (isDateDuplicate) {
            alert('Errore: Questa data è già presente nel registro.');
            return;
        }
        
        const hours = parseFloat(hourSlider.value).toFixed(1);
        const locationM = morningSelect.value;
        const locationA = afternoonSelect.value;

        logEntries.push({
            id: Date.now(),
            date: date,
            hours: hours,
            locationM: locationM,
            locationA: locationA
        });
        localStorage.setItem('workLog', JSON.stringify(logEntries));
        
        morningSelect.value = '';
        afternoonSelect.value = '';
        hourSlider.value = 0; 
        sliderValue.textContent = '0.0 h';
        
        renderLog();
    });

    // --- FUNZIONI DI CONTROLLO ---
    logBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const indexToDelete = e.target.getAttribute('data-index');
            logEntries.splice(indexToDelete, 1);
            localStorage.setItem('workLog', JSON.stringify(logEntries));
            renderLog();
        }
    });
    
    resetBtn.addEventListener('click', () => {
        const confirmation = confirm("Sei sicuro di voler cancellare TUTTI i dati? L'azione non è reversibile.");
        if (confirmation) {
            logEntries = [];
            localStorage.removeItem('workLog');
            localStorage.removeItem('workLocations');
            workLocations = []; // Resetta a lista vuota
            populateLocationDropdowns();
            renderLog();
        }
    });
    
    // --- FUNZIONE DI ESPORTAZIONE E CONDIVISIONE ---
    const createReportImage = async (share = false, authorName) => {
        const selectedDate = new Date(dateInput.value + 'T00:00:00');
        const viewingMonth = selectedDate.getMonth();
        const viewingYear = selectedDate.getFullYear();

        const filteredEntries = logEntries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === viewingMonth && entryDate.getFullYear() === viewingYear;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    
        if (filteredEntries.length === 0) {
            alert("Nessun dato da esportare per il mese selezionato.");
            return;
        }
    
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.padding = '20px';
        printContainer.style.display = 'flex';
        printContainer.style.flexDirection = 'column';
        printContainer.style.gap = '20px';
        printContainer.style.width = '800px'; 
        
        const bodyStyles = getComputedStyle(document.body);
        printContainer.style.backgroundColor = bodyStyles.getPropertyValue('--bg-color');
        printContainer.style.color = bodyStyles.getPropertyValue('--text-color');
        printContainer.style.fontFamily = bodyStyles.getPropertyValue('font-family');
    
        const reportTitle = `Resoconto Ore di ${authorName}`;
        const summaryHTML = `
            <div style="text-align: center; background-color: ${bodyStyles.getPropertyValue('--card-bg-color')}; border-radius: 12px; padding: 18px;">
                <h2>${reportTitle}</h2>
                <p>Mese: <strong>${currentMonthEl.textContent}</strong></p>
                <p style="font-size: 28px; font-weight: 500;">Totale Ore: <strong style="color: ${bodyStyles.getPropertyValue('--primary-accent-color')};">${totalHoursEl.textContent}</strong></p>
            </div>
        `;
    
        const createTableHTML = (data) => {
            if (data.length === 0) return '';
            let rows = '';
            data.forEach(entry => {
                rows += `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${new Date(entry.date).toLocaleDateString('it-IT', {day: '2-digit', month: 'short'})}</td>
                        <td style="padding: 12px; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${entry.hours}</td>
                        <td style="padding: 12px; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${entry.locationM}</td>
                        <td style="padding: 12px; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">${entry.locationA}</td>
                    </tr>
                `;
            });
    
            return `
                <table style="width: 100%; border-collapse: collapse; background-color: ${bodyStyles.getPropertyValue('--card-bg-color')}; border-radius: 12px; overflow: hidden;">
                    <thead>
                        <tr>
                            <th style="padding: 12px; text-align: left; color: ${bodyStyles.getPropertyValue('--secondary-text-color')}; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Data</th>
                            <th style="padding: 12px; text-align: left; color: ${bodyStyles.getPropertyValue('--secondary-text-color')}; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Ore</th>
                            <th style="padding: 12px; text-align: left; color: ${bodyStyles.getPropertyValue('--secondary-text-color')}; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Mattina</th>
                            <th style="padding: 12px; text-align: left; color: ${bodyStyles.getPropertyValue('--secondary-text-color')}; border-bottom: 1px solid ${bodyStyles.getPropertyValue('--border-color')};">Pomeriggio</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        };
    
        const firstColumnData = filteredEntries.slice(0, 15);
        const secondColumnData = filteredEntries.slice(15);
        
        const tablesHTML = `
            <div style="display: flex; gap: 20px; align-items: flex-start;">
                <div style="flex: 1;">${createTableHTML(firstColumnData)}</div>
                <div style="flex: 1;">${createTableHTML(secondColumnData)}</div>
            </div>
        `;
        
        printContainer.innerHTML = summaryHTML + tablesHTML;
        document.body.appendChild(printContainer);
    
        try {
            const canvas = await html2canvas(printContainer, { scale: 2 });
            const monthName = currentMonthEl.textContent.replace(/\s/g, '-');
            const fileName = `Report-Ore-${monthName}-${authorName.replace(/\s/g, '_')}.png`;

            if (share) {
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], fileName, { type: "image/png" });
                    const shareData = { files: [file], title: `Report Ore - ${monthName}` };
                    if (navigator.canShare && navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                    } else {
                        alert("Funzionalità di condivisione non supportata. Verrà scaricata l'immagine.");
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = fileName;
                        link.click();
                        URL.revokeObjectURL(link.href);
                    }
                }, 'image/png');
            } else {
                const image = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = fileName;
                link.href = image;
                link.click();
            }
        } catch (err) {
            console.error("Errore durante la creazione dell'immagine:", err);
        } finally {
            document.body.removeChild(printContainer);
        }
    };

    shareBtn.addEventListener('click', () => {
        const name = prompt("Inserisci il tuo nome:");
        if (name) {
            createReportImage(true, name);
        }
    });
    
    exportBtn.addEventListener('click', () => {
        const name = prompt("Inserisci il tuo nome:");
        if (name) {
            createReportImage(false, name);
        }
    });

    // Popola i menù e mostra i dati al caricamento iniziale
    populateLocationDropdowns();
    renderLog();
});