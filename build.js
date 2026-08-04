#!/usr/bin/env node
// Scans this directory's immediate subfolders for an index.html, builds
// projects.json, and rewrites the embedded data block inside index.html so
// the landing page needs no live fetch (works over file:// and on Neocities).
//
// Run this after adding, removing, or retitling a project folder, then
// re-upload index.html and projects.json (and the new folder) to Neocities.

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const IGNORE = new Set(["node_modules", ".git", ".github"]);
const START_MARKER = "<!-- PROJECTS_JSON_START -->";
const END_MARKER = "<!-- PROJECTS_JSON_END -->";

function titleCase(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractTag(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

// Matches whichever quote char opens the attribute, so values containing
// the other quote type (e.g. an apostrophe in "world's") aren't truncated.
function extractDescription(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=(["'])([\s\S]*?)\1/i);
  return m ? m[2].trim() : null;
}

function scanProjects() {
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  const projects = [];
  const skipped = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || IGNORE.has(entry.name)) continue;

    const indexPath = path.join(ROOT, entry.name, "index.html");
    if (!fs.existsSync(indexPath)) {
      skipped.push(entry.name);
      continue;
    }

    const html = fs.readFileSync(indexPath, "utf8");
    const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i) || titleCase(entry.name);
    const description = extractDescription(html);

    projects.push({ folder: entry.name, title, description: description || "" });
  }

  projects.sort((a, b) => a.title.localeCompare(b.title));
  return { projects, skipped };
}

function writeManifest(data) {
  const manifestPath = path.join(ROOT, "projects.json");
  fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2) + "\n");
  return manifestPath;
}

function updateIndexHtml(data) {
  const indexPath = path.join(ROOT, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  const startIdx = html.indexOf(START_MARKER);
  const endIdx = html.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(
      `Could not find ${START_MARKER} / ${END_MARKER} markers in index.html — ` +
        "don't remove them, the build script needs them to know where to inject data."
    );
  }

  const block =
    START_MARKER +
    "\n<script id=\"projects-data\" type=\"application/json\">\n" +
    JSON.stringify(data, null, 2) +
    "\n</script>\n" +
    END_MARKER;

  html = html.slice(0, startIdx) + block + html.slice(endIdx + END_MARKER.length);
  fs.writeFileSync(indexPath, html);
}

function main() {
  const { projects, skipped } = scanProjects();
  const data = { generatedAt: new Date().toISOString(), projects };

  const manifestPath = writeManifest(data);
  updateIndexHtml(data);

  console.log(`Wrote ${path.relative(ROOT, manifestPath)} and updated index.html`);
  console.log(`${projects.length} project(s) catalogued:`);
  for (const p of projects) {
    console.log(`  /${p.folder}/  ->  "${p.title}"${p.description ? " — " + p.description : ""}`);
  }
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} folder(s) with no index.html: ${skipped.join(", ")}`);
  }
}

main();
