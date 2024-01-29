mkdir -p $HOME/.config

ln -sf "$PWD/nvim" $HOME/.config/nvim
ln -sf "$PWD/zprofile" $HOME/.zprofile
ln -sf "$PWD/zshrc" $HOME/.zshrc
ln -sf "$PWD/gitconfig" $HOME/.gitconfig
ln -sf "$PWD/gitignore" $HOME/.gitignore
ln -sf "$PWD/rgignore" $HOME/.rgignore
ln -sf "$PWD/ripgreprc" $HOME/.ripgreprc
ln -sf "$PWD/starship.toml" $HOME/.config/starship.toml

tic xterm-256color.ti

if [ `uname` == "Darwin" ]; then
    defaults write -g ApplePressAndHoldEnabled -bool false
fi
mkdir $HOME/.vim_swap
