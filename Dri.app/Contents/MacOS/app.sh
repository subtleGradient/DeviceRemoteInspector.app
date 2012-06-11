#!/usr/bin/env bash -l
ProcessSerialNumber="$1"

function main () {
  export BundleIdentifier="com.subtlegradient.facebook.Dri"
  export App="$(cd "$(dirname "$0")/../..";pwd)"
  export SharedSupport="$App/Contents/SharedSupport"
  export PATH="$PATH:$SharedSupport/bin"
  
  export UserSupport="$HOME/Library/Application Support/Dri"
  export Logs="$HOME/Library/Logs/Dri"
  export BuildString="$(cd "$App"; git log -1 --pretty=format:"(%h) built %cr")"
  export BuildHash="$(cd "$App"; git log -1 --pretty=format:"%h")"
  export Version="$(node -e "console.log(require('$App/Contents/package.json').version)")"
  
  export DefaultConfig="$App/Contents/config.json"
  export UserConfig="$HOME/Library/Application Support/Dri/config.json"
  
  export CocoaDialog="$SharedSupport/bin/cocoaDialog.app/Contents/MacOS/CocoaDialog"
  
  mkdir -p "$UserSupport"
  mkdir -p "$Logs"
  
  local DateStamp="$(date "+%Y-%m-%d_%H-%M-%S")"
  export CurrentLog="$Logs/Dri.app.$DateStamp.log"
  
  rm "$Logs/Dri.app.log" &> /dev/null
  gzip "$Logs"/*.log &> /dev/null
  
  touch "$CurrentLog"
  ln "$CurrentLog" "$Logs/Dri.app.log"
  
  pre-launch &> "$CurrentLog"
}

function pre-launch () {
  echo "Launching $BundleIdentifier v$Version ($BuildHash) at $App as $ProcessSerialNumber"
  
  cleanup-from-last-launch
  if [[ $? == 0 ]]; then
    echo "Setting ProcessSerialNumber"
    echo "$ProcessSerialNumber" > "$UserSupport/ProcessSerialNumber"
    
    ensure-dependencies
    if [[ $? == 0 ]]; then
      echo "Dependencies met"
      setup
      launch
    fi
    
    echo "Cleaning up ProcessSerialNumber"
    rm "$UserSupport/ProcessSerialNumber"
  fi
  
  echo "Quitting"
}

function ensure-dependencies () {
  echo "Ensure Dependencies"
  
  export DYLD_FRAMEWORK_PATH="/Applications/WebKit.app/Contents/Frameworks/10.7"
  if [[ ! -d "$DYLD_FRAMEWORK_PATH" ]]; then
    echo "Missing Dependency '$DYLD_FRAMEWORK_PATH'"
    local returnValue=$(
      "$CocoaDialog" msgbox --float\
        --icon-file "$App/Contents/Resources/Dri.icns"\
        --title "Missing Dependency"\
        --text "$DYLD_FRAMEWORK_PATH cannot be found"\
        --informative-text "The WebKit Inspector depends on WebKit Nightly"\
        --button1 "Launch without Inspector"\
        --button2 "Get WebKit Nightly"\
        --button3 "Cancel & Quit"\
        --timeout 30
    )
    echo "User chose $returnValue"
    
    [[ $returnValue == 1 ]] && return 0 #launch
    [[ $returnValue == 2 ]] && open "http://nightly.webkit.org/"
    # [[ $returnValue == 0 ]] && return 1 #timeout
    # [[ $returnValue == 3 ]] && return 1 #cancel
    return 1 #quit immediately
  fi
  
  export NODE=`which node`
  if [[ ! -f "$NODE" ]]; then
    echo "Missing Dependency node.js"
    local returnValue=$(
      "$CocoaDialog" msgbox --float\
        --icon-file "$App/Contents/Resources/Dri.icns"\
        --title "Missing Dependency"\
        --text "Node.js cannot be found in your PATH"\
        --informative-text "This app needs node.js to work"\
        --button1 "Download node.js"\
        --button3 "😢 Cancel & Quit"\
        --timeout 30
    )
    echo "User chose $returnValue"
    
    [[ $returnValue == 1 ]] && open "http://nodejs.org/#download"
    return 1 #quit immediately
  fi
  
  return 0 #launch
}

function setup () {
  echo "Setup"
  echo "Enable Dri.app's own web inspector"
  defaults write $BundleIdentifier WebKitDeveloperExtras -bool true
}

function launch () {
  echo "Launching"
  
  cd "$UserSupport"
  "$NODE" "$App/Contents/MacOS/app.js" "$ProcessSerialNumber" --verbose
  
  [[ $? == 0 ]] || unexpected-quit
  
  is-up-to-date || "$App/Contents/MacOS/update.sh"
}

function unexpected-quit () {
  prompt "File bug report" "Quit unexpectedly" "Looks like Dri is busted" "It'd be awesome if you could tell Thomas about this" "⌘V to paste your most recent Dri.app log into your email"
  if [[ $? == 0 ]]; then
    cat $CurrentLog|pbcopy
    open "mailto:aylott@fb.com?subject=Dri v$Version ($BuildHash) crashed&body=Log is on my clipboard"
  fi
}

function cleanup-from-last-launch () {
  if [[ -f "$UserSupport/ProcessSerialNumber" ]]; then
    echo "ProcessSerialNumber file '$UserSupport/ProcessSerialNumber' already exists"
    prompt "Cleanup and Launch" "Dri quit unexpectedly" "Looks like Dri didn't quit properly last time" "This is probly a bug or something"
    if [[ $? == 0 ]]; then
      echo "Cleaning up ProcessSerialNumber"
      rm "$UserSupport/ProcessSerialNumber"
    fi
  fi
  
  echo "Looking for zombie processes to kill"
  ps wwx|grep "$App"|grep -v grep|grep -v "\\$ProcessSerialNumber"
  if [[ $? == 0 ]]; then
    prompt "Kill zombies and Launch" "Possible Zombie Infestation" "Looks like Dri is still running" "This is probly a bug"
    if [[ $? == 0 ]]; then
      echo "Killing the zombies"
      ps wwx|grep "$App"|grep -v grep|grep -v "\\$ProcessSerialNumber"|cut -d" " -f1|xargs kill
    fi
  fi
  
  # echo "Cleaning up Caches"
  # rm -rf "$HOME/Library/Caches/$BundleIdentifier"
}

function is-up-to-date () {
  echo "Checking for update"
  cd "$App"
  local HASH="$(git log -1 --pretty=format:%H)"
  git pull --rebase origin master || return 0
  local NEW_HASH="$(git log -1 --pretty=format:%H)"
  
  if [[ $HASH == $NEW_HASH ]]; then
    echo "Up-to-date"
    return 0
  else
    echo "Updated from git"
    return 1
  fi
}

function prompt () {
  echo "prompt $1 $2 $3 $4"
  local returnValue=$(
    "$CocoaDialog" msgbox --float\
      --icon-file "$App/Contents/Resources/Dri.icns"\
      --title "$2"\
      --text "$3"\
      --informative-text "$4"\
      --button1 "$1"\
      --button3 "Cancel"\
      --timeout 30
  )
  echo "User chose $returnValue"
  [[ $returnValue == 1 ]] && return 0 || return 1
}

main
