" set nocompatible
filetype off

call plug#begin('~/.local/share/nvim/plugged')

" other plugins
Plug 'Shougo/vimproc.vim', {'do' : 'make'}  " required for tsuquyomi
" Plug 'ctrlpvim/ctrlp.vim'
Plug 'scrooloose/nerdtree'
Plug 'vim-airline/vim-airline'
Plug 'tpope/vim-fugitive'
Plug 'tpope/vim-commentary'
Plug 'mg979/vim-visual-multi'
" Plug 'mgedmin/pythonhelper.vim'
Plug 'rafi/awesome-vim-colorschemes'
Plug 'google/yapf', { 'rtp': 'plugins/vim', 'for': 'python' }
Plug 'tpope/vim-surround'
" dependencies for telescope
Plug 'nvim-lua/popup.nvim'
Plug 'nvim-lua/plenary.nvim'
" telescope
Plug 'nvim-telescope/telescope.nvim'
Plug 'nvim-telescope/telescope-fzy-native.nvim'

" Plug 'nvim-lualine/lualine.nvim'
" If you want to have icons in your statusline choose one of these
Plug 'kyazdani42/nvim-web-devicons'

" language-related plugins
Plug 'hynek/vim-python-pep8-indent'
Plug 'neoclide/coc.nvim', {'branch': 'release'}
Plug 'othree/html5.vim'
Plug 'JesseKPhillips/d.vim'
Plug 'digitaltoad/vim-pug'
Plug 'dense-analysis/ale'
" Plug 'rust-lang/rust.vim'
Plug 'elixir-editors/vim-elixir'
Plug 'hail2u/vim-css3-syntax'
Plug 'gutenye/json5.vim'
Plug 'neoclide/jsonc.vim'
" Plug 'eagletmt/neco-ghc'
" Plug 'cakebaker/scss-syntax.vim'
" Plug 'racer-rust/vim-racer'
Plug 'cespare/vim-toml'
Plug 'Glench/Vim-Jinja2-Syntax'
Plug 'evanleck/vim-svelte', {'branch': 'main'}
Plug 'hashivim/vim-terraform'
" Plug 'posva/vim-vue'
Plug 'nvim-treesitter/nvim-treesitter', {'do': ':TSUpdate'}
" Plug 'MathSquared/vim-python-sql'

call plug#end()

set bs=2 "set backspace to be able to delete previous characters
set number "display line number

syntax on

" use soft tabs of 4 spaces
set autoindent
set expandtab " expand tab to spaces
set shiftwidth=4
set softtabstop=4
" set tabstop=4 " set tab itself to be 4 spaces
autocmd BufNewFile,BufReadPost *.coffee setl shiftwidth=4 expandtab
autocmd BufRead,BufNewFile tsconfig.json set filetype=jsonc

" Enable filetype plugin
filetype indent on
filetype plugin on
" filetype plugin indent on

" make the tab key reindent the line
" http://smalltalk.gnu.org/blog/bonzinip/emacs-ifying-vims-autoindent
set cinkeys=0{,0},0),0#,!<Tab>,;,:,o,O,e
set indentkeys=!<Tab>,o,O
map <Tab> i<Tab><Esc>^
set cinoptions=:0,(0,u0,W1s

" Set to auto read when a file is changed from the outside
set autoread

" Fast saving
nmap <leader>w :w<cr>

set hid "Change buffer - without saving

" some key bindings from emacs :)
inoremap <C-A> <Home>
inoremap <C-E> <End>

" Turn on incremental search with ignore case (except explicit caps)
set incsearch
set ignorecase
set smartcase

set hlsearch

" Enable indent folding
" set foldenable
" set fdm=indent

set scrolloff=3 " start scrolling when 3 lines from the bottom

" highlight the line in the current active window
autocmd WinEnter * setlocal cursorline
autocmd WinLeave * setlocal nocursorline
"set cursorline

" Smart way to move btw. windows
map <C-j> <C-W>j
map <C-k> <C-W>k
map <C-h> <C-W>h
map <C-l> <C-W>l

" disable mouse select
set mouse=

" set autochdir " always set the directory to that of the current file

" highlight Pmenu ctermbg=238 gui=bold
" set term=xterm-256color
" colorscheme wombat2
colorscheme flattened_light
set termguicolors
" colorscheme ayu

set directory^=$HOME/.vim_swap//   " put all swap files in one place

" when space is pressed, clear all highlights
nnoremap <Space> :noh<CR>

"set rnu
"au InsertEnter * :set nu
"au InsertLeave * :set rnu
"au FocusLost * :set nu
"au FocusGained * :set rnu

" NERDTree
" autocmd vimenter * NERDTree
autocmd StdinReadPre * let s:std_in=1
autocmd VimEnter * if argc() == 0 && !exists("s:std_in") | NERDTree | endif
let NERDTreeIgnore = ['\.pyc$', '^__pycache__', '\.egg-info', '^build$', 'a\.out', '\.pkl$', '\.zst$', '\.sqlite$', '\.png$', '\.h5$', '\.pb$', '\.npy$', '\.mp4$', '\.so$', '\.so.*']
" Go to previous (last accessed) window.
autocmd VimEnter * wincmd p

nnoremap <c-p> <cmd>Telescope find_files<cr>
" let g:ctrlp_lazy_update = 100
" let g:ctrlp_clear_cache_on_exit = 1
" if executable("rg")
"     set grepprg=rg\ --color=never
"     let g:ctrlp_user_command = 'rg %s --files --color=never -g ''!*.git'' -g ''!.DS_Store'' -g ''!*node_modules*'' -g ''!*bower_components*'' -g ''!media*'' -g ''!*.pyc'' -g ''!.mypy_cache*'' -g ''!__pycache__'' -g ''!*.mdb'' -g ''!*.so'' -g ''!*.o'' -g ''!*.png'' -g ''!*.jpeg'' -g ''!*.jpg'' -g ''!*.pkl'' --hidden --glob ""'
"     let g:ctrlp_use_caching = 0
" endif


source ~/.config/nvim/coc.vim
source ~/.config/nvim/ale.vim


let g:indent_guides_auto_colors = 0
let g:indent_guides_guide_size = 1
autocmd VimEnter,Colorscheme * :hi IndentGuidesOdd  ctermbg=234
autocmd VimEnter,Colorscheme * :hi IndentGuidesEven ctermbg=235

nnoremap <silent><leader>bp obreakpoint()<Esc>
nnoremap <silent><leader>Bp Obreakpoint()<Esc>

" run YAPF
nnoremap <leader>y :call yapf#YAPF()<cr>

let g:airline_powerline_fonts = 1
set laststatus=3

" multiple cursors
let g:multi_cursor_prev_key='<C-b>'

let g:haskellmode_completion_ghc = 0
let g:necoghc_enable_detailed_browse = 1
autocmd FileType haskell setlocal omnifunc=necoghc#omnifunc

" set statusline=%<%f\ %h%m%r\ %1*%{TagInStatusLine()}%*%=%-14.(%l,%c%V%)\ %P

" force some special files to use certain syntaxes
au BufReadPost Pipfile set syntax=toml
au BufReadPost Pipfile.lock set syntax=json
au BufReadPost SConstruct set syntax=python

lua <<EOF
require'nvim-treesitter.configs'.setup {
  ensure_installed = { "python", "javascript", "typescript" }, -- one of "all", "maintained" (parsers with maintainers), or a list of languages
  highlight = {
    enable = { "python" },              -- false will disable the whole extension
  },
}
require('telescope').load_extension('fzy_native')
EOF
