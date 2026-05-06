dotfiles
========

Managed with [GNU Stow](https://www.gnu.org/software/stow/).

## Install

```sh
brew install stow
sudo pacman -S stow
```

## Migrate an existing pre-Stow machine

If the machine was previously set up with the old manual symlinks:

```sh
cd ~/dotfiles
git pull
./migrate.sh
```

This removes only old symlinks that point into this dotfiles checkout, then dry-runs and applies Stow.

## Link dotfiles on a fresh machine

From the repo root:

```sh
stow --dotfiles --simulate --verbose zsh git ripgrep tmux starship nvim ghostty bat pi
stow --dotfiles --verbose zsh git ripgrep tmux starship nvim ghostty bat pi
```

## Unlink dotfiles

```sh
stow --dotfiles -D zsh git ripgrep tmux starship nvim ghostty bat pi
```

## Optional setup

```sh
tic terminal/xterm-256color.ti
mkdir -p ~/.vim_swap
```

On macOS:

```sh
defaults write -g ApplePressAndHoldEnabled -bool false
```
