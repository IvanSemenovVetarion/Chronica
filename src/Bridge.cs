using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace Mifarium
{
    internal sealed class Bridge
    {
        private readonly AppStorage _storage;
        private readonly IWin32Window _owner;
        private readonly JavaScriptSerializer _json;

        public event Action<string> ThemeChanged;
        public event Action<string> AppNameChanged;
        public event Action<double> UiScaleChanged;

        public Bridge(AppStorage storage, IWin32Window owner)
        {
            _storage = storage;
            _owner = owner;
            _json = AppStorage.CreateSerializer();
        }

        public async Task<string> ProcessAsync(string messageJson)
        {
            Dictionary<string, object> response = new Dictionary<string, object>();
            object id = 0;
            string method = string.Empty;
            try
            {
                Dictionary<string, object> message =
                    _json.Deserialize<Dictionary<string, object>>(messageJson);
                if (message == null) throw new InvalidOperationException("Пустое сообщение интерфейса.");

                if (message.ContainsKey("id")) id = message["id"];
                if (message.ContainsKey("method")) method = Convert.ToString(message["method"]);
                Dictionary<string, object> args = null;
                object rawArgs;
                if (message.TryGetValue("args", out rawArgs))
                    args = rawArgs as Dictionary<string, object>;

                object result;
                if (method == "deepseekExtract")
                {
                    string text = Arg(args, "text");
                    string model = Arg(args, "model");
                    DeepSeekClient client = new DeepSeekClient(_storage.GetApiKey(), model);
                    result = await Task.Run(() => client.Extract(text));
                }
                else if (method == "checkUpdates")
                {
                    result = await Task.Run(() => UpdateService.Check(_storage.GetGitHubRepo(), _storage.GetLanguage()));
                }
                else if (method == "downloadUpdate")
                {
                    string url = Arg(args, "url");
                    string version = Arg(args, "version");
                    string path = await Task.Run(() => UpdateService.Download(url, version, _storage.GetLanguage()));
                    Dictionary<string, object> downloaded = new Dictionary<string, object>();
                    downloaded["path"] = path;
                    result = downloaded;
                }
                else
                {
                    result = Dispatch(method, args);
                }

                response["id"] = id;
                response["ok"] = true;
                response["result"] = result;
            }
            catch (Exception ex)
            {
                Log.Error("Ошибка обработки запроса интерфейса: " + method, ex);
                response = new Dictionary<string, object>();
                response["id"] = id;
                response["ok"] = false;
                response["error"] = FriendlyError(ex);
            }
            try
            {
                return _json.Serialize(response);
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось сериализовать ответ для интерфейса", ex);
                return "{\"id\":0,\"ok\":false,\"error\":\"Внутренняя ошибка приложения.\"}";
            }
        }

        private object Dispatch(string method, Dictionary<string, object> args)
        {
            switch (method)
            {
                case "loadData":
                {
                    Dictionary<string, object> result = new Dictionary<string, object>();
                    result["json"] = _storage.LoadJson();
                    return result;
                }
                case "saveData":
                {
                    string json = Arg(args, "json");
                    if (json == null) throw new InvalidOperationException("Не переданы данные для сохранения.");
                    long size = _storage.SaveJson(json);
                    Dictionary<string, object> result = new Dictionary<string, object>();
                    result["savedAt"] = DateTimeOffset.Now.ToString("o");
                    result["size"] = size;
                    return result;
                }
                case "pickImage":
                {
                    string kind = Arg(args, "kind");
                    string name = _storage.PickImage(kind, _owner);
                    if (name == null) return null;
                    Dictionary<string, object> result = new Dictionary<string, object>();
                    result["url"] = "https://media.mifarium/" + Uri.EscapeDataString(name);
                    result["name"] = name;
                    result["size"] = new FileInfo(Path.Combine(_storage.ImagesDir, name)).Length;
                    return result;
                }
                case "pickImages":
                {
                    string kind = Arg(args, "kind");
                    List<string> names = _storage.PickImages(kind, _owner);
                    if (names == null) return null;
                    List<Dictionary<string, object>> result = new List<Dictionary<string, object>>();
                    for (int i = 0; i < names.Count; i++)
                    {
                        Dictionary<string, object> item = new Dictionary<string, object>();
                        item["url"] = "https://media.mifarium/" + Uri.EscapeDataString(names[i]);
                        item["name"] = names[i];
                        item["size"] = new FileInfo(Path.Combine(_storage.ImagesDir, names[i])).Length;
                        result.Add(item);
                    }
                    return result;
                }
                case "pickAudio":
                {
                    string name = _storage.PickAudio(_owner);
                    if (name == null) return null;
                    Dictionary<string, object> result = new Dictionary<string, object>();
                    result["url"] = "https://audio.mifarium/" + Uri.EscapeDataString(name);
                    result["name"] = name;
                    result["size"] = new FileInfo(Path.Combine(_storage.AudioDir, name)).Length;
                    return result;
                }
                case "pickBackground":
                {
                    string name = _storage.PickBackground(_owner);
                    if (name == null) return null;
                    Dictionary<string, object> result = new Dictionary<string, object>();
                    result["url"] = "https://media.mifarium/" + Uri.EscapeDataString(name);
                    result["name"] = name;
                    result["size"] = new FileInfo(Path.Combine(_storage.ImagesDir, name)).Length;
                    return result;
                }
                case "pickFont":
                {
                    string name = _storage.PickFont(_owner);
                    if (name == null) return null;
                    Dictionary<string, object> result = new Dictionary<string, object>();
                    result["url"] = "https://fonts.mifarium/" + Uri.EscapeDataString(name);
                    result["name"] = name;
                    result["displayName"] = _storage.LastPickedFontName;
                    result["size"] = new FileInfo(Path.Combine(_storage.FontsDir, name)).Length;
                    return result;
                }
                case "createBackup":
                {
                    Dictionary<string, object> result = new Dictionary<string, object>();
                    result["path"] = _storage.CreateBackup();
                    return result;
                }
                case "exportWorld":
                    return ExportWorld(args);
                case "setLanguage":
                    _storage.SaveLanguage(Arg(args, "language"));
                    return new Dictionary<string, object> { { "language", _storage.GetLanguage() } };
                case "setUiScale":
                {
                    double scale = Convert.ToDouble(args != null && args.ContainsKey("scale") ? args["scale"] : 1.0);
                    if (scale < 0.7) scale = 0.7;
                    if (scale > 1.6) scale = 1.6;
                    if (UiScaleChanged != null) UiScaleChanged(scale);
                    return new Dictionary<string, object> { { "scale", scale } };
                }
                case "getSyncSettings":
                    return _storage.GetSyncSettings();
                case "saveSyncSettings":
                {
                    string folder = Arg(args, "folder");
                    string participant = Arg(args, "participant");
                    bool auto = ArgBool(args, "auto");
                    bool assets = ArgBool(args, "assets");
                    return _storage.SaveSyncSettings(folder, participant, auto, assets);
                }
                case "chooseSyncFolder":
                    return _storage.ChooseSyncFolder(_owner);
                case "readShared":
                    return _storage.ReadSharedJson();
                case "writeShared":
                {
                    string json = Arg(args, "json");
                    if (json == null) throw new InvalidOperationException("Нет данных для общей копии.");
                    return _storage.WriteSharedJson(json);
                }
                case "getGitHubRepo":
                    return new Dictionary<string, object> { { "repo", _storage.GetGitHubRepo() } };
                case "saveGitHubRepo":
                    return new Dictionary<string, object> { { "repo", _storage.SaveGitHubRepo(Arg(args, "repo")) } };
                case "runInstaller":
                    UpdateService.RunInstaller(Arg(args, "path"), _storage.GetLanguage());
                    return new Dictionary<string, object> { { "ok", true } };
                case "getApiSettings":
                    return _storage.GetApiSettings();
                case "saveApiSettings":
                {
                    string apiKey = Arg(args, "apiKey");
                    string model = Arg(args, "model");
                    bool clear = ArgBool(args, "clear");
                    return _storage.SaveApiSettings(apiKey, model, clear);
                }
                case "restoreBackup":
                    return RestoreBackup();
                case "getInfo":
                    return GetInfo();
                case "openDataFolder":
                    _storage.OpenDataFolder();
                    return new Dictionary<string, object> { { "ok", true } };
                case "setTheme":
                {
                    string theme = Arg(args, "theme");
                    if (!IsKnownTheme(theme)) theme = "dark";
                    _storage.SaveTheme(theme);
                    Action<string> handler = ThemeChanged;
                    if (handler != null) handler(theme);
                    return new Dictionary<string, object> { { "theme", theme } };
                }
                case "setAppName":
                {
                    string appName = _storage.SaveAppName(Arg(args, "appName"));
                    Action<string> handler = AppNameChanged;
                    if (handler != null) handler(appName);
                    Dictionary<string, object> output = new Dictionary<string, object>();
                    output["appName"] = appName;
                    return output;
                }
                case "showItemInFolder":
                    _storage.ShowItemInFolder(Arg(args, "path"));
                    return new Dictionary<string, object> { { "ok", true } };
                default:
                    throw new InvalidOperationException("Неизвестный метод приложения: " + method);
            }
        }

        private object ExportWorld(Dictionary<string, object> args)
        {
            string json = _storage.LoadJson();
            if (string.IsNullOrWhiteSpace(json))
                throw new InvalidOperationException("Летопись пуста — экспортировать нечего.");
            string format = (Arg(args, "format") ?? string.Empty).ToLowerInvariant();
            string filter;
            string extension;
            string label;
            if (format == "docx")
            {
                filter = _storage.L("Документ Word|*.docx", "Word document|*.docx");
                extension = ".docx";
                label = _storage.L("Документ Word", "Word document");
            }
            else if (format == "xlsx")
            {
                filter = _storage.L("Книга Excel|*.xlsx", "Excel workbook|*.xlsx");
                extension = ".xlsx";
                label = _storage.L("Книга Excel", "Excel workbook");
            }
            else if (format == "json")
            {
                filter = _storage.L("Летопись JSON|*.json", "Chronicle JSON|*.json");
                extension = ".json";
                label = _storage.L("Летопись JSON", "Chronicle JSON");
            }
            else
            {
                throw new InvalidOperationException("Неизвестный формат экспорта.");
            }

            string worldName = WorldExporter.WorldName(json);
            string baseName = SafeFileName(worldName + " — Chronica");
            using (SaveFileDialog dialog = new SaveFileDialog())
            {
                dialog.Title = _storage.L("Экспорт: ", "Export: ") + label;
                dialog.Filter = filter;
                dialog.DefaultExt = extension;
                dialog.AddExtension = true;
                dialog.OverwritePrompt = true;
                dialog.FileName = baseName + extension;
                DialogResult result = _owner == null
                    ? dialog.ShowDialog()
                    : dialog.ShowDialog(_owner);
                if (result != DialogResult.OK) return null;
                WorldExporter.Export(json, dialog.FileName, format);
                Dictionary<string, object> output = new Dictionary<string, object>();
                output["path"] = dialog.FileName;
                Log.Info("Экспорт (" + format + "): " + dialog.FileName);
                return output;
            }
        }

        private static string SafeFileName(string value)
        {
            char[] invalid = Path.GetInvalidFileNameChars();
            string result = value ?? "Chronica";
            for (int i = 0; i < invalid.Length; i++)
                result = result.Replace(invalid[i], ' ');
            result = result.Trim();
            while (result.IndexOf("  ", StringComparison.Ordinal) >= 0)
                result = result.Replace("  ", " ");
            if (result.Length == 0) result = "Chronica";
            if (result.Length > 120) result = result.Substring(0, 120).Trim();
            return result;
        }

        private static bool IsKnownTheme(string theme)
        {
            switch ((theme ?? string.Empty).ToLowerInvariant())
            {
                case "dark":
                case "light":
                case "emerald":
                case "rosequartz":
                case "wine":
                case "sapphire":
                case "amethyst":
                case "obsidian":
                case "copper":
                case "ocean":
                case "plum":
                case "steel":
                case "moss":
                    return true;
                default:
                    return false;
            }
        }

        private object RestoreBackup()
        {
            using (OpenFileDialog dialog = new OpenFileDialog())
            {
                dialog.Title = _storage.L("Выберите резервную копию Chronica", "Choose a Chronica backup");
                dialog.Filter = _storage.L("Резервные копии Chronica|*.zip;*.json|Архивы|*.zip|Летопись JSON|*.json|Все файлы|*.*",
                    "Chronica backups|*.zip;*.json|Archives|*.zip|Chronicle JSON|*.json|All files|*.*");
                dialog.CheckFileExists = true;
                dialog.Multiselect = false;
                DialogResult result = _owner == null
                    ? dialog.ShowDialog()
                    : dialog.ShowDialog(_owner);
                if (result != DialogResult.OK) return null;
                return _storage.RestoreBackup(dialog.FileName);
            }
        }

        private object GetInfo()
        {
            Dictionary<string, object> result = new Dictionary<string, object>();
            result["storagePath"] = _storage.DataDir;
            result["dataFile"] = _storage.DataFile;
            result["imagesPath"] = _storage.ImagesDir;
            result["backupsPath"] = _storage.BackupsDir;
            result["dataSize"] = _storage.DataFileSize();
            result["dataFileSize"] = _storage.DataFileSize();
            result["imageCount"] = _storage.CountImages();
            result["audioCount"] = _storage.CountAudio();
            result["fontCount"] = _storage.CountFonts();
            result["version"] = AppInfo.Version;
            result["appName"] = _storage.GetAppName();
            result["edition"] = _storage.Edition;
            result["editionName"] = _storage.IsDndEdition ? "Chronika DnD Edition" : "Chronica";
            result["githubRepo"] = _storage.GetGitHubRepo();
            result["portable"] = _storage.IsPortable;
            result["mode"] = _storage.IsPortable ? "portable" : "local";
            return result;
        }

        private static string Arg(Dictionary<string, object> args, string name)
        {
            if (args == null) return null;
            object value;
            if (!args.TryGetValue(name, out value)) return null;
            return value == null ? null : Convert.ToString(value);
        }

        private static bool ArgBool(Dictionary<string, object> args, string name)
        {
            if (args == null) return false;
            object value;
            if (!args.TryGetValue(name, out value) || value == null) return false;
            bool parsed;
            if (value is bool) return (bool)value;
            return bool.TryParse(Convert.ToString(value), out parsed) && parsed;
        }

        private static string FriendlyError(Exception exception)
        {
            if (exception is UnauthorizedAccessException)
                return "Нет прав на запись в папку данных. Проверьте права доступа.";
            if (exception is IOException)
                return "Ошибка файла: " + exception.Message;
            return exception.Message;
        }
    }
}
