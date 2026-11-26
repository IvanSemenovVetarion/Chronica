using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Mifarium
{
    internal sealed class MainForm : Form
    {
        private readonly AppStorage _storage;
        private readonly bool _devMode;
        private readonly WebView2 _webView;
        private readonly Bridge _bridge;
        private bool _initialized;
        private bool _navigationDone;

        public MainForm(AppStorage storage, bool devMode)
        {
            _storage = storage;
            _devMode = devMode;

            Text = storage.GetAppName() + " — хранитель миров";
            StartPosition = FormStartPosition.CenterScreen;
            MinimumSize = new Size(980, 640);
            BackColor = Color.FromArgb(8, 16, 23);
            ForeColor = Color.FromArgb(233, 226, 212);
            KeyPreview = true;
            try
            {
                System.Drawing.Icon icon = System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (icon != null) Icon = icon;
            }
            catch
            {
            }

            Rectangle area = Screen.PrimaryScreen.WorkingArea;
            int width = Math.Min(1440, Math.Max(1024, area.Width - 100));
            int height = Math.Min(900, Math.Max(680, area.Height - 100));
            Width = width;
            Height = height;

            _webView = new WebView2();
            _webView.Dock = DockStyle.Fill;
            _webView.DefaultBackgroundColor = Color.FromArgb(8, 16, 23);
            _webView.AllowExternalDrop = false;
            Controls.Add(_webView);

            _bridge = new Bridge(storage, this);
            _bridge.ThemeChanged += ApplyTheme;
            _bridge.AppNameChanged += ApplyAppName;
            _bridge.UiScaleChanged += ApplyUiScale;

            Load += MainForm_Load;
            FormClosing += MainForm_FormClosing;
        }

        private async void MainForm_Load(object sender, EventArgs e)
        {
            if (_initialized) return;
            _initialized = true;
            try
            {
                string uiDir = UiAssets.EnsureExtracted(_storage);
                CoreWebView2EnvironmentOptions options = new CoreWebView2EnvironmentOptions();
                CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(
                    null, _storage.WebViewDir, options);
                if (IsDisposed || _webView.IsDisposed) return;

                await _webView.EnsureCoreWebView2Async(environment);
                if (IsDisposed || _webView.CoreWebView2 == null) return;

                CoreWebView2 core = _webView.CoreWebView2;
                core.Settings.AreDevToolsEnabled = _devMode;
                core.Settings.AreDefaultContextMenusEnabled = false;
                core.Settings.AreBrowserAcceleratorKeysEnabled = _devMode;
                core.Settings.AreDefaultScriptDialogsEnabled = true;
                core.Settings.IsStatusBarEnabled = false;
                core.Settings.IsZoomControlEnabled = false;
                core.Settings.IsWebMessageEnabled = true;
                core.Settings.AreHostObjectsAllowed = false;
                core.Settings.IsGeneralAutofillEnabled = false;
                core.Settings.IsPasswordAutosaveEnabled = false;
                core.Settings.IsPinchZoomEnabled = false;
                core.Settings.IsSwipeNavigationEnabled = false;
                core.Settings.IsReputationCheckingRequired = false;

                core.SetVirtualHostNameToFolderMapping(
                    "app.mifarium", uiDir, CoreWebView2HostResourceAccessKind.Allow);
                core.SetVirtualHostNameToFolderMapping(
                    "media.mifarium", _storage.ImagesDir, CoreWebView2HostResourceAccessKind.Allow);
                core.SetVirtualHostNameToFolderMapping(
                    "audio.mifarium", _storage.AudioDir, CoreWebView2HostResourceAccessKind.Allow);
                core.SetVirtualHostNameToFolderMapping(
                    "fonts.mifarium", _storage.FontsDir, CoreWebView2HostResourceAccessKind.Allow);

                core.WebMessageReceived += Core_WebMessageReceived;
                core.NewWindowRequested += Core_NewWindowRequested;
                core.NavigationStarting += Core_NavigationStarting;
                core.NavigationCompleted += Core_NavigationCompleted;
                core.PermissionRequested += Core_PermissionRequested;
                core.ProcessFailed += Core_ProcessFailed;

                ApplyTheme(_storage.LoadTheme(), true);
                core.Navigate("https://app.mifarium/index.html" + (_storage.IsDndEdition ? "?edition=dnd" : ""));
                Log.Info("Интерфейс загружен: " + uiDir);
            }
            catch (Exception ex)
            {
                Log.Error("Критическая ошибка запуска интерфейса", ex);
                ShowStartupError(ex);
            }
        }

        private async void Core_WebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string response;
            try
            {
                response = await _bridge.ProcessAsync(e.WebMessageAsJson);
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось обработать сообщение интерфейса", ex);
                response = "{\"id\":0,\"ok\":false,\"error\":\"Внутренняя ошибка приложения.\"}";
            }
            try
            {
                if (IsDisposed || _webView == null || _webView.IsDisposed) return;
                if (_webView.CoreWebView2 != null)
                    _webView.CoreWebView2.PostWebMessageAsJson(response);
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось отправить ответ интерфейсу", ex);
            }
        }

        private void Core_NewWindowRequested(object sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            e.Handled = true;
            OpenExternal(e.Uri);
        }

        private void Core_NavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            if (e.Uri == null) return;
            if (e.Uri.StartsWith("https://app.mifarium/", StringComparison.OrdinalIgnoreCase)) return;
            if (e.Uri.Equals("about:blank", StringComparison.OrdinalIgnoreCase)) return;
            e.Cancel = true;
            OpenExternal(e.Uri);
        }

        private void Core_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (_navigationDone) return;
            _navigationDone = true;
            if (!e.IsSuccess)
            {
                Log.Error("Навигация WebView2 завершилась ошибкой: " + e.WebErrorStatus, null);
                MessageBox.Show(this,
                    "Не удалось открыть интерфейс " + _storage.GetAppName() + ".\n\nКод ошибки: " + e.WebErrorStatus +
                    "\n\nПопробуйте перезапустить программу.",
                    _storage.GetAppName(), MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void Core_PermissionRequested(object sender, CoreWebView2PermissionRequestedEventArgs e)
        {
            e.State = CoreWebView2PermissionState.Deny;
        }

        private void Core_ProcessFailed(object sender, CoreWebView2ProcessFailedEventArgs e)
        {
            Log.Error("Сбой процесса WebView2: " + e.ProcessFailedKind, null);
            if (e.ProcessFailedKind == CoreWebView2ProcessFailedKind.BrowserProcessExited)
            {
                MessageBox.Show(this,
                    "Компонент отображения неожиданно завершил работу. Перезапустите " + _storage.GetAppName() + ".",
                    _storage.GetAppName(), MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private static void OpenExternal(string url)
        {
            try
            {
                Uri uri;
                if (!Uri.TryCreate(url, UriKind.Absolute, out uri)) return;
                if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) return;
                Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось открыть внешнюю ссылку: " + url, ex);
            }
        }

        private void ApplyAppName(string name)
        {
            if (InvokeRequired)
            {
                BeginInvoke(new Action<string>(ApplyAppName), name);
                return;
            }
            Text = (string.IsNullOrWhiteSpace(name) ? "Chronica" : name.Trim()) + " — хранитель миров";
        }

        private void ApplyUiScale(double scale)
        {
            try
            {
                if (_webView != null && !_webView.IsDisposed && _webView.CoreWebView2 != null)
                    _webView.ZoomFactor = scale;
            }
            catch { }
        }

        private void ApplyTheme(string theme)
        {
            ApplyTheme(theme, false);
        }

        private void ApplyTheme(string theme, bool initial)
        {
            if (InvokeRequired)
            {
                BeginInvoke(new Action<string, bool>(ApplyTheme), theme, initial);
                return;
            }
            bool light = theme == "light";
            Color back = ThemeBackground(theme);
            BackColor = back;
            if (_webView != null && !_webView.IsDisposed)
            {
                try { _webView.DefaultBackgroundColor = back; }
                catch { }
            }
            SetTitleBarTheme(theme, light, back);
            if (!initial)
            {
                // Тема уже сохранена мостом; здесь только синхронизируем окно.
            }
        }

        private static Color ThemeBackground(string theme)
        {
            switch ((theme ?? string.Empty).ToLowerInvariant())
            {
                case "light": return Color.FromArgb(236, 229, 216);
                case "emerald": return Color.FromArgb(7, 19, 15);
                case "rosequartz": return Color.FromArgb(21, 12, 18);
                case "wine": return Color.FromArgb(18, 8, 11);
                case "sapphire": return Color.FromArgb(7, 17, 28);
                case "amethyst": return Color.FromArgb(15, 10, 23);
                case "obsidian": return Color.FromArgb(10, 14, 17);
                case "copper": return Color.FromArgb(23, 16, 8);
                case "ocean": return Color.FromArgb(6, 20, 26);
                case "plum": return Color.FromArgb(20, 11, 22);
                case "steel": return Color.FromArgb(11, 16, 20);
                case "moss": return Color.FromArgb(18, 21, 11);
                default: return Color.FromArgb(9, 17, 24);
            }
        }

        private void SetTitleBarTheme(string theme, bool light, Color back)
        {
            if (!IsHandleCreated) return;
            try
            {
                int dark = light ? 0 : 1;
                int value = dark;
                int result = DwmSetWindowAttribute(Handle, 20, ref value, sizeof(int));
                if (result != 0)
                {
                    value = dark;
                    DwmSetWindowAttribute(Handle, 19, ref value, sizeof(int));
                }

                int caption = light ? ColorRef(236, 229, 216) : ColorRef(back.R, back.G, back.B);
                int text = light ? ColorRef(50, 43, 32) : ColorRef(233, 226, 212);
                int border = light
                    ? ColorRef(210, 199, 181)
                    : ColorRef(Math.Min(255, back.R + 22), Math.Min(255, back.G + 26), Math.Min(255, back.B + 30));
                DwmSetWindowAttribute(Handle, 35, ref caption, sizeof(int));
                DwmSetWindowAttribute(Handle, 36, ref text, sizeof(int));
                DwmSetWindowAttribute(Handle, 34, ref border, sizeof(int));
            }
            catch
            {
            }
        }

        private static int ColorRef(int r, int g, int b)
        {
            return r | (g << 8) | (b << 16);
        }

        private void ShowStartupError(Exception ex)
        {
            string details =
                "Не удалось запустить интерфейс " + _storage.GetAppName() + ".\n\n" +
                "Проверьте, что рядом с " + (_storage.IsDndEdition ? "ChronicaDnD.exe" : "Chronica.exe") + " находятся файлы:\n" +
                "• WebView2Loader.dll\n" +
                "• Microsoft.Web.WebView2.Core.dll\n" +
                "• Microsoft.Web.WebView2.WinForms.dll\n\n" +
                "Также на компьютере должен быть установлен компонент Microsoft Edge WebView2 Runtime.\n\n" +
                "Техническая информация записана в chronica.log.";
            DialogResult answer = MessageBox.Show(this, details + "\n\nОткрыть страницу загрузки WebView2 Runtime?",
                _storage.GetAppName(), MessageBoxButtons.YesNo, MessageBoxIcon.Error);
            if (answer == DialogResult.Yes)
                OpenExternal("https://go.microsoft.com/fwlink/p/?LinkId=2124703");
            Close();
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            try
            {
                if (_webView != null && _webView.CoreWebView2 != null)
                    _webView.CoreWebView2.Stop();
            }
            catch
            {
            }
            Log.Info(_storage.GetAppName() + " закрыт.");
        }

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);
    }
}
