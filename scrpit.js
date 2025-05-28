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

// script.js (or within your <script> tag)

// ... (keep existing variables like generatedNumbers, backgroundImage)
// ... (keep existing DOMContentLoaded listener and other functions like generateNumbers, saveAsExcel, etc.)

function updatePreview() {
    const preview = document.getElementById('preview');
    preview.innerHTML = ''; // Clear previous preview

    // Use sample data if no numbers are generated yet, to ensure preview box is drawn
    const sampleNumberForPreview = (generatedNumbers.length > 0) ? generatedNumbers[0] : "1234567";
    const sampleSerialForPreview = document.getElementById('serialStartNumber').value || "1";

    const textSize = document.getElementById('textSize').value;
    const textX = document.getElementById('textPositionX').value;
    const textY = document.getElementById('textPositionY').value;
    const useSerial = document.getElementById('useSerialNumber').checked;
    const serialSize = document.getElementById('serialNumberSize').value;
    const serialX = document.getElementById('serialPositionX').value;
    const serialY = document.getElementById('serialPositionY').value;
    const useDate = document.getElementById('useDatePrinting').checked;
    const dateSize = document.getElementById('dateSize').value;
    const dateX = document.getElementById('datePositionX').value;
    const dateY = document.getElementById('datePositionY').value;

    // Calculate PDF card dimensions (in mm) to set preview box size
    const pdfColumns = parseInt(document.getElementById('columns').value) || 1;
    const pdfRows = parseInt(document.getElementById('rows').value) || 1;
    const pdfBoxSpacing = parseFloat(document.getElementById('boxSpacing').value) || 0;
    const pdfMarginX = 2; // As used in generatePDF
    const pdfMarginY = 2; // As used in generatePDF
    const pdfPageWidth = 210;
    const pdfPageHeight = 297;

    const boxWidthMm = ((pdfPageWidth - 2 * pdfMarginX) - (pdfBoxSpacing * (pdfColumns - 1))) / pdfColumns;
    const boxHeightMm = ((pdfPageHeight - 2 * pdfMarginY) - (pdfBoxSpacing * (pdfRows - 1))) / pdfRows;

    const box = document.createElement('div');
    box.className = 'box'; // This is the element whose offsetWidth/Height will be measured
    box.style.width = `${boxWidthMm}mm`;
    box.style.height = `${boxHeightMm}mm`;
    // Ensure the box is part of the layout flow for offsetWidth/Height to be accurate
    // It's already part of the flex container 'preview' which should be sufficient.

    if (backgroundImage) {
        box.style.backgroundImage = `url(${backgroundImage})`;
    }

    const number = document.createElement('div');
    number.textContent = sampleNumberForPreview;
    number.style.position = 'absolute';
    number.style.left = `${textX}px`;
    number.style.top = `${textY}px`;
    number.style.fontSize = `${textSize}pt`;
    number.style.color = 'red'; // Make preview text distinct if needed for debugging
    box.appendChild(number);

    if (useSerial) {
        const serial = document.createElement('div');
        serial.textContent = sampleSerialForPreview;
        serial.style.position = 'absolute';
        serial.style.left = `${serialX}px`;
        serial.style.top = `${serialY}px`;
        serial.style.fontSize = `${serialSize}pt`;
        serial.style.color = 'red';
        box.appendChild(serial);
    }

    if (useDate) {
        const date = document.createElement('div');
        const today = new Date().toISOString().split('T')[0];
        date.textContent = today;
        date.style.position = 'absolute';
        date.style.left = `${dateX}px`;
        date.style.top = `${dateY}px`;
        date.style.fontSize = `${dateSize}pt`;
        date.style.color = 'red';
        box.appendChild(date);
    }

    preview.appendChild(box);
}


function generatePDF() {
    if (generatedNumbers.length === 0) {
        alert("لا توجد أرقام مولدة لإنشاء PDF!");
        return;
    }

    const previewBoxElement = document.getElementById('preview').querySelector('.box');
    if (!previewBoxElement) {
        alert("عنصر صندوق المعاينة غير موجود. يرجى التأكد من أن المعاينة مرئية.");
        // Fallback or default if preview isn't available (less accurate)
        // This part is tricky, ideally preview should always be there.
        // For now, we'll proceed but positions might be off if this happens.
        // Consider adding default previewRenderedPxWidth/Height or a more robust fallback.
        console.warn("Preview box element not found for PDF generation measurements.");
        // return; // Or use a less accurate fallback
    }

    // Get the actual rendered pixel dimensions of the preview card
    // These dimensions are what the user sees and bases their pixel inputs on.
    const previewRenderedPxWidth = previewBoxElement ? previewBoxElement.offsetWidth : 100; // Fallback width
    const previewRenderedPxHeight = previewBoxElement ? previewBoxElement.offsetHeight : 50;  // Fallback height

    if (previewRenderedPxWidth === 0 || previewRenderedPxHeight === 0) {
        alert("صندوق المعاينة ليس له أبعاد (قد يكون مخفيًا). قد تكون المواضع في PDF غير صحيحة.");
        // Still proceed, but warn user
    }


    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const columns = parseInt(document.getElementById('columns').value);
    const rows = parseInt(document.getElementById('rows').value);
    const textSize = parseInt(document.getElementById('textSize').value);
    // User inputs for textX, textY etc. are in pixels relative to the preview box
    const textX_px = parseFloat(document.getElementById('textPositionX').value);
    const textY_px = parseFloat(document.getElementById('textPositionY').value);
    const useSerial = document.getElementById('useSerialNumber').checked;
    const serialSize = parseInt(document.getElementById('serialNumberSize').value);
    const serialX_px = parseFloat(document.getElementById('serialPositionX').value);
    const serialY_px = parseFloat(document.getElementById('serialPositionY').value);
    const serialStart = parseInt(document.getElementById('serialStartNumber').value);
    const useDate = document.getElementById('useDatePrinting').checked;
    const dateSize = parseInt(document.getElementById('dateSize').value);
    const dateX_px = parseFloat(document.getElementById('datePositionX').value);
    const dateY_px = parseFloat(document.getElementById('datePositionY').value);
    const boxSpacing = parseFloat(document.getElementById('boxSpacing').value);

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 2;
    const marginY = 2;
    // These are the target dimensions of one card in the PDF, in mm
    const pdfCardWidth_mm = ((pageWidth - 2 * marginX) - (boxSpacing * (columns - 1))) / columns;
    const pdfCardHeight_mm = ((pageHeight - 2 * marginY) - (boxSpacing * (rows - 1))) / rows;

    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < generatedNumbers.length; i++) {
        if (i > 0 && i % (columns * rows) === 0) {
            pdf.addPage();
        }

        const col = i % columns;
        const row = Math.floor((i % (columns * rows)) / columns);

        const currentCardOriginX_mm = marginX + col * (pdfCardWidth_mm + boxSpacing);
        const currentCardOriginY_mm = marginY + row * (pdfCardHeight_mm + boxSpacing);

        pdf.rect(currentCardOriginX_mm, currentCardOriginY_mm, pdfCardWidth_mm, pdfCardHeight_mm);

        if (backgroundImage) {
            try {
                pdf.addImage(backgroundImage, 'JPEG', currentCardOriginX_mm, currentCardOriginY_mm, pdfCardWidth_mm, pdfCardHeight_mm);
            } catch (e) {
                console.error("Error adding background image to PDF:", e);
            }
        }

        // --- Calculate proportional offsets for PDF ---
        // The user's textX_px is an offset within a box of previewRenderedPxWidth.
        // We want the same proportional offset within a PDF box of pdfCardWidth_mm.
        const scaleX = (previewRenderedPxWidth > 0) ? (pdfCardWidth_mm / previewRenderedPxWidth) : 0;
        const scaleY = (previewRenderedPxHeight > 0) ? (pdfCardHeight_mm / previewRenderedPxHeight) : 0;

        // Main number
        pdf.setFontSize(textSize); // textSize is in points
        pdf.text(generatedNumbers[i],
                 currentCardOriginX_mm + (textX_px * scaleX),
                 currentCardOriginY_mm + (textY_px * scaleY),
                 { baseline: 'top', lang: 'ar', align: 'right' }); // Test with align: 'right' if numbers still shift left

        // Serial number
        if (useSerial) {
            pdf.setFontSize(serialSize); // serialSize is in points
            pdf.text((serialStart + i).toString(),
                     currentCardOriginX_mm + (serialX_px * scaleX),
                     currentCardOriginY_mm + (serialY_px * scaleY),
                     { baseline: 'top', lang: 'ar', align: 'right' });
        }

        // Date
        if (useDate) {
            pdf.setFontSize(dateSize); // dateSize is in points
            pdf.text(today,
                     currentCardOriginX_mm + (dateX_px * scaleX),
                     currentCardOriginY_mm + (dateY_px * scaleY),
                     { baseline: 'top', lang: 'ar', align: 'right' });
        }
    }

    const beginNumber = document.getElementById('beginNumber').value;
    const profile = document.getElementById('profile').value;
    const filename = `cards_${profile}_${beginNumber}_${generatedNumbers.length}_${today.replace(/-/g, '')}.pdf`;
    pdf.save(filename);
}
