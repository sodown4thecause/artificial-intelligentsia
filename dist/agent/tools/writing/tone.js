const MARKERS = {
    confidence: { pos: [/\b(certainly|definitely|i am sure|without doubt)\b/gi], neg: [/\b(maybe|perhaps|i think|possibly|not sure)\b/gi] },
    formality: { pos: [/\b(therefore|accordingly|kindly|regarding|pursuant)\b/gi], neg: [/\b(gonna|wanna|yeah|cool|stuff)\b/gi] },
    warmth: { pos: [/\b(hope you|glad|thank you|appreciate|warm)\b/gi], neg: [/\b(must|demand|immediately|failure)\b/gi] },
    directness: { pos: [/\b(please send|we need|do this|action)\b/gi], neg: [/\b(if you have time|maybe consider|perhaps you could)\b/gi] },
    urgency: { pos: [/\b(urgent|asap|by end of day|deadline|immediately)\b/gi], neg: [/\b(whenever|no rush|eventually|sometime)\b/gi] },
    ambiguity: { pos: [/\b(something|things|etc|and so on|whatever)\b/gi], neg: [/\b(specifically|exactly|the following three|on monday at 10)\b/gi] },
};
export function detectTone(text) {
    const estimate = {};
    for (const dim of Object.keys(MARKERS)) {
        const { pos, neg } = MARKERS[dim];
        let score = 0.5;
        for (const re of pos)
            if (re.test(text))
                score += 0.15;
        for (const re of neg)
            if (re.test(text))
                score -= 0.15;
        estimate[dim] = Math.min(1, Math.max(0, Math.round(score * 100) / 100));
    }
    return { estimate, disclaimer: 'Tone results are estimates, not objective judgments.' };
}
//# sourceMappingURL=tone.js.map