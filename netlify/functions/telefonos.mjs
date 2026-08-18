import { getStore } from "@netlify/blobs";

const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const HORAS_CACHE = 6;

const MOJI = { "\u00c3\u2018": "N", "\u00c3\u00b1": "N", "\u00c3\u00a9": "E", "\u00c3\u00a1": "A", "\u00c3\u00ad": "I", "\u00c3\u00b3": "O", "\u00c3\u00ba": "U" };
function clave(s) {
  s = String(s || "");
  for (const a in MOJI) s = s.split(a).join(MOJI[a]);
  return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, " ").split(/\s+/).filter(t => t.length > 1).join(" ");
}

function parseCSV(texto) {
  const filas = [];
  let campo = "", fila = [], entre = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entre) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++ } else entre = false }
      else campo += c;
    } else if (c === '"') entre = true;
    else if (c === ",") { fila.push(campo); campo = "" }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = "" }
    else if (c !== "\r") campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila) }
  return filas;
}

function extraer(filas) {
  let h = -1, iN = -1, iT = -1, iE = -1;
  for (let i = 0; i < Math.min(filas.length, 15); i++) {
    const f = filas[i].map(x => String(x || "").trim().toUpperCase());
    const a = f.findIndex(x => x.includes("SALESCLERKNAME"));
    const b = f.findIndex(x => x.includes("PHONENUMBER"));
    if (a >= 0 && b >= 0) { h = i; iN = a; iT = b; iE = f.findIndex(x => x.includes("ESTADO_CLERK")); break }
  }
  if (h < 0) throw new Error("No encontre las columnas SALESCLERKNAME y PHONENUMBER en la hoja.");
  const act = {}, inact = {};
  for (let i = h + 1; i < filas.length; i++) {
    const r = filas[i];
    const n = clave(r[iN]);
    const t = String(r[iT] || "").replace(/\D/g, "").slice(-9);
    if (!n || t.length !== 9) continue;
    const activo = iE < 0 || String(r[iE] || "").trim().toUpperCase() === "ACTIVO";
    if (activo) { if (!act[n]) act[n] = t } else if (!inact[n]) inact[n] = t;
  }
  return { ...inact, ...act };
}

export default async (req) => {
  if (String(process.env.TELEFONOS_PUBLICOS || "").toLowerCase() === "no")
    return json({ telefonos: null, motivo: "desactivado" });

  const id = process.env.SHEET_TELEFONOS;
  if (!id) return json({ telefonos: null, motivo: "Falta configurar SHEET_TELEFONOS en Netlify." });

  const forzar = new URL(req.url).searchParams.get("forzar") === "1";
  const store = getStore({ name: "rutas", consistency: "strong" });

  if (!forzar) {
    try {
      const c = await store.get("telefonos_cache", { type: "json" });
      if (c && c.actualizado && Date.now() - new Date(c.actualizado).getTime() < HORAS_CACHE * 3600e3)
        return json({ telefonos: c.telefonos, actualizado: c.actualizado, origen: "cache" });
    } catch (e) { /* sin cache */ }
  }

  const gid = process.env.GID_TELEFONOS || "0";
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  let telefonos;
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) throw new Error("La hoja respondio " + r.status + ". Revisa que este compartida con 'cualquiera con el enlace'.");
    const txt = await r.text();
    if (txt.trim().startsWith("<")) throw new Error("La hoja no es publica: Google devolvio una pagina de acceso.");
    telefonos = extraer(parseCSV(txt));
  } catch (e) {
    try {
      const c = await store.get("telefonos_cache", { type: "json" });
      if (c) return json({ telefonos: c.telefonos, actualizado: c.actualizado, origen: "cache", aviso: e.message });
    } catch (_) { /* nada */ }
    return json({ telefonos: null, motivo: e.message });
  }

  const actualizado = new Date().toISOString();
  try { await store.setJSON("telefonos_cache", { telefonos, actualizado }) } catch (e) { /* no critico */ }
  return json({ telefonos, actualizado, origen: "hoja", total: Object.keys(telefonos).length });
};

export const config = { path: "/api/telefonos" };
