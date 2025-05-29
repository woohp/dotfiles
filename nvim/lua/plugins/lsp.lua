return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        pyright = { enabled = false },
        jedi_language_server = { enabled = true },
        clangd = {
          cmd = { "clang++" },
          init_options = {
            compilationDatabaseDirectory = "build",
            fallbackFlags = { "-std=c++1z", "-stdlib=libc++", "-Wall" },
          },
        },
        jinja_lsp = {
          filetypes = { "jinja", "html" },
        },
      },
    },
  },
}
