// script.js
let generatedNumbers = [];
let backgroundImage = null;

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    document.getElementById('backgroundImage').addEventListener('change', function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            backgroundImage = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('useSerialNumber').addEventListener('change', function() {
        document.getElementById('serialNumberInputs').style.display = this.checked ? 'block' : 'none';
        updatePreview();
    });

    document.getElementById('useDatePrinting').addEventListener('change', function() {
        document.getElementById('datePrintingInputs').style.display = this.checked ? 'block' : 'none';
        updatePreview();
    });
});

function generateNumbers() {
    let customer = document.getElementById('customer').value.trim().replace(/\s+/g, '');
    let comment = document.getElementById('comment').value.trim().replace(/\s+/g, '');
    let profile = document.getElementById('profile').value.trim().replace(/\s+/g, '');
    let passwordType = document.getElementById('passwordType').value;

    const beginNumber = parseInt(document.getElementById('beginNumber').value);
    const length = parseInt(document.getElementById('numLength').value);
    const count = parseInt(document.getElementById('numCount').value);
    const outputArea = document.getElementById('output');

    if (length < 5) {
        alert("خطأ: يجب أن يكون طول الرقم 5 أو أكثر!");
        return;
    }

    let result = '';
    generatedNumbers = [];

    result += `/log info "بدء إنشاء المستخدمين للعميل ${customer}";\n`;
    result += `:local scriptRunDate [/system clock get date];\n`;

    while (generatedNumbers.length < count) {
        let randomNumber = beginNumber.toString();
        while (randomNumber.length < length) {
            randomNumber += Math.floor(Math.random() * 10);
        }

        if (!generatedNumbers.includes(randomNumber)) {
            generatedNumbers.push(randomNumber);

            let password = '';
            if (passwordType === 'same') {
                password = randomNumber;
            } else if (passwordType === 'empty') {
                password = '""';
            }

            const script = `/log info "إنشاء مستخدم جديد: ${randomNumber}";\n` +
                           `/tool user-manager user add customer=${customer} username=${randomNumber} password=${password} first-name=$scriptRunDate comment=${comment};\n` +
                           `/tool user-manager user create-and-activate-profile customer=${customer} profile=${profile} "${randomNumber}";\n`;
            result += script;
        }
    }
    result += `/log info "اكتمال إنشاء المستخدمين للعميل ${customer} - العدد الإجمالي: ${count}";\n`;
    outputArea.value = result;
    updatePreview();
}

function saveAsExcel() {
    if (generatedNumbers.length === 0) {
        alert("لا توجد أرقام مولدة لحفظها!");
        return;
    }

    const worksheetData = generatedNumbers.map((number, index) => {
        return {
            "الرقم": number,
            "العميل": document.getElementById('customer').value,
            "البروفايل": document.getElementById('profile').value,
            "التعليق": document.getElementById('comment').value || "",
        };
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Numbers");

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numberCount = generatedNumbers.length;
    const beginNumber = document.getElementById('beginNumber').value;
    const profile = document.getElementById('profile').value;
    XLSX.writeFile(wb, `numbers_${profile}_${beginNumber}_${numberCount}_${date}.xlsx`);
}

function saveAsTxt() {
    const text = generatedNumbers.join('\n');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numberCount = generatedNumbers.length;
    const beginNumber = document.getElementById('beginNumber').value;
    const profile = document.getElementById('profile').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `numbers_${profile}_${beginNumber}_${numberCount}_${date}.txt`;
    link.click();
}

function saveAsMikroTik() {
    const text = document.getElementById('output').value.trim();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numberCount = generatedNumbers.length;
    const beginNumber = document.getElementById('beginNumber').value;
    const profile = document.getElementById('profile').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usermanagerscript_${profile}_${beginNumber}_${numberCount}_${date}.txt`;
    link.click();
}

// script.js (or within your <script> tag)

// ... (keep existing variables like generatedNumbers, backgroundImage)
// ... (keep existing DOMContentLoaded listener and other functions like generateNumbers, saveAsExcel, etc.)

function updatePreview() {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';

    if (generatedNumbers.length === 0) return;

    // const columns = parseInt(document.getElementById('columns').value); // Not used for single card preview
    // const rows = parseInt(document.getElementById('rows').value);     // Not used for single card preview
    const textSize = document.getElementById('textSize').value; // This will be treated as points (pt)
    const textX = document.getElementById('textPositionX').value; // User input in preview pixels
    const textY = document.getElementById('textPositionY').value; // User input in preview pixels
    const useSerial = document.getElementById('useSerialNumber').checked;
    const serialSize = document.getElementById('serialNumberSize').value; // points (pt)
    const serialX = document.getElementById('serialPositionX').value;
    const serialY = document.getElementById('serialPositionY').value;
    const serialStart = parseInt(document.getElementById('serialStartNumber').value);
    const useDate = document.getElementById('useDatePrinting').checked;
    const dateSize = document.getElementById('dateSize').value; // points (pt)
    const dateX = document.getElementById('datePositionX').value;
    const dateY = document.getElementById('datePositionY').value;
    // const boxSpacing = parseFloat(document.getElementById('boxSpacing').value); // Not used for single card preview

    const pageWidth = 210; // A4 width in mm
    // const pageHeight = 297; // A4 height in mm
    // const marginX = 5;
    // const marginY = 5;
    // const availableWidth = pageWidth - 2 * marginX;
    // const availableHeight = pageHeight - 2 * marginY;

    // For preview, we calculate boxWidth/Height based on PDF settings to show one card
    const pdfColumns = parseInt(document.getElementById('columns').value);
    const pdfRows = parseInt(document.getElementById('rows').value);
    const pdfBoxSpacing = parseFloat(document.getElementById('boxSpacing').value);
    const pdfMarginX = 2; // As used in generatePDF
    const pdfMarginY = 2; // As used in generatePDF
    const pdfPageWidth = 210;
    const pdfPageHeight = 297;

    const boxWidthMm = ((pdfPageWidth - 2 * pdfMarginX) - (pdfBoxSpacing * (pdfColumns - 1))) / pdfColumns;
    const boxHeightMm = ((pdfPageHeight - 2 * pdfMarginY) - (pdfBoxSpacing * (pdfRows - 1))) / pdfRows;

    // The 'scale' factor was a bit problematic. Let's simplify.
    // The preview box will be dimensioned in mm, and text positions in px relative to that.
    // This relies on the browser's interpretation of mm and px.

    const box = document.createElement('div');
    box.className = 'box';
    // Set preview box dimensions in mm, browser will convert to screen pixels
    box.style.width = `${boxWidthMm}mm`;
    box.style.height = `${boxHeightMm}mm`;

    if (backgroundImage) {
        box.style.backgroundImage = `url(${backgroundImage})`;
    }

    const number = document.createElement('div');
    number.textContent = generatedNumbers[0] || "12345678"; // Show sample if no numbers yet
    number.style.position = 'absolute';
    number.style.left = `${textX}px`;   // User inputs this in pixels
    number.style.top = `${textY}px`;    // User inputs this in pixels
    number.style.fontSize = `${textSize}pt`; // Use points for consistency with PDF
    box.appendChild(number);

    if (useSerial) {
        const serial = document.createElement('div');
        serial.textContent = serialStart.toString();
        serial.style.position = 'absolute';
        serial.style.left = `${serialX}px`;
        serial.style.top = `${serialY}px`;
        serial.style.fontSize = `${serialSize}pt`; // Use points
        box.appendChild(serial);
    }

    if (useDate) {
        const date = document.createElement('div');
        const today = new Date().toISOString().split('T')[0];
        date.textContent = today;
        date.style.position = 'absolute';
        date.style.left = `${dateX}px`;
        date.style.top = `${dateY}px`;
        date.style.fontSize = `${dateSize}pt`; // Use points
        box.appendChild(date);
    }

    preview.appendChild(box);
}


function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const columns = parseInt(document.getElementById('columns').value);
    const rows = parseInt(document.getElementById('rows').value);
    const textSize = parseInt(document.getElementById('textSize').value); // Input is now treated as points
    const textX = parseFloat(document.getElementById('textPositionX').value); // Input in preview pixels
    const textY = parseFloat(document.getElementById('textPositionY').value); // Input in preview pixels
    const useSerial = document.getElementById('useSerialNumber').checked;
    const serialSize = parseInt(document.getElementById('serialNumberSize').value); // Input as points
    const serialX = parseFloat(document.getElementById('serialPositionX').value);
    const serialY = parseFloat(document.getElementById('serialPositionY').value);
    const serialStart = parseInt(document.getElementById('serialStartNumber').value);
    const useDate = document.getElementById('useDatePrinting').checked;
    const dateSize = parseInt(document.getElementById('dateSize').value); // Input as points
    const dateX = parseFloat(document.getElementById('datePositionX').value);
    const dateY = parseFloat(document.getElementById('datePositionY').value);
    const boxSpacing = parseFloat(document.getElementById('boxSpacing').value);

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 2; // Keep PDF margins as they were
    const marginY = 2;
    const boxWidth = ((pageWidth - 2 * marginX) - (boxSpacing * (columns - 1))) / columns;
    const boxHeight = ((pageHeight - 2 * marginY) - (boxSpacing * (rows - 1))) / rows;

    const pxToMm = 25.4 / 96; // Standard conversion: 1 inch = 25.4 mm, 96 pixels per inch (common assumption)

    const today = new Date().toISOString().split('T')[0];

    // It's good practice to ensure a font is loaded/set, especially for Arabic.
    // jsPDF's default fonts might not have good Arabic support.
    // This example doesn't include custom font embedding, which is a more advanced topic
    // but crucial for non-Latin scripts if default fonts fail.
    // For now, we rely on jsPDF's default or system fallback for Arabic.

    for (let i = 0; i < generatedNumbers.length; i++) {
        if (i > 0 && i % (columns * rows) === 0) {
            pdf.addPage();
        }

        const col = i % columns;
        const row = Math.floor((i % (columns * rows)) / columns);

        const currentCardX = marginX + col * (boxWidth + boxSpacing);
        const currentCardY = marginY + row * (boxHeight + boxSpacing);

        pdf.rect(currentCardX, currentCardY, boxWidth, boxHeight);

        if (backgroundImage) {
            try {
                pdf.addImage(backgroundImage, 'JPEG', currentCardX, currentCardY, boxWidth, boxHeight);
            } catch (e) {
                console.error("Error adding background image to PDF:", e);
                // Optionally, draw a placeholder or skip if image is problematic
            }
        }

        // Main number
        pdf.setFontSize(textSize); // textSize is now in points
        // Convert pixel-based textX/textY from preview to mm for PDF
        // Use { baseline: 'top' } to align text from its top edge
        pdf.text(generatedNumbers[i],
                 currentCardX + (textX * pxToMm),
                 currentCardY + (textY * pxToMm),
                 { baseline: 'top', lang: 'ar' }); // Added lang: 'ar' for better Arabic handling if supported by font

        // Serial number
        if (useSerial) {
            pdf.setFontSize(serialSize); // serialSize is in points
            pdf.text((serialStart + i).toString(),
                     currentCardX + (serialX * pxToMm),
                     currentCardY + (serialY * pxToMm),
                     { baseline: 'top', lang: 'ar' });
        }

        // Date
        if (useDate) {
            pdf.setFontSize(dateSize); // dateSize is in points
            pdf.text(today,
                     currentCardX + (dateX * pxToMm),
                     currentCardY + (dateY * pxToMm),
                     { baseline: 'top', lang: 'ar' });
        }
    }

    const beginNumber = document.getElementById('beginNumber').value;
    const profile = document.getElementById('profile').value;
    const filename = `cards_${profile}_${beginNumber}_${generatedNumbers.length}_${today.replace(/-/g, '')}.pdf`;
    pdf.save(filename);
}
