// ─────────────────────────────────────────────
//  SERVICE WORKER — MeuApp PWA
//  Responsável por: cache offline + instalação
// ─────────────────────────────────────────────

const CACHE_NAME = 'meuapp-v1';

// Arquivos que serão salvos no celular do usuário
const ARQUIVOS_PARA_CACHE = [
  '/app-mobile.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];


// ── 1. INSTALL ──────────────────────────────
// Roda uma vez quando o SW é registrado pela 1ª vez.
// Baixa e salva todos os arquivos no cache.
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Salvando arquivos no cache');
      return cache.addAll(ARQUIVOS_PARA_CACHE);
    })
  );

  // Força o SW novo a assumir sem esperar o usuário fechar o app
  self.skipWaiting();
});


// ── 2. ACTIVATE ─────────────────────────────
// Roda quando o SW assume o controle.
// Aqui limpamos caches antigos de versões anteriores.
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado!');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME) // caches de versões antigas
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Assume o controle de todas as abas abertas imediatamente
  self.clients.claim();
});


// ── 3. FETCH ────────────────────────────────
// Intercepta TODA requisição de rede do app.
// Estratégia: Cache First → se não tiver, busca na rede.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((respostaDoCache) => {

      // ✅ Arquivo encontrado no cache → retorna offline
      if (respostaDoCache) {
        return respostaDoCache;
      }

      // 🌐 Não está no cache → busca na internet
      return fetch(event.request).then((respostaDaRede) => {

        // Salva no cache para a próxima vez
        if (respostaDaRede && respostaDaRede.status === 200) {
          const respostaClonada = respostaDaRede.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, respostaClonada);
          });
        }

        return respostaDaRede;
      }).catch(() => {
        // 📵 Sem internet e sem cache → mostra página offline
        console.warn('[SW] Sem conexão e sem cache para:', event.request.url);
      });

    })
  );
});
