module.exports = {
  __esModule: true,
  adapty: {
    activate: async () => undefined,
    identify: async () => undefined,
    logout: async () => undefined,
    getFlow: async () => ({}),
    getPaywallProducts: async () => [],
    makePurchase: async () => ({ type: 'user_cancelled' }),
  },
};
