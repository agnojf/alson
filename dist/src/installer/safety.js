"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetDir = targetDir;
exports.targetExists = targetExists;
exports.verifyUnmodified = verifyUnmodified;
exports.readCliVersion = readCliVersion;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
const hash_js_1 = require("../util/hash.js");
const io_js_1 = require("../util/io.js");
const paths_js_1 = require("../util/paths.js");
function targetDir(name) {
    return node_path_1.default.join((0, paths_js_1.skillsDir)(), name);
}
function targetExists(name) {
    return (0, io_js_1.dirExists)(targetDir(name));
}
async function verifyUnmodified(name, record, action) {
    const dir = targetDir(name);
    if (!(0, io_js_1.dirExists)(dir)) {
        return;
    }
    const hash = await (0, hash_js_1.packageHash)(dir);
    if (hash !== record.hash) {
        const verb = action === 'delete' ? 'delete' : 'update';
        throw new errors_js_1.AlsonError('ModifiedInstall', `${name} was modified locally. Use --force to ${verb} it`);
    }
}
async function readCliVersion() {
    const root = (0, paths_js_1.findPackageRoot)(__dirname);
    const pkg = JSON.parse(await node_fs_1.default.promises.readFile(node_path_1.default.join(root, 'package.json'), 'utf8'));
    return pkg.version ?? '0.0.0';
}
