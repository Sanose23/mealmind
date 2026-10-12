export default [{
  files: ["js/**/*.js"],
  languageOptions: {
    ecmaVersion: 2022, sourceType: "module",
    globals: { document: "readonly", window: "readonly", location: "readonly", localStorage: "readonly", fetch: "readonly", URLSearchParams: "readonly", Option: "readonly", confirm: "readonly" }
  },
  rules: { "no-unused-vars": "error", "no-undef": "error", "eqeqeq": "error", "semi": "error" },
}];
