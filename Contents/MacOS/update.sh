#!/usr/bin/env bash -l

function main () {
  export App="$(dirname "$0")/../.."
  export SharedSupport="$App/Contents/SharedSupport"
  
  cd "$App"
  git pull --rebase origin master
}

main
