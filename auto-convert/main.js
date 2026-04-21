var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AutoConvertPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_child_process = require("child_process");
var path = __toESM(require("path"));
var import_fs = require("fs");
var DEFAULT_SETTINGS = {
  extensions: [".docx", ".doc", ".rtf", ".odt", ".xlsx", ".xls", ".txt"],
  deleteOriginal: false,
  pandocPath: "",
  convertExisting: false,
  excludeFolders: []
};
var AutoConvertPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.pandocAvailable = false;
    this.processingFiles = /* @__PURE__ */ new Set();
    this._xlsx = null;
  }
  async onload() {
    await this.loadSettings();
    this.checkPandoc();
    this.addSettingTab(new AutoConvertSettingTab(this.app, this));
    this.addRibbonIcon("refresh-cw", "自动转换：批量转换", async () => {
      await this.batchConvert();
    });
    this.addCommand({
      id: "auto-convert-batch",
      name: "批量转换所有未转换的文件",
      callback: async () => {
        await this.batchConvert();
      }
    });
    this.addCommand({
      id: "auto-convert-check-pandoc",
      name: "检查 Pandoc 安装",
      callback: () => {
        this.checkPandoc();
      }
    });
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (file instanceof import_obsidian.TFile) {
          await this.handleNewFile(file);
        }
      })
    );
    console.log("Auto Convert plugin loaded");
  }
  onunload() {
    console.log("Auto Convert plugin unloaded");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.checkPandoc();
  }
  /**
   * Check if pandoc is available on the system
   */
  checkPandoc() {
    const pandocCmd = this.settings.pandocPath || "pandoc";
    (0, import_child_process.execFile)(pandocCmd, ["--version"], (error, stdout) => {
      if (error) {
        this.pandocAvailable = false;
        new import_obsidian.Notice("自动转换：未找到 Pandoc，请在设置中安装或设置 Pandoc 路径。");
        console.warn("Auto Convert: Pandoc not available:", error.message);
      } else {
        this.pandocAvailable = true;
        const version = stdout.split("\n")[0];
        console.log(`Auto Convert: Pandoc available - ${version}`);
        new import_obsidian.Notice(`自动转换：${version} 已检测 \u2713`);
      }
    });
  }
  /**
   * Check if a file path is in an excluded folder
   */
  isExcluded(filePath) {
    for (const folder of this.settings.excludeFolders) {
      if (filePath.startsWith(folder)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Handle a newly created file in the vault
   */
  async handleNewFile(file) {
    const ext = path.extname(file.path).toLowerCase();
    if (!this.settings.extensions.contains(ext))
      return;
    if (![".txt", ".xlsx", ".xls"].includes(ext) && !this.pandocAvailable)
      return;
    if (this.processingFiles.has(file.path))
      return;
    const basename = path.basename(file.path);
    if (basename.startsWith("~$"))
      return;
    if (this.isExcluded(file.path))
      return;
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.convertFile(file);
  }
  /**
   * Convert a single file to markdown
   */
  async convertFile(file) {
    if (this.processingFiles.has(file.path))
      return false;
    this.processingFiles.add(file.path);
    try {
      const mdPath = file.path.replace(/\.[^.]+$/, ".md");
      const existingMd = this.app.vault.getAbstractFileByPath(mdPath);
      if (existingMd instanceof import_obsidian.TFile) {
        new import_obsidian.Notice(`自动转换：${path.basename(mdPath)} 已存在，跳过。`);
        return false;
      }
      const adapter = this.app.vault.adapter;
      const absInputPath = adapter.getFullPath(file.path);
      const absOutputPath = adapter.getFullPath(mdPath);
      const ext = path.extname(file.path).toLowerCase();
      if (ext === ".xlsx" || ext === ".xls") {
        const markdown = await this.excelToMarkdown(file);
        import_fs.writeFileSync(absOutputPath, markdown, "utf-8");
        const mdFile = this.app.vault.getAbstractFileByPath(mdPath);
        if (mdFile instanceof import_obsidian.TFile) {
          await this.app.vault.read(mdFile);
        }
        new import_obsidian.Notice(`自动转换：${path.basename(file.path)} → ${path.basename(mdPath)} 转换成功`);
        console.log(`Auto Convert: Successfully converted ${file.path} → ${mdPath}`);
        return true;
      }
      if (ext === ".txt") {
        const content = await this.app.vault.read(file);
        import_fs.writeFileSync(absOutputPath, content, "utf-8");
        const mdFile = this.app.vault.getAbstractFileByPath(mdPath);
        if (mdFile instanceof import_obsidian.TFile) {
          await this.app.vault.read(mdFile);
        }
        new import_obsidian.Notice(`自动转换：${path.basename(file.path)} → ${path.basename(mdPath)} 转换成功`);
        console.log(`Auto Convert: Successfully converted ${file.path} → ${mdPath}`);
        return true;
      }
      const pandocCmd = this.settings.pandocPath || "pandoc";
      await new Promise((resolve, reject) => {
        (0, import_child_process.execFile)(
          pandocCmd,
          [
            "-f",
            this.getSourceFormat(path.extname(file.path).toLowerCase()),
            "-t",
            "markdown",
            "--wrap=none",
            "-o",
            absOutputPath,
            absInputPath
          ],
          { timeout: 6e4, maxBuffer: 10 * 1024 * 1024 },
          (error, stdout, stderr) => {
            if (error) {
              reject(new Error(`Pandoc error: ${error.message}
${stderr}`));
            } else {
              resolve();
            }
          }
        );
      });
      const mdFile = this.app.vault.getAbstractFileByPath(mdPath);
      if (mdFile instanceof import_obsidian.TFile) {
        await this.app.vault.read(mdFile);
      }
      new import_obsidian.Notice(`自动转换：${path.basename(file.path)} \u2192 ${path.basename(mdPath)} 转换成功`);
      console.log(`Auto Convert: Successfully converted ${file.path} \u2192 ${mdPath}`);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      new import_obsidian.Notice(`自动转换：${path.basename(file.path)} 转换失败 - ${msg}`, 8e3);
      console.error(`Auto Convert: Conversion failed for ${file.path}:`, msg);
      return false;
    } finally {
      this.processingFiles.delete(file.path);
    }
  }
  /**
   * Map file extension to pandoc source format
   */
  getSourceFormat(ext) {
    const formatMap = {
      ".docx": "docx",
      ".doc": "doc",
      ".rtf": "rtf",
      ".odt": "odt",
      ".epub": "epub",
      ".html": "html",
      ".htm": "html",
      ".tex": "latex",
      ".wp": "docx",
      ".wpd": "docx",
      ".xlsx": "xlsx",
      ".xls": "xlsx"
    };
    return formatMap[ext] || "docx";
  }
  getXlsx() {
    if (!this._xlsx) {
      const xlsxPath = this.app.vault.adapter.getFullPath(
        `.obsidian/plugins/${this.manifest.id}/xlsx.full.min.js`
      );
      const code = import_fs.readFileSync(xlsxPath, "utf-8");
      const fn = new Function("exports", "module", "define", code + "\nreturn XLSX;");
      this._xlsx = fn(undefined, undefined, undefined);
    }
    return this._xlsx;
  }
  /**
   * Convert Excel file (.xls/.xlsx) to markdown using SheetJS
   */
  async excelToMarkdown(file) {
    const XLSX = this.getXlsx();
    const data = await this.app.vault.adapter.readBinary(file.path);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetNames = workbook.SheetNames;
    const parts = [];
    for (let i = 0; i < sheetNames.length; i++) {
      const name = sheetNames[i];
      const sheet = workbook.Sheets[name];
      if (!sheet["!ref"]) continue;
      if (sheetNames.length > 1) {
        parts.push(`## ${name}\n`);
      }
      parts.push(this.sheetToMarkdownTable(sheet));
    }
    return parts.join("\n\n") + "\n";
  }
  /**
   * Convert a single worksheet to a markdown pipe table
   */
  sheetToMarkdownTable(sheet) {
    const XLSX = this.getXlsx();
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const merges = sheet["!merges"] || [];
    const mergeMap = {};
    for (const m of merges) {
      const src = XLSX.utils.encode_cell(m.s);
      for (let r = m.s.r; r <= m.e.r; r++) {
        for (let c = m.s.c; c <= m.e.c; c++) {
          mergeMap[XLSX.utils.encode_cell({ r, c })] = src;
        }
      }
    }
    const rows = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        let val = "";
        const cell = sheet[addr];
        if (cell) {
          val = XLSX.utils.format_cell(cell);
        } else if (mergeMap[addr]) {
          const src = sheet[mergeMap[addr]];
          if (src) val = XLSX.utils.format_cell(src);
        }
        row.push(val.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>"));
      }
      rows.push(row);
    }
    if (rows.length === 0) return "";
    const sep = rows[0].map(() => "---");
    const lines = [
      "| " + rows[0].join(" | ") + " |",
      "| " + sep.join(" | ") + " |"
    ];
    for (let i = 1; i < rows.length; i++) {
      lines.push("| " + rows[i].join(" | ") + " |");
    }
    return lines.join("\n");
  }
  /**
   * Batch convert all matching files in vault
   */
  async batchConvert() {
    const files = this.app.vault.getFiles();
    const candidates = files.filter((f) => {
      const ext = path.extname(f.path).toLowerCase();
      if (!this.settings.extensions.contains(ext) || this.isExcluded(f.path))
        return false;
      if (![".txt", ".xlsx", ".xls"].includes(ext) && !this.pandocAvailable)
        return false;
      return true;
    });
    if (candidates.length === 0) {
      new import_obsidian.Notice("自动转换：没有需要转换的文件。");
      return;
    }
    new import_obsidian.Notice(`自动转换：开始批量转换 ${candidates.length} 个文件...`);
    let converted = 0;
    let skipped = 0;
    let failed = 0;
    for (const file of candidates) {
      const mdPath = file.path.replace(/\.[^.]+$/, ".md");
      const existingMd = this.app.vault.getAbstractFileByPath(mdPath);
      if (existingMd instanceof import_obsidian.TFile) {
        skipped++;
        continue;
      }
      const success = await this.convertFile(file);
      if (success) {
        converted++;
      } else {
        failed++;
      }
    }
    new import_obsidian.Notice(
      `自动转换：批量转换完成！成功 ${converted} 个，跳过 ${skipped} 个，失败 ${failed} 个。`,
      6e3
    );
  }
};
var AutoConvertSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "自动转换 设置" });
    new import_obsidian.Setting(containerEl).setName("Pandoc 路径").setDesc("Pandoc 可执行文件路径，留空则使用系统 PATH。").addText((text) => text.setPlaceholder("pandoc").setValue(this.plugin.settings.pandocPath).onChange(async (value) => {
      this.plugin.settings.pandocPath = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("文件扩展名").setDesc("自动转换的文件扩展名列表，逗号分隔（如 .docx, .doc, .rtf, .odt）").addText((text) => text.setPlaceholder(".docx, .doc, .rtf, .odt").setValue(this.plugin.settings.extensions.join(", ")).onChange(async (value) => {
      this.plugin.settings.extensions = value.split(",").map((s) => s.trim().toLowerCase()).filter((s) => s.startsWith("."));
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("删除原文件").setDesc("转换成功后删除原始文件。").addToggle((toggle) => toggle.setValue(this.plugin.settings.deleteOriginal).onChange(async (value) => {
      this.plugin.settings.deleteOriginal = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("排除文件夹").setDesc("排除转换的文件夹路径，逗号分隔（如 attachments, templates）").addText((text) => text.setPlaceholder("attachments, templates").setValue(this.plugin.settings.excludeFolders.join(", ")).onChange(async (value) => {
      this.plugin.settings.excludeFolders = value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("立即批量转换").setDesc("转换仓库中所有未转换的文件。").addButton((btn) => btn.setButtonText("全部转换").setCta().onClick(async () => {
      await this.plugin.batchConvert();
    }));
    new import_obsidian.Setting(containerEl).setName("检查 Pandoc").setDesc("验证 Pandoc 是否已安装且可用。").addButton((btn) => btn.setButtonText("检查").onClick(() => {
      this.plugin.checkPandoc();
    }));
    containerEl.createEl("h3", { text: "安装 Pandoc" });
    containerEl.createEl("p", {
      text: "文件转换需要 Pandoc，请从以下地址下载："
    });
    const link = containerEl.createEl("a", {
      text: "https://pandoc.org/installing.html",
      href: "https://pandoc.org/installing.html"
    });
    link.style.color = "var(--text-accent)";
    containerEl.createEl("p", {
      text: '安装完成后，请重启 Obsidian 或点击上方的"检查"按钮。'
    });
  }
};
