export const environment = {
  api: 'http://localhost:8080/app',
  // URL pública del widget que el cliente embebe en su sitio. Hardcoded en
  // el snippet de instalación que se muestra en `CustomizeBotComponent`.
  widgetUrl: 'https://widget.zolvion.com/widget.js',
  projectName: 'Chatbot Panel',
  session: {
    inactivityTimeoutMs: 30 * 60 * 1000, // 30 min — cierre total
    inactivityWarningMs: 2 * 60 * 1000,  // aviso 2 min antes
    activityDebounceMs: 1000,            // debounce de mousemove/scroll
  },
};
