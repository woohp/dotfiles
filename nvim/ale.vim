let g:ale_linters_explicit = 1
let g:ale_linters = {
            \ 'python': ['ruff', 'mypy'],
            \ 'c++': ['clang'],
            \ 'typescript': ['tsserver'],
            \ 'javascript': ['eslint'],
            \ 'html': ['tidy'],
            \ 'rust': ['rls'],
            \ '*': [],
\}
let g:ale_cpp_clang_executable = 'clang++'
let g:ale_cpp_clang_options = '-std=c++1z -stdlib=libc++ -Wall'
let g:ale_python_mypy_options = '--ignore-missing-imports'

