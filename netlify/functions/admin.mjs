import { getStore } from "@netlify/blobs";

const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

function autorizado(req) {
  const enviada = req.headers.get("x-clave") || "";
  const real = process.env.CLAVE_ADMIN || "";
  if (!real || enviada.length !== real.length) return false;
  let dif = 0;
  for (let i = 0; i < real.length; i++) dif |= real.charCodeAt(i) ^ enviada.charCodeAt(i);
  return dif === 0;
}

export default async (req) => {
  const op = new URL(req.url).searchParams.get("op");

  if (!process.env.CLAVE_ADMIN)
    return json({ error: "Falta configurar la variable CLAVE_ADMIN en Netlify." }, 500);

  if (op === "login")
    return autorizado(req) ? json({ ok: true }) : json({ error: "Clave incorrecta" }, 401);

  if (!autorizado(req)) return json({ error: "No autorizado" }, 401);

  const store = getStore({ name: "rutas", consistency: "strong" });

  if (op === "datos") {
    let d = null;
    try { d = await store.get("acumulado", { type: "json" }); } catch (e) { d = null; }
    return json(d || { bloques: [], directorio: null, actualizado: null });
  }

  if (op === "guardar") {
    let body;
    try { body = await req.json(); } catch (e) { return json({ error: "Cuerpo invalido" }, 400); }
    if (!Array.isArray(body.bloques)) return json({ error: "Faltan los bloques" }, 400);
    const payload = {
      bloques: body.bloques,
      directorio: body.directorio || null,
      actualizado: new Date().toISOString()
    };
    await store.setJSON("acumulado", payload);
    return json({ ok: true, bloques: payload.bloques.length, actualizado: payload.actualizado });
  }

  return json({ error: "Operacion desconocida" }, 400);
};

export const config = { path: "/api/admin" };
