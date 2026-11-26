using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace Mifarium
{
    internal static class Program
    {
        private static string MutexName
        {
            get
            {
                bool dnd = AppStorage.DetectDndEdition();
                return dnd ? @"Local\ChronicaDnD_SingleInstance" : @"Local\Chronica_SingleInstance";
            }
        }

        private static string AppTitle
        {
            get { return AppStorage.DetectDndEdition() ? "Chronika DnD Edition" : "Chronica"; }
        }

        private static string DataFolderName
        {
            get { return AppStorage.DetectDndEdition() ? "ChronicaDnDData" : "ChronicaData"; }
        }

        [STAThread]
        private static void Main(string[] args)
        {
            bool createdNew = false;
            using (Mutex mutex = new Mutex(true, MutexName, out createdNew))
            {
                if (!createdNew)
                {
                    ActivateExistingWindow();
                    return;
                }

                bool devMode = false;
                for (int i = 0; i < args.Length; i++)
                {
                    if (string.Equals(args[i], "--dev", StringComparison.OrdinalIgnoreCase))
                        devMode = true;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
                Application.ThreadException += delegate(object sender, ThreadExceptionEventArgs e)
                {
                    Log.Error("Необработанная ошибка интерфейса", e.Exception);
                    try
                    {
                        MessageBox.Show(
                            "Произошла непредвиденная ошибка:\n\n" + e.Exception.Message +
                            "\n\n" + AppTitle + " продолжит работу. Подробности записаны в chronica.log.",
                            AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                    catch
                    {
                    }
                };
                AppDomain.CurrentDomain.UnhandledException += delegate(object sender, UnhandledExceptionEventArgs e)
                {
                    Log.Error("Необработанная критическая ошибка", e.ExceptionObject as Exception);
                };

                try
                {
                    AppStorage storage = AppStorage.Create();
                    MainForm form = new MainForm(storage, devMode);
                    Application.Run(form);
                }
                catch (Exception ex)
                {
                    Log.Error("Критическая ошибка при запуске", ex);
                    MessageBox.Show(
                        "Не удалось запустить " + AppTitle + ":\n\n" + ex.Message +
                        "\n\nЕсли ошибка повторяется, проверьте папку " + DataFolderName + " рядом с программой " +
                        "или удалите её (данные летописи будут потеряны).",
                        AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
                finally
                {
                    try { mutex.ReleaseMutex(); }
                    catch { }
                }
            }
        }

        private static void ActivateExistingWindow()
        {
            try
            {
                string processName = Path.GetFileNameWithoutExtension(Application.ExecutablePath);
                Process[] processes = Process.GetProcessesByName(processName);
                for (int i = 0; i < processes.Length; i++)
                {
                    IntPtr handle = processes[i].MainWindowHandle;
                    if (handle == IntPtr.Zero) continue;
                    ShowWindowAsync(handle, 9);
                    SetForegroundWindow(handle);
                    return;
                }
            }
            catch
            {
            }
            MessageBox.Show(
                AppTitle + " уже запущена.\n\nНайдите окно программы на панели задач.",
                AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        [DllImport("user32.dll")]
        private static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);
    }
}
