"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readResource = readResource;
const node_fs_1 = __importDefault(require("node:fs"));
const node_url_1 = require("node:url");
const REQUEST_TIMEOUT_MS = 15_000;
async function readResource(urlString) {
    let url;
    try {
        url = new URL(urlString);
    }
    catch {
        throw new Error(`invalid URL: ${urlString}`);
    }
    if (url.protocol === 'file:') {
        return node_fs_1.default.promises.readFile((0, node_url_1.fileURLToPath)(url));
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error(`unsupported URL protocol: ${url.protocol}`);
    }
    const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) {
        throw new Error(`request returned HTTP ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
}
