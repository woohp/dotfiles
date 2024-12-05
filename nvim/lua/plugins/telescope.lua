return {
  {
    "nvim-telescope/telescope.nvim",
    dependencies = { "natecraddock/telescope-zf-native.nvim", "nvim-telescope/telescope-frecency.nvim" },
    opts = function(_, opts)
      local telescope = require("telescope")
      telescope.load_extension("zf-native")
      -- telescope.load_extension("frecency")
      opts.defaults = {
        file_ignore_patterns = {
          "%.o$", -- Object files
          "%.so$", -- Shared object files (Linux/macOS)
          "%.a$", -- Static libraries
          "%.bin$", -- Binary files
          "%.mp4$", -- Binary files
        },
      }
    end,
    keys = {
      { "<C-p>", LazyVim.pick("files"), desc = "Find Files (Root Dir)" },
    },
  },
}
