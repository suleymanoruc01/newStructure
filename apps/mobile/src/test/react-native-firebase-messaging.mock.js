module.exports = {
  __esModule: true,
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
  getMessaging: () => ({}),
  getToken: async () => 'mock-token',
  hasPermission: async () => 1,
  requestPermission: async () => 1,
  getInitialNotification: async () => null,
  onNotificationOpenedApp: () => () => {},
  onTokenRefresh: () => () => {},
  default: () => ({
    getToken: async () => 'mock-token',
    hasPermission: async () => 1,
    requestPermission: async () => 1,
  }),
};
