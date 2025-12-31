"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToLocal = convertToLocal;
exports.convertToUTC = convertToUTC;
const env_1 = require("@cold-monitor/env");
const dayjs_1 = __importDefault(require("dayjs"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const TIMEZONE = env_1.env.TIMEZONE;
/**
 * Converte uma data do banco (UTC) para o fuso UTC-3 (visualmente)
 */
function convertToLocal(date) {
    return dayjs_1.default.utc(date).tz(TIMEZONE);
}
/**
 * Converte uma data no fuso UTC-3 para UTC (para salvar no banco)
 */
function convertToUTC(date) {
    return dayjs_1.default.tz(date, TIMEZONE).utc().toDate();
}
