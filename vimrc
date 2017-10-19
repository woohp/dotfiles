" set nocompatible
filetype off

let g:python_host_prog = '/home/huipeng/.pyenv/versions/2.7.13/bin/python2'
let g:python3_host_prog = '/home/huipeng/.pyenv/versions/3.6.2/bin/python3'

call plug#begin('~/.vim/plugged')

" other plugins
Plug 'Shougo/vimproc.vim', {'do' : 'make'}
Plug 'ctrlpvim/ctrlp.vim'
Plug 'scrooloose/nerdtree'
Plug 'vim-airline/vim-airline'
Plug 'terryma/vim-multiple-cursors'
Plug 'tpope/vim-fugitive'

" language-related plugins
Plug 'hynek/vim-python-pep8-indent'
Plug 'kchmck/vim-coffee-script'
Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
Plug 'zchee/deoplete-jedi'
Plug 'pangloss/vim-javascript'
Plug 'othree/html5.vim'
Plug 'JesseKPhillips/d.vim'
" Plug 'scrooloose/syntastic'
Plug 'w0rp/ale'
Plug 'digitaltoad/vim-pug'
Plug 'leafgarland/typescript-vim'
Plug 'Quramy/tsuquyomi'  " typescript syntax checker/linter
Plug 'rking/ag.vim'
Plug 'rust-lang/rust.vim'
Plug 'elixir-lang/vim-elixir'
Plug 'racer-rust/vim-racer'
Plug 'hail2u/vim-css3-syntax'
Plug 'altercation/vim-colors-solarized'
" Plug 'cakebaker/scss-syntax.vim'

call plug#end()

call deoplete#enable()

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
filetype plugin indent on

" make the tab key reindent the line
" http://smalltalk.gnu.org/blog/bonzinip/emacs-ifying-vims-autoindent
set cinkeys=0{,0},0),0#,!<Tab>,;,:,o,O,e
set indentkeys=!<Tab>,o,O
map <Tab> i<Tab><Esc>^
set cinoptions=:0,(0,u0,W1s

" Set to auto read when a file is changed from the outside
set autoread

" Fast saving
" nmap <leader>w :w<cr>

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
" set bg=dark
" colorscheme wombat2
set background=light
colorscheme solarized

set directory^=$HOME/.vim_swap//   " put all swap files in one place

nnoremap <Space> :noh<CR>          " when space is pressed, clear all highlights

"set rnu
"au InsertEnter * :set nu
"au InsertLeave * :set rnu
"au FocusLost * :set nu
"au FocusGained * :set rnu

" NERDTree
autocmd vimenter * NERDTree
let NERDTreeIgnore = ['\.pyc$']
" Go to previous (last accessed) window.
autocmd VimEnter * wincmd p

" ruby
autocmd FileType ruby,eruby set omnifunc=rubycomplete#Complete
autocmd FileType ruby,eruby let g:rubycomplete_buffer_loading = 1
autocmd FileType ruby,eruby let g:rubycomplete_rails = 1
autocmd FileType ruby,eruby let g:rubycomplete_classes_in_global = 1
set re=1

let g:ctrlp_clear_cache_on_exit = 1
if executable("ag")
    set grepprg=ag\ --nogroup\ --nocolor
    let g:ctrlp_user_command = 'ag %s -i --nocolor --nogroup --ignore ''.git'' --ignore ''.DS_Store'' --ignore ''node_modules'' --ignore ''bower_components'' --ignore ''media'' --ignore ''.pyc'' --hidden -g ""'
endif

" YouCompleteMe
let g:ycm_python_binary_path = 'python3'
let g:ycm_global_ycm_extra_conf='~/.ycm_extra_conf.py'
" let g:ycm_rust_src_path = '~/rustc-1.11.0/src/'
nnoremap <leader>jd :YcmCompleter GoTo<CR>

" syntastic
" let g:syntastic_python_checkers = ['flake8']
" let g:syntastic_cpp_compiler = 'clang++'
" let g:syntastic_cpp_compiler_options = ' -std=c++11 -stdlib=libc++'
" let g:syntastic_html_checkers = ['tidy']
" let g:syntastic_html_tidy_exec = 'tidy'
" let g:tsuquyomi_disable_quickfix = 1
" let g:syntastic_typescript_checkers = ['tsuquyomi'] " You shouldn't use 'tsc' checker.

" ale
let g:ale_fixers = {
            \ 'javascript': ['tsserver'],
            \ 'python': ['flake8'],
            \ 'c++': ['clang'],
            \ 'html': ['tidy'],
            \ }

let g:indent_guides_auto_colors = 0
let g:indent_guides_guide_size = 1
autocmd VimEnter,Colorscheme * :hi IndentGuidesOdd  ctermbg=234
autocmd VimEnter,Colorscheme * :hi IndentGuidesEven ctermbg=235

let g:airline_powerline_fonts = 1

" multiple cursors
let g:multi_cursor_prev_key='<C-b>'
