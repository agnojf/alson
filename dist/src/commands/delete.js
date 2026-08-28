"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDelete = runDelete;
const install_js_1 = require("../installer/install.js");
async function runDelete(args) {
    const dir = await (0, install_js_1.deleteSkill)(args.skill, { force: args.force });
    console.log(`removed ${dir}`);
}
