#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
repo_dir="$(pwd -P)"
packages=(zsh git ripgrep tmux starship nvim ghostty bat)
old_targets=(
  "$HOME/.zshrc"
  "$HOME/.zprofile"
  "$HOME/.gitconfig"
  "$HOME/.gitignore"
  "$HOME/.rgignore"
  "$HOME/.ripgreprc"
  "$HOME/.tmux.conf"
  "$HOME/.config/starship.toml"
  "$HOME/.config/nvim"
  "$HOME/.config/ghostty"
)

if ! command -v stow >/dev/null 2>&1; then
  echo "error: GNU Stow is not installed. On macOS: brew install stow" >&2
  exit 1
fi

echo "Removing old pre-Stow symlinks that point into: $repo_dir"

for target in "${old_targets[@]}"; do
  if [ ! -L "$target" ]; then
    continue
  fi

  link="$(readlink "$target")"

  # Old setup.sh created absolute symlinks via $PWD. Only remove symlinks
  # that clearly point into this dotfiles checkout.
  case "$link" in
    "$repo_dir"/*)
      rm "$target"
      echo "removed $target -> $link"
      ;;
    *)
      echo "skipped $target -> $link"
      ;;
  esac
done

echo
echo "Dry-running Stow..."
stow --dotfiles --simulate --verbose "${packages[@]}"

echo
echo "Applying Stow..."
stow --dotfiles --verbose "${packages[@]}"

echo
echo "Migration complete."
echo "Optional setup:"
echo "  tic terminal/xterm-256color.ti"
echo "  mkdir -p ~/.vim_swap"
if [ "$(uname)" = "Darwin" ]; then
  echo "  defaults write -g ApplePressAndHoldEnabled -bool false"
fi
