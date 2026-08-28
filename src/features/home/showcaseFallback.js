/**
 * Pôsteres estáticos usados no grid do hero da home enquanto o endpoint
 * /external/showcase não respondeu — ou como preenchimento quando ele volta
 * menos itens que o necessário. URLs de CDN da TMDB (estáveis, hotlinkáveis),
 * todas verificadas como 200.
 */
const TMDB = 'https://image.tmdb.org/t/p/w500';

export const SHOWCASE_FALLBACK = [
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  '/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
  '/8kSerJrhrJWKLk1LViesGcnrUPE.jpg',
  '/velWPhVMQeQKcxggNEU8YmIo52R.jpg',
  '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
  '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg',
  '/1E5baAaEse26fej7uHcjOgEE2t2.jpg',
  '/74xTEgt7R36Fpooo50r9T25onhq.jpg',
  '/aQvJ5WPzZgYVDrxLX4R6cLJCEaQ.jpg',
  '/5weKu49pzJCt06OPpjvT80efnQj.jpg',
  '/wigZBAmNrIhxp2FNGOROUAeHvdh.jpg',
  '/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg',
  '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
  '/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg',
  '/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg',
  '/ngl2FKBlU4fhbdsrtdom9LVLBXw.jpg',
  '/xRWht48C2V8XNfzvPehyClOvDni.jpg',
  '/qhb1qOilapbapxWQn9jtRCMwXJF.jpg',
  '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
  '/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
  '/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
  '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
  '/ldfCF9RhR40mppkzmftxapaHeTo.jpg',
  '/vRQnzOn4HjIMX4LBq9nHhFXbsSu.jpg',
  '/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
].map((path) => TMDB + path);
