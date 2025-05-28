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

function updatePreview() {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';

    if (generatedNumbers.length === 0) return;

    const columns = parseInt(document.getElementById('columns').value);
    const rows = parseInt(document.getElementById('rows').value);
    const textSize = document.getElementById('textSize').value;
    const textX = document.getElementById('textPositionX').value;
    const textY = document.getElementById('textPositionY').value;
    const useSerial = document.getElementById('useSerialNumber').checked;
    const serialSize = document.getElementById('serialNumberSize').value;
    const serialX = document.getElementById('serialPositionX').value;
    const serialY = document.getElementById('serialPositionY').value;
    const serialStart = parseInt(document.getElementById('serialStartNumber').value);
    const useDate = document.getElementById('useDatePrinting').checked;
    const dateSize = document.getElementById('dateSize').value;
    const dateX = document.getElementById('datePositionX').value;
    const dateY = document.getElementById('datePositionY').value;
    const boxSpacing = parseFloat(document.getElementById('boxSpacing').value);

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 5;
    const marginY = 5;
    const availableWidth = pageWidth - 2 * marginX;
    const availableHeight = pageHeight - 2 * marginY;

    const boxWidth = (availableWidth - (boxSpacing * (columns - 1))) / columns;
    const boxHeight = (availableHeight - (boxSpacing * (rows - 1))) / rows;

    const scale = Math.min(1, 600 / pageWidth);

    const box = document.createElement('div');
    box.className = 'box';
    box.style.width = `${boxWidth * scale}mm`;
    box.style.height = `${boxHeight * scale}mm`;
    if (backgroundImage) {
        box.style.backgroundImage = `url(${backgroundImage})`;
    }

    const number = document.createElement('div');
    number.textContent = generatedNumbers[0];
    number.style.position = 'absolute';
    number.style.left = `${textX * scale}px`;
    number.style.top = `${textY * scale}px`;
    number.style.fontSize = `${textSize * scale}px`;
    box.appendChild(number);

    if (useSerial) {
        const serial = document.createElement('div');
        serial.textContent = serialStart.toString();
        serial.style.position = 'absolute';
        serial.style.left = `${serialX * scale}px`;
        serial.style.top = `${serialY * scale}px`;
        serial.style.fontSize = `${serialSize * scale}px`;
        box.appendChild(serial);
    }

    if (useDate) {
        const date = document.createElement('div');
        const today = new Date().toISOString().split('T')[0];
        date.textContent = today;
        date.style.position = 'absolute';
        date.style.left = `${dateX * scale}px`;
        date.style.top = `${dateY * scale}px`;
        date.style.fontSize = `${dateSize * scale}px`;
        box.appendChild(date);
    }

    preview.appendChild(box);
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

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const columns = parseInt(document.getElementById('columns').value);
    const rows = parseInt(document.getElementById('rows').value);
    const textSize = parseInt(document.getElementById('textSize').value);
    const textX = parseFloat(document.getElementById('textPositionX').value);
    const textY = parseFloat(document.getElementById('textPositionY').value);
    const useSerial = document.getElementById('useSerialNumber').checked;
    const serialSize = parseInt(document.getElementById('serialNumberSize').value);
    const serialX = parseFloat(document.getElementById('serialPositionX').value);
    const serialY = parseFloat(document.getElementById('serialPositionY').value);
    const serialStart = parseInt(document.getElementById('serialStartNumber').value);
    const useDate = document.getElementById('useDatePrinting').checked;
    const dateSize = parseInt(document.getElementById('dateSize').value);
    const dateX = parseFloat(document.getElementById('datePositionX').value);
    const dateY = parseFloat(document.getElementById('datePositionY').value);
    const boxSpacing = parseFloat(document.getElementById('boxSpacing').value);

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 2;
    const marginY = 2;
    const boxWidth = ((pageWidth - 2 * marginX) - (boxSpacing * (columns - 1))) / columns;
    const boxHeight = ((pageHeight - 2 * marginY) - (boxSpacing * (rows - 1))) / rows;

    const pxToMm = 25.4 / 96;
    const today = new Date().toISOString().split('T')[0];
    let pageIndex = 0;

    for (let i = 0; i < generatedNumbers.length; i++) {
        if (i > 0 && i % (columns * rows) === 0) {
            pdf.addPage();
            pageIndex++;
        }

        const col = i % columns;
        const row = Math.floor((i % (columns * rows)) / columns);
        const x = marginX + col * (boxWidth + boxSpacing);
        const y = marginY + row * (boxHeight + boxSpacing);

        pdf.rect(x, y, boxWidth, boxHeight);

        if (backgroundImage) {
            pdf.addImage(backgroundImage, 'JPEG', x, y, boxWidth, boxHeight);
        }

        pdf.setFontSize(textSize);
        pdf.text(generatedNumbers[i], x + (textX * pxToMm), y + (textY * pxToMm) + (textSize * 0.3));

        if (useSerial) {
            pdf.setFontSize(serialSize);
            pdf.text((serialStart + i).toString(), x + (serialX * pxToMm), y + (serialY * pxToMm) + (serialSize * 0.35));
        }

        if (useDate) {
            pdf.setFontSize(dateSize);
            pdf.text(today, x + (dateX * pxToMm), y + (dateY * pxToMm) + (dateSize * 0.35));
        }
    }

    const beginNumber = document.getElementById('beginNumber').value;
    const profile = document.getElementById('profile').value;
    const filename = `cards_${profile}_${beginNumber}_${generatedNumbers.length}_${today}.pdf`;
    pdf.save(filename);
}
