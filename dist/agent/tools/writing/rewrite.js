const PROTECTED = [
    /\b\d+(?:\.\d+)?(?:%|kg|lb|km|mi|usd|eur|gb|mb)?\b/g, // numbers+units
    /\[[^\]]*\]\([^)]*\)/g, // markdown links
    /https?:\/\/\S+/g, // urls
    /\([A-Z]{2,6}\s\d{4}\)/g, // citation refs like (APA 2020)
    /[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g, // proper nouns
];
export function extractProtected(text) {
    const found = [];
    for (const re of PROTECTED) {
        let m;
        while ((m = re.exec(text)))
            found.push(m[0]);
    }
    return found;
}
export function rewrite(text, mode, instruction) {
    const protectedTokens = extractProtected(text);
    let result = text;
    switch (mode) {
        case 'concision':
            result = text.replace(/\b(in order to)\b/gi, 'to').replace(/\b(due to the fact that)\b/gi, 'because').replace(/\s{2,}/g, ' ');
            break;
        case 'professional':
            result = text.replace(/\bstuff\b/gi, 'materials').replace(/\bget\b/gi, 'obtain').replace(/\bcool\b/gi, 'acceptable');
            break;
        case 'friendly':
            result = text.replace(/\byou must\b/gi, "you're welcome to").replace(/\bdo this\b/gi, "let's take care of this");
            break;
        case 'simplification':
            result = text.replace(/\b(utilize|utilise)\b/gi, 'use').replace(/\b(commence)\b/gi, 'start');
            break;
        case 'clarity':
        case 'fluency':
        case 'expansion':
        case 'persuasive':
        case 'user-instruction':
            // Foundation: light normalization; user-instruction would route to model in full impl.
            result = text.replace(/\s{2,}/g, ' ');
            if (instruction)
                result = `[${mode}: ${instruction}] ${result}`;
            break;
    }
    const protectedPreserved = protectedTokens.every((t) => result.includes(t));
    return { result, protectedPreserved };
}
//# sourceMappingURL=rewrite.js.map