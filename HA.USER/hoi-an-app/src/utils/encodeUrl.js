export function encodeUrl(u) {
  if (!u) return u;
  try { return encodeURI(decodeURI(u)); }
  catch(e){ try { return encodeURI(u); } catch(e2){ return u; } }
}