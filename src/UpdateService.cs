using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;

namespace Mifarium
{
    internal static class UpdateService
    {
        private const string UserAgent = "Chronica/2.0 (Windows)";

        public static Dictionary<string, object> Check(string repo, string language)
        {
            string clean = NormalizeRepo(repo);
            if (string.IsNullOrEmpty(clean))
                throw new InvalidOperationException(L("Укажите GitHub-репозиторий в формате владелец/репозиторий.",
                    "Enter a GitHub repository in owner/repository format.", language));
            ServicePointManager.SecurityProtocol = ServicePointManager.SecurityProtocol | SecurityProtocolType.Tls12;
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create("https://api.github.com/repos/" + clean + "/releases/latest");
            request.Method = "GET";
            request.UserAgent = UserAgent;
            request.Accept = "application/vnd.github+json";
            request.Timeout = 30000;
            request.ReadWriteTimeout = 30000;
            string responseBody;
            try
            {
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                using (Stream stream = response.GetResponseStream())
                using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                {
                    responseBody = reader.ReadToEnd();
                }
            }
            catch (WebException ex)
            {
                HttpWebResponse response = ex.Response as HttpWebResponse;
                if (response != null && (int)response.StatusCode == 404)
                    throw new InvalidOperationException(L("Репозиторий не найден или в нём ещё нет релизов.",
                        "The repository was not found or has no releases yet.", language));
                throw new InvalidOperationException(L("Не удалось проверить обновления GitHub. Проверьте интернет и адрес репозитория.",
                    "Could not check GitHub updates. Check your internet connection and repository address.", language), ex);
            }

            JavaScriptSerializer json = AppStorage.CreateSerializer();
            Dictionary<string, object> release = null;
            try
            {
                release = json.Deserialize<Dictionary<string, object>>(responseBody);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(L("GitHub вернул неожиданный ответ.", "GitHub returned an unexpected response.", language), ex);
            }
            if (release == null) throw new InvalidOperationException(L("GitHub вернул пустой ответ.", "GitHub returned an empty response.", language));

            string tag = GetString(release, "tag_name");
            string latest = NormalizeVersion(tag);
            string releaseUrl = GetString(release, "html_url");
            string name = GetString(release, "name");
            string notes = GetString(release, "body");
            string downloadUrl = "";
            string assetName = "";
            bool dndEdition = AppStorage.DetectDndEdition();
            string preferredAsset = dndEdition ? "ChronicaDnDSetup.exe" : "ChronicaSetup.exe";
            object assetsValue;
            if (release.TryGetValue("assets", out assetsValue))
            {
                object[] assets = AsArray(assetsValue);
                for (int i = 0; i < assets.Length; i++)
                {
                    Dictionary<string, object> asset = assets[i] as Dictionary<string, object>;
                    if (asset == null) continue;
                    string fileName = GetString(asset, "name");
                    string url = GetString(asset, "browser_download_url");
                    if (string.Equals(fileName, preferredAsset, StringComparison.OrdinalIgnoreCase))
                    {
                        assetName = fileName;
                        downloadUrl = url;
                        break;
                    }
                }
                if (string.IsNullOrEmpty(downloadUrl))
                {
                    for (int i = 0; i < assets.Length; i++)
                    {
                        Dictionary<string, object> asset = assets[i] as Dictionary<string, object>;
                        if (asset == null) continue;
                        string fileName = GetString(asset, "name");
                        string url = GetString(asset, "browser_download_url");
                        if (!string.IsNullOrEmpty(fileName) && fileName.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                        {
                            assetName = fileName;
                            downloadUrl = url;
                            break;
                        }
                    }
                }
            }

            bool newer = CompareVersions(latest, AppInfo.Version) > 0;
            Dictionary<string, object> result = new Dictionary<string, object>();
            result["repo"] = clean;
            result["tag"] = tag;
            result["latestVersion"] = latest;
            result["currentVersion"] = AppInfo.Version;
            result["isNewer"] = newer;
            result["name"] = name;
            result["notes"] = notes;
            result["releaseUrl"] = releaseUrl;
            result["downloadUrl"] = downloadUrl;
            result["assetName"] = assetName;
            return result;
        }

        public static string Download(string url, string version, string language)
        {
            if (string.IsNullOrWhiteSpace(url))
                throw new InvalidOperationException(L("В релизе GitHub нет установщика .exe.", "The GitHub release has no .exe installer.", language));
            Uri uri;
            if (!Uri.TryCreate(url, UriKind.Absolute, out uri) || uri.Scheme != Uri.UriSchemeHttps)
                throw new InvalidOperationException(L("Некорректная ссылка на обновление.", "Invalid update link.", language));
            string host = uri.Host.ToLowerInvariant();
            if (!(host == "github.com" || host.EndsWith(".github.com") || host == "objects.githubusercontent.com" || host.EndsWith(".githubusercontent.com")))
                throw new InvalidOperationException(L("Ссылка на обновление должна вести на GitHub.", "The update link must point to GitHub.", language));
            string safeVersion = NormalizeVersion(version);
            if (string.IsNullOrEmpty(safeVersion)) safeVersion = "latest";
            string path = Path.Combine(Path.GetTempPath(), (AppStorage.DetectDndEdition() ? "ChronicaDnDSetup-" : "ChronicaSetup-") + safeVersion + ".exe");
            ServicePointManager.SecurityProtocol = ServicePointManager.SecurityProtocol | SecurityProtocolType.Tls12;
            using (WebClient client = new WebClient())
            {
                client.Headers["User-Agent"] = UserAgent;
                client.DownloadFile(uri, path);
            }
            return path;
        }

        public static void RunInstaller(string path, string language)
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
                throw new InvalidOperationException(L("Установщик обновления не найден.", "The update installer was not found.", language));
            if (!path.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(L("Обновление должно быть .exe-файлом.", "The update must be an .exe file.", language));
            string currentDir = AppDomain.CurrentDomain.BaseDirectory
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            System.Diagnostics.ProcessStartInfo info = new System.Diagnostics.ProcessStartInfo(path);
            info.UseShellExecute = true;
            if (File.Exists(Path.Combine(currentDir, "Uninstall.exe")))
                info.Arguments = "/D=\"" + currentDir + "\"";
            System.Diagnostics.Process.Start(info);
        }

        private static string L(string ru, string en, string language)
        {
            return language == "en" ? en : ru;
        }

        private static string NormalizeRepo(string repo)
        {
            string clean = (repo ?? "").Trim();
            if (clean.StartsWith("https://github.com/", StringComparison.OrdinalIgnoreCase))
                clean = clean.Substring("https://github.com/".Length);
            clean = clean.Trim('/');
            if (clean.EndsWith(".git", StringComparison.OrdinalIgnoreCase))
                clean = clean.Substring(0, clean.Length - 4);
            return clean;
        }

        private static string NormalizeVersion(string value)
        {
            return (value ?? "").Trim().TrimStart('v', 'V');
        }

        private static int CompareVersions(string left, string right)
        {
            string[] a = (left ?? "").Split('.');
            string[] b = (right ?? "").Split('.');
            int count = Math.Max(a.Length, b.Length);
            for (int i = 0; i < count; i++)
            {
                int av = i < a.Length ? ParsePart(a[i]) : 0;
                int bv = i < b.Length ? ParsePart(b[i]) : 0;
                if (av != bv) return av > bv ? 1 : -1;
            }
            return 0;
        }

        private static int ParsePart(string value)
        {
            int result;
            return int.TryParse(value, out result) ? result : 0;
        }

        private static string GetString(Dictionary<string, object> map, string key)
        {
            object value;
            if (map == null || !map.TryGetValue(key, out value) || value == null) return "";
            return Convert.ToString(value);
        }

        private static object[] AsArray(object value)
        {
            if (value == null) return new object[0];
            object[] array = value as object[];
            if (array != null) return array;
            System.Collections.IEnumerable sequence = value as System.Collections.IEnumerable;
            if (sequence == null) return new object[0];
            List<object> list = new List<object>();
            foreach (object item in sequence) list.Add(item);
            return list.ToArray();
        }
    }
}
