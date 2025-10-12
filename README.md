# gnome-EasyPeek
A lightweight GNOME extension that lets you take a peek at your desktop. Click anywhere on the desktop to minimize or reveal all windows.

# GNOME Compatibility
Particularly tested on GNOME 48.

# Compatibility with other extensions
Works with similar extensions like Show Desktop Button, but with some limits:
- Since you can't minimize modal windows in GNOME, this extension hides the modal windows through compositor. The only way to bring back the modal window is to click on the desktop again. If windows are minimized and modal windows are hidden through this extension, other similar extensions won't bring back the modal windows unless it also contains the same feature. Though, turning off EasyPeek works seamlessly and modal window will still reveal itself without any confusion.
  
- Does not work with Desktop Icons.

# Install
https://extensions.gnome.org/extension/8666/easypeek/
