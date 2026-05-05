-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Emacs-style mappings
vim.keymap.set("i", "<C-A>", "<Home>", { desc = "Go to beginning of line" })
vim.keymap.set("i", "<C-E>", "<End>", { desc = "Go to end of line" })

-- http://smalltalk.gnu.org/blog/bonzinip/emacs-ifying-vims-autoindent
-- vim.keymap.set("n", "<Tab>", "i<Tab><Esc>^", { desc = "Insert tab and return to start of line" })

-- Python breakpoint
vim.keymap.set("n", "<leader>bp", "obreakpoint()<Esc>", { desc = "Add breakpoint below" })
vim.keymap.set("n", "<leader>Bp", "Obreakpoint()<Esc>", { desc = "Add breakpoint above" })

-- vim.api.nvim_set_keymap("n", "<C-j>", ":Treewalker Down<CR>", { noremap = true })
-- vim.api.nvim_set_keymap("n", "<C-k>", ":Treewalker Up<CR>", { noremap = true })
-- vim.api.nvim_set_keymap("n", "<C-h>", ":Treewalker Left<CR>", { noremap = true })
-- vim.api.nvim_set_keymap("n", "<C-l>", ":Treewalker Right<CR>", { noremap = true })
