// Sets API base URL for remote backend (trycloudflare)
// Only sets if not already defined elsewhere
(function () {
  if (!window.API_BASE_URL || typeof window.API_BASE_URL !== 'string' || window.API_BASE_URL.trim() === '') {
    window.API_BASE_URL = 'https://edward-vitamin-statutory-silence.trycloudflare.com/';
  }
})();

