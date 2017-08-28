mkdir $HOME/.config

ln -sf "$PWD/nvim" $HOME/.config/nvim
ln -sf "$PWD/zshrc" $HOME/.zshrc
ln -sf "$PWD/gitignore" $HOME/.gitignore

tic xterm-256color.ti

defaults write -g ApplePressAndHoldEnabled -bool false
mkdir $HOME/.vim_swap
