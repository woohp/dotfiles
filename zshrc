# Path to your oh-my-zsh configuration.
ZSH=$HOME/.oh-my-zsh

# Set name of the theme to load.
# Look in ~/.oh-my-zsh/themes/
# Optionally, if you set this to "random", it'll load a random theme each
# time that oh-my-zsh is loaded.
# ZSH_THEME="pure"
ZSH_THEME=""

# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

# Set to this to use case-sensitive completion
# CASE_SENSITIVE="true"

# Comment this out to disable weekly auto-update checks
# DISABLE_AUTO_UPDATE="true"

# Uncomment following line if you want to disable colors in ls
# DISABLE_LS_COLORS="true"

# Uncomment following line if you want to disable autosetting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment following line if you want red dots to be displayed while waiting for completion
# COMPLETION_WAITING_DOTS="true"

export VIRTUALENVWRAPPER_PYTHON=/usr/local/opt/python/libexec/bin/python

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# export VIRTUALENVWRAPPER_PYTHON="/usr/local/bin/python3"

plugins=(git osx django autojump new npm python virtualenvwrapper)

source $ZSH/oh-my-zsh.sh
source $HOME/.arabica.zsh

autoload -U promptinit; promptinit
prompt pure

# Customize to your needs...
export PATH=/usr/local/cuda/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin
export PATH=/usr/local/opt/python/libexec/bin:$PATH
# export CPATH=/usr/local/opt/emscripten/libexec/system/include/:/usr/local/opt/libxml2/include/libxml2:/usr/local/include:$CPATH
export CPATH=/usr/local/cuda/include:/usr/local/opt/libxml2/include/libxml2:/usr/local/include:$CPATH
export LD_LIBRARY_PATH=/usr/local/cuda/lib:$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/local/opt/libxml2/lib:$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
export TERMINFO="$HOME/.terminfo"

export HOMEBREW_NO_ANALYTICS=1

unsetopt SHARE_HISTORY

alias v='nvim'
alias vim='nvim'
# alias tmux='tmux'

# export PATH="$HOME/.rbenv/bin:$PATH"
# if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

# PATH=$PATH:$HOME/.rvm/bin # Add RVM to PATH for scripting
# [[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

export PATH="/usr/local/share/npm/bin:$PATH"
export NODE_PATH="/usr/local/lib/node:/usr/local/share/npm/lib/node_modules"

alias gl="git log --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

export PIP_REQUIRE_VIRTUALENV=true
export WORKON_HOME="$HOME/.virtualenvs"
# export PYTHONPATH="/usr/local/lib/python2.7/site-packages/:$PYTHONPATH"
source /usr/local/bin/virtualenvwrapper.sh

export EDITOR=nvim
export LESS='-RXF'

# alias ag="ag -Q --pager less"


man() {
    env \
        LESS_TERMCAP_mb=$(printf "\e[1;31m") \
        LESS_TERMCAP_md=$(printf "\e[1;31m") \
        LESS_TERMCAP_me=$(printf "\e[0m") \
        LESS_TERMCAP_se=$(printf "\e[0m") \
        LESS_TERMCAP_so=$(printf "\e[1;44;33m") \
        LESS_TERMCAP_ue=$(printf "\e[0m") \
        LESS_TERMCAP_us=$(printf "\e[1;32m") \
        man "$@"
    }

export PATH="$HOME/.yarn/bin:$PATH"

function ag()
{
    /usr/bin/env rg -p "$@" | less -RXF
}

export FZF_DEFAULT_COMMAND='rg --files --hidden --ignore-file ~/.rgignore'
alias ls=exa

source ~/.zprofile
