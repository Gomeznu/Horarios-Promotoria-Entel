import { getStore } from "@netlify/blobs";

const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const VACIO = { bloques: [], directorio: null, telefonos: null, actualizado: null };

export default async () => {
  let d = null;
  try {
    const store = getStore({ name: "rutas", consistency: "strong" });
    d = await store.get("acumulado", { type: "json" });
  } catch (e) {
    return json(VACIO);
  }
  if (!d) return json(VACIO);

  // La vista publica nunca expone el DNI
  const bloques = (d.bloques || []).map(({ dni, ...r }) => r);

  // Los telefonos solo se publican si se habilita explicitamente en Netlify
  const ocultarTel = String(process.env.TELEFONOS_PUBLICOS || "").toLowerCase() === "no";

  return json({
    bloques,
    directorio: d.directorio || null,
    telefonos: ocultarTel ? null : (d.telefonos || null),
    actualizado: d.actualizado || null
  });
};

export const config = { path: "/api/publico" };
