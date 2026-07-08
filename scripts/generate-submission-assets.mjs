import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");

const W = 1284;
const H = 2778;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const result = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

function frame(content, bg = "#f4efe8") {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#dfcfba"/>
      </linearGradient>
      <pattern id="rule" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M0 31H32" stroke="#b89d81" stroke-opacity=".18" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#rule)"/>
    ${content}
  </svg>`;
}

function header(title, subtitle) {
  const lines = wrap(subtitle, 34);
  return `
    <text x="72" y="110" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#8f5b2a">BASE TRADE TICKET</text>
    <text x="72" y="232" font-family="Arial, sans-serif" font-size="92" font-weight="900" fill="#241b14">${esc(title)}</text>
    ${lines.map((line, index) => `<text x="76" y="${308 + index * 44}" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#6f5642">${esc(line)}</text>`).join("")}
  `;
}

function pill(x, y, text, fill, fg = "#241b14") {
  return `
    <rect x="${x}" y="${y}" rx="28" width="${text.length * 16 + 70}" height="56" fill="${fill}" stroke="#241b14" stroke-width="3"/>
    <text x="${x + 30}" y="${y + 37}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function panel(x, y, width, height, title, lines, dark = false) {
  const bg = dark ? "#241b14" : "#fffdf9";
  const fg = dark ? "#ffffff" : "#241b14";
  const sub = dark ? "#f1dcc4" : "#6f5642";
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="32" fill="${bg}" stroke="#241b14" stroke-width="4"/>
      <text x="${x + 28}" y="${y + 54}" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${sub}">${esc(title)}</text>
      ${lines.map((line, index) => `<text x="${x + 28}" y="${y + 118 + index * 40}" font-family="Arial, sans-serif" font-size="34" font-weight="${index === 0 ? 900 : 700}" fill="${index === 0 ? fg : sub}">${esc(line)}</text>`).join("")}
    </g>
  `;
}

function button(x, y, width, text, fill, fg = "#ffffff") {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="96" rx="48" fill="${fill}" stroke="#241b14" stroke-width="4"/>
    <text x="${x + width / 2}" y="${y + 61}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${fg}">${esc(text)}</text>
  `;
}

function screenshot1() {
  const content = `
    ${header("Post a trade ticket.", "Write what you offer, say what you want back, and publish one clear swap request on Base.")}
    ${pill(72, 408, "Maker flow", "#d7b18a")}
    ${pill(244, 408, "One responder", "#ffffff")}
    ${panel(72, 540, 1140, 286, "Create ticket", ["Offer: 1x Base launch tee", "Want: 1x event poster", "State: open ticket"], false)}
    ${panel(72, 872, 548, 246, "Trade note", ["Straight swap", "Meetup handoff after match"], false)}
    ${panel(664, 872, 548, 246, "Why this works", ["One obvious offer", "One desired item", "One match to accept"], false)}
    ${panel(72, 1166, 1140, 290, "Receipt board", ["Maker: 0x9936...9652", "Responder: none yet", "Acceptance: pending"], true)}
    ${panel(72, 1508, 1140, 250, "Flow", ["Create ticket", "Receive one response", "Accept the match onchain"], false)}
    ${button(72, 2522, 1140, "Create on Base", "#241b14")}
  `;
  return frame(content);
}

function screenshot2() {
  const content = `
    ${header("A match is waiting.", "Users can load a trade ticket, see the open offer, and respond to claim the match slot.")}
    ${pill(72, 408, "0x8ab2...77f1 connected", "#d7b18a")}
    ${pill(406, 408, "Trade ID 12", "#ffffff")}
    ${panel(72, 536, 360, 246, "Offer", ["1x Base launch tee", "Posted by maker"], false)}
    ${panel(462, 536, 360, 246, "Want", ["1x event poster", "Expected in return"], false)}
    ${panel(852, 536, 360, 246, "State", ["Seeking match", "No responder yet"], false)}
    ${panel(72, 840, 1140, 310, "Trade note", ["Straight swap, local meetup handoff, and clear onchain acceptance.", "Responder takes the only open slot."], true)}
    ${panel(72, 1208, 1140, 286, "Match panel", ["Trade ID: 12", "Wallet can respond once", "Maker must accept to confirm"], false)}
    ${panel(72, 1544, 1140, 254, "Status", ["Responder attached on Base.", "Ticket now waits on the maker's acceptance."], true)}
    ${button(72, 2522, 1140, "Respond to trade", "#d7b18a", "#241b14")}
  `;
  return frame(content, "#efe4d6");
}

function screenshot3() {
  const content = `
    ${header("Accept the match.", "The maker can confirm one responder and turn the open ticket into a matched trade receipt.")}
    ${pill(72, 408, "Accepted", "#ffffff")}
    ${pill(228, 408, "Matched receipt", "#d7b18a")}
    ${panel(72, 540, 548, 276, "Maker", ["0x9936...9652", "Posted the original ticket", "Confirmed the match"], true)}
    ${panel(664, 540, 548, 276, "Responder", ["0x8ab2...77f1", "Claimed the response slot", "Now part of the accepted trade"], false)}
    ${panel(72, 874, 1140, 306, "Final ticket", ["Offer: 1x Base launch tee", "Want: 1x event poster", "State: matched"], false)}
    ${panel(72, 1238, 1140, 290, "Receipt", ["Trade accepted on Base.", "Both wallet roles stay visible.", "The ticket becomes a clear public match."], true)}
    ${panel(72, 1582, 1140, 254, "Post-match state", ["One maker", "One responder", "One accepted trade record"], false)}
    ${button(72, 2522, 1140, "Accept match", "#241b14")}
  `;
  return frame(content, "#e9dece");
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#f4efe8"/>
    <rect x="138" y="138" width="748" height="748" rx="96" fill="#fffdf9" stroke="#241b14" stroke-width="24"/>
    <rect x="210" y="220" width="604" height="164" rx="30" fill="#241b14"/>
    <rect x="210" y="432" width="604" height="118" rx="24" fill="#f2d0aa" stroke="#241b14" stroke-width="14"/>
    <rect x="210" y="596" width="260" height="152" rx="24" fill="#fff4e7" stroke="#241b14" stroke-width="14"/>
    <rect x="554" y="596" width="260" height="152" rx="24" fill="#fff4e7" stroke="#241b14" stroke-width="14"/>
    <path d="M384 672h256" stroke="#241b14" stroke-width="18" stroke-linecap="round"/>
    <path d="M384 672l44-44" stroke="#241b14" stroke-width="18" stroke-linecap="round"/>
    <path d="M640 672l-44 44" stroke="#241b14" stroke-width="18" stroke-linecap="round"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f4efe8"/>
        <stop offset="100%" stop-color="#dfcfba"/>
      </linearGradient>
    </defs>
    <rect width="1910" height="1000" fill="url(#bg)"/>
    <text x="96" y="198" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="#241b14">Base Trade Ticket</text>
    <text x="100" y="292" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#6f5642">Post a simple swap request, find one responder, and accept the match on Base.</text>
    ${pill(100, 348, "Receipt-style swap", "#d7b18a")}
    ${pill(356, 348, "One responder", "#ffffff")}
    ${button(100, 448, 430, "Create ticket", "#241b14")}
    ${button(560, 448, 430, "Respond", "#d7b18a", "#241b14")}
    ${panel(1186, 124, 624, 250, "Live ticket", ["Offer: 1x Base launch tee", "Want: 1x event poster", "State: seeking match"], true)}
    ${panel(1186, 420, 624, 250, "Accepted flow", ["One responder joins", "Maker accepts the trade onchain"], false)}
    ${panel(1186, 734, 624, 180, "Trade state", ["Clear, simple, and made for mobile scanning"], true)}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  files,
};

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8",
);

for (const file of files) {
  console.log(file);
}
