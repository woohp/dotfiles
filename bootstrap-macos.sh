#!/usr/bin/env bash
set -euo pipefail

DOTFILES_REPO_URL="${DOTFILES_REPO_URL:-https://github.com/woohp/dotfiles.git}"
DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"
packages=(zsh git ripgrep tmux starship nvim ghostty bat pi)

script_dir="$(cd "$(dirname "$0")" && pwd -P)"
repo_dir="$script_dir"

if [ "$(uname)" != "Darwin" ]; then
  echo "error: bootstrap-macos.sh is intended for macOS" >&2
  exit 1
fi

install_homebrew() {
  if command -v brew >/dev/null 2>&1; then
    return
  fi

  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
}

load_homebrew_shellenv() {
  if command -v brew >/dev/null 2>&1; then
    return
  fi

  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

clone_or_update_dotfiles() {
  if [ -f "$repo_dir/Brewfile" ]; then
    return
  fi

  repo_dir="$DOTFILES_DIR"

  if [ -d "$repo_dir/.git" ]; then
    echo "Updating dotfiles in $repo_dir..."
    git -C "$repo_dir" pull --ff-only
  elif [ -e "$repo_dir" ]; then
    echo "error: $repo_dir exists but is not a git checkout" >&2
    exit 1
  else
    echo "Cloning dotfiles to $repo_dir..."
    git clone "$DOTFILES_REPO_URL" "$repo_dir"
  fi

  cd "$repo_dir"
}

run_brew_bundle() {
  echo "Installing Homebrew packages from Brewfile..."
  brew bundle --file "$repo_dir/Brewfile"
}

install_oh_my_zsh() {
  if [ -d "$HOME/.oh-my-zsh" ]; then
    return
  fi

  echo "Installing oh-my-zsh..."
  RUNZSH=no CHSH=no KEEP_ZSHRC=yes sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
}

link_dotfiles() {
  echo "Dry-running Stow..."
  stow --dotfiles --simulate --verbose "${packages[@]}"

  echo
  echo "Applying Stow..."
  stow --dotfiles --verbose "${packages[@]}"
}

run_optional_setup() {
  echo "Creating ~/.vim_swap..."
  mkdir -p "$HOME/.vim_swap"
}

print_next_steps() {
  cat <<'EOF'

Bootstrap complete.

Recommended next steps:
  - Authenticate GitHub: gh auth login
  - Create an SSH key if needed: ssh-keygen -t ed25519 -C "you@example.com"
  - Copy your SSH public key: pbcopy < ~/.ssh/id_ed25519.pub
  - Sign in to ChatGPT, Google Cloud, Tailscale, Synology Drive, and KeePassXC as needed
EOF
}

install_homebrew
load_homebrew_shellenv
clone_or_update_dotfiles
run_brew_bundle
install_oh_my_zsh
link_dotfiles
run_optional_setup
print_next_steps
