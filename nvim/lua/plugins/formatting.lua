return {
  {
    "stevearc/conform.nvim",
    opts = {
      -- disable format on save
      -- format_on_save = true,
      -- or use a specific formatter per filetype
      formatters_by_ft = {
        python = { "ruff_format" }, -- or "black"
        javascript = { "biome" },
        typescript = { "biome" },
        html = { "prettier" },
        css = { "biome" },
        json = { "biome" },
        cpp = { "clang-format" },
      },
    },
  },
}
