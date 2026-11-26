using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

namespace MifariumUninstall
{
    internal static class Program
    {
        private static string InstallDir
        {
            get { return AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar); }
        }

        private static bool IsDnd
        {
            get { return File.Exists(Path.Combine(InstallDir, "ChronicaDnD.exe")); }
        }

        private static string AppName
        {
            get { return IsDnd ? "Chronika DnD Edition" : "Chronica"; }
        }

        private static string AppExe
        {
            get { return IsDnd ? "ChronicaDnD.exe" : "Chronica.exe"; }
        }

        private static string InstallFolder
        {
            get { return IsDnd ? "ChronicaDnD" : "Chronica"; }
        }

        private static string DataFolder
        {
            get { return IsDnd ? "ChronicaDnDData" : "ChronicaData"; }
        }

        private static string StartMenuFolder
        {
            get { return IsDnd ? "Chronika DnD Edition" : "Chronica"; }
        }

        private static string UninstallKey
        {
            get { return @"Software\Microsoft\Windows\CurrentVersion\Uninstall\" + InstallFolder; }
        }

        [STAThread]
        private static void Main(string[] args)
        {
            bool quiet = false;
            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i] ?? string.Empty;
                if (string.Equals(arg, "/quiet", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(arg, "/q", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(arg, "/s", StringComparison.OrdinalIgnoreCase))
                    quiet = true;
            }

            if (!quiet)
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
            }

            string installDir = InstallDir;
            string appPath = Path.Combine(installDir, AppExe);
            if (!File.Exists(appPath))
            {
                if (!quiet)
                {
                    MessageBox.Show(
                        "Не удалось найти " + AppExe + " рядом с деинсталлятором.\n\n" +
                        "Запустите Uninstall.exe из папки с программой.",
                        AppName, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                return;
            }

            bool removeData = true;
            if (!quiet)
            {
                DialogResult answer = MessageBox.Show(
                    "Удалить " + AppName + "?\n\n" +
                    "Да — удалить программу и все миры, изображения и резервные копии.\n" +
                    "Нет — удалить программу, сохранив папку " + DataFolder + " с вашими мирами.\n" +
                    "Отмена — выйти без изменений.",
                    "Удаление " + AppName,
                    MessageBoxButtons.YesNoCancel,
                    MessageBoxIcon.Question,
                    MessageBoxDefaultButton.Button3);
                if (answer == DialogResult.Cancel) return;
                removeData = answer == DialogResult.Yes;
            }
            try
            {
                CloseRunningApp();
                RemoveShortcuts();
                RemoveRegistryEntry();
                ScheduleRemoval(installDir, removeData);
                if (!quiet)
                {
                    MessageBox.Show(
                        removeData
                            ? AppName + " удалён. Все данные программы будут удалены в течение нескольких секунд."
                            : "Программа удалена. Ваши миры сохранены в папке " + DataFolder + ".",
                        AppName, MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                if (!quiet)
                {
                    MessageBox.Show(
                        "Не удалось полностью удалить " + AppName + ":\n\n" + ex.Message,
                        AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private static void CloseRunningApp()
        {
            Process[] current = Process.GetProcessesByName(IsDnd ? "ChronicaDnD" : "Chronica");
            Process[] legacy = IsDnd ? new Process[0] : Process.GetProcessesByName("TitZero");
            Process[] older = IsDnd ? new Process[0] : Process.GetProcessesByName("Mifarium");
            Process[] processes = new Process[current.Length + legacy.Length + older.Length];
            Array.Copy(current, 0, processes, 0, current.Length);
            Array.Copy(legacy, 0, processes, current.Length, legacy.Length);
            Array.Copy(older, 0, processes, current.Length + legacy.Length, older.Length);
            for (int i = 0; i < processes.Length; i++)
            {
                try { processes[i].CloseMainWindow(); } catch { }
            }
            for (int i = 0; i < processes.Length; i++)
            {
                try
                {
                    if (!processes[i].WaitForExit(3000)) processes[i].Kill();
                }
                catch { }
                finally
                {
                    try { processes[i].Dispose(); } catch { }
                }
            }
        }

        private static void RemoveShortcuts()
        {
            try
            {
                string startDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    @"Microsoft\Windows\Start Menu\Programs", StartMenuFolder);
                if (Directory.Exists(startDir)) Directory.Delete(startDir, true);
            }
            catch { }
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                DeleteIfExists(Path.Combine(desktop, AppName + ".lnk"));
                if (!IsDnd)
                {
                    DeleteIfExists(Path.Combine(desktop, "TitZero.lnk"));
                    DeleteIfExists(Path.Combine(desktop, "Mifarium.lnk"));
                }
            }
            catch { }
        }

        private static void RemoveRegistryEntry()
        {
            try
            {
                Registry.CurrentUser.DeleteSubKeyTree(UninstallKey, false);
            }
            catch { }
        }

        private static void ScheduleRemoval(string installDir, bool removeData)
        {
            string batch = Path.Combine(
                Path.GetTempPath(), "chronica-uninstall-" + Guid.NewGuid().ToString("N") + ".cmd");
            StringBuilder script = new StringBuilder();
            script.AppendLine("@echo off");
            script.AppendLine("timeout /t 2 /nobreak >nul");
            if (removeData)
            {
                script.AppendLine("rmdir /s /q \"" + installDir + "\"");
                script.AppendLine("rmdir /s /q \"%LocalAppData%\\" + InstallFolder + "\"");
                if (!IsDnd)
                {
                    script.AppendLine("rmdir /s /q \"%LocalAppData%\\TitZero\"");
                    script.AppendLine("rmdir /s /q \"%LocalAppData%\\Mifarium\"");
                }
            }
            else
            {
                script.AppendLine("del /q \"" + Path.Combine(installDir, AppExe) + "\"");
                script.AppendLine("del /q \"" + Path.Combine(installDir, "WebView2Loader.dll") + "\"");
                script.AppendLine("del /q \"" + Path.Combine(installDir, "Microsoft.Web.WebView2.Core.dll") + "\"");
                script.AppendLine("del /q \"" + Path.Combine(installDir, "Microsoft.Web.WebView2.WinForms.dll") + "\"");
                script.AppendLine("del /q \"" + Path.Combine(installDir, "README.txt") + "\"");
                script.AppendLine("del /q \"" + Path.Combine(installDir, "Uninstall.exe") + "\"");
            }
            script.AppendLine("del \"" + batch + "\"");
            File.WriteAllText(batch, script.ToString(), Encoding.Default);

            ProcessStartInfo info = new ProcessStartInfo("cmd.exe", "/c call \"" + batch + "\"");
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            Process.Start(info);
        }

        private static void DeleteIfExists(string path)
        {
            try
            {
                if (File.Exists(path)) File.Delete(path);
            }
            catch { }
        }
    }
}
