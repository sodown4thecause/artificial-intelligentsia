// MEM-005 — sensitive-content filter used by Mnemosyne before candidate extraction.
import { isSecret } from '../security/secrets';
export class SensitiveContentFilter {
    scan(text) {
        return isSecret(text);
    }
}
//# sourceMappingURL=sensitiveFilter.js.map