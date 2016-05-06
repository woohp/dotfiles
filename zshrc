# Path to your oh-my-zsh configuration.
ZSH=$HOME/.oh-my-zsh

# Set name of the theme to load.
# Look in ~/.oh-my-zsh/themes/
# Optionally, if you set this to "random", it'll load a random theme each
# time that oh-my-zsh is loaded.
ZSH_THEME="huipeng"

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

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
plugins=(git osx django autojump bower brew npm python virtualenvwrapper)
source $ZSH/oh-my-zsh.sh

source $HOME/.arabica.zsh

# Customize to your needs...
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin
# export PATH=/Developer/NVIDIA/CUDA-7.5/bin:$PATH
export CPATH=/usr/local/opt/emscripten/libexec/system/include/:/usr/local/opt/libxml2/include/libxml2:/usr/local/include:$CPATH
# export DYLD_LIBRARY_PATH=/Users/huipeng/cuda:/Developer/NVIDIA/CUDA-7.5/lib:$DYLD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/local/cuda/lib:$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/local/opt/libxml2/lib:$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
export TERMINFO="$HOME/.terminfo"

export HOMEBREW_NO_ANALYTICS=1

unsetopt SHARE_HISTORY

alias v='nvim'
alias tmux='tmux'

export PATH="$HOME/.rbenv/bin:$PATH"
if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi

PATH=$PATH:$HOME/.rvm/bin # Add RVM to PATH for scripting
[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

export PATH="/usr/local/share/npm/bin:$PATH"
export NODE_PATH="/usr/local/lib/node:/usr/local/share/npm/lib/node_modules"

alias gl="git log --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

export WORKON_HOME="$HOME/.virtualenvs"
PYTHONPATH="/usr/local/lib/python2.7/site-packages/:$PYTHONPATH"
# export PIP_REQUIRE_VIRTUALENV=true
source /usr/local/bin/virtualenvwrapper.sh

export EDITOR=vim
export LESS='-R -X -F'

alias ag="ag --pager less"

export GIRI_OAUTH='25fbcfcf65497a35ae961e7d08b4c1825e408a59'
