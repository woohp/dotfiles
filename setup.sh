mkdir $HOME/.config
mkdir $HOME/.config/nvim

ln -sf "$PWD/vim" $HOME/.vim
ln -sf "$PWD/vimrc" $HOME/.vimrc
ln -sf "$PWD/vimrc" $HOME/.config/nvim/init.vim
ln -sf "$PWD/zshrc" $HOME/.zshrc
ln -sf "$PWD/gitignore" $HOME/.gitignore

tic xterm-256color.ti

defaults write -g ApplePressAndHoldEnabled -bool false
