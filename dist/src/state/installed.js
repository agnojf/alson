"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_STATE = void 0;
exports.readState = readState;
exports.writeState = writeState;
const node_fs_1 = __importDefault(require("node:fs"));
const errors_js_1 = require("../errors.js");
const io_js_1 = require("../util/io.js");
const paths_js_1 = require("../util/paths.js");
exports.EMPTY_STATE = { version: 1, installs: {} };
async function readState() {
    const file = (0, paths_js_1.stateFile)();
    let raw;
    try {
        raw = await node_fs_1.default.promises.readFile(file, 'utf8');
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return structuredClone(exports.EMPTY_STATE);
        }
        throw err;
    }
    try {
        const parsed = JSON.parse(raw);
        if (parsed &&
            typeof parsed === 'object' &&
            parsed.version === 1 &&
            parsed.installs &&
            typeof parsed.installs === 'object') {
            return parsed;
        }
        throw new Error('unexpected state shape');
    }
    catch {
        throw new errors_js_1.AlsonError('StateCorrupt', `installed state is corrupt at ${file}. Fix or remove it, then retry`);
    }
}
async function writeState(state) {
    await (0, io_js_1.atomicWriteFile)((0, paths_js_1.stateFile)(), JSON.stringify(state, null, 2) + '\n');
}
