module.exports = {
    plugins: [
        "matrix-org",
    ],
    env: {
        browser: true,
        node: true,
    },
    rules: {
        "no-var": ["warn"],
        "prefer-rest-params": ["warn"],
        "prefer-spread": ["warn"],
        "one-var": ["warn"],
        "padded-blocks": ["warn"],
        "no-extend-native": ["warn"],
        "camelcase": ["warn"],
        "no-multi-spaces": ["error", { "ignoreEOLComments": true }],
        "space-before-function-paren": ["error", {
            "anonymous": "never",
            "named": "never",
            "asyncArrow": "always",
        }],
        "arrow-parens": "off",
        "prefer-promise-reject-errors": "off",
        "quotes": "off",
        "indent": "off",
        "no-constant-condition": "off",
        "no-async-promise-executor": "off",
    },
    overrides: [{
        files: [
            "**/*.ts",
        ],
        extends: [
            "plugin:matrix-org/typescript",
        ],
        rules: {
            // TypeScript has its own version of this
            "@babel/no-invalid-this": "off",

            // We're okay being explicit at the moment
            "@typescript-eslint/no-empty-interface": "off",

            "quotes": "off",
            // We use a `logger` intermediary module
            "no-console": "error",
        },
    }],
};
