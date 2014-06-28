set nocompatible
filetype off

set rtp+=~/.vim/bundle/Vundle.vim/
call vundle#rc()

" let Vundle manage Vundle
" required! 
Bundle 'gmarik/Vundle.vim'

" other plugins
Bundle 'scrooloose/nerdtree'
Bundle 'kchmck/vim-coffee-script'
Bundle 'vim-ruby/vim-ruby'
Bundle 'slim-template/vim-slim'
Bundle 'kien/ctrlp.vim'
Bundle 'FelikZ/ctrlp-py-matcher'
Bundle 'altercation/vim-colors-solarized'
Bundle 'Valloric/YouCompleteMe'
Bundle 'pangloss/vim-javascript'
Bundle 'othree/html5.vim'
Bundle 'JesseKPhillips/d.vim'
Bundle 'scrooloose/syntastic'

set bs=2 "set backspace to be able to delete previous characters
set number "display line number

syntax on

" use soft tabs of 4 spaces
set autoindent
set cindent
set expandtab " expand tab to spaces
set shiftwidth=4
set softtabstop=4
" set tabstop=4 " set tab itself to be 4 spaces

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

" Informative status line
set laststatus=2 " always enable the status line
set statusline=%F%m%r%h%w\ [TYPE=%Y\ %{&ff}]\ [%l/%L\ (%p%%)]

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

set autochdir " always set the directory to that of the current file

" highlight Pmenu ctermbg=238 gui=bold
set term=xterm-256color
set bg=dark
colorscheme wombat2

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

" ruby
autocmd FileType ruby,eruby set omnifunc=rubycomplete#Complete
autocmd FileType ruby,eruby let g:rubycomplete_buffer_loading = 1
autocmd FileType ruby,eruby let g:rubycomplete_rails = 1
autocmd FileType ruby,eruby let g:rubycomplete_classes_in_global = 1

" ctrlp
if !has('python')
    echo 'In order to use pymatcher plugin, you need +python compiled vim'
else
    let g:ctrlp_match_func = { 'match': 'pymatcher#PyMatch' }
endif
let g:ctrlp_lazy_update = 100
let g:ctrlp_clear_cache_on_exit = 0
if executable("ag")
    set grepprg=ag\ --nogroup\ --nocolor
    let g:ctrlp_user_command = 'ag %s -i --nocolor --nogroup --ignore ''.git'' --ignore ''.DS_Store'' --ignore ''node_modules'' --hidden -g ""'
endif

" YouCompleteMe
let g:ycm_global_ycm_extra_conf='~/.ycm_extra_conf.py'

" syntastic
let g:syntastic_python_checkers = ['pyflakes']
let g:syntastic_cpp_compiler = 'clang++'
let g:syntastic_cpp_compiler_options = ' -std=c++11 -stdlib=libc++'

set re=1
