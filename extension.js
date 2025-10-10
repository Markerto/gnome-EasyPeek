//gnome 45+ code
import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class ShowDesktopClickExtension {
    constructor() {
        this._windowsHidden = false;
        this._hiddenWindows = [];
        this._captureEventId = null;
    }

    _toggleDesktop() {
        const workspace = global.workspace_manager.get_active_workspace();
        const windows = workspace.list_windows();
        
        if (this._windowsHidden) {
            // Show windows
            this._hiddenWindows.forEach(win => {
                win.unminimize();
            });
            this._hiddenWindows = [];
            this._windowsHidden = false;
        } else {
            // Hide windows
            this._hiddenWindows = [];
            windows.forEach(win => {
                if (!win.minimized && win.get_window_type() === Meta.WindowType.NORMAL) {
                    this._hiddenWindows.push(win);
                    win.minimize();
                }
            });
            this._windowsHidden = true;
        }
    }

    _onBackgroundClick(actor, event) {
        // Only respond to primary button clicks
        if (event.get_button() !== 1) {
            return Clutter.EVENT_PROPAGATE;
        }
        
        // Get the actor at the event coordinates
        const [x, y] = event.get_coords();
        const actor_at_pos = global.stage.get_actor_at_pos(
            Clutter.PickMode.REACTIVE, x, y
        );
        
        // Click check
        const backgroundGroup = Main.layoutManager._backgroundGroup;
        const isBackgroundClick = (
            actor_at_pos === backgroundGroup ||
            (actor_at_pos && backgroundGroup && backgroundGroup.contains(actor_at_pos)) ||
            actor_at_pos === global.stage ||
            (actor_at_pos && actor_at_pos.get_parent() === backgroundGroup)
        );
        
        if (isBackgroundClick) {
            this._toggleDesktop();
            return Clutter.EVENT_STOP;
        }
        
        return Clutter.EVENT_PROPAGATE;
    }

    enable() {
        // Connect to capture event on the stage
        this._captureEventId = global.stage.connect('captured-event', (actor, event) => {
            if (event.type() === Clutter.EventType.BUTTON_PRESS) {
                return this._onBackgroundClick(actor, event);
            }
            return Clutter.EVENT_PROPAGATE;
        });
    }

    disable() {
        // Disconnect event handler
        if (this._captureEventId) {
            global.stage.disconnect(this._captureEventId);
            this._captureEventId = null;
        }
        
        // restore hidden windows
        if (this._windowsHidden) {
            this._hiddenWindows.forEach(win => {
                win.unminimize();
            });
            this._hiddenWindows = [];
            this._windowsHidden = false;
        }
    }
}
