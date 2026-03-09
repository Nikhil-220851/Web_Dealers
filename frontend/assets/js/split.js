const fs = require('fs');

const html = fs.readFileSync('loanpro-dashboard.html', 'utf8');
const lines = html.split('\n');

function extract(startLineNum, endLineNum) {
    if (endLineNum === undefined) {
        // Find next section
        let next = lines.findIndex((l, i) => i > startLineNum && l.includes('/* ════'));
        if (next === -1) next = lines.length;
        endLineNum = next - 2;
    }
    return lines.slice(startLineNum - 1, endLineNum).join('\n');
}

// Map sections (1-indexed input line numbers)
const cssBlocks = {
    base: [
        [16, 575], // Tokens to Cards
        [823, 970], // Toggle Card to Badge
        [1673, 2175] // Modal to Animations
    ],
    dashboard: [
        [576, 822], // Stat Cards to Dashboard
        [971, 1014] // Rec cards
    ],
    apply_loan: [
        [1015, 1291]
    ],
    my_loans: [
        [1292, 1399]
    ],
    payment_history: [
        [1400, 1411]
    ],
    emi_calculator: [
        [1412, 1520]
    ],
    profile: [
        [1521, 1672]
    ]
};

const jsBlocks = {
    base: [
        [3293, 3356], // Data, Nav, Interval Pills
        [3731, 3893], // KYC Data Store
        [3906, 3928], // Modal helpers
        [3979, 4103] // Animations
    ],
    dashboard: [
        [3929, 3978] // Init dash chart, txn class
    ],
    apply_loan: [
        [3357, 3644] // Flow, apply modal
    ],
    my_loans: [
        [3645, 3682] // My loans table
    ],
    emi_calculator: [
        [3683, 3730] // EMI calc
    ],
    profile: [
        [3894, 3905] // Lang select, etc.
    ],
    payment_history: []
};

// CSS Write
for (const [mod, ranges] of Object.entries(cssBlocks)) {
    const filename = mod.replace('_', '-') + '.css';
    const content = ranges.map(range => extract(range[0], range[1])).join('\n\n');
    if (content.trim()) {
        fs.writeFileSync(filename, content);
        console.log(`Wrote ${filename}`);
    }
}

// JS Write
for (const [mod, ranges] of Object.entries(jsBlocks)) {
    const filename = mod.replace('_', '-') + '.js';
    const content = ranges.map(range => extract(range[0], range[1])).join('\n\n');
    if (content.trim()) {
        fs.writeFileSync(filename, content);
        console.log(`Wrote ${filename}`);
    }
}
