import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class ClipboardIndicatorPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    window._settings = this.getSettings();
    const settingsUI = new Settings(window._settings);
    const page = new Adw.PreferencesPage();
    // page.add(settingsUI.ui);
    // page.add(settingsUI.behavior);
    // page.add(settingsUI.limits);
    // page.add(settingsUI.topbar);
    // page.add(settingsUI.notifications);
    page.add(settingsUI.shortcuts);
    window.add(page);
  }
}

class Settings {
  constructor(schema) {
    this.schema = schema;

    this.shortcuts = new Adw.PreferencesGroup({ title: _("Shortcuts") });
    this.#buildShorcuts(this.shortcuts);
  }

  #shortcuts = {
    // [PrefsFields.BINDING_PRIVATE_MODE]: _("Private mode"),
    ["toggle-menu"]: _("Toggle the menu"),
    // [PrefsFields.BINDING_CLEAR_HISTORY]: _("Clear history"),
    // [PrefsFields.BINDING_PREV_ENTRY]: _("Previous entry"),
    // [PrefsFields.BINDING_NEXT_ENTRY]: _("Next entry"),
  };

  #buildShorcuts(group) {
    this.field_keybinding_activation = new Adw.SwitchRow({
      title: _("Enable shortcuts"),
    });

    group.add(this.field_keybinding_activation);

    for (const [pref, title] of Object.entries(this.#shortcuts)) {
      const row = new Adw.ActionRow({
        title,
      });

      row.add_suffix(this.#createShortcutButton(pref));

      group.add(row);
    }
  }

  #createShortcutButton(pref) {
    const button = new Gtk.Button({
      has_frame: false,
    });

    const setLabelFromSettings = () => {
      const originalValue = this.schema.get_strv(pref)[0];

      if (!originalValue) {
        button.set_label(_("Disabled"));
      } else {
        button.set_label(originalValue);
      }
    };

    const startEditing = () => {
      button.isEditing = button.label;
      button.set_label(_("Enter shortcut"));
    };

    const revertEditing = () => {
      button.set_label(button.isEditing);
      button.isEditing = null;
    };

    const stopEditing = () => {
      setLabelFromSettings();
      button.isEditing = null;
    };

    setLabelFromSettings();

    button.connect("clicked", () => {
      if (button.isEditing) {
        revertEditing();
        return;
      }

      startEditing();

      const eventController = new Gtk.EventControllerKey();
      button.add_controller(eventController);

      let debounceTimeoutId = null;
      const connectId = eventController.connect(
        "key-pressed",
        (_ec, keyval, keycode, mask) => {
          if (debounceTimeoutId) clearTimeout(debounceTimeoutId);

          mask = mask & Gtk.accelerator_get_default_mod_mask();

          if (mask === 0) {
            switch (keyval) {
              case Gdk.KEY_Escape:
                revertEditing();
                return Gdk.EVENT_STOP;
              case Gdk.KEY_BackSpace:
                this.schema.set_strv(pref, []);
                setLabelFromSettings();
                stopEditing();
                eventController.disconnect(connectId);
                return Gdk.EVENT_STOP;
            }
          }

          const selectedShortcut = Gtk.accelerator_name_with_keycode(
            null,
            keyval,
            keycode,
            mask
          );

          debounceTimeoutId = setTimeout(() => {
            eventController.disconnect(connectId);
            this.schema.set_strv(pref, [selectedShortcut]);
            stopEditing();
          }, 400);

          return Gdk.EVENT_STOP;
        }
      );

      button.show();
    });

    return button;
  }
}
