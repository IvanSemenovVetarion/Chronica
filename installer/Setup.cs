using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

namespace MifariumSetup
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            bool silent = false;
            bool desktop = true;
            string dir = null;
            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i] ?? string.Empty;
                if (string.Equals(arg, "/S", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(arg, "/SILENT", StringComparison.OrdinalIgnoreCase))
                    silent = true;
                else if (string.Equals(arg, "/NODESKTOP", StringComparison.OrdinalIgnoreCase))
                    desktop = false;
                else if (arg.StartsWith("/D=", StringComparison.OrdinalIgnoreCase))
                    dir = arg.Substring(3).Trim().Trim('"');
            }
            InstallerForm form = new InstallerForm(silent, dir, desktop);
            Application.Run(form);
            Environment.ExitCode = form.Success ? 0 : (silent ? 1 : 0);
        }
    }

    internal sealed class InstallerForm : Form
    {
        private static readonly bool IsDnd = DetectDndEdition();
        private static readonly string AppName = IsDnd ? "Chronika DnD Edition" : "Chronica";
        private static readonly string AppExe = IsDnd ? "ChronicaDnD.exe" : "Chronica.exe";
        private static readonly string InstallFolder = IsDnd ? "ChronicaDnD" : "Chronica";
        private static readonly string DataFolder = IsDnd ? "ChronicaDnDData" : "ChronicaData";
        private static readonly string StartMenuFolder = IsDnd ? "Chronika DnD Edition" : "Chronica";
        private static readonly string AppProcessName = IsDnd ? "ChronicaDnD" : "Chronica";
        private static readonly string UninstallKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\" + InstallFolder;
        private const string AppVersion = "2.0.0";
        private const string Publisher = "Vetarion";
        private const string WebView2Url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703";

        private static bool DetectDndEdition()
        {
#if DND_EDITION
            return true;
#else
            return false;
#endif
        }

        private readonly TextBox _pathBox;
        private readonly Button _browseButton;
        private readonly Button _installButton;
        private readonly Button _cancelButton;
        private readonly CheckBox _desktopBox;
        private readonly CheckBox _launchBox;
        private readonly ProgressBar _progress;
        private readonly Label _statusLabel;
        private readonly LinkLabel _webViewLink;
        private readonly bool _silent;
        private bool _installed;
        private string _installDir;

        public bool Success { get; private set; }

        public InstallerForm(bool silent, string installDir, bool desktopShortcut)
        {
            _silent = silent;
            Text = "Установка " + AppName;
            ClientSize = new Size(620, 468);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(10, 17, 23);
            ForeColor = Color.FromArgb(233, 226, 212);
            Font = new Font("Segoe UI", 9f);
            AutoScaleMode = AutoScaleMode.Dpi;
            AutoScaleDimensions = new SizeF(96f, 96f);
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
            if (silent)
            {
                ShowInTaskbar = false;
                Opacity = 0;
                WindowState = FormWindowState.Minimized;
            }

            Panel header = new Panel();
            header.Bounds = new Rectangle(0, 0, ClientSize.Width, 112);
            header.BackColor = Color.FromArgb(14, 26, 35);
            Controls.Add(header);

            PictureBox icon = new PictureBox();
            icon.Bounds = new Rectangle(26, 27, 58, 58);
            icon.SizeMode = PictureBoxSizeMode.StretchImage;
            try { icon.Image = Icon.ExtractAssociatedIcon(Application.ExecutablePath).ToBitmap(); } catch { }
            header.Controls.Add(icon);

            Label title = new Label();
            title.Text = AppName;
            title.Font = new Font("Segoe UI Semibold", IsDnd ? 17f : 22f, FontStyle.Bold);
            title.ForeColor = Color.FromArgb(221, 188, 126);
            title.AutoSize = true;
            title.Location = new Point(99, 18);
            header.Controls.Add(title);

            Label subtitle = new Label();
            subtitle.Text = "хранитель миров · установка";
            subtitle.Font = new Font("Segoe UI", 9.5f);
            subtitle.ForeColor = Color.FromArgb(151, 160, 160);
            subtitle.AutoSize = true;
            subtitle.Location = new Point(102, 58);
            header.Controls.Add(subtitle);

            Label version = new Label();
            version.Text = "Версия " + AppVersion + " · Windows 10/11";
            version.Font = new Font("Segoe UI", 8f);
            version.ForeColor = Color.FromArgb(110, 124, 130);
            version.AutoSize = true;
            version.Location = new Point(102, 78);
            header.Controls.Add(version);

            Label pathLabel = new Label();
            pathLabel.Text = "Куда установить";
            pathLabel.ForeColor = Color.FromArgb(203, 195, 180);
            pathLabel.AutoSize = true;
            pathLabel.Location = new Point(26, 132);
            Controls.Add(pathLabel);

            _pathBox = new TextBox();
            _pathBox.Bounds = new Rectangle(26, 154, 456, 27);
            _pathBox.BackColor = Color.FromArgb(20, 32, 40);
            _pathBox.ForeColor = Color.FromArgb(233, 226, 212);
            _pathBox.BorderStyle = BorderStyle.FixedSingle;
            _pathBox.Text = DefaultInstallDir();
            Controls.Add(_pathBox);

            _browseButton = MakeButton("Обзор…", 492, 153, 100, 29, false);
            _browseButton.Click += delegate { BrowseFolder(); };
            Controls.Add(_browseButton);

            Label hint = new Label();
            hint.Text = "Программа устанавливается только для текущего пользователя и не требует прав администратора.";
            hint.Font = new Font("Segoe UI", 8f);
            hint.ForeColor = Color.FromArgb(110, 124, 130);
            hint.AutoSize = true;
            hint.Location = new Point(26, 187);
            Controls.Add(hint);

            _desktopBox = new CheckBox();
            _desktopBox.Text = "Создать ярлык на рабочем столе";
            _desktopBox.ForeColor = Color.FromArgb(203, 195, 180);
            _desktopBox.AutoSize = true;
            _desktopBox.Checked = true;
            _desktopBox.Location = new Point(26, 216);
            Controls.Add(_desktopBox);

            _launchBox = new CheckBox();
            _launchBox.Text = "Запустить " + AppName + " после установки";
            _launchBox.ForeColor = Color.FromArgb(203, 195, 180);
            _launchBox.AutoSize = true;
            _launchBox.Checked = true;
            _launchBox.Location = new Point(26, 242);
            Controls.Add(_launchBox);

            Label webLabel = new Label();
            webLabel.Text = "Компонент отображения";
            webLabel.ForeColor = Color.FromArgb(203, 195, 180);
            webLabel.AutoSize = true;
            webLabel.Location = new Point(26, 280);
            Controls.Add(webLabel);

            string webViewVersion = FindWebView2Version();
            Label webState = new Label();
            webState.Text = webViewVersion != null
                ? "WebView2 Runtime найден · " + webViewVersion
                : "WebView2 Runtime не найден — установите его после установки программы.";
            webState.ForeColor = webViewVersion != null
                ? Color.FromArgb(127, 172, 141)
                : Color.FromArgb(214, 164, 104);
            webState.Font = new Font("Segoe UI", 8.5f);
            webState.AutoSize = true;
            webState.Location = new Point(26, 300);
            Controls.Add(webState);

            _webViewLink = new LinkLabel();
            _webViewLink.Text = "Скачать WebView2 Runtime";
            _webViewLink.LinkColor = Color.FromArgb(221, 188, 126);
            _webViewLink.ActiveLinkColor = Color.FromArgb(244, 215, 158);
            _webViewLink.LinkClicked += delegate { OpenUrl(WebView2Url); };
            _webViewLink.AutoSize = true;
            _webViewLink.Location = new Point(26, 320);
            _webViewLink.Visible = webViewVersion == null;
            Controls.Add(_webViewLink);

            _statusLabel = new Label();
            _statusLabel.Text = "Готово к установке.";
            _statusLabel.ForeColor = Color.FromArgb(151, 160, 160);
            _statusLabel.Font = new Font("Segoe UI", 8.5f);
            _statusLabel.AutoSize = true;
            _statusLabel.Location = new Point(26, 352);
            Controls.Add(_statusLabel);

            _progress = new ProgressBar();
            _progress.Bounds = new Rectangle(26, 374, 566, 7);
            _progress.Style = ProgressBarStyle.Continuous;
            _progress.Visible = false;
            Controls.Add(_progress);

            _installButton = MakeButton("Установить", 486, 404, 106, 36, true);
            _installButton.Click += delegate { InstallOrLaunch(); };
            Controls.Add(_installButton);

            _cancelButton = MakeButton("Отмена", 384, 404, 92, 36, false);
            _cancelButton.Click += delegate { Close(); };
            Controls.Add(_cancelButton);

            AcceptButton = _installButton;
            CancelButton = _cancelButton;
            if (!string.IsNullOrWhiteSpace(installDir)) _pathBox.Text = installDir.Trim();
            _desktopBox.Checked = desktopShortcut;
            _launchBox.Checked = !silent;
            FormClosing += delegate(object sender, FormClosingEventArgs e)
            {
                if (_installButton.Enabled) return;
                e.Cancel = true;
            };
            if (silent)
            {
                Shown += delegate { RunSilentInstall(); };
            }
        }

        private void RunSilentInstall()
        {
            InstallOrLaunch();
            if (Success || IsDisposed) return;
            Success = false;
            Close();
        }

        private static string DefaultInstallDir()
        {
            return Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs", InstallFolder);
        }

        private static Button MakeButton(string text, int x, int y, int width, int height, bool primary)
        {
            Button button = new Button();
            button.Text = text;
            button.Bounds = new Rectangle(x, y, width, height);
            button.FlatStyle = FlatStyle.Flat;
            button.FlatAppearance.BorderSize = 1;
            button.FlatAppearance.BorderColor = primary ? Color.FromArgb(150, 119, 68) : Color.FromArgb(47, 62, 70);
            button.BackColor = primary ? Color.FromArgb(176, 139, 78) : Color.FromArgb(20, 32, 40);
            button.ForeColor = primary ? Color.FromArgb(15, 22, 26) : Color.FromArgb(221, 213, 198);
            button.Font = new Font("Segoe UI Semibold", 9f);
            button.Cursor = Cursors.Hand;
            return button;
        }

        private void BrowseFolder()
        {
            using (FolderBrowserDialog dialog = new FolderBrowserDialog())
            {
                dialog.Description = "Выберите папку для установки " + AppName;
                dialog.ShowNewFolderButton = true;
                string current = _pathBox.Text.Trim();
                if (Directory.Exists(current)) dialog.SelectedPath = current;
                if (dialog.ShowDialog(this) == DialogResult.OK)
                    _pathBox.Text = dialog.SelectedPath;
            }
        }

        private void InstallOrLaunch()
        {
            if (_installed)
            {
                Launch();
                Close();
                return;
            }
            string raw = _pathBox.Text.Trim();
            if (raw.Length == 0)
            {
                if (_silent) { FailSilent("Не указана папка установки.", null); return; }
                MessageBox.Show(this, "Укажите папку установки.", AppName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            string dir;
            try
            {
                dir = Path.GetFullPath(raw);
            }
            catch (Exception ex)
            {
                if (_silent) { FailSilent("Некорректный путь установки.", ex); return; }
                MessageBox.Show(this, "Некорректный путь:\n" + ex.Message, AppName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            if (dir.Length < 4 || dir == Path.GetPathRoot(dir))
            {
                if (_silent) { FailSilent("Папка установки не может быть корнем диска.", null); return; }
                MessageBox.Show(this, "Выберите папку, а не корень диска.", AppName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            _installDir = dir;
            SetBusy(true);
            try
            {
                SetStatus("Закрываем запущенную копию " + AppName + "…");
                CloseRunningApp();

                SetStatus("Распаковываем файлы…");
                ExtractPayload(dir);

                SetStatus("Переносим данные предыдущей версии…");
                MigrateLegacyData(dir);

                SetStatus("Создаём ярлыки…");
                CreateShortcuts(dir);

                SetStatus("Регистрируем программу…");
                WriteUninstallEntry(dir);

                _progress.Maximum = 100;
                _progress.Value = 100;
                SetStatus("Готово. " + AppName + " установлена.");
                _installed = true;
                _installButton.Text = "Запустить";
                _installButton.Enabled = true;
                _installButton.Focus();
                _cancelButton.Text = "Закрыть";
                _cancelButton.Enabled = true;
                _browseButton.Enabled = true;
                _pathBox.Enabled = true;
                _desktopBox.Enabled = false;
                _launchBox.Enabled = false;

                if (_silent)
                {
                    Success = true;
                    Close();
                    return;
                }
                if (_launchBox.Checked)
                {
                    Launch();
                    Close();
                }
            }
            catch (Exception ex)
            {
                if (_silent) { FailSilent("Установка не завершена.", ex); return; }
                SetStatus("Установка не завершена.");
                MessageBox.Show(this,
                    "Не удалось установить " + AppName + ":\n\n" + ex.Message +
                    "\n\nПопробуйте выбрать другую папку или закройте программу и повторите установку.",
                    AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
                SetBusy(false);
            }
        }

        private void FailSilent(string message, Exception exception)
        {
            Success = false;
            try
            {
                string log = Path.Combine(Path.GetTempPath(), (IsDnd ? "ChronicaDnDSetup" : "ChronicaSetup") + "-error.log");
                File.WriteAllText(log,
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + message +
                    (exception == null ? string.Empty : Environment.NewLine + exception),
                    Encoding.UTF8);
            }
            catch { }
            _installButton.Enabled = true;
            Close();
        }

        private void SetBusy(bool busy)
        {
            _installButton.Enabled = !busy;
            _cancelButton.Enabled = !busy;
            _browseButton.Enabled = !busy;
            _pathBox.Enabled = !busy;
            _desktopBox.Enabled = !busy;
            _launchBox.Enabled = !busy;
            _progress.Visible = busy;
            if (busy)
            {
                _progress.Value = 0;
                _statusLabel.Text = "Установка…";
                _statusLabel.ForeColor = Color.FromArgb(221, 188, 126);
            }
            else
            {
                _statusLabel.ForeColor = Color.FromArgb(151, 160, 160);
            }
            Application.DoEvents();
        }

        private void SetStatus(string text)
        {
            _statusLabel.Text = text;
            _statusLabel.Refresh();
            Application.DoEvents();
        }

        private static void CloseRunningApp()
        {
            Process[] current = Process.GetProcessesByName(AppProcessName);
            Process[] legacy = IsDnd ? new Process[0] : Process.GetProcessesByName("TitZero");
            Process[] older = IsDnd ? new Process[0] : Process.GetProcessesByName("Mifarium");
            Process[] processes = new Process[current.Length + legacy.Length + older.Length];
            Array.Copy(current, 0, processes, 0, current.Length);
            Array.Copy(legacy, 0, processes, current.Length, legacy.Length);
            Array.Copy(older, 0, processes, current.Length + legacy.Length, older.Length);
            for (int i = 0; i < processes.Length; i++)
            {
                try
                {
                    processes[i].CloseMainWindow();
                }
                catch { }
            }
            for (int i = 0; i < processes.Length; i++)
            {
                try
                {
                    if (!processes[i].WaitForExit(3000))
                        processes[i].Kill();
                }
                catch { }
                finally
                {
                    try { processes[i].Dispose(); } catch { }
                }
            }
        }

        private void ExtractPayload(string installDir)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream stream = assembly.GetManifestResourceStream("payload.zip"))
            {
                if (stream == null)
                    throw new InvalidOperationException("В установщик не встроены файлы программы.");
                using (ZipArchive archive = new ZipArchive(stream, ZipArchiveMode.Read))
                {
                    Directory.CreateDirectory(installDir);
                    _progress.Maximum = Math.Max(1, archive.Entries.Count);
                    _progress.Value = 0;
                    string root = Path.GetFullPath(installDir) + Path.DirectorySeparatorChar;
                    int index = 0;
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        index++;
                        if (!string.IsNullOrEmpty(entry.Name))
                        {
                            string target = Path.GetFullPath(Path.Combine(installDir, entry.FullName));
                            if (!target.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                                continue;
                            string folder = Path.GetDirectoryName(target);
                            if (!string.IsNullOrEmpty(folder)) Directory.CreateDirectory(folder);
                            entry.ExtractToFile(target, true);
                        }
                        _progress.Value = Math.Min(_progress.Maximum, index);
                        Application.DoEvents();
                    }
                }
            }
            string exe = Path.Combine(installDir, AppExe);
            if (!File.Exists(exe))
                throw new InvalidOperationException("После распаковки не найден " + AppExe + ".");
            if (!File.Exists(Path.Combine(installDir, "WebView2Loader.dll")))
                throw new InvalidOperationException("После распаковки не найден WebView2Loader.dll.");
        }

        private static void MigrateLegacyData(string installDir)
        {
            if (IsDnd) return;
            string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string[] oldPaths = new string[]
            {
                Path.Combine(local, "Programs", "TitZero", "TitZeroData"),
                Path.Combine(local, "Programs", "Mifarium", "MifariumData"),
                Path.Combine(installDir, "TitZeroData"),
                Path.Combine(installDir, "MifariumData"),
                Path.Combine(local, "TitZero"),
                Path.Combine(local, "Mifarium")
            };
            string[] newPaths = new string[]
            {
                Path.Combine(installDir, DataFolder),
                Path.Combine(installDir, DataFolder),
                Path.Combine(installDir, DataFolder),
                Path.Combine(installDir, DataFolder),
                Path.Combine(local, InstallFolder),
                Path.Combine(local, InstallFolder)
            };
            for (int i = 0; i < oldPaths.Length; i++)
            {
                try
                {
                    if (Directory.Exists(oldPaths[i]) && !Directory.Exists(newPaths[i]))
                        CopyDirectory(oldPaths[i], newPaths[i]);
                }
                catch
                {
                    // перенос данных не должен мешать установке
                }
            }
        }

        private static void CopyDirectory(string source, string target)
        {
            Directory.CreateDirectory(target);
            string[] files = Directory.GetFiles(source);
            for (int i = 0; i < files.Length; i++)
                File.Copy(files[i], Path.Combine(target, Path.GetFileName(files[i])), true);
            string[] dirs = Directory.GetDirectories(source);
            for (int i = 0; i < dirs.Length; i++)
                CopyDirectory(dirs[i], Path.Combine(target, Path.GetFileName(dirs[i])));
        }

        private void CreateShortcuts(string installDir)
        {
            string app = Path.Combine(installDir, AppExe);
            string uninstall = Path.Combine(installDir, "Uninstall.exe");
            string startDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                @"Microsoft\Windows\Start Menu\Programs", StartMenuFolder);
            Directory.CreateDirectory(startDir);
            string description = IsDnd ? "Chronika DnD Edition - D&D 5e / 2024" : "Chronica - хранитель миров";
            CreateShortcut(Path.Combine(startDir, AppName + ".lnk"), app, installDir, app, description);
            if (File.Exists(uninstall))
                CreateShortcut(Path.Combine(startDir, "Удалить " + AppName + ".lnk"), uninstall, installDir, uninstall,
                    "Удалить " + AppName);
            if (_desktopBox.Checked)
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                CreateShortcut(Path.Combine(desktop, AppName + ".lnk"), app, installDir, app, description);
            }
        }

        private static void CreateShortcut(string linkPath, string target, string workDir, string iconPath, string description)
        {
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) return;
            object shell = Activator.CreateInstance(shellType);
            object shortcut = null;
            try
            {
                shortcut = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell,
                    new object[] { linkPath });
                Type shortcutType = shortcut.GetType();
                shortcutType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, shortcut, new object[] { target });
                shortcutType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, shortcut, new object[] { workDir });
                shortcutType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, shortcut, new object[] { iconPath + ",0" });
                shortcutType.InvokeMember("Description", BindingFlags.SetProperty, null, shortcut, new object[] { description });
                shortcutType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
            }
            finally
            {
                try { if (shortcut != null) Marshal.ReleaseComObject(shortcut); } catch { }
                try { if (shell != null) Marshal.ReleaseComObject(shell); } catch { }
            }
        }

        private void WriteUninstallEntry(string installDir)
        {
            string app = Path.Combine(installDir, AppExe);
            string uninstall = Path.Combine(installDir, "Uninstall.exe");
            long size = 0;
            try
            {
                string[] files = Directory.GetFiles(installDir, "*", SearchOption.AllDirectories);
                for (int i = 0; i < files.Length; i++)
                    size += new FileInfo(files[i]).Length;
            }
            catch { }
            using (RegistryKey key = Registry.CurrentUser.CreateSubKey(UninstallKey))
            {
                key.SetValue("DisplayName", AppName);
                key.SetValue("DisplayVersion", AppVersion);
                key.SetValue("Publisher", Publisher);
                key.SetValue("InstallLocation", installDir);
                key.SetValue("DisplayIcon", app + ",0");
                key.SetValue("UninstallString", "\"" + uninstall + "\"");
                key.SetValue("QuietUninstallString", "\"" + uninstall + "\" /quiet");
                key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                key.SetValue("EstimatedSize", (int)Math.Max(1, size / 1024), RegistryValueKind.DWord);
            }
        }

        private void Launch()
        {
            try
            {
                string app = Path.Combine(_installDir, AppExe);
                if (!File.Exists(app)) app = Path.Combine(_pathBox.Text.Trim(), AppExe);
                Process.Start(new ProcessStartInfo(app) { WorkingDirectory = Path.GetDirectoryName(app) });
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, "Не удалось запустить " + AppName + ":\n" + ex.Message,
                    AppName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private static string FindWebView2Version()
        {
            string[] paths = new string[]
            {
                @"HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
                @"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
                @"HKEY_CURRENT_USER\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
            };
            for (int i = 0; i < paths.Length; i++)
            {
                try
                {
                    object value = Registry.GetValue(paths[i], "pv", null);
                    string version = value == null ? null : Convert.ToString(value);
                    if (!string.IsNullOrWhiteSpace(version)) return version;
                }
                catch { }
            }
            return null;
        }

        private static void OpenUrl(string url)
        {
            try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
            catch { }
        }
    }
}
