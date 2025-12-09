(function (global) {
  const FakeAuth = {
    _config: null,
    _loginWindow: null,
    _loginResolver: null,
    _loginRejecter: null,

    init(config) {
      if (!config || !config.authBaseUrl || !config.redirectUri) {
        throw new Error("FakeAuth.init membutuhkan authBaseUrl dan redirectUri");
      }
      this._config = config;
      window.addEventListener("message", this._handleMessage.bind(this));
    },

    login() {
      return new Promise((resolve, reject) => {
        if (!this._config) {
          return reject(new Error("FakeAuth belum di-init"));
        }

        const state = Math.random().toString(36).slice(2);
        const authUrl =
          this._config.authBaseUrl +
          "?redirect_uri=" +
          encodeURIComponent(this._config.redirectUri) +
          "&state=" +
          encodeURIComponent(state);

        const w = 420;
        const h = 600;
        const left = window.screenX + (window.innerWidth - w) / 2;
        const top = window.screenY + (window.innerHeight - h) / 2;

        this._loginWindow = window.open(
          authUrl,
          "fakeauth_login",
          `width=${w},height=${h},left=${left},top=${top}`
        );

        if (!this._loginWindow) {
          return reject(new Error("Popup diblokir. Izinkan popup untuk melanjutkan."));
        }

        this._expectedState = state;
        this._loginResolver = resolve;
        this._loginRejecter = reject;
      });
    },

    _handleMessage(event) {
      const data = event.data;
      if (!data || data.type !== "FAKEAUTH_RESULT") return;

      if (data.error) {
        this._loginRejecter && this._loginRejecter(new Error(data.error));
      } else {
        this._loginResolver && this._loginResolver({
          idToken: data.idToken,
          user: data.user
        });
      }

      if (this._loginWindow) {
        this._loginWindow.close();
        this._loginWindow = null;
      }

      this._loginResolver = null;
      this._loginRejecter = null;
    }
  };

  global.FakeAuth = FakeAuth;
})(window);
