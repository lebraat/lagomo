module.exports = {
  "env": {
    "node": true,
    "browser": true,
    "mocha": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "globals": {
    "Web3": "readonly",
    "WalletConnectProvider": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"]
  }
};
