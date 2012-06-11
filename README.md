# Dri.app
## Device Remote Inspector

*Note: If you download this app from as a zip, you'll need to rename the folder `subtleGradient-DeviceRemoteInspector.app-5a418c8` to `DeviceRemoteInspector.app` or else Mac OS X won't understand how to launch it.*

**The easiest way to inspect mobile web apps on your device.**

1. **Connect** device to your computer
2. **Launch** Dri.app
3. **Click** a tab to inspect it

*Currently only supports Google Chrome on Android* :,(

Uses the very latest bleeding edge devtools frontend with experimental feature support.

Updates automatically using git.

Created using Appify-UI by SubtleGradient.

* * *

## Getting Started

*This configuration stuff will only need to be done once for each device.*

1. [Install Chrome for Android](http://www.google.com/intl/en/chrome/android/ "Chrome for Android")

2. Turn on "USB Debugging" on your device
    * On the device, go to **Settings > Developer options** and enable USB debugging

4. Turn on Chrome Remote Debugging
  * Launch Chrome
  * Open **Settings > Advanced > Developer tools** and check **Enable USB Web debugging**  
    ![Screenshot Enable USB Web debugging](https://developers.google.com/chrome/mobile/images/webDebugMenu.png "")

5. Plug device into your Mac

6. Launch Dri.app on your Mac

## FAQ

### Android 2.3?
I don't think it's possible to get the remote web inspector working with Android 2.3. Apache Cordova Weinre is as good as you can get afaik (e.g. Adobe Shadow).

### iOS?
I may add support for it eventually. For now, use something like [iWebInspector.com](http://iWebInspector.com "Debugging tool for Safari on iPhone, iPad and PhoneGap apps - Remote Inspector (like Firebug) for JavaScript, HTML and CSS")

### Mac OS X?
*Only works on Mac OS X Lion*  
I'm too lazy to bother adding Snow Leopard support.

### Linux?
Sorry, Linux is great, but I'm too lazy to bother.

### Windows 8?
Sorry, Windows 8 is great, but I'm too lazy to bother.

### Windows 7?
Sorry, I'm too lazy to bother.
