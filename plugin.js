"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var util = __importStar(require("util"));
var http = __importStar(require("http"));
var https = __importStar(require("https"));
var asyncUnlink = util.promisify(fs.unlink);
var asyncRmdir = util.promisify(fs.rmdir);
var ModuleFederationTypesPlugin = /** @class */ (function () {
    function ModuleFederationTypesPlugin(options) {
        if (!(options === null || options === void 0 ? void 0 : options.name)) {
            throw new Error('Please set your app name of ModuleFederationPlugin in name option');
        }
        this.name = options.name;
        this.typeOut = options.typeOut ? "".concat(options.typeOut, "/").concat(options.name, ".d.ts") : "./types/".concat(options.name, ".d.ts");
        this.exposes = options.exposes || undefined;
        this.remotes = options.remotes || undefined;
        this.remoteTypesDir = options.remoteTypesDir || path.resolve(__dirname, '..', '..', 'src', 'microfrontends', 'types');
        this.clearOnStart = options.clearOnStart || undefined;
        this.clearOnEnd = options.clearOnEnd || undefined;
    }
    ModuleFederationTypesPlugin.prototype.apply = function (compiler) {
        var _this = this;
        var webpack = compiler.webpack;
        var Compilation = webpack.Compilation;
        var RawSource = webpack.sources.RawSource;
        /* Generate Exposes */
        if (this.exposes) {
            compiler.hooks.thisCompilation.tap('ModuleFederationTypesPlugin', function (compilation) {
                compilation.hooks.processAssets.tap({
                    name: 'ModuleFederationTypesPlugin',
                    stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
                }, function (assets) {
                    //collect all generated declaration files
                    //and remove them from the assets that will be emitted
                    var declarationFiles = {};
                    for (var filename in assets) {
                        if (~filename.indexOf('.d.ts') && _this.isExpose(filename)) {
                            // @ts-ignore
                            declarationFiles[filename] = assets[filename];
                            compilation.deleteAsset(filename);
                        }
                    }
                    //combine them into one declaration file
                    var combinedDeclaration = _this.generateCombinedDeclaration(declarationFiles);
                    //and insert that back into the assets
                    compilation.emitAsset(_this.typeOut, new RawSource(combinedDeclaration));
                });
            });
        }
        /* Get Remotes */
        if (this.remotes) {
            var remotesUrl = Object.values(this.remotes).filter(function (remoteUrl) {
                var hostRgx = new RegExp("^".concat(_this.name, "@"));
                var isHostUrl = hostRgx.test(remoteUrl);
                return !isHostUrl;
            });
            console.log('REMOTES -->', remotesUrl);
            var typesRemotes_1 = [];
            remotesUrl.forEach(function (remote) {
                var typeRemote = remote.replace(/^(.+)@(https?)(.+\/)[^/].+$/, '$2$3types/$1.d.ts');
                typesRemotes_1.push(typeRemote);
            });
            console.log('TYPES REMOTES -->', typesRemotes_1);
            this.downloadDTsFiles(typesRemotes_1);
        }
        if (this.clearOnStart) {
            compiler.hooks.beforeRun.tapPromise('ModuleFederationTypesPlugin', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.deleteFileOrDirectory(this.clearOnStart)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        }
        if (this.clearOnEnd) {
            compiler.hooks.afterEmit.tapPromise('ModuleFederationTypesPlugin', function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.deleteFileOrDirectory(this.clearOnEnd)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        }
    };
    ModuleFederationTypesPlugin.prototype.isExpose = function (filename) {
        var isRequired = Object.keys(this.exposes).some(function (path) {
            var expose = path.replace(/.\/(.+)$/, '$1');
            var regxp = new RegExp(expose);
            var isRequired = regxp.test(filename);
            if (isRequired) {
                console.log({ EXPOSES_TYPE: '--> ' + filename });
            }
            return isRequired;
        });
        return isRequired;
    };
    ModuleFederationTypesPlugin.prototype.deleteFileOrDirectory = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var stats, files, err_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, fs.promises.lstat(filePath)];
                    case 1:
                        stats = _a.sent();
                        if (!stats.isDirectory()) return [3 /*break*/, 5];
                        return [4 /*yield*/, fs.promises.readdir(filePath)];
                    case 2:
                        files = _a.sent();
                        return [4 /*yield*/, Promise.all(files.map(function (file) { return _this.deleteFileOrDirectory(path.join(filePath, file)); }))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, asyncRmdir(filePath)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, asyncUnlink(filePath)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        err_1 = _a.sent();
                        console.error("Error deleting ".concat(filePath, ": ").concat(err_1));
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    ModuleFederationTypesPlugin.prototype.downloadDTsFiles = function (urls) {
        var _this = this;
        if (!fs.existsSync(this.remoteTypesDir)) {
            fs.mkdirSync(this.remoteTypesDir, { recursive: true });
        }
        // Delete created file
        function deleteCreatedFile(file) {
            fs.unlink(file.path, function (err) {
                if (err) {
                    console.error('Error deleting file:', err);
                }
                else {
                    console.log('File deleted:', file.path);
                }
            });
        }
        urls.forEach(function (url) {
            var protocol = url.startsWith('https') ? https : http;
            var fileName = path.basename(url);
            var filePath = path.join(_this.remoteTypesDir, fileName);
            var file = fs.createWriteStream(filePath);
            var request = protocol.get(url, function (response) {
                if (response.statusCode === 200) {
                    console.log("\u0424\u0430\u0439\u043B ".concat(fileName, " \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D"));
                    response.pipe(file);
                    file.on('finish', function () {
                        file.close();
                        console.log("Download Completed -> ".concat(fileName));
                    });
                }
                else {
                    deleteCreatedFile(file);
                }
            });
            request.on('error', function (error) {
                console.error("Error when download ".concat(fileName, ":"), error);
                deleteCreatedFile(file);
            });
        });
    };
    ModuleFederationTypesPlugin.prototype.generateCombinedDeclaration = function (declarationFiles) {
        var declarations = '/* exposes app modules types */\n\n';
        for (var fileName in declarationFiles) {
            // @ts-ignore
            var declarationFile = declarationFiles[fileName];
            // The lines of the files now come as a Function inside declaration file.
            var data = declarationFile.source();
            var lines = data.split("\n");
            var i = lines.length;
            while (i--) {
                var line = lines[i];
                //exclude empty lines
                var excludeLine = line == "";
                //exclude export statements
                excludeLine = excludeLine || !!~line.indexOf("export =");
                //exclude import statements
                excludeLine = excludeLine || (/import ([a-z0-9A-Z_-]+) = require\(/).test(line);
                if (excludeLine) {
                    lines.splice(i, 1);
                }
                else {
                    if (~line.indexOf("declare ")) {
                        lines[i] = line.replace("declare ", "");
                    }
                    //add tab
                    lines[i] = "\t" + lines[i];
                }
            }
            var name_1 = fileName.replace(/.+\/(.+).d.ts$/, '$1');
            declarations += "declare module \"".concat(this.name, "/").concat(name_1, "\" {\n").concat(lines.join("\n"), "\n}\n\n");
        }
        return declarations;
    };
    return ModuleFederationTypesPlugin;
}());
module.exports = ModuleFederationTypesPlugin;
