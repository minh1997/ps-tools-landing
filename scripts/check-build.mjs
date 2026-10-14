import { access, readFile, stat } from "node:fs/promises";

const required = [
  "dist/index.html",
  "dist/assets/ps-studio-hero-ui.webp",
  "dist/assets/ps-tools-guide.webp",
  "dist/downloads/PS_V1.0.2.ccx",
  "dist/downloads/Cai-dat-PS-Visual-Tool-Windows.cmd",
  "dist/downloads/PS-Visual-Tool-Windows-v1.0.2.zip",
];

await Promise.all(required.map((file) => access(file)));

const html = await readFile("dist/index.html", "utf8");
const installer = await stat("dist/downloads/PS_V1.0.2.ccx");
const windowsInstaller = await stat("dist/downloads/Cai-dat-PS-Visual-Tool-Windows.cmd");
const windowsInstallerSource = await readFile("dist/downloads/Cai-dat-PS-Visual-Tool-Windows.cmd", "utf8");
const windowsBundle = await stat("dist/downloads/PS-Visual-Tool-Windows-v1.0.2.zip");
const checks = [
  [html.includes("PS Visual Tool"), "Astro generated the landing page"],
  [html.includes("/downloads/PS_V1.0.2.ccx"), "Built page links to the current CCX installer"],
  [html.includes("Photoshop 27.0 trở lên"), "Built guide keeps the Photoshop requirement"],
  [html.includes('id="bang-gia"') && html.includes("1.300K"), "Built page includes the credit pricing section"],
  [html.includes("2.800K") && html.includes("52.000 credit / năm") && html.includes("annual-action"), "Built page includes the annual contact plan"],
  [html.includes('id="credit-email"') && html.includes("credits-2000/orders"), "Built page includes the email checkout flow for every credit package"],
  [installer.size > 0, "CCX installer is included in the Worker assets"],
  [html.includes("Cai-dat-PS-Visual-Tool-Windows.cmd") && windowsInstaller.size > 0, "Windows command-line installer is included in the Worker assets"],
  [html.includes("PS-Visual-Tool-Windows-v1.0.2.zip") && windowsBundle.size > 200_000, "Self-contained Windows ZIP is included in the Worker assets"],
  [html.includes("Tải cho Windows") && html.includes("Tải cho macOS") && html.includes("windows-download") && html.includes("mac-download"), "Built hero provides separate Windows and macOS downloads"],
  [windowsInstallerSource.includes('/remove "%PLUGIN_NAME%"') && windowsInstallerSource.includes('/install "%CCX_FILE%"'), "Built Windows installer replaces an existing plugin before installation"],
];

const failed = checks.filter(([pass]) => !pass);
for (const [pass, message] of checks) console.log(`${pass ? "✓" : "✗"} ${message}`);
if (failed.length) process.exit(1);
