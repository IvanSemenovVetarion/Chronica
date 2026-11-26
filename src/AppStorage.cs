using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;

namespace Mifarium
{
    internal static class Log
    {
        private static readonly object Sync = new object();
        private static string _path;

        public static void Configure(string path)
        {
            _path = path;
        }

        public static void Error(string context, Exception exception)
        {
            try
            {
                if (string.IsNullOrEmpty(_path)) return;
                string text = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + context;
                if (exception != null) text += Environment.NewLine + exception;
                text += Environment.NewLine + new string('-', 72) + Environment.NewLine;
                lock (Sync) File.AppendAllText(_path, text, new UTF8Encoding(false));
            }
            catch
            {
            }
        }

        public static void Info(string message)
        {
            try
            {
                if (string.IsNullOrEmpty(_path)) return;
                string text = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + message + Environment.NewLine;
                lock (Sync) File.AppendAllText(_path, text, new UTF8Encoding(false));
            }
            catch
            {
            }
        }
    }

    internal sealed class AppStorage
    {
        private static readonly JavaScriptSerializer Json = CreateSerializer();
        private readonly object _saveSync = new object();

        public string DataDir { get; private set; }
        public string DataFile { get; private set; }
        public string BackupFile { get; private set; }
        public string ImagesDir { get; private set; }
        public string AudioDir { get; private set; }
        public string FontsDir { get; private set; }
        public string BackupsDir { get; private set; }
        public string LogFile { get; private set; }
        public string WebViewDir { get; private set; }
        public bool IsPortable { get; private set; }
        public bool IsDndEdition { get; private set; }
        public string Edition { get { return IsDndEdition ? "dnd" : "standard"; } }
        public string LastPickedFontName { get; private set; }

        private AppStorage()
        {
        }

        public static JavaScriptSerializer CreateSerializer()
        {
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            serializer.MaxJsonLength = 128 * 1024 * 1024;
            serializer.RecursionLimit = 200;
            return serializer;
        }

        public static bool DetectDndEdition()
        {
#if DND_EDITION
            return true;
#else
            return false;
#endif
        }

        public static AppStorage Create()
        {
            bool dnd = DetectDndEdition();
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string portableDir = dnd
                ? ResolveDirectory(baseDir, "ChronicaDnDData")
                : ResolveDirectory(baseDir, "ChronicaData", "TitZeroData", "MifariumData");
            string localDir = dnd
                ? ResolveDirectory(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ChronicaDnD")
                : ResolveDirectory(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Chronica", "TitZero", "Mifarium");

            string chosen = null;
            bool portable = false;
            Exception portableError = null;
            try
            {
                PrepareDirectory(portableDir);
                chosen = portableDir;
                portable = true;
            }
            catch (Exception ex)
            {
                portableError = ex;
            }
            if (chosen == null)
            {
                PrepareDirectory(localDir);
                chosen = localDir;
            }

            AppStorage storage = new AppStorage();
            storage.DataDir = Path.GetFullPath(chosen);
            storage.IsPortable = portable;
            storage.IsDndEdition = dnd;
            storage.DataFile = Path.Combine(storage.DataDir, "chronica.json");
            storage.BackupFile = Path.Combine(storage.DataDir, "chronica.json.bak");
            storage.ImagesDir = Path.Combine(storage.DataDir, "images");
            storage.AudioDir = Path.Combine(storage.DataDir, "audio");
            storage.FontsDir = Path.Combine(storage.DataDir, "fonts");
            storage.BackupsDir = Path.Combine(storage.DataDir, "backups");
            storage.LogFile = Path.Combine(storage.DataDir, "chronica.log");
            storage.WebViewDir = Path.Combine(storage.DataDir, "webview");
            MigrateDataFiles(storage);

            Directory.CreateDirectory(storage.ImagesDir);
            Directory.CreateDirectory(storage.AudioDir);
            Directory.CreateDirectory(storage.FontsDir);
            Directory.CreateDirectory(storage.BackupsDir);
            Directory.CreateDirectory(storage.WebViewDir);

            Log.Configure(storage.LogFile);
            if (portableError != null)
            {
                Log.Error("Папка рядом с программой недоступна, используется LocalAppData", portableError);
            }
            Log.Info("Запуск " + (dnd ? "Chronika DnD Edition" : "Chronica") + ". Данные: " + storage.DataDir + (portable ? " (портативно)" : " (LocalAppData)"));
            return storage;
        }

        private static string ResolveDirectory(string parent, string name, params string[] legacyNames)
        {
            string target = Path.Combine(parent, name);
            if (!Directory.Exists(target))
            {
                for (int i = 0; i < legacyNames.Length; i++)
                {
                    string legacy = Path.Combine(parent, legacyNames[i]);
                    if (!Directory.Exists(legacy)) continue;
                    try
                    {
                        Directory.Move(legacy, target);
                        break;
                    }
                    catch
                    {
                        return legacy;
                    }
                }
            }
            return target;
        }

        private static void MigrateDataFiles(AppStorage storage)
        {
            try
            {
                string oldData = Path.Combine(storage.DataDir, "mifarium.json");
                string oldBackup = Path.Combine(storage.DataDir, "mifarium.json.bak");
                if (!File.Exists(storage.DataFile) && File.Exists(oldData))
                    File.Move(oldData, storage.DataFile);
                if (!File.Exists(storage.BackupFile) && File.Exists(oldBackup))
                    File.Move(oldBackup, storage.BackupFile);
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось перенести имя файла летописи", ex);
            }
        }

        private static void PrepareDirectory(string path)
        {
            Directory.CreateDirectory(path);
            string test = Path.Combine(path, ".write-test-" + Guid.NewGuid().ToString("N"));
            File.WriteAllText(test, "ok", new UTF8Encoding(false));
            File.Delete(test);
        }

        public string LoadJson()
        {
            string json = TryReadJson(DataFile);
            if (json != null) return json;
            string backup = TryReadJson(BackupFile);
            if (backup != null)
            {
                Log.Info("Основной файл летописи отсутствует или повреждён, загружена резервная копия.");
                return backup;
            }
            return null;
        }

        private static string TryReadJson(string path)
        {
            try
            {
                if (!File.Exists(path)) return null;
                string text = File.ReadAllText(path, Encoding.UTF8);
                if (string.IsNullOrWhiteSpace(text)) return null;
                Json.DeserializeObject(text);
                return text;
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось прочитать " + path, ex);
                return null;
            }
        }

        public long SaveJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                throw new InvalidOperationException("Летопись пуста — сохранять нечего.");
            if (json.Length > 96 * 1024 * 1024)
                throw new InvalidOperationException("Летопись слишком велика для сохранения.");

            try
            {
                Json.DeserializeObject(json);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Данные летописи повреждены и не были сохранены.", ex);
            }

            lock (_saveSync)
            {
                Directory.CreateDirectory(DataDir);
                string temp = DataFile + ".tmp-" + Guid.NewGuid().ToString("N");
                try
                {
                    File.WriteAllText(temp, json, new UTF8Encoding(false));
                    if (File.Exists(DataFile))
                    {
                        try
                        {
                            File.Copy(DataFile, BackupFile, true);
                        }
                        catch
                        {
                        }
                        try
                        {
                            File.Replace(temp, DataFile, null);
                        }
                        catch
                        {
                            File.Delete(DataFile);
                            File.Move(temp, DataFile);
                        }
                    }
                    else
                    {
                        File.Move(temp, DataFile);
                    }
                }
                finally
                {
                    try
                    {
                        if (File.Exists(temp)) File.Delete(temp);
                    }
                    catch
                    {
                    }
                }
                return new FileInfo(DataFile).Length;
            }
        }

        public int CountImages()
        {
            try
            {
                string[] files = Directory.GetFiles(ImagesDir);
                int count = 0;
                for (int i = 0; i < files.Length; i++)
                {
                    string ext = Path.GetExtension(files[i]).ToLowerInvariant();
                    if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp" || ext == ".gif" || ext == ".bmp" || ext == ".svg")
                        count++;
                }
                return count;
            }
            catch
            {
                return 0;
            }
        }

        public long DataFileSize()
        {
            try
            {
                return File.Exists(DataFile) ? new FileInfo(DataFile).Length : 0;
            }
            catch
            {
                return 0;
            }
        }

        public string PickImage(string kind, System.Windows.Forms.IWin32Window owner)
        {
            using (System.Windows.Forms.OpenFileDialog dialog = new System.Windows.Forms.OpenFileDialog())
            {
                dialog.Title = PickImageTitle(kind);
                dialog.Filter = L("Изображения|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.svg|Все файлы|*.*",
                    "Images|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.svg|All files|*.*");
                dialog.CheckFileExists = true;
                dialog.Multiselect = false;
                System.Windows.Forms.DialogResult dialogResult = owner == null
                    ? dialog.ShowDialog()
                    : dialog.ShowDialog(owner);
                if (dialogResult != System.Windows.Forms.DialogResult.OK)
                    return null;
                return ImportImageFile(dialog.FileName);
            }
        }

        public List<string> PickImages(string kind, System.Windows.Forms.IWin32Window owner)
        {
            using (System.Windows.Forms.OpenFileDialog dialog = new System.Windows.Forms.OpenFileDialog())
            {
                dialog.Title = PickImageTitle(kind);
                dialog.Filter = L("Изображения|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.svg|Все файлы|*.*",
                    "Images|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.svg|All files|*.*");
                dialog.CheckFileExists = true;
                dialog.Multiselect = true;
                System.Windows.Forms.DialogResult dialogResult = owner == null
                    ? dialog.ShowDialog()
                    : dialog.ShowDialog(owner);
                if (dialogResult != System.Windows.Forms.DialogResult.OK)
                    return null;
                List<string> names = new List<string>();
                for (int i = 0; i < dialog.FileNames.Length && names.Count < 24; i++)
                {
                    names.Add(ImportImageFile(dialog.FileNames[i]));
                }
                return names;
            }
        }

        private string ImportImageFile(string sourcePath)
        {
            FileInfo source = new FileInfo(sourcePath);
            string extension = source.Extension.ToLowerInvariant();
            if (!(extension == ".png" || extension == ".jpg" || extension == ".jpeg" || extension == ".webp" || extension == ".gif" || extension == ".bmp" || extension == ".svg"))
                throw new InvalidOperationException(L("Поддерживаются изображения PNG, JPG, WebP, GIF, BMP и SVG.",
                    "Supported image formats: PNG, JPG, WebP, GIF, BMP and SVG."));
            if (source.Length > 12L * 1024L * 1024L)
                throw new InvalidOperationException(L("Файл «" + source.Name + "» слишком большой. Выберите изображение до 12 МБ.",
                    "The file " + source.Name + " is too large. Choose an image up to 12 MB."));

            Directory.CreateDirectory(ImagesDir);
            string name = "img_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + "_" +
                          Guid.NewGuid().ToString("N").Substring(0, 6) + extension;
            string target = Path.Combine(ImagesDir, name);
            File.Copy(source.FullName, target, false);
            return name;
        }

        private string PickImageTitle(string kind)
        {
            switch ((kind ?? string.Empty).ToLowerInvariant())
            {
                case "character": return L("Большой портрет или рисунки персонажа", "Large portrait or character illustrations");
                case "region": return L("Изображение региона", "Region image");
                case "location": return L("Изображение локации", "Location image");
                case "faction": return L("Эмблема фракции", "Faction emblem");
                case "race": return L("Символ расы", "Race symbol");
                case "lore": return L("Иллюстрация статьи лора", "Lore article illustration");
                case "book": return L("Обложка источника", "Source cover");
                case "catalogItem": return L("Изображение записи раздела", "Section entry image");
                case "map": return L("Фон карты мира", "World map background");
                case "icon": return L("Иконка раздела (PNG или SVG)", "Section icon (PNG or SVG)");
                case "background": return L("Фон программы", "Program background");
                default: return L("Выберите изображение", "Choose an image");
            }
        }

        public string PickAudio(System.Windows.Forms.IWin32Window owner)
        {
            using (System.Windows.Forms.OpenFileDialog dialog = new System.Windows.Forms.OpenFileDialog())
            {
                dialog.Title = L("Голос персонажа или музыка", "Character voice or music");
                dialog.Filter = L("Аудио|*.mp3;*.wav;*.ogg;*.m4a;*.aac|Все файлы|*.*",
                    "Audio|*.mp3;*.wav;*.ogg;*.m4a;*.aac|All files|*.*");
                dialog.CheckFileExists = true;
                dialog.Multiselect = false;
                System.Windows.Forms.DialogResult dialogResult = owner == null
                    ? dialog.ShowDialog()
                    : dialog.ShowDialog(owner);
                if (dialogResult != System.Windows.Forms.DialogResult.OK)
                    return null;
                return ImportAudioFile(dialog.FileName);
            }
        }

        private string ImportAudioFile(string sourcePath)
        {
            FileInfo source = new FileInfo(sourcePath);
            string extension = source.Extension.ToLowerInvariant();
            if (!(extension == ".mp3" || extension == ".wav" || extension == ".ogg" || extension == ".m4a" || extension == ".aac"))
                throw new InvalidOperationException(L("Поддерживаются аудиофайлы MP3, WAV, OGG, M4A и AAC.",
                    "Supported audio formats: MP3, WAV, OGG, M4A and AAC."));
            if (source.Length > 40L * 1024L * 1024L)
                throw new InvalidOperationException(L("Аудиофайл «" + source.Name + "» слишком большой. Выберите файл до 40 МБ.",
                    "The audio file " + source.Name + " is too large. Choose a file up to 40 MB."));

            Directory.CreateDirectory(AudioDir);
            string name = "aud_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + "_" +
                          Guid.NewGuid().ToString("N").Substring(0, 6) + extension;
            string target = Path.Combine(AudioDir, name);
            File.Copy(source.FullName, target, false);
            return name;
        }

        public int CountAudio()
        {
            try
            {
                return Directory.GetFiles(AudioDir, "aud_*").Length;
            }
            catch
            {
                return 0;
            }
        }

        public string PickBackground(System.Windows.Forms.IWin32Window owner)
        {
            using (System.Windows.Forms.OpenFileDialog dialog = new System.Windows.Forms.OpenFileDialog())
            {
                dialog.Title = L("Фон программы", "Program background");
                dialog.Filter = L("Изображения|*.png;*.jpg;*.jpeg;*.webp|Все файлы|*.*",
                    "Images|*.png;*.jpg;*.jpeg;*.webp|All files|*.*");
                dialog.CheckFileExists = true;
                dialog.Multiselect = false;
                System.Windows.Forms.DialogResult result = owner == null ? dialog.ShowDialog() : dialog.ShowDialog(owner);
                if (result != System.Windows.Forms.DialogResult.OK) return null;
                FileInfo source = new FileInfo(dialog.FileName);
                string extension = source.Extension.ToLowerInvariant();
                if (!(extension == ".png" || extension == ".jpg" || extension == ".jpeg" || extension == ".webp"))
                    throw new InvalidOperationException(L("Для фона подходят PNG, JPG и WebP.", "Backgrounds must be PNG, JPG or WebP."));
                if (source.Length > 30L * 1024L * 1024L)
                    throw new InvalidOperationException(L("Фон слишком большой. Выберите изображение до 30 МБ.",
                        "The background is too large. Choose an image up to 30 MB."));
                Directory.CreateDirectory(ImagesDir);
                string name = "bg_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + "_" +
                              Guid.NewGuid().ToString("N").Substring(0, 6) + extension;
                File.Copy(source.FullName, Path.Combine(ImagesDir, name), false);
                return name;
            }
        }

        public string PickFont(System.Windows.Forms.IWin32Window owner)
        {
            using (System.Windows.Forms.OpenFileDialog dialog = new System.Windows.Forms.OpenFileDialog())
            {
                dialog.Title = L("Свой шрифт", "Custom font");
                dialog.Filter = L("Шрифты|*.ttf;*.otf;*.woff;*.woff2|Все файлы|*.*",
                    "Fonts|*.ttf;*.otf;*.woff;*.woff2|All files|*.*");
                dialog.CheckFileExists = true;
                dialog.Multiselect = false;
                System.Windows.Forms.DialogResult result = owner == null ? dialog.ShowDialog() : dialog.ShowDialog(owner);
                if (result != System.Windows.Forms.DialogResult.OK) return null;
                FileInfo source = new FileInfo(dialog.FileName);
                string extension = source.Extension.ToLowerInvariant();
                LastPickedFontName = Path.GetFileNameWithoutExtension(source.Name);
                if (!(extension == ".ttf" || extension == ".otf" || extension == ".woff" || extension == ".woff2"))
                    throw new InvalidOperationException(L("Поддерживаются шрифты TTF, OTF, WOFF и WOFF2.",
                        "Supported font formats: TTF, OTF, WOFF and WOFF2."));
                if (source.Length > 20L * 1024L * 1024L)
                    throw new InvalidOperationException(L("Шрифт слишком большой. Выберите файл до 20 МБ.",
                        "The font is too large. Choose a file up to 20 MB."));
                Directory.CreateDirectory(FontsDir);
                string name = "font_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + "_" +
                              Guid.NewGuid().ToString("N").Substring(0, 6) + extension;
                File.Copy(source.FullName, Path.Combine(FontsDir, name), false);
                return name;
            }
        }

        public int CountFonts()
        {
            try
            {
                return Directory.GetFiles(FontsDir, "font_*").Length;
            }
            catch
            {
                return 0;
            }
        }

        public string CreateBackup()
        {
            Directory.CreateDirectory(BackupsDir);
            string stamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
            string path = Path.Combine(BackupsDir, "Chronica-backup-" + stamp + ".zip");
            int suffix = 2;
            while (File.Exists(path))
            {
                path = Path.Combine(BackupsDir, "Chronica-backup-" + stamp + "-" + suffix + ".zip");
                suffix++;
            }

            using (System.IO.Compression.ZipArchive zip = System.IO.Compression.ZipFile.Open(
                path, System.IO.Compression.ZipArchiveMode.Create))
            {
                if (File.Exists(DataFile))
                {
                    zip.CreateEntryFromFile(DataFile, "chronica.json",
                        System.IO.Compression.CompressionLevel.Optimal);
                }
                string[] images = Directory.GetFiles(ImagesDir);
                for (int i = 0; i < images.Length; i++)
                {
                    string ext = Path.GetExtension(images[i]).ToLowerInvariant();
                    if (!(ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".webp" || ext == ".gif" || ext == ".bmp" || ext == ".svg"))
                        continue;
                    zip.CreateEntryFromFile(images[i], "images/" + Path.GetFileName(images[i]),
                        System.IO.Compression.CompressionLevel.Optimal);
                }

                string[] audio = Directory.GetFiles(AudioDir);
                for (int i = 0; i < audio.Length; i++)
                {
                    string ext = Path.GetExtension(audio[i]).ToLowerInvariant();
                    if (!(ext == ".mp3" || ext == ".wav" || ext == ".ogg" || ext == ".m4a" || ext == ".aac"))
                        continue;
                    zip.CreateEntryFromFile(audio[i], "audio/" + Path.GetFileName(audio[i]),
                        System.IO.Compression.CompressionLevel.Optimal);
                }

                string[] fonts = Directory.GetFiles(FontsDir);
                for (int i = 0; i < fonts.Length; i++)
                {
                    string ext = Path.GetExtension(fonts[i]).ToLowerInvariant();
                    if (!(ext == ".ttf" || ext == ".otf" || ext == ".woff" || ext == ".woff2"))
                        continue;
                    zip.CreateEntryFromFile(fonts[i], "fonts/" + Path.GetFileName(fonts[i]),
                        System.IO.Compression.CompressionLevel.Optimal);
                }

                System.IO.Compression.ZipArchiveEntry manifest = zip.CreateEntry("manifest.txt");
                using (StreamWriter writer = new StreamWriter(manifest.Open(), new UTF8Encoding(false)))
                {
                    writer.WriteLine("Chronica — резервная копия");
                    writer.WriteLine("Создана: " + DateTime.Now.ToString("dd.MM.yyyy HH:mm"));
                    writer.WriteLine("Формат: 2");
                    writer.WriteLine("Изображений: " + CountImages());
                    writer.WriteLine("Аудио: " + CountAudio());
                    writer.WriteLine("Шрифтов: " + CountFonts());
                    writer.WriteLine("Версия: " + AppInfo.Version);
                }
            }
            Log.Info("Создана резервная копия: " + path);
            return path;
        }

        public Dictionary<string, object> RestoreBackup(string path)
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
                throw new InvalidOperationException("Файл архива не найден.");

            string extension = Path.GetExtension(path).ToLowerInvariant();
            if (extension == ".json")
            {
                string text = File.ReadAllText(path, Encoding.UTF8);
                Json.DeserializeObject(text);
                CreateBackup();
                return Result(text, path);
            }
            if (extension != ".zip")
                throw new InvalidOperationException(L("Выберите архив Chronica (.zip) или файл летописи (.json).",
                    "Choose a Chronica archive (.zip) or chronicle file (.json)."));

            string json = null;
            CreateBackup();

            using (System.IO.Compression.ZipArchive zip = System.IO.Compression.ZipFile.OpenRead(path))
            {
                System.IO.Compression.ZipArchiveEntry jsonEntry = null;
                List<System.IO.Compression.ZipArchiveEntry> images = new List<System.IO.Compression.ZipArchiveEntry>();
                List<System.IO.Compression.ZipArchiveEntry> audio = new List<System.IO.Compression.ZipArchiveEntry>();
                List<System.IO.Compression.ZipArchiveEntry> fonts = new List<System.IO.Compression.ZipArchiveEntry>();
                for (int i = 0; i < zip.Entries.Count; i++)
                {
                    System.IO.Compression.ZipArchiveEntry entry = zip.Entries[i];
                    if (string.IsNullOrEmpty(entry.Name)) continue;
                    string normalized = entry.FullName.Replace('\\', '/');
                    if (normalized.StartsWith("images/", StringComparison.OrdinalIgnoreCase))
                    {
                        images.Add(entry);
                    }
                    else if (normalized.StartsWith("audio/", StringComparison.OrdinalIgnoreCase))
                    {
                        audio.Add(entry);
                    }
                    else if (normalized.StartsWith("fonts/", StringComparison.OrdinalIgnoreCase))
                    {
                        fonts.Add(entry);
                    }
                    else if (normalized.EndsWith(".json", StringComparison.OrdinalIgnoreCase) &&
                             (jsonEntry == null ||
                              normalized.Equals("chronica.json", StringComparison.OrdinalIgnoreCase) ||
                              normalized.Equals("mifarium.json", StringComparison.OrdinalIgnoreCase)))
                    {
                        jsonEntry = entry;
                    }
                }

                if (jsonEntry == null)
                    throw new InvalidOperationException("В архиве не найден файл летописи chronica.json.");

                using (StreamReader reader = new StreamReader(jsonEntry.Open(), Encoding.UTF8))
                {
                    json = reader.ReadToEnd();
                }
                if (string.IsNullOrWhiteSpace(json))
                    throw new InvalidOperationException("Файл летописи в архиве пуст.");
                Json.DeserializeObject(json);

                Directory.CreateDirectory(ImagesDir);
                for (int i = 0; i < images.Count; i++)
                {
                    string name = Path.GetFileName(images[i].FullName.Replace('\\', '/'));
                    if (string.IsNullOrEmpty(name) || name == "." || name == "..") continue;
                    string target = Path.Combine(ImagesDir, name);
                    if (!Path.GetFullPath(target).StartsWith(Path.GetFullPath(ImagesDir), StringComparison.OrdinalIgnoreCase))
                        continue;
                    string temp = target + ".restore-" + Guid.NewGuid().ToString("N");
                    using (Stream input = images[i].Open())
                    using (FileStream output = File.Create(temp))
                    {
                        input.CopyTo(output);
                    }
                    if (File.Exists(target)) File.Delete(target);
                    File.Move(temp, target);
                }

                Directory.CreateDirectory(AudioDir);
                for (int i = 0; i < audio.Count; i++)
                {
                    string name = Path.GetFileName(audio[i].FullName.Replace('\\', '/'));
                    if (string.IsNullOrEmpty(name) || name == "." || name == "..") continue;
                    string target = Path.Combine(AudioDir, name);
                    if (!Path.GetFullPath(target).StartsWith(Path.GetFullPath(AudioDir), StringComparison.OrdinalIgnoreCase))
                        continue;
                    string temp = target + ".restore-" + Guid.NewGuid().ToString("N");
                    using (Stream input = audio[i].Open())
                    using (FileStream output = File.Create(temp))
                    {
                        input.CopyTo(output);
                    }
                    if (File.Exists(target)) File.Delete(target);
                    File.Move(temp, target);
                }

                Directory.CreateDirectory(FontsDir);
                for (int i = 0; i < fonts.Count; i++)
                {
                    string name = Path.GetFileName(fonts[i].FullName.Replace('\\', '/'));
                    if (string.IsNullOrEmpty(name) || name == "." || name == "..") continue;
                    string target = Path.Combine(FontsDir, name);
                    if (!Path.GetFullPath(target).StartsWith(Path.GetFullPath(FontsDir), StringComparison.OrdinalIgnoreCase))
                        continue;
                    string temp = target + ".restore-" + Guid.NewGuid().ToString("N");
                    using (Stream input = fonts[i].Open())
                    using (FileStream output = File.Create(temp))
                    {
                        input.CopyTo(output);
                    }
                    if (File.Exists(target)) File.Delete(target);
                    File.Move(temp, target);
                }
            }

            Log.Info("Восстановлено из архива: " + path);
            return Result(json, path);
        }

        private static Dictionary<string, object> Result(string json, string path)
        {
            Dictionary<string, object> result = new Dictionary<string, object>();
            result["json"] = json;
            result["path"] = path;
            return result;
        }

        public void OpenDataFolder()
        {
            System.Diagnostics.Process.Start("explorer.exe", "\"" + DataDir + "\"");
        }

        public void ShowItemInFolder(string path)
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path)) return;
            System.Diagnostics.Process.Start("explorer.exe", "/select,\"" + path + "\"");
        }

        public Dictionary<string, object> GetSyncSettings()
        {
            Dictionary<string, object> settings = ReadSettings();
            Dictionary<string, object> result = new Dictionary<string, object>();
            string folder = "";
            string participant = "";
            object value;
            if (settings.TryGetValue("syncFolder", out value)) folder = Convert.ToString(value) ?? "";
            if (settings.TryGetValue("syncName", out value)) participant = Convert.ToString(value) ?? "";
            bool auto = true;
            if (settings.TryGetValue("syncAuto", out value))
            {
                bool parsed;
                if (bool.TryParse(Convert.ToString(value), out parsed)) auto = parsed;
            }
            bool assets = true;
            if (settings.TryGetValue("syncAssets", out value))
            {
                bool parsed;
                if (bool.TryParse(Convert.ToString(value), out parsed)) assets = parsed;
            }
            result["folder"] = folder;
            result["participant"] = participant;
            result["auto"] = auto;
            result["assets"] = assets;
            result["path"] = string.IsNullOrEmpty(folder) ? "" : Path.Combine(folder, "ChronicaShared.json");
            result["exists"] = !string.IsNullOrEmpty(folder) && File.Exists(Path.Combine(folder, "ChronicaShared.json"));
            return result;
        }

        public Dictionary<string, object> SaveSyncSettings(string folder, string participant, bool auto, bool assets)
        {
            Dictionary<string, object> settings = ReadSettings();
            settings["syncFolder"] = (folder ?? "").Trim();
            settings["syncName"] = (participant ?? "").Trim();
            settings["syncAuto"] = auto ? "true" : "false";
            settings["syncAssets"] = assets ? "true" : "false";
            WriteSettings(settings);
            return GetSyncSettings();
        }

        public string ChooseSyncFolder(System.Windows.Forms.IWin32Window owner)
        {
            using (System.Windows.Forms.FolderBrowserDialog dialog = new System.Windows.Forms.FolderBrowserDialog())
            {
                dialog.Description = L("Выберите общую папку Chronica (Яндекс Диск, Google Drive, OneDrive или сетевая папка)",
                    "Choose the shared Chronica folder (Yandex Disk, Google Drive, OneDrive or a network folder)");
                dialog.ShowNewFolderButton = true;
                Dictionary<string, object> sync = GetSyncSettings();
                string current = Convert.ToString(sync["folder"]);
                if (!string.IsNullOrEmpty(current) && Directory.Exists(current)) dialog.SelectedPath = current;
                System.Windows.Forms.DialogResult result = owner == null ? dialog.ShowDialog() : dialog.ShowDialog(owner);
                return result == System.Windows.Forms.DialogResult.OK ? dialog.SelectedPath : null;
            }
        }

        public Dictionary<string, object> ReadSharedJson()
        {
            Dictionary<string, object> sync = GetSyncSettings();
            string folder = Convert.ToString(sync["folder"]);
            Dictionary<string, object> result = new Dictionary<string, object>();
            result["folder"] = folder;
            if (string.IsNullOrEmpty(folder))
                throw new InvalidOperationException("Папка совместной работы не выбрана.");
            string path = Path.Combine(folder, "ChronicaShared.json");
            result["path"] = path;
            SyncSharedAssets();
            if (!File.Exists(path))
            {
                result["exists"] = false;
                result["json"] = null;
                result["modified"] = 0L;
                return result;
            }
            result["exists"] = true;
            result["json"] = File.ReadAllText(path, Encoding.UTF8);
            result["modified"] = File.GetLastWriteTimeUtc(path).Ticks;
            return result;
        }

        public Dictionary<string, object> WriteSharedJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                throw new InvalidOperationException("Нет данных для совместной работы.");
            Json.DeserializeObject(json);
            Dictionary<string, object> sync = GetSyncSettings();
            string folder = Convert.ToString(sync["folder"]);
            if (string.IsNullOrEmpty(folder))
                throw new InvalidOperationException("Папка совместной работы не выбрана.");
            Directory.CreateDirectory(folder);
            string path = Path.Combine(folder, "ChronicaShared.json");
            string temp = path + ".tmp-" + Guid.NewGuid().ToString("N");
            File.WriteAllText(temp, json, new UTF8Encoding(false));
            try
            {
                if (File.Exists(path))
                {
                    try { File.Replace(temp, path, null); }
                    catch { File.Delete(path); File.Move(temp, path); }
                }
                else
                {
                    File.Move(temp, path);
                }
            }
            finally
            {
                try { if (File.Exists(temp)) File.Delete(temp); } catch { }
            }
            SyncSharedAssets();
            Dictionary<string, object> result = new Dictionary<string, object>();
            result["path"] = path;
            result["modified"] = File.GetLastWriteTimeUtc(path).Ticks;
            return result;
        }

        public void SyncSharedAssets()
        {
            Dictionary<string, object> sync = GetSyncSettings();
            string folder = Convert.ToString(sync["folder"]);
            bool enabled = Convert.ToString(sync["assets"]) != "False";
            if (string.IsNullOrEmpty(folder) || !enabled) return;
            string root = Path.Combine(folder, "ChronicaAssets");
            SyncAssetPair(ImagesDir, Path.Combine(root, "images"));
            SyncAssetPair(AudioDir, Path.Combine(root, "audio"));
            SyncAssetPair(FontsDir, Path.Combine(root, "fonts"));
        }

        private static void SyncAssetPair(string localDir, string sharedDir)
        {
            try
            {
                Directory.CreateDirectory(localDir);
                Directory.CreateDirectory(sharedDir);
                CopyMissing(sharedDir, localDir);
                CopyMissing(localDir, sharedDir);
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось синхронизировать файлы с общей папкой", ex);
            }
        }

        private static void CopyMissing(string sourceDir, string targetDir)
        {
            string[] files = Directory.GetFiles(sourceDir);
            for (int i = 0; i < files.Length; i++)
            {
                string target = Path.Combine(targetDir, Path.GetFileName(files[i]));
                if (!File.Exists(target))
                    File.Copy(files[i], target, false);
            }
        }

        public string GetGitHubRepo()
        {
            try
            {
                Dictionary<string, object> settings = ReadSettings();
                object value;
                if (settings.TryGetValue("githubRepo", out value))
                {
                    string repo = Convert.ToString(value);
                    if (!string.IsNullOrWhiteSpace(repo)) return repo.Trim();
                }
            }
            catch { }
            return "IvanSemenovVetarion/Chronica";
        }

        public string SaveGitHubRepo(string repo)
        {
            string clean = (repo ?? "").Trim();
            if (clean.StartsWith("https://github.com/", StringComparison.OrdinalIgnoreCase))
                clean = clean.Substring("https://github.com/".Length);
            clean = clean.Trim('/');
            if (clean.EndsWith(".git", StringComparison.OrdinalIgnoreCase))
                clean = clean.Substring(0, clean.Length - 4);
            Dictionary<string, object> settings = ReadSettings();
            settings["githubRepo"] = clean;
            WriteSettings(settings);
            return clean;
        }

        public string GetLanguage()
        {
            try
            {
                Dictionary<string, object> settings = ReadSettings();
                object value;
                if (settings.TryGetValue("language", out value))
                {
                    string language = Convert.ToString(value);
                    if (language == "en" || language == "ru") return language;
                }
            }
            catch { }
            return "ru";
        }

        public string SaveLanguage(string language)
        {
            string clean = language == "en" ? "en" : "ru";
            Dictionary<string, object> settings = ReadSettings();
            settings["language"] = clean;
            WriteSettings(settings);
            return clean;
        }

        public string L(string ru, string en)
        {
            return GetLanguage() == "en" ? en : ru;
        }

        public string GetAppName()
        {
            try
            {
                Dictionary<string, object> settings = ReadSettings();
                object value;
                if (settings.TryGetValue("appName", out value))
                {
                    string name = Convert.ToString(value);
                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        name = name.Trim();
                        if (name == "Мир TitZero" || name == "TitZero" || name == "Мифариум" ||
                            name == "Mifarium" || name == "Мир Mifarium" || name == "Мир Chronica")
                            return "Chronica";
                        if (name == "Chronica" && IsDndEdition) return "Chronika DnD Edition";
                        return name;
                    }
                }
            }
            catch
            {
            }
            return IsDndEdition ? "Chronika DnD Edition" : "Chronica";
        }

        public string SaveAppName(string name)
        {
            string clean = (name ?? string.Empty).Trim();
            if (clean.Length == 0) clean = IsDndEdition ? "Chronika DnD Edition" : "Chronica";
            if (clean.Length > 48) clean = clean.Substring(0, 48).Trim();
            Dictionary<string, object> settings = ReadSettings();
            settings["appName"] = clean;
            WriteSettings(settings);
            return clean;
        }

        public void SaveTheme(string theme)
        {
            try
            {
                Dictionary<string, object> settings = ReadSettings();
                settings["theme"] = string.IsNullOrWhiteSpace(theme) ? "dark" : theme.Trim();
                WriteSettings(settings);
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось сохранить тему", ex);
            }
        }

        public string LoadTheme()
        {
            try
            {
                Dictionary<string, object> settings = ReadSettings();
                object value;
                if (settings.TryGetValue("theme", out value))
                {
                    string theme = Convert.ToString(value);
                    if (!string.IsNullOrWhiteSpace(theme)) return theme;
                }
            }
            catch
            {
            }
            return "dark";
        }

        public Dictionary<string, object> GetApiSettings()
        {
            Dictionary<string, object> result = new Dictionary<string, object>();
            string key = GetApiKey();
            result["hasKey"] = !string.IsNullOrEmpty(key);
            result["keyHint"] = string.IsNullOrEmpty(key) ? string.Empty : key.Substring(Math.Max(0, key.Length - 4));
            result["model"] = GetApiModel();
            result["endpoint"] = "https://api.deepseek.com";
            return result;
        }

        public Dictionary<string, object> SaveApiSettings(string apiKey, string model, bool clear)
        {
            Dictionary<string, object> settings = ReadSettings();
            if (clear)
            {
                settings.Remove("deepseekApiKey");
            }
            else if (!string.IsNullOrWhiteSpace(apiKey))
            {
                settings["deepseekApiKey"] = ProtectApiKey(apiKey.Trim());
            }
            if (!string.IsNullOrWhiteSpace(model))
            {
                string value = model.Trim();
                if (value != "deepseek-chat" && value != "deepseek-reasoner")
                    throw new InvalidOperationException("Неизвестная модель DeepSeek.");
                settings["deepseekModel"] = value;
            }
            WriteSettings(settings);
            return GetApiSettings();
        }

        public string GetApiKey()
        {
            try
            {
                Dictionary<string, object> settings = ReadSettings();
                object value;
                if (!settings.TryGetValue("deepseekApiKey", out value)) return string.Empty;
                string stored = Convert.ToString(value);
                if (string.IsNullOrEmpty(stored)) return string.Empty;
                byte[] data = Convert.FromBase64String(stored);
                byte[] plain = ProtectedData.Unprotect(data, null, DataProtectionScope.CurrentUser);
                return Encoding.UTF8.GetString(plain);
            }
            catch (Exception ex)
            {
                Log.Error("Не удалось прочитать ключ DeepSeek", ex);
                return string.Empty;
            }
        }

        public string GetApiModel()
        {
            try
            {
                Dictionary<string, object> settings = ReadSettings();
                object value;
                if (settings.TryGetValue("deepseekModel", out value))
                {
                    string model = Convert.ToString(value);
                    if (model == "deepseek-chat" || model == "deepseek-reasoner") return model;
                }
            }
            catch
            {
            }
            return "deepseek-chat";
        }

        private static string ProtectApiKey(string apiKey)
        {
            byte[] data = ProtectedData.Protect(
                Encoding.UTF8.GetBytes(apiKey), null, DataProtectionScope.CurrentUser);
            return Convert.ToBase64String(data);
        }

        private void WriteSettings(Dictionary<string, object> settings)
        {
            string path = Path.Combine(DataDir, "settings.json");
            string temp = path + ".tmp-" + Guid.NewGuid().ToString("N");
            string json = Json.Serialize(settings);
            try
            {
                File.WriteAllText(temp, json, new UTF8Encoding(false));
                if (File.Exists(path))
                {
                    try
                    {
                        File.Replace(temp, path, null);
                    }
                    catch
                    {
                        File.Delete(path);
                        File.Move(temp, path);
                    }
                }
                else
                {
                    File.Move(temp, path);
                }
            }
            finally
            {
                try
                {
                    if (File.Exists(temp)) File.Delete(temp);
                }
                catch
                {
                }
            }
        }

        private Dictionary<string, object> ReadSettings()
        {
            try
            {
                string path = Path.Combine(DataDir, "settings.json");
                if (File.Exists(path))
                {
                    Dictionary<string, object> map =
                        Json.Deserialize<Dictionary<string, object>>(File.ReadAllText(path, Encoding.UTF8));
                    if (map != null) return map;
                }
            }
            catch
            {
            }
            return new Dictionary<string, object>();
        }
    }

    internal static class AppInfo
    {
        public const string Version = "2.0.0";
    }
}
