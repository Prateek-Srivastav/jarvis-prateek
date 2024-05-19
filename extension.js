import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import St from "gi://St";
import GObject from "gi://GObject";
import Clutter from "gi://Clutter";
import Soup from "gi://Soup";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

export default class JarvisExtension extends Extension {
  enable() {
    this.jarvis = new Jarvis({
      settings: this.getSettings(),
      openSettings: this.openPreferences,
      uuid: this.uuid,
    });

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
  { GTypeName: "Jarvis" },
  class Jarvis extends PanelMenu.Button {
    destroy() {
      this._unbindShortcuts();
      this.#clearTimeouts();
      super.destroy();
    }

    _init(extension) {
      super._init(0.0, _("Jarvis"));
      this.extension = extension;
      this._shortcutsBindingIds = [];

      let hbox = new St.BoxLayout({
        style_class: "box-layout",
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
        hint_text: _("ask anything..."),
        can_focus: true,
        width: 400,
      });

      // Add the input field to the menu
      let menuItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
      menuItem.add_child(inputItem);
      this.menu.addMenuItem(menuItem);

      this.menu.connect("open-state-changed", (self, open) => {
        this._setFocusOnOpenTimeout = setTimeout(() => {
          if (open) {
            global.stage.set_key_focus(inputItem);
            this.makeWebSocketConnection(resultLabel, inputItem);
          }
        }, 50);
      });

      // let scrollView = new St.ScrollView({
      //   style_class: "scroll-view",
      //   // x_expand: true,
      //   // y_expand: true,
      //   overlay_scrollbars: true,
      //   // hscrollbar_policy:2,
      //   enable_mouse_scrolling: true,
      //   hscrollbar_policy: St.PolicyType.NEVER,
      //   vscrollbar_policy: St.PolicyType.AUTOMATIC,
      //   height: 100,
      // });

      // Create a label for displaying the input text with fixed width and multiline support
      let resultLabel = new Clutter.Text({
        // style_class: "result-label", // Use a custom style class for additional styling
        // text: "",
        line_wrap: true,
        width: 400, // Set a fixed width in pixels
      });

      const whiteColor = Clutter.Color.from_string("#ffffff")[1];
      resultLabel.set_color(whiteColor);

      // Add the label to the menu
      let resultItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
      // scrollView.add_actor(resultLabel);
      // scrollView.set_child(resultItem);
      resultItem.add_child(resultLabel);
      this.menu.addMenuItem(resultItem);

      // Handle the 'key-press-event' for the input field
      this._bindShortcuts();
      // this.makeWebSocketConnection(resultLabel, inputItem);

      resultLabel.set_text(this.get_starting_text());
      // inputItem.clutter_text.connect("key-press-event", (actor, event) => {
      //   let symbol = event.get_key_symbol();
      //   if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
      //     // When Enter is pressed, make a request and update the label with the result
      //     this.makeRequest(resultLabel, inputItem);
      //     return Clutter.EVENT_STOP;
      //   }
      //   return Clutter.EVENT_PROPAGATE;
      // });
    }

    _bindShortcuts() {
      this._bindShortcut("toggle-assistant", this._toggleMenu);
    }

    _unbindShortcuts() {
      this._shortcutsBindingIds.forEach((id) => Main.wm.removeKeybinding(id));

      this._shortcutsBindingIds = [];
    }

    _bindShortcut(name, cb) {
      var ModeType = Shell.hasOwnProperty("ActionMode")
        ? Shell.ActionMode
        : Shell.KeyBindingMode;

      Main.wm.addKeybinding(
        name,
        this.extension.settings,
        Meta.KeyBindingFlags.NONE,
        ModeType.ALL,
        cb.bind(this)
      );

      this._shortcutsBindingIds.push(name);
    }

    _toggleMenu() {
      this.menu.toggle();
    }

    #clearTimeouts() {
      if (this._setFocusOnOpenTimeout)
        clearTimeout(this._setFocusOnOpenTimeout);
    }

    // makeRequest(resultLabel, inputItem) {
    //   let httpSession = new Soup.Session();
    //   let params = {
    //     question: inputItem.get_text(),
    //     // messages: JSON.stringify([
    //     //   { role: "user", content: "meaning of meaning in one line" },
    //     // ]),
    //     // model: "mixtral-8x7b-32768",
    //   };
    //   let message = Soup.Message.new_from_encoded_form(
    //     "POST",
    //     "http://localhost:9565/response",
    //     Soup.form_encode_hash(params)
    //   );
    //   // message.request_headers.append("Authorization", "Bearer <API_KEY>");
    //   // message.request_headers.append("Content-Type", "application/json");
    //   resultLabel.set_text("transmitting question...");
    //   console.log("HELLLO");
    //   httpSession.send_and_read_async(
    //     message,
    //     GLib.PRIORITY_DEFAULT,
    //     null,
    //     (session, result) => {
    //       console.log("MESSAGE: ", message.get_status());
    //       // if (message.get_status() === Soup.Status.OK) {
    //       let bytes = session.send_and_read_finish(result);
    //       let decoder = new TextDecoder("utf-8");
    //       let response = decoder.decode(bytes.get_data());
    //       console.log(`Response: ${response}`);
    //       resultLabel.set_text(response);
    //       // }
    //     }
    //   );

    //   resultLabel.set_text("thinking...");
    // }

    makeWebSocketConnection(resultLabel, inputItem, close = false) {
      const session = new Soup.Session();
      const message = new Soup.Message({
        method: "GET",
        uri: GLib.Uri.parse("ws://localhost:8080/", GLib.UriFlags.NONE),
      });
      const decoder = new TextDecoder();

      session.websocket_connect_async(
        message,
        null,
        [],
        null,
        null,
        websocket_connect_async_callback
      );

      function websocket_connect_async_callback(_session, res) {
        let connection;

        try {
          connection = session.websocket_connect_finish(res);
        } catch (err) {
          logError(err);
          return;
        }

        connection.connect("closed", () => {
          log("closed");
        });

        connection.connect("error", (self, err) => {
          logError(err);
        });

        let result = "";
        let messages = [];
        connection.connect("message", (self, type, data) => {
          if (type !== Soup.WebsocketDataType.TEXT) return;

          let str = decoder.decode(data.toArray());
          if (str.length > 1) str = JSON.parse(str);
          // console.log(str);
          result += str.res;
          messages = str.messages;

          // log("messages", messages);
          resultLabel.set_text(result);
          inputItem.clutter_text.connect("key-press-event", (actor, event) => {
            let symbol = event.get_key_symbol();
            if (
              symbol === Clutter.KEY_Return ||
              symbol === Clutter.KEY_KP_Enter
            ) {
              // When Enter is pressed, make a request and update the label with the result
              console.log("inside", messages);

              connection.send_text(
                JSON.stringify({
                  messages: messages,
                  question: inputItem.get_text(),
                })
              );
              result = "";
              return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
          });

          // connection.close(Soup.WebsocketCloseCode.NORMAL, null);
        });

        log("open");
      }
    }

    get_starting_text() {
      const texts = [
        "Aha, your laptop must have pulled quite the stunt to deserve a restart. Care to share the drama?",
        "Ah, a laptop reboot! I'm curious what prompted this delightful refresh.",
        "Aha, your laptop graced us with a reboot. Care to share what sin it committed to deserve this?",
        "I see, you've rebooted your laptop.\nCan I know what your laptop did to owe this pleasure?",
      ];

      const randomIndex = Math.floor(Math.random() * texts.length);
      return texts[randomIndex];
    }
  }
);
