-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
vim.o.background = "light"

-- Set to auto read when a file is changed from the outside
vim.o.autoread = true

-- disable relative number (which LazyVim enables by default)
vim.o.relativenumber = false

-- start scrolling when 3 lines from the top/bottom
vim.o.scrolloff = 3

-- disable mouse
vim.o.mouse = ""

-- use \ as leader
vim.g.mapleader = "\\"

-- Don't use system clipboard
vim.opt.clipboard = ""

-- Disable auto-selecting first completion item
vim.opt.completeopt = "menu,menuone,noselect"

-- make the tab key reindent the line
-- http://smalltalk.gnu.org/blog/bonzinip/emacs-ifying-vims-autoindent
-- vim.opt.cinkeys = "0{,0},0),0#,!<Tab>,;,:,o,O,e"
-- vim.opt.indentkeys = "!<Tab>,o,O"
-- vim.opt.cinoptions = ":0,(0,u0,W1s"

-- LazyVim auto format
vim.g.autoformat = true

vim.g.lazyvim_python_lsp = "jedi_language_server"
vim.g.lazyvim_python_ruff = "ruff"

vim.opt.shiftwidth = 4
vim.opt.numberwidth = 4
vim.opt.signcolumn = "auto"
vim.opt.statuscolumn = ""

vim.g.lazyvim_picker = "telescope"

vim.opt.incsearch = true
vim.opt.ignorecase = true
vim.opt.smartcase = true

vim.opt.list = false
-- vim.cmd([[highlight SpecialKey guifg=#cfcfcf]])
