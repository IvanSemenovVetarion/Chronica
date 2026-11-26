using System;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;

namespace Mifarium
{
    internal static class UiAssets
    {
        private const string ResourceName = "ui.zip";

        public static string EnsureExtracted(AppStorage storage)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream resource = assembly.GetManifestResourceStream(ResourceName))
            {
                if (resource == null)
                    throw new InvalidOperationException("В сборку не встроены файлы интерфейса.");

                string hash = ComputeHash(resource);
                string folderName = "ui-" + AppInfo.Version + "-" + hash.Substring(0, 10);
                string target = Path.Combine(storage.DataDir, folderName);
                string index = Path.Combine(target, "index.html");
                if (File.Exists(index)) return target;

                string tempZip = Path.Combine(Path.GetTempPath(), "mifarium-ui-" + Guid.NewGuid().ToString("N") + ".zip");
                string tempDir = Path.Combine(storage.DataDir, "ui-tmp-" + Guid.NewGuid().ToString("N"));
                try
                {
                    resource.Position = 0;
                    using (FileStream output = File.Create(tempZip))
                    {
                        resource.CopyTo(output);
                    }
                    Directory.CreateDirectory(tempDir);
                    System.IO.Compression.ZipFile.ExtractToDirectory(tempZip, tempDir);
                    if (!File.Exists(Path.Combine(tempDir, "index.html")))
                        throw new InvalidOperationException("Архив интерфейса повреждён: нет index.html.");

                    if (Directory.Exists(target))
                        TryDeleteDirectory(target);
                    Directory.Move(tempDir, target);
                    CleanupOldVersions(storage.DataDir, folderName);
                    return target;
                }
                catch (Exception ex)
                {
                    Log.Error("Не удалось распаковать интерфейс", ex);
                    TryDeleteDirectory(tempDir);
                    throw new InvalidOperationException(
                        "Не удалось подготовить файлы интерфейса. Проверьте свободное место и права на папку данных.", ex);
                }
                finally
                {
                    try
                    {
                        if (File.Exists(tempZip)) File.Delete(tempZip);
                    }
                    catch
                    {
                    }
                }
            }
        }

        private static string ComputeHash(Stream stream)
        {
            using (SHA256 sha = SHA256.Create())
            {
                byte[] hash = sha.ComputeHash(stream);
                return BitConverter.ToString(hash).Replace("-", string.Empty).ToLowerInvariant();
            }
        }

        private static void CleanupOldVersions(string dataDir, string current)
        {
            try
            {
                string[] dirs = Directory.GetDirectories(dataDir, "ui-*");
                for (int i = 0; i < dirs.Length; i++)
                {
                    string name = Path.GetFileName(dirs[i]);
                    if (name == current) continue;
                    if (!name.StartsWith("ui-", StringComparison.OrdinalIgnoreCase)) continue;
                    TryDeleteDirectory(dirs[i]);
                }
            }
            catch
            {
            }
        }

        private static void TryDeleteDirectory(string path)
        {
            try
            {
                if (Directory.Exists(path)) Directory.Delete(path, true);
            }
            catch
            {
            }
        }
    }
}
