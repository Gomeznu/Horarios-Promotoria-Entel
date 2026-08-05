import { getStore } from "@netlify/blobs";

const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const VACIO = { bloques: [], directorio: null, actualizado: null };

export default async () => {
  let d = null;
  try {
    const store = getStore({ name: "rutas", consistency: "strong" });
    d = await store.get("acumulado", { type: "json" });
  } catch (e) {
    return json(VACIO);
  }
  if (!d) return json(VACIO);
  // La vista publica no expone el DNI de las personas
  const bloques = (d.bloques || []).map(({ dni, ...r }) => r);
  return json({ bloques, directorio: d.directorio || null, actualizado: d.actualizado || null });
};

export const config = { path: "/api/publico" };
