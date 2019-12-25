" set nocompatible
filetype off

call plug#begin('~/.local/share/nvim/plugged')

" other plugins
Plug 'Shougo/vimproc.vim', {'do' : 'make'}  " required for tsuquyomi
" Plug 'ctrlpvim/ctrlp.vim'
Plug 'scrooloose/nerdtree'
Plug 'vim-airline/vim-airline'
Plug 'terryma/vim-multiple-cursors'
Plug 'tpope/vim-fugitive'
Plug 'junegunn/fzf'
Plug 'junegunn/fzf.vim'
" Plug 'mgedmin/pythonhelper.vim'
Plug 'romainl/flattened'
" Plug 'ayu-theme/ayu-vim'
Plug 'google/yapf', { 'rtp': 'plugins/vim', 'for': 'python' }
Plug 'tpope/vim-surround'

" language-related plugins
Plug 'hynek/vim-python-pep8-indent'
Plug 'Valloric/YouCompleteMe', { 'do': './install.py --ts-completer --clang-completer' }
Plug 'pangloss/vim-javascript'
Plug 'othree/html5.vim'
Plug 'JesseKPhillips/d.vim'
Plug 'digitaltoad/vim-pug'
Plug 'leafgarland/typescript-vim'
Plug 'w0rp/ale'
" Plug 'Quramy/tsuquyomi'  " typescript syntax checker/linter
Plug 'rust-lang/rust.vim'
Plug 'elixir-editors/vim-elixir'
Plug 'hail2u/vim-css3-syntax'
" Plug 'eagletmt/neco-ghc'
" Plug 'cakebaker/scss-syntax.vim'
" Plug 'racer-rust/vim-racer'
Plug 'cespare/vim-toml'
Plug 'Glench/Vim-Jinja2-Syntax'

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
" colorscheme solarized
colorscheme flattened_light
set termguicolors
" colorscheme ayu

set directory^=$HOME/.vim_swap//   " put all swap files in one place

nnoremap <Space> :noh<CR>          " when space is pressed, clear all highlights

"set rnu
"au InsertEnter * :set nu
"au InsertLeave * :set rnu
"au FocusLost * :set nu
"au FocusGained * :set rnu

" NERDTree
" autocmd vimenter * NERDTree
autocmd StdinReadPre * let s:std_in=1
autocmd VimEnter * if argc() == 0 && !exists("s:std_in") | NERDTree | endif
let NERDTreeIgnore = ['\.pyc$', '^__pycache__$', '\.egg-info', '^build$', 'a.out', '\.pkl$', '\.zst$', '\.sqlite$', '\.png$', '\.h5$', '\.pb$', '\.npy$', '\.mp4$']
" Go to previous (last accessed) window.
autocmd VimEnter * wincmd p

nnoremap <c-p> :Files<cr>
" let g:ctrlp_clear_cache_on_exit = 1
" if executable("ag")
"     set grepprg=ag\ --nogroup\ --nocolor
"     let g:ctrlp_user_command = 'ag %s -i --nocolor --nogroup --ignore ''.git'' --ignore ''.DS_Store'' --ignore ''node_modules'' --ignore ''bower_components'' --ignore ''media'' --ignore ''.pyc'' --hidden -g ""'
" endif

" YouCompleteMe
let g:ycm_python_binary_path = 'python3'
let g:ycm_global_ycm_extra_conf='~/.ycm_extra_conf.py'
let g:ycm_autoclose_preview_window_after_completion = 1
let g:ycm_semantic_triggers = {
    \ 'haskell' : ['.'],
\ }
nnoremap <leader>jd :YcmCompleter GoTo<CR>
nnoremap <leader>jt :YcmCompleter GetType<CR>

" rust racer
" let g:racer_cmd = '/Users/huipeng/.cargo/bin/racer'
" let $RUST_SRC_PATH = '/Users/huipeng/rustc-1.12.0/src'

" ale
let g:ale_linters = {
            \ 'python': ['flake8'],
            \ 'c++': ['clang'],
            \ 'typescript': ['tsserver'],
            \ 'javascript': ['eslint'],
            \ 'html': ['tidy'],
            \ 'rust': ['rls'],
            \ '*': [],
\}
let g:ale_cpp_clang_executable = 'clang++'
let g:ale_cpp_clang_options = '-std=c++1z -stdlib=libc++ -Wall'

let g:indent_guides_auto_colors = 0
let g:indent_guides_guide_size = 1
autocmd VimEnter,Colorscheme * :hi IndentGuidesOdd  ctermbg=234
autocmd VimEnter,Colorscheme * :hi IndentGuidesEven ctermbg=235

" run YAPF
nnoremap <leader>y :call yapf#YAPF()<cr>

let g:airline_powerline_fonts = 1

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
