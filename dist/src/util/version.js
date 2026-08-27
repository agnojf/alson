"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidVersion = isValidVersion;
exports.parseVersion = parseVersion;
exports.compareVersions = compareVersions;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
function isValidVersion(v) {
    return SEMVER.test(v);
}
function parseVersion(v) {
    return v
        .replace(/^v/, '')
        .split('.')
        .map((n) => parseInt(n, 10));
}
function compareVersions(a, b) {
    const pa = parseVersion(a);
    const pb = parseVersion(b);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const na = pa[i] ?? 0;
        const nb = pb[i] ?? 0;
        if (na !== nb) {
            return na < nb ? -1 : 1;
        }
    }
    return 0;
}
