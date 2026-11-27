package com.vetarion.chronica;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

public class ChronicaBridge {
    private static final int REQ_IMAGE = 4101;
    private static final int REQ_IMAGES = 4102;
    private static final int REQ_AUDIO = 4103;
    private static final int REQ_FONT = 4104;
    private static final int REQ_BACKGROUND = 4105;
    private static final int REQ_RESTORE = 4106;
    private static final int REQ_EXPORT = 4107;

    private static final String VERSION = "2.0.1";
    private static final int BUILD = 204;
    private static final String APP_NAME = "Chronica";

    private final Activity activity;
    private final WebView webView;
    private final File dataDir;
    private final File imagesDir;
    private final File audioDir;
    private final File fontsDir;
    private final File backupsDir;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private Pending pending;

    private static class Pending {
        final String id;
        final String kind;
        final File file;
        final String mime;
        final String name;

        Pending(String id, String kind) {
            this(id, kind, null, null, null);
        }

        Pending(String id, String kind, File file, String mime, String name) {
            this.id = id;
            this.kind = kind;
            this.file = file;
            this.mime = mime;
            this.name = name;
        }
    }

    public ChronicaBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.dataDir = new File(activity.getFilesDir(), "ChronicaData");
        this.imagesDir = new File(dataDir, "images");
        this.audioDir = new File(dataDir, "audio");
        this.fontsDir = new File(dataDir, "fonts");
        this.backupsDir = new File(dataDir, "backups");
        ensureDirectories();
    }

    public File getImagesDir() { return imagesDir; }
    public File getAudioDir() { return audioDir; }
    public File getFontsDir() { return fontsDir; }

    private void ensureDirectories() {
        if (!dataDir.exists()) dataDir.mkdirs();
        if (!imagesDir.exists()) imagesDir.mkdirs();
        if (!audioDir.exists()) audioDir.mkdirs();
        if (!fontsDir.exists()) fontsDir.mkdirs();
        if (!backupsDir.exists()) backupsDir.mkdirs();
    }

    @JavascriptInterface
    public void invoke(final String method, final String argsJson, final String requestId) {
        final JSONObject args;
        try {
            args = argsJson == null || argsJson.length() == 0 ? new JSONObject() : new JSONObject(argsJson);
        } catch (Exception e) {
            replyError(requestId, "Некорректные параметры запроса.");
            return;
        }

        try {
            if ("loadData".equals(method)) {
                executor.execute(() -> {
                    try {
                        JSONObject result = new JSONObject();
                        String json = readText(new File(dataDir, "chronica.json"));
                        result.put("json", json == null ? JSONObject.NULL : json);
                        reply(requestId, result);
                    } catch (Exception e) {
                        replyError(requestId, e.getMessage());
                    }
                });
                return;
            }
            if ("saveData".equals(method)) {
                final String json = args.optString("json", "");
                executor.execute(() -> {
                    try {
                        if (json.length() == 0) throw new IOException("Данные пусты.");
                        File target = new File(dataDir, "chronica.json");
                        backupCurrent(target);
                        writeAtomic(target, json);
                        JSONObject result = new JSONObject();
                        result.put("savedAt", isoNow());
                        result.put("size", json.getBytes("UTF-8").length);
                        reply(requestId, result);
                    } catch (Exception e) {
                        replyError(requestId, e.getMessage());
                    }
                });
                return;
            }
            if ("getInfo".equals(method)) {
                executor.execute(() -> {
                    try {
                        JSONObject result = new JSONObject();
                        result.put("appName", APP_NAME);
                        result.put("edition", "standard");
                        result.put("editionName", APP_NAME);
                        result.put("version", VERSION);
                        result.put("build", BUILD);
                        result.put("storagePath", dataDir.getAbsolutePath());
                        result.put("dataFile", new File(dataDir, "chronica.json").getAbsolutePath());
                        result.put("imagesPath", imagesDir.getAbsolutePath());
                        result.put("backupsPath", backupsDir.getAbsolutePath());
                        result.put("dataSize", folderSize(dataDir));
                        result.put("dataFileSize", fileSize(new File(dataDir, "chronica.json")));
                        result.put("imageCount", countFiles(imagesDir));
                        result.put("audioCount", countFiles(audioDir));
                        result.put("fontCount", countFiles(fontsDir));
                        result.put("portable", false);
                        result.put("mode", "android");
                        result.put("githubRepo", "IvanSemenovVetarion/Chronica");
                        reply(requestId, result);
                    } catch (Exception e) {
                        replyError(requestId, e.getMessage());
                    }
                });
                return;
            }
            if ("getApiSettings".equals(method) || "saveApiSettings".equals(method)) {
                reply(requestId, new JSONObject());
                return;
            }
            if ("getSyncSettings".equals(method)) {
                JSONObject result = new JSONObject();
                result.put("folder", "");
                result.put("participant", "");
                result.put("auto", false);
                result.put("assets", false);
                result.put("path", "");
                result.put("exists", false);
                reply(requestId, result);
                return;
            }
            if ("saveSyncSettings".equals(method)) {
                JSONObject result = new JSONObject();
                result.put("folder", "");
                result.put("participant", args.optString("participant", ""));
                result.put("auto", false);
                result.put("assets", false);
                reply(requestId, result);
                return;
            }
            if ("getGitHubRepo".equals(method)) {
                JSONObject result = new JSONObject();
                result.put("repo", "IvanSemenovVetarion/Chronica");
                reply(requestId, result);
                return;
            }
            if ("saveGitHubRepo".equals(method)) {
                JSONObject result = new JSONObject();
                result.put("repo", args.optString("repo", "IvanSemenovVetarion/Chronica"));
                reply(requestId, result);
                return;
            }
            if ("checkUpdates".equals(method)) {
                JSONObject result = new JSONObject();
                result.put("isNewer", false);
                result.put("currentVersion", VERSION);
                result.put("latestVersion", VERSION);
                result.put("tag", "v" + VERSION);
                result.put("repo", "IvanSemenovVetarion/Chronica");
                result.put("downloadUrl", "");
                result.put("releaseUrl", "https://github.com/IvanSemenovVetarion/Chronica/releases");
                reply(requestId, result);
                return;
            }
            if ("setTheme".equals(method) || "setLanguage".equals(method) || "setAppName".equals(method)) {
                reply(requestId, new JSONObject());
                return;
            }
            if ("setUiScale".equals(method)) {
                final double scale = args.optDouble("scale", 1.0);
                activity.runOnUiThread(() -> {
                    try {
                        webView.getSettings().setTextZoom((int) Math.round(scale * 100));
                    } catch (Exception ignored) {
                    }
                });
                JSONObject result = new JSONObject();
                result.put("scale", scale);
                reply(requestId, result);
                return;
            }
            if ("openDataFolder".equals(method) || "showItemInFolder".equals(method)) {
                activity.runOnUiThread(() -> Toast.makeText(activity,
                        "Данные Chronica: " + dataDir.getAbsolutePath(), Toast.LENGTH_LONG).show());
                reply(requestId, new JSONObject().put("ok", true));
                return;
            }
            if ("chooseSyncFolder".equals(method)) {
                reply(requestId, JSONObject.NULL);
                return;
            }
            if ("readShared".equals(method) || "writeShared".equals(method)) {
                replyError(requestId, "Совместная работа доступна в настольной версии.");
                return;
            }
            if ("deepseekExtract".equals(method)) {
                replyError(requestId, "Импорт DeepSeek доступен в настольной версии.");
                return;
            }
            if ("downloadUpdate".equals(method) || "runInstaller".equals(method)) {
                replyError(requestId, "Обновление Android-версии выполняется установкой нового APK.");
                return;
            }
            if ("pickImage".equals(method)) {
                launchPicker(requestId, "image", REQ_IMAGE, "image/*", false);
                return;
            }
            if ("pickBackground".equals(method)) {
                launchPicker(requestId, "background", REQ_BACKGROUND, "image/*", false);
                return;
            }
            if ("pickImages".equals(method)) {
                launchPicker(requestId, "images", REQ_IMAGES, "image/*", true);
                return;
            }
            if ("pickAudio".equals(method)) {
                launchPicker(requestId, "audio", REQ_AUDIO, "audio/*", false);
                return;
            }
            if ("pickFont".equals(method)) {
                launchPicker(requestId, "font", REQ_FONT, "*/*", false);
                return;
            }
            if ("createBackup".equals(method)) {
                executor.execute(() -> {
                    try {
                        File zip = createBackupZip();
                        startExport(requestId, zip, "application/zip", zip.getName());
                    } catch (Exception e) {
                        replyError(requestId, e.getMessage());
                    }
                });
                return;
            }
            if ("restoreBackup".equals(method)) {
                launchRestore(requestId);
                return;
            }
            if ("exportWorld".equals(method)) {
                final String format = args.optString("format", "json").toLowerCase(Locale.ROOT);
                if (!"json".equals(format)) {
                    replyError(requestId, "Word и Excel доступны в настольной версии. Используйте JSON или резервную копию.");
                    return;
                }
                executor.execute(() -> {
                    try {
                        String json = readText(new File(dataDir, "chronica.json"));
                        if (json == null || json.length() == 0) throw new IOException("Летопись пуста.");
                        File temp = new File(activity.getCacheDir(), "Chronica-world-" + stamp() + ".json");
                        writeAtomic(temp, json);
                        startExport(requestId, temp, "application/json", "Chronica-world-" + stamp() + ".json");
                    } catch (Exception e) {
                        replyError(requestId, e.getMessage());
                    }
                });
                return;
            }
            replyError(requestId, "Неизвестный метод: " + method);
        } catch (Exception e) {
            replyError(requestId, e.getMessage());
        }
    }

    private void launchPicker(String requestId, String kind, int requestCode, String mime, boolean multiple) {
        if (pending != null) {
            replyError(requestId, "Дождитесь завершения текущего выбора файла.");
            return;
        }
        pending = new Pending(requestId, kind);
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(mime);
            if (multiple) intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            try {
                activity.startActivityForResult(intent, requestCode);
            } catch (Exception e) {
                pending = null;
                replyError(requestId, "Не удалось открыть выбор файла.");
            }
        });
    }

    private void launchRestore(String requestId) {
        if (pending != null) {
            replyError(requestId, "Дождитесь завершения текущего выбора файла.");
            return;
        }
        pending = new Pending(requestId, "restore");
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            try {
                activity.startActivityForResult(intent, REQ_RESTORE);
            } catch (Exception e) {
                pending = null;
                replyError(requestId, "Не удалось открыть выбор резервной копии.");
            }
        });
    }

    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        Pending current = pending;
        if (current == null) return;
        if (resultCode != Activity.RESULT_OK || data == null) {
            pending = null;
            replyError(current.id, "Выбор отменён.");
            return;
        }
        Uri uri = data.getData();
        if (requestCode == REQ_EXPORT) {
            pending = null;
            if (uri == null || current.file == null) {
                replyError(current.id, "Не удалось сохранить файл.");
                return;
            }
            executor.execute(() -> {
                try {
                    copyFileToUri(current.file, uri);
                    JSONObject result = new JSONObject();
                    result.put("path", uri.toString());
                    result.put("name", current.name);
                    reply(current.id, result);
                } catch (Exception e) {
                    replyError(current.id, e.getMessage());
                }
            });
            return;
        }
        if (requestCode == REQ_RESTORE) {
            pending = null;
            if (uri == null) {
                replyError(current.id, "Файл не выбран.");
                return;
            }
            executor.execute(() -> {
                try {
                    JSONObject result = restoreFromUri(uri);
                    reply(current.id, result);
                } catch (Exception e) {
                    replyError(current.id, e.getMessage());
                }
            });
            return;
        }

        pending = null;
        if (requestCode == REQ_IMAGES) {
            ArrayList<Uri> uris = new ArrayList<>();
            if (data.getClipData() != null) {
                for (int i = 0; i < data.getClipData().getItemCount(); i++) {
                    uris.add(data.getClipData().getItemAt(i).getUri());
                }
            } else if (uri != null) {
                uris.add(uri);
            }
            executor.execute(() -> {
                try {
                    JSONArray items = new JSONArray();
                    for (Uri item : uris) {
                        File copied = copyUriToDirectory(item, imagesDir, "image");
                        if (copied != null) items.put(fileResult(copied, "https://media.mifarium/"));
                    }
                    reply(current.id, items);
                } catch (Exception e) {
                    replyError(current.id, e.getMessage());
                }
            });
            return;
        }

        if (uri == null) {
            replyError(current.id, "Файл не выбран.");
            return;
        }
        final int finalRequestCode = requestCode;
        executor.execute(() -> {
            try {
                File directory;
                String prefix;
                String urlBase;
                if (finalRequestCode == REQ_AUDIO) {
                    directory = audioDir;
                    prefix = "audio";
                    urlBase = "https://audio.mifarium/";
                } else if (finalRequestCode == REQ_FONT) {
                    directory = fontsDir;
                    prefix = "font";
                    urlBase = "https://fonts.mifarium/";
                } else {
                    directory = imagesDir;
                    prefix = "image";
                    urlBase = "https://media.mifarium/";
                }
                File copied = copyUriToDirectory(uri, directory, prefix);
                if (copied == null) throw new IOException("Не удалось прочитать файл.");
                JSONObject result = fileResult(copied, urlBase);
                if (finalRequestCode == REQ_FONT) {
                    result.put("displayName", displayName(uri));
                }
                reply(current.id, result);
            } catch (Exception e) {
                replyError(current.id, e.getMessage());
            }
        });
    }

    private JSONObject fileResult(File file, String urlBase) throws Exception {
        JSONObject result = new JSONObject();
        result.put("url", urlBase + Uri.encode(file.getName()));
        result.put("name", file.getName());
        result.put("size", file.length());
        return result;
    }

    private File copyUriToDirectory(Uri uri, File directory, String prefix) throws IOException {
        String original = displayName(uri);
        String extension = extensionOf(original, activity.getContentResolver().getType(uri));
        if (extension.length() == 0) {
            if (directory == fontsDir) extension = "ttf";
            else if (directory == audioDir) extension = "mp3";
            else extension = "jpg";
        }
        String name = prefix + "-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
        File target = new File(directory, name + "." + extension);
        try (InputStream input = activity.getContentResolver().openInputStream(uri);
             OutputStream output = new FileOutputStream(target)) {
            if (input == null) throw new IOException("Не удалось открыть файл.");
            byte[] buffer = new byte[16 * 1024];
            int read;
            while ((read = input.read(buffer)) > 0) output.write(buffer, 0, read);
        }
        return target;
    }

    private void startExport(String requestId, File file, String mime, String name) {
        pending = new Pending(requestId, "export", file, mime, name);
        activity.runOnUiThread(() -> {
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(mime);
            intent.putExtra(Intent.EXTRA_TITLE, name);
            try {
                activity.startActivityForResult(intent, REQ_EXPORT);
            } catch (Exception e) {
                pending = null;
                replyError(requestId, "Не удалось открыть сохранение файла.");
            }
        });
    }

    private File createBackupZip() throws IOException {
        ensureDirectories();
        File zip = new File(backupsDir, "Chronica-backup-" + stamp() + ".zip");
        try (ZipOutputStream output = new ZipOutputStream(new FileOutputStream(zip))) {
            addToZip(output, new File(dataDir, "chronica.json"), "chronica.json");
            addDirectoryToZip(output, imagesDir, "images/");
            addDirectoryToZip(output, audioDir, "audio/");
            addDirectoryToZip(output, fontsDir, "fonts/");
            ZipEntry manifest = new ZipEntry("manifest.txt");
            output.putNextEntry(manifest);
            output.write(("Chronica Android backup\nVersion: " + VERSION + "\n").getBytes("UTF-8"));
            output.closeEntry();
        }
        return zip;
    }

    private void addDirectoryToZip(ZipOutputStream output, File directory, String prefix) throws IOException {
        File[] files = directory.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (!file.isFile()) continue;
            addToZip(output, file, prefix + file.getName());
        }
    }

    private void addToZip(ZipOutputStream output, File file, String name) throws IOException {
        if (!file.isFile()) return;
        ZipEntry entry = new ZipEntry(name);
        output.putNextEntry(entry);
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[16 * 1024];
            int read;
            while ((read = input.read(buffer)) > 0) output.write(buffer, 0, read);
        }
        output.closeEntry();
    }

    private JSONObject restoreFromUri(Uri uri) throws Exception {
        String name = displayName(uri);
        String lower = name.toLowerCase(Locale.ROOT);
        String json;
        File tempDir = new File(activity.getCacheDir(), "restore-" + UUID.randomUUID().toString());
        tempDir.mkdirs();
        File downloaded = new File(tempDir, "backup" + (lower.endsWith(".json") ? ".json" : ".zip"));
        try (InputStream input = activity.getContentResolver().openInputStream(uri);
             OutputStream output = new FileOutputStream(downloaded)) {
            if (input == null) throw new IOException("Не удалось открыть файл.");
            copyStream(input, output);
        } catch (Exception e) {
            deleteDirectory(tempDir);
            throw e;
        }
        if (lower.endsWith(".json") || "application/json".equals(activity.getContentResolver().getType(uri))) {
            json = readText(downloaded);
        } else {
            File extracted = new File(tempDir, "unzipped");
            extracted.mkdirs();
            unzip(downloaded, extracted);
            File jsonFile = new File(extracted, "chronica.json");
            if (!jsonFile.exists()) jsonFile = new File(extracted, "mifarium.json");
            if (!jsonFile.exists()) {
                deleteDirectory(tempDir);
                throw new IOException("В архиве нет chronica.json.");
            }
            json = readText(jsonFile);
            if (json == null) {
                deleteDirectory(tempDir);
                throw new IOException("Файл летописи пуст.");
            }
            File oldJson = new File(dataDir, "chronica.json");
            backupCurrent(oldJson);
            writeAtomic(oldJson, json);
            copyDirectoryContents(new File(extracted, "images"), imagesDir);
            copyDirectoryContents(new File(extracted, "audio"), audioDir);
            copyDirectoryContents(new File(extracted, "fonts"), fontsDir);
            deleteDirectory(tempDir);
            JSONObject result = new JSONObject();
            result.put("json", json);
            result.put("path", uri.toString());
            return result;
        }
        if (json == null || json.length() == 0) {
            deleteDirectory(tempDir);
            throw new IOException("Файл летописи пуст.");
        }
        File target = new File(dataDir, "chronica.json");
        backupCurrent(target);
        writeAtomic(target, json);
        deleteDirectory(tempDir);
        JSONObject result = new JSONObject();
        result.put("json", json);
        result.put("path", uri.toString());
        return result;
    }

    private void unzip(File zip, File root) throws IOException {
        try (ZipInputStream input = new ZipInputStream(new FileInputStream(zip))) {
            ZipEntry entry;
            byte[] buffer = new byte[16 * 1024];
            while ((entry = input.getNextEntry()) != null) {
                String name = entry.getName().replace('\\', '/');
                if (name.contains("..") || name.startsWith("/")) continue;
                File target = new File(root, name);
                String canonical = target.getCanonicalPath();
                if (!canonical.startsWith(root.getCanonicalPath() + File.separator)) continue;
                if (entry.isDirectory()) {
                    target.mkdirs();
                    continue;
                }
                File parent = target.getParentFile();
                if (parent != null) parent.mkdirs();
                try (OutputStream output = new FileOutputStream(target)) {
                    int read;
                    while ((read = input.read(buffer)) > 0) output.write(buffer, 0, read);
                }
            }
        }
    }

    private void copyDirectoryContents(File source, File target) throws IOException {
        if (!source.isDirectory()) return;
        if (!target.exists()) target.mkdirs();
        File[] files = source.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (!file.isFile()) continue;
            File destination = new File(target, file.getName());
            try (InputStream input = new FileInputStream(file);
                 OutputStream output = new FileOutputStream(destination)) {
                copyStream(input, output);
            }
        }
    }

    private void copyFileToUri(File file, Uri uri) throws IOException {
        try (InputStream input = new FileInputStream(file);
             OutputStream output = activity.getContentResolver().openOutputStream(uri, "w")) {
            if (output == null) throw new IOException("Не удалось открыть файл для записи.");
            copyStream(input, output);
        }
    }

    private void backupCurrent(File dataFile) {
        if (!dataFile.exists()) return;
        File backup = new File(dataDir, "chronica.json.bak");
        try (InputStream input = new FileInputStream(dataFile);
             OutputStream output = new FileOutputStream(backup)) {
            copyStream(input, output);
        } catch (Exception ignored) {
        }
    }

    private void writeAtomic(File file, String text) throws IOException {
        File parent = file.getParentFile();
        if (parent != null) parent.mkdirs();
        File temp = new File(file.getAbsolutePath() + ".tmp");
        try (OutputStream output = new FileOutputStream(temp)) {
            output.write(text.getBytes("UTF-8"));
            output.flush();
        }
        if (file.exists() && !file.delete()) throw new IOException("Не удалось заменить файл данных.");
        if (!temp.renameTo(file)) throw new IOException("Не удалось сохранить файл данных.");
    }

    private String displayName(Uri uri) {
        String name = null;
        try (Cursor cursor = activity.getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) name = cursor.getString(index);
            }
        } catch (Exception ignored) {
        }
        if (name == null || name.length() == 0) name = uri.getLastPathSegment();
        return name == null ? "file" : name;
    }

    private String extensionOf(String name, String mime) {
        if (name != null) {
            int dot = name.lastIndexOf('.');
            if (dot >= 0 && dot < name.length() - 1) {
                String ext = name.substring(dot + 1).replaceAll("[^A-Za-z0-9]", "").toLowerCase(Locale.ROOT);
                if (ext.length() > 0 && ext.length() < 8) return ext;
            }
        }
        if (mime != null) {
            if (mime.contains("jpeg")) return "jpg";
            if (mime.contains("png")) return "png";
            if (mime.contains("webp")) return "webp";
            if (mime.contains("gif")) return "gif";
            if (mime.contains("svg")) return "svg";
            if (mime.contains("mpeg")) return "mp3";
            if (mime.contains("wav")) return "wav";
            if (mime.contains("ogg")) return "ogg";
            if (mime.contains("mp4")) return "m4a";
            if (mime.contains("font")) return "ttf";
        }
        return "";
    }

    private String readText(File file) {
        if (!file.exists()) return null;
        try (InputStream input = new FileInputStream(file);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            copyStream(input, output);
            return output.toString("UTF-8");
        } catch (Exception e) {
            return null;
        }
    }

    private void copyStream(InputStream input, OutputStream output) throws IOException {
        byte[] buffer = new byte[16 * 1024];
        int read;
        while ((read = input.read(buffer)) > 0) output.write(buffer, 0, read);
    }

    private long folderSize(File dir) {
        long size = 0;
        File[] files = dir.listFiles();
        if (files == null) return 0;
        for (File file : files) {
            size += file.isDirectory() ? folderSize(file) : file.length();
        }
        return size;
    }

    private long fileSize(File file) {
        return file.exists() ? file.length() : 0;
    }

    private int countFiles(File dir) {
        File[] files = dir.listFiles();
        if (files == null) return 0;
        int count = 0;
        for (File file : files) if (file.isFile()) count++;
        return count;
    }

    private void deleteDirectory(File dir) {
        if (dir == null || !dir.exists()) return;
        File[] files = dir.listFiles();
        if (files != null) for (File file : files) {
            if (file.isDirectory()) deleteDirectory(file);
            else file.delete();
        }
        dir.delete();
    }

    private String stamp() {
        return new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.ROOT).format(new Date());
    }

    private String isoNow() {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ROOT);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(new Date());
    }

    private Object idValue(String id) {
        if (id == null) return JSONObject.NULL;
        try {
            return Long.parseLong(id);
        } catch (Exception ignored) {
            return id;
        }
    }

    private void reply(String id, Object result) {
        try {
            JSONObject response = new JSONObject();
            response.put("id", idValue(id));
            response.put("ok", true);
            response.put("result", result == null ? JSONObject.NULL : result);
            evaluate(response);
        } catch (Exception ignored) {
        }
    }

    private void replyError(String id, String message) {
        try {
            JSONObject response = new JSONObject();
            response.put("id", idValue(id));
            response.put("ok", false);
            response.put("error", message == null ? "Неизвестная ошибка" : message);
            evaluate(response);
        } catch (Exception ignored) {
        }
    }

    private void evaluate(JSONObject response) {
        final String json = response.toString();
        webView.post(() -> {
            try {
                webView.evaluateJavascript("window.__chronicaAndroidBridge(" + JSONObject.quote(json) + ");", null);
            } catch (Exception ignored) {
            }
        });
    }
}
