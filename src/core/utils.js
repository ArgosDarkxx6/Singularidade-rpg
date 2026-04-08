export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function deepClone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getInitials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

export function parseTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatMoney(value) {
  return `¥${safeNumber(value, 0)}`;
}

export function formatTimestamp(timestamp) {
  try {
    return new Date(timestamp).toLocaleString('pt-BR');
  } catch (error) {
    return '';
  }
}

export function parseLooseNumber(value, fallback = 0) {
  const match = String(value || '')
    .replace(/\./g, '')
    .match(/-?\d+/);

  return match ? safeNumber(match[0], fallback) : fallback;
}

export function extractLineValue(text, label) {
  const regex = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'im');
  const match = String(text || '').match(regex);
  return match ? match[1].trim() : '';
}

export function splitTextSheets(rawText) {
  return String(rawText || '')
    .replace(/\r/g, '')
    .split(/(?=^\s*Nome\s*:)/gim)
    .map((chunk) => chunk.trim())
    .filter((chunk) => /^\s*Nome\s*:/im.test(chunk));
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function downloadTextFile(filename, text, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function fallbackCopyText(text) {
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function copyText(text) {
  if (!text) return Promise.resolve();
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return fallbackCopyText(text);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
