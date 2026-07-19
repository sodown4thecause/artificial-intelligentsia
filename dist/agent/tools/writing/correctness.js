const COMMON_TYPO = {
    recieve: 'receive',
    seperate: 'separate',
    occurence: 'occurrence',
    definately: 'definitely',
    ther: 'there',
    adress: 'address',
    wierd: 'weird',
    accomodate: 'accommodate',
    alot: 'a lot',
    calender: 'calendar',
};
const DOUBLE_SPACE = /\s{2,}/g;
const TRAILING_SPACE = /[ ]+$/gm;
const SENTENCE_START = /(^|[.!?]\s+)([a-z])/g;
export function checkCorrectness(text) {
    const out = [];
    for (const [bad, good] of Object.entries(COMMON_TYPO)) {
        const re = new RegExp(`\\b${bad}\\b`, 'gi');
        let m;
        while ((m = re.exec(text))) {
            out.push({ start: m.index, end: m.index + m[0].length, message: `Possible misspelling: "${m[0]}"`, severity: 'warning', replacement: good });
        }
    }
    let ds;
    while ((ds = DOUBLE_SPACE.exec(text))) {
        out.push({ start: ds.index, end: ds.index + ds[0].length, message: 'Multiple spaces', severity: 'info', replacement: ' ' });
    }
    let ts;
    while ((ts = TRAILING_SPACE.exec(text))) {
        out.push({ start: ts.index, end: ts.index + ts[0].length, message: 'Trailing space', severity: 'info', replacement: '' });
    }
    let ss;
    while ((ss = SENTENCE_START.exec(text))) {
        const lower = ss[2];
        if (lower && /^[a-z]/.test(lower)) {
            const idx = ss.index + ss[1].length;
            out.push({ start: idx, end: idx + 1, message: 'Sentence should start with a capital letter', severity: 'warning', replacement: lower.toUpperCase() });
        }
    }
    return out.sort((a, b) => a.start - b.start);
}
//# sourceMappingURL=correctness.js.map