return {
  {
    "hrsh7th/nvim-cmp",

    opts = function(_, opts)
      local cmp = require("cmp")

      opts.preselect = "none"

      opts.completion = {
        completeopt = "menu,menuone,noselect",
      }

      opts.mapping = vim.tbl_deep_extend("force", opts.mapping, {
        ["<C-y>"] = cmp.mapping.confirm({ select = true }),
        ["<CR>"] = cmp.config.disable,
      })
      -- opts.mapping = vim.tbl_extend("force", opts.mapping, {
      --   ["<CR>"] = cmp.mapping.abort(), -- Prevents auto-accept on Enter
      -- })
    end,
  },
}
