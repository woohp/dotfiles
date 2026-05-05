dotfiles
========

Managed with [GNU Stow](https://www.gnu.org/software/stow/).

## Install

```sh
brew install stow
```

## Link dotfiles

From the repo root:

```sh
stow --dotfiles --simulate --verbose zsh git ripgrep tmux starship nvim ghostty bat
stow --dotfiles --verbose zsh git ripgrep tmux starship nvim ghostty bat
```

## Unlink dotfiles

```sh
stow --dotfiles -D zsh git ripgrep tmux starship nvim ghostty bat
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
