return {
  {
    "stevearc/conform.nvim",
    opts = {
      -- disable format on save
      -- format_on_save = true,
      -- or use a specific formatter per filetype
      formatters_by_ft = {
        python = { "ruff_format", "ruff_organize_imports" }, -- or "black"
        javascript = { "biome" },
        typescript = { "biome" },
        html = { "djlint" },
        jinja = { "djlint" },
        css = { "biome" },
        json = { "biome" },
        cpp = { "clang-format" },
      },
    },
  },
}
