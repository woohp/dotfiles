mkdir -p $HOME/.config

ln -sf "$PWD/nvim" $HOME/.config/nvim
ln -sf "$PWD/zshrc" $HOME/.zshrc
ln -sf "$PWD/gitconfig" $HOME/.gitconfig
ln -sf "$PWD/gitignore" $HOME/.gitignore
ln -sf "$PWD/rgignore" $HOME/.rgignore

tic xterm-256color.ti

if [ `uname` == "Darwin" ]; then
    defaults write -g ApplePressAndHoldEnabled -bool false
fi
mkdir $HOME/.vim_swap
