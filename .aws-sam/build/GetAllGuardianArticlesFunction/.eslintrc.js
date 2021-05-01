module.exports = {
    "env": {
        "node": true,
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
      "@stedi-oss/stedi-aws-rules/no-aws-import": "error",
    "@stedi-oss/stedi-aws-rules/instrument-aws-clients": "error",
    "@stedi-oss/stedi-aws-rules/instrument-document-clients": "error"
    },
    "plugins": ["@stedi-oss/stedi-aws-rules"]
    
};
