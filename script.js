document.addEventListener('DOMContentLoaded', () => {
    // Elementi del DOM
    const dateInput = document.getElementById('entry-date');
    const prevDayBtn = document.getElementById('prev-day-btn');
    const nextDayBtn = document.getElementById('next-day-btn');
    const hourSlider = document.getElementById('hour-slider');
    const sliderValue = document.getElementById('slider-value');
    const morningInput = document.getElementById('location-morning');
    const afternoonInput = document.getElementById('location-afternoon');
    const addBtn = document.getElementById('add-entry-btn');
    const logBody = document.getElementById('log-body');
    const totalHoursEl = document.getElementById('total-hours');
    const currentMonthEl = document.getElementById('current-month');
    const exportBtn = document.getElementById('export-btn');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Imposta data di oggi
    dateInput.value = new Date().toISOString().split('T')[0];

    // Carica dati dal localStorage
    let logEntries = JSON.parse(localStorage.getItem('workLog')) || [];

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

    // --- LOGICA PER NAVIGAZIONE DATA ---
    const changeDate = (days) => {
        const currentDate = new Date(dateInput.value);
        currentDate.setDate(currentDate.getDate() + days);
        dateInput.value = currentDate.toISOString().split('T')[0];
    };
    prevDayBtn.addEventListener('click', () => changeDate(-1));
    nextDayBtn.addEventListener('click', () => changeDate(1));

    // --- LOGICA PER LO SLIDER DELLE ORE ---
    hourSlider.addEventListener('input', () => {
        sliderValue.textContent = `${parseFloat(hourSlider.value).toFixed(1)} h`;
    });

    // --- LOGICA APP ---
    const renderLog = () => {
        logBody.innerHTML = '';
        let totalHours = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        currentMonthEl.textContent = new Date(currentYear, currentMonth).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
        const filteredEntries = logEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
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

    // --- FUNZIONE DI AGGIUNTA ---
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
        
        logEntries.push({
            id: Date.now(),
            date: date,
            hours: hours,
            locationM: morningInput.value,
            locationA: afternoonInput.value
        });
        localStorage.setItem('workLog', JSON.stringify(logEntries));
        
        morningInput.value = '';
        afternoonInput.value = '';
        // Modifica per resettare lo slider a 0
        hourSlider.value = 0; 
        sliderValue.textContent = '0.0 h';
        
        renderLog();
    });

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
            renderLog();
        }
    });
    
    // --- FUNZIONE DI ESPORTAZIONE A DUE COLONNE ---
    exportBtn.addEventListener('click', () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const filteredEntries = logEntries
            .filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    
        if (filteredEntries.length === 0) {
            alert("Nessun dato da esportare per il mese corrente.");
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
    
        const summaryHTML = `
            <div style="text-align: center; background-color: ${bodyStyles.getPropertyValue('--card-bg-color')}; border-radius: 12px; padding: 18px;">
                <h2>Riepilogo Mensile</h2>
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
    
        html2canvas(printContainer, { scale: 2 }).then(canvas => {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const monthName = currentMonthEl.textContent.replace(/\s/g, '-');
            link.download = `Report-Ore-${monthName}.png`;
            link.href = image;
            link.click();
    
            document.body.removeChild(printContainer);
        }).catch(err => {
            console.error("Errore durante la creazione dell'immagine:", err);
            document.body.removeChild(printContainer);
        });
    });

    // Mostra i dati al caricamento della pagina iniziale
    renderLog();
});