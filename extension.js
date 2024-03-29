import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import St from "gi://St";
import GObject from "gi://GObject";
import Clutter from "gi://Clutter";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

export default class JarvisExtension extends Extension {
  enable() {
    this.jarvis = new Jarvis();
    Main.panel.addToStatusArea("jarvis", this.jarvis, 1);
  }
  disable() {
    if (this.jarvis) {
      this.jarvis.destroy();
      this.jarvis = null;
    }
  }
}

const Jarvis = GObject.registerClass(
  {},
  class Jarvis extends PanelMenu.Button {
    _init() {
      super._init(0.0, _("Jarvis"));

      let hbox = new St.BoxLayout({
        style_class: "panel-status-menu-box clipboard-indicator-hbox",
      });
      this.hbox = hbox;

      let icon = new St.Icon({
        icon_name: "system-run-symbolic",
        style_class: "system-status-icon",
      });

      hbox.add_child(icon);
      this.add_child(hbox);

      // Create an input field
      let inputItem = new St.Entry({
        style_class: "example-input",
        hint_text: _("Type something..."),
        can_focus: true,
      });

      // Add the input field to the menu
      let menuItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
      menuItem.add_child(inputItem);
      this.menu.addMenuItem(menuItem);

      // Create a label for displaying the input text
      let resultLabel = new St.Label({
        style_class: "example-result-label",
        text: "",
      });

      // Add the label to the menu
      let resultItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
      resultItem.add_child(resultLabel);
      this.menu.addMenuItem(resultItem);

      // Handle the 'key-press-event' for the input field
      inputItem.clutter_text.connect("key-press-event", (actor, event) => {
        let symbol = event.get_key_symbol();
        if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
          // When Enter is pressed, update the label with the input text
          let inputText = inputItem.get_text();
          resultLabel.set_text(inputText);
          return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
      });
    }
  }
);
