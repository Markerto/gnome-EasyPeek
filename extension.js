//gnome 45+ code
import Clutter from 'gi://Clutter';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export default class ShowDesktopClickExtension {
    constructor() {
        this._windowsHidden = [];
        this._hiddenWindows = [];
        this._hiddenActors = [];
        this._captureEventId = null;
        this._windowFocusIds = [];
    }

    _restoreAllWindows() {

	const currIndex = global.workspace_manager.get_active_workspace_index();

        // Show windows
        this._hiddenWindows[currIndex].forEach(win => {
            win.unminimize();
        });
        this._hiddenWindows[currIndex] = [];

        // For Modal windows
        this._hiddenActors[currIndex].forEach(actor => {
            actor.show();
        });
        this._hiddenActors[currIndex] = [];

        // Disconnect window focus handlers
        this._windowFocusIds[currIndex].forEach(({win, id}) => {
            win.disconnect(id);
        });
        this._windowFocusIds[currIndex] = [];

        this._windowsHidden[currIndex]= false;
    }

    _toggleDesktop() {
        const workspace = global.workspace_manager.get_active_workspace();
        const currIndex = global.workspace_manager.get_active_workspace_index();
        const windows = workspace.list_windows();

        windows.forEach(win => {
            if(!win.minimized){
                this._windowsHidden[currIndex] = false;
            }
        })

        if (this._windowsHidden[currIndex]) {
            this._restoreAllWindows();
        } else {
            // Hide windows
            this._hiddenWindows [currIndex]= [];
            this._hiddenActors[currIndex] = [];
            this._windowFocusIds[currIndex] = [];

            windows.forEach(win => {
                if (!win.minimized) {
                    const windowType = win.get_window_type();

                    if (windowType === Meta.WindowType.NORMAL) {
                        // Minimize normal windows
                        this._hiddenWindows[currIndex].push(win);
                        win.minimize();
                    } else if (windowType === Meta.WindowType.MODAL_DIALOG ||
                               windowType === Meta.WindowType.DIALOG) {
                        // Hide modal/dialog windows
                        const actor = win.get_compositor_private();
                        if (actor && actor.visible) {
                            this._hiddenActors[currIndex].push(actor);
                            actor.hide();

                            // Connect to focus-in event to restore all when modal is activated
                            const focusId = win.connect('focus', () => {
                                if (this._windowsHidden[currIndex]) {
                                    this._restoreAllWindows();
                                }
                            });
                            this._windowFocusIds[currIndex].push({win: win, id: focusId});
                        }
                    }
                }
            });
            this._windowsHidden[currIndex] = true;
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
        if (this._windowsHidden[currIndex]) {
            this._restoreAllWindows();
        }
    }
}
