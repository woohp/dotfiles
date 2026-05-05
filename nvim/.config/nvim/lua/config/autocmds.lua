-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Add any additional autocmds here

local group = vim.api.nvim_create_augroup("custom_filetypes", { clear = true })

local ft_files = {
  ["tsconfig.json"] = { filetype = "jsonc" },
  ["Pipfile"] = { syntax = "toml" },
  ["Pipfile.lock"] = { syntax = "json" },
  ["SConstruct"] = { syntax = "python" },
  ["*.html.j2"] = { syntax = "html.jinja" },
}

for pattern, config in pairs(ft_files) do
  local cmd = config.filetype and "set filetype=" .. config.filetype or "set syntax=" .. config.syntax
  vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
    group = group,
    pattern = pattern,
    command = cmd,
  })
end

vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  pattern = { "*.j2" },
  callback = function()
    vim.fn["jinja#AdjustFiletype"]()
  end,
})

if not vim.b.jinja_syntax_autocmd_loaded then
  if vim.treesitter.language.get_lang("jinja") == nil then
    vim.api.nvim_create_autocmd("FileType", {
      buffer = 0,
      callback = function()
        if vim.bo.filetype ~= "" then
          vim.bo.syntax = "on"
        end
      end,
    })
  end
  vim.b.jinja_syntax_autocmd_loaded = true
end
