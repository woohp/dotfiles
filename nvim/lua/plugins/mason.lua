return {
  {
    "williamboman/mason.nvim",
    opts = {
      ensure_installed = {
        "jedi-language-server",
        "ruff", -- Python linter
        -- "mypy", -- Python type checker
        "clangd", -- C++ LSP
        -- "tsserver", -- TypeScript LSP
        "eslint_d", -- JavaScript linter
        -- "tidy", -- HTML linter
        -- "rust-analyzer", -- Rust LSP
      },
    },
  },
}
