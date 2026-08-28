"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlsonError = void 0;
class AlsonError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'AlsonError';
    }
}
exports.AlsonError = AlsonError;
