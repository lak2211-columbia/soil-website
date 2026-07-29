#!/usr/bin/env bash
# One-step publish for the SOIL site.
#   Usage:  bash push.sh
set -u
cd "$(dirname "$0")" || exit 1

REPO="soil-website"
echo
echo "  SOIL → GitHub"
echo "  ============="
echo

# --- 1. clean the scaffolding left by the sandbox ---------------------------
# The folder was created over a mount that can't delete files, so git left
# stale lock files behind. Start from a fresh repo — there's no history to keep.
rm -f  .write_test 2>/dev/null
rm -rf .git        2>/dev/null

if ! command -v git >/dev/null 2>&1; then
  echo "  git isn't installed. Install Xcode command line tools:"
  echo "      xcode-select --install"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "  The GitHub CLI isn't installed. Install it, then re-run this script:"
  echo
  echo "      brew install gh"
  echo
  echo "  (No Homebrew? Get it at https://brew.sh — or see FALLBACK in README.)"
  exit 1
fi

# --- 2. pick the account ---------------------------------------------------
if gh auth status >/dev/null 2>&1; then
  CUR=$(gh api user --jq .login 2>/dev/null || echo "?")
  echo "  You're currently signed in to GitHub as:  $CUR"
  printf "  Publish as this account? [y/N] "
  read -r YN
  case "${YN:-n}" in
    y|Y) ;;
    *)
      echo "  Signing out so you can choose another account…"
      gh auth logout 2>/dev/null
      gh auth login || { echo "  Login cancelled."; exit 1; }
      ;;
  esac
else
  echo "  Not signed in yet — opening the GitHub login."
  echo "  Choose:   GitHub.com  →  HTTPS  →  Login with a web browser"
  echo
  gh auth login || { echo "  Login cancelled."; exit 1; }
fi

USER=$(gh api user --jq .login) || { echo "  Couldn't read your account."; exit 1; }
echo
echo "  Publishing as: $USER"
echo

# --- 3. fresh repo, commit authored by that account ------------------------
EMAIL=$(gh api user --jq '.email // empty' 2>/dev/null)
[ -z "$EMAIL" ] && EMAIL="${USER}@users.noreply.github.com"

git init -q -b main
git config user.name  "$USER"
git config user.email "$EMAIL"
git add index.html README.md LICENSE .nojekyll push.sh
git commit -q -m "Add SOIL magazine homepage" || { echo "  Nothing to commit?"; exit 1; }

# --- 4. create + push ------------------------------------------------------
if gh repo view "$USER/$REPO" >/dev/null 2>&1; then
  echo "  github.com/$USER/$REPO already exists — pushing to it."
  git remote add origin "https://github.com/$USER/$REPO.git" 2>/dev/null
  git push -u origin main --force || { echo "  Push failed."; exit 1; }
else
  echo "  Creating github.com/$USER/$REPO …"
  gh repo create "$REPO" --public --source=. --push \
      --description "SOIL — 소소한 일상. A magazine of the ordinary, organised around 의식주." \
    || { echo "  Repo creation failed."; exit 1; }
fi

# --- 5. github pages -------------------------------------------------------
echo "  Turning on GitHub Pages …"
gh api -X POST "repos/$USER/$REPO/pages" \
     -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || gh api -X PUT "repos/$USER/$REPO/pages" \
       -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || echo "  (Couldn't set it automatically — do it in Settings → Pages → main / root)"

echo
echo "  ✓ Done."
echo "    Repo:  https://github.com/$USER/$REPO"
echo "    Site:  https://$USER.github.io/$REPO/     (live in about a minute)"
echo
