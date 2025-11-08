"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtManager = void 0;
/**
 * Technical debt management
 */
var path = require("path");
var fileUtils_js_1 = require("../utils/fileUtils.js");
var DebtManager = /** @class */ (function () {
    function DebtManager(projectPath) {
        this.registerPath = path.join(projectPath, '.technical-debt', 'debt-register.json');
    }
    DebtManager.prototype.addDebt = function (debt) {
        return __awaiter(this, void 0, void 0, function () {
            var register, id, now, newItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadRegister()];
                    case 1:
                        register = _a.sent();
                        id = "debt-".concat(Date.now());
                        now = new Date().toISOString();
                        newItem = {
                            id: id,
                            title: debt.title || 'Untitled',
                            description: debt.description || '',
                            location: debt.location || '',
                            type: debt.type || 'code-quality',
                            severity: debt.severity || 'medium',
                            status: debt.status || 'open',
                            estimatedEffort: debt.estimatedEffort || 'Unknown',
                            impact: debt.impact || '',
                            createdAt: now,
                            lastUpdated: now,
                            notes: debt.notes || [],
                        };
                        register.items.push(newItem);
                        register.lastUpdated = now;
                        return [4 /*yield*/, this.saveRegister(register)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, id];
                }
            });
        });
    };
    DebtManager.prototype.listDebt = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var register, items;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadRegister()];
                    case 1:
                        register = _a.sent();
                        items = register.items;
                        if (filters === null || filters === void 0 ? void 0 : filters.type) {
                            items = items.filter(function (item) { return item.type === filters.type; });
                        }
                        if (filters === null || filters === void 0 ? void 0 : filters.severity) {
                            items = items.filter(function (item) { return item.severity === filters.severity; });
                        }
                        if (filters === null || filters === void 0 ? void 0 : filters.status) {
                            items = items.filter(function (item) { return item.status === filters.status; });
                        }
                        return [2 /*return*/, items];
                }
            });
        });
    };
    DebtManager.prototype.updateDebt = function (debtId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var register, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadRegister()];
                    case 1:
                        register = _a.sent();
                        item = register.items.find(function (i) { return i.id === debtId; });
                        if (!item) {
                            throw new Error("Debt item ".concat(debtId, " not found"));
                        }
                        Object.assign(item, updates, { lastUpdated: new Date().toISOString() });
                        register.lastUpdated = new Date().toISOString();
                        return [4 /*yield*/, this.saveRegister(register)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DebtManager.prototype.resolveDebt = function (debtId, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var register, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadRegister()];
                    case 1:
                        register = _a.sent();
                        item = register.items.find(function (i) { return i.id === debtId; });
                        if (!item) {
                            throw new Error("Debt item ".concat(debtId, " not found"));
                        }
                        item.status = 'resolved';
                        item.resolvedAt = new Date().toISOString();
                        item.lastUpdated = new Date().toISOString();
                        if (notes) {
                            item.notes.push(notes);
                        }
                        register.lastUpdated = new Date().toISOString();
                        return [4 /*yield*/, this.saveRegister(register)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DebtManager.prototype.generateReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var register, items, byType, bySeverity, openItems, resolvedItems;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadRegister()];
                    case 1:
                        register = _a.sent();
                        items = register.items;
                        byType = items.reduce(function (acc, item) {
                            acc[item.type] = (acc[item.type] || 0) + 1;
                            return acc;
                        }, {});
                        bySeverity = items.reduce(function (acc, item) {
                            acc[item.severity] = (acc[item.severity] || 0) + 1;
                            return acc;
                        }, {});
                        openItems = items.filter(function (i) { return i.status === 'open' || i.status === 'in-progress'; });
                        resolvedItems = items.filter(function (i) { return i.status === 'resolved'; });
                        return [2 /*return*/, {
                                totalDebt: items.length,
                                byType: byType,
                                bySeverity: bySeverity,
                                openDebt: openItems.length,
                                resolvedDebt: resolvedItems.length,
                                oldestDebt: items.length > 0 ? items[0].createdAt : null,
                            }];
                }
            });
        });
    };
    DebtManager.prototype.loadRegister = function () {
        return __awaiter(this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fileUtils_js_1.fileExists)(this.registerPath)];
                    case 1:
                        if (!(_a.sent())) {
                            return [2 /*return*/, {
                                    version: '1.0',
                                    projectPath: path.dirname(path.dirname(this.registerPath)),
                                    lastUpdated: new Date().toISOString(),
                                    items: [],
                                }];
                        }
                        return [4 /*yield*/, (0, fileUtils_js_1.readFile)(this.registerPath)];
                    case 2:
                        content = _a.sent();
                        return [2 /*return*/, JSON.parse(content)];
                }
            });
        });
    };
    DebtManager.prototype.saveRegister = function (register) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fileUtils_js_1.writeFile)(this.registerPath, JSON.stringify(register, null, 2))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DebtManager;
}());
exports.DebtManager = DebtManager;
