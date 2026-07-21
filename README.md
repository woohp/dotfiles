dotfiles
========

Managed with [GNU Stow](https://www.gnu.org/software/stow/).

## Install

```sh
brew install stow
sudo pacman -S stow
```

## Fresh macOS setup

From a brand-new Mac, open Terminal.app and run:

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/woohp/dotfiles/main/bootstrap-macos.sh)"
```

Or, if the repo is already cloned:

```sh
cd ~/dotfiles
./bootstrap-macos.sh
```

This installs Homebrew if needed, clones or updates `~/dotfiles`, installs packages from `Brewfile`, links dotfiles with Stow, and creates `~/.vim_swap`. It does not apply macOS defaults or terminal database changes.

## Migrate an existing pre-Stow machine

If the machine was previously set up with the old manual symlinks:

```sh
cd ~/dotfiles
git pull
./migrate.sh
```

This removes only old symlinks that point into this dotfiles checkout, then dry-runs and applies Stow.

## Link dotfiles manually

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
