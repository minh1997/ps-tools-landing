import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { deflateRawSync } from "node:zlib";

const files = [
  "public/downloads/Cai-dat-PS-Visual-Tool-Windows.cmd",
  "public/downloads/PS_V1.0.2.ccx",
];
const output = "public/downloads/PS-Visual-Tool-Windows-v1.0.2.zip";

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const safeDate = date.getFullYear() < 1980 ? new Date(1980, 0, 1) : date;
  const time = (safeDate.getHours() << 11) | (safeDate.getMinutes() << 5) | Math.floor(safeDate.getSeconds() / 2);
  const day = (safeDate.getFullYear() - 1980) << 9 | (safeDate.getMonth() + 1) << 5 | safeDate.getDate();
  return { time, day };
}

function localHeader(entry) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(entry.time, 10);
  header.writeUInt16LE(entry.day, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.compressed.length, 18);
  header.writeUInt32LE(entry.data.length, 22);
  header.writeUInt16LE(entry.name.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function centralHeader(entry, offset) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(8, 10);
  header.writeUInt16LE(entry.time, 12);
  header.writeUInt16LE(entry.day, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.compressed.length, 20);
  header.writeUInt32LE(entry.data.length, 24);
  header.writeUInt16LE(entry.name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return header;
}

function endOfCentralDirectory(entries, centralSize, centralOffset) {
  const footer = Buffer.alloc(22);
  footer.writeUInt32LE(0x06054b50, 0);
  footer.writeUInt16LE(0, 4);
  footer.writeUInt16LE(0, 6);
  footer.writeUInt16LE(entries, 8);
  footer.writeUInt16LE(entries, 10);
  footer.writeUInt32LE(centralSize, 12);
  footer.writeUInt32LE(centralOffset, 16);
  footer.writeUInt16LE(0, 20);
  return footer;
}

const entries = await Promise.all(files.map(async (file) => {
  const absolutePath = resolve(file);
  const [data, metadata] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
  if (!data.length) throw new Error(`File rỗng: ${file}`);
  const name = Buffer.from(basename(file), "utf8");
  const { time, day } = dosDateTime(metadata.mtime);
  return { data, name, time, day, crc: crc32(data), compressed: deflateRawSync(data, { level: 9 }) };
}));

const localParts = [];
const centralParts = [];
let offset = 0;

for (const entry of entries) {
  const header = localHeader(entry);
  localParts.push(header, entry.name, entry.compressed);
  centralParts.push(centralHeader(entry, offset), entry.name);
  offset += header.length + entry.name.length + entry.compressed.length;
}

const centralDirectory = Buffer.concat(centralParts);
const archive = Buffer.concat([
  ...localParts,
  centralDirectory,
  endOfCentralDirectory(entries.length, centralDirectory.length, offset),
]);

await writeFile(resolve(output), archive);
console.log(`✓ Đã đóng gói ${entries.length} file vào ${output} (${archive.length.toLocaleString("vi-VN")} bytes)`);
