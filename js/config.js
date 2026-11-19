function stripJsonComments(rawText) {
  return rawText.replace(/^\s*\/\/.*$/gm, "");
}

async function loadSiteConfig() {
  const response = await fetch("config.json?v=" + Date.now());
  const rawText = await response.text();
  return JSON.parse(stripJsonComments(rawText));
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
