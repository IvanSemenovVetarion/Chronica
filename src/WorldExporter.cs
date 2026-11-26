using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Web.Script.Serialization;

namespace Mifarium
{
    internal static class WorldExporter
    {
        private static readonly JavaScriptSerializer Json = AppStorage.CreateSerializer();

        public static void Export(string json, string path, string format)
        {
            if (string.IsNullOrWhiteSpace(json))
                throw new InvalidOperationException("Летопись пуста — экспортировать нечего.");
            Dictionary<string, object> data = Parse(json);
            Directory.CreateDirectory(Path.GetDirectoryName(path) ?? ".");
            if (format == "docx") ExportDocx(data, path);
            else if (format == "xlsx") ExportXlsx(data, path);
            else if (format == "json") File.WriteAllText(path, json, new UTF8Encoding(false));
            else throw new InvalidOperationException("Неизвестный формат экспорта.");
        }

        public static string WorldName(string json)
        {
            try
            {
                Dictionary<string, object> world = Map(Parse(json), "world");
                string name = Text(world, "name");
                return string.IsNullOrWhiteSpace(name) ? "Мой мир" : name.Trim();
            }
            catch
            {
                return "Мой мир";
            }
        }

        private static Dictionary<string, object> Parse(string json)
        {
            Dictionary<string, object> data = Json.Deserialize<Dictionary<string, object>>(json);
            if (data == null) throw new InvalidOperationException("Не удалось прочитать летопись.");
            return data;
        }

        /* ======================= DOCX ======================= */

        private static void ExportDocx(Dictionary<string, object> data, string path)
        {
            string document = BuildDocument(data);
            using (ZipArchive zip = ZipFile.Open(path, ZipArchiveMode.Create))
            {
                AddEntry(zip, "[Content_Types].xml",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
                    "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
                    "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
                    "<Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>" +
                    "</Types>");
                AddEntry(zip, "_rels/.rels",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                    "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>" +
                    "</Relationships>");
                AddEntry(zip, "word/document.xml", document);
            }
        }

        private static string BuildDocument(Dictionary<string, object> data)
        {
            Dictionary<string, object> world = Map(data, "world");
            Dictionary<string, Dictionary<string, object>> regions = Index(Arr(data, "regions"));
            Dictionary<string, Dictionary<string, object>> races = Index(Arr(data, "races"));
            Dictionary<string, Dictionary<string, object>> locations = Index(Arr(data, "locations"));
            Dictionary<string, Dictionary<string, object>> factions = Index(Arr(data, "factions"));
            Dictionary<string, Dictionary<string, object>> characters = Index(Arr(data, "characters"));
            Dictionary<string, Dictionary<string, object>> books = Index(Arr(data, "books"));

            StringBuilder b = new StringBuilder();
            b.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            b.Append("<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>");
            AddDocParagraph(b, "Chronica", 56, true, "8A6B34");
            AddDocParagraph(b, FirstNonEmpty(Text(world, "name"), "Мой мир"), 40, true, null);
            AddDocParagraph(b, "Летопись миров, героев и земель", 22, false, "777777");
            AddDocParagraph(b, "Автор: Vetarion", 20, false, "9A7B45");
            AddDocParagraph(b, "Экспортировано " + DateTime.Now.ToString("dd.MM.yyyy HH:mm"), 18, false, "999999");
            AddDocParagraph(b, "", 10, false, null);

            // World
            AddDocHeading(b, "Мир");
            AddDocField(b, "Название", Text(world, "name"));
            AddDocField(b, "Жанр", Text(world, "genre"));
            AddDocField(b, "Эпоха", Text(world, "era"));
            AddDocField(b, "Текущий год", Text(world, "currentYear"));
            AddDocField(b, "Девиз", Text(world, "tagline"));
            AddDocField(b, "Описание", Text(world, "description"));
            AddDocField(b, "Создан", DateText(Text(world, "createdAt")));
            AddDocField(b, "Обновлён", DateText(Text(world, "updatedAt")));

            // Characters
            AddDocPageBreak(b);
            AddDocHeading(b, "Персонажи");
            foreach (Dictionary<string, object> c in Arr(data, "characters"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(c, "name"), "Без имени"));
                AddDocField(b, "Титул", Text(c, "title"));
                AddDocField(b, "Роль", Text(c, "role"));
                AddDocField(b, "Пол", Text(c, "gender"));
                AddDocField(b, "Раса", FirstNonEmpty(LookupName(races, Text(c, "raceId")), Text(c, "race")));
                AddDocField(b, "Возраст", Text(c, "age"));
                AddDocField(b, "Статус", Text(c, "status"));
                AddDocField(b, "Фракция", LookupName(factions, Text(c, "factionId")));
                AddDocField(b, "Локация", LookupName(locations, Text(c, "locationId")));
                AddDocField(b, "Цитата", Text(c, "quote"));
                AddDocField(b, "Внешность", Text(c, "appearance"));
                AddDocField(b, "История", Text(c, "description"));
                AddDocField(b, "Характер", Text(c, "personality"));
                AddDocField(b, "Метки", JoinArray(c, "tags"));
                AddDocField(b, "Палитра", JoinArray(c, "palette"));
                AddDocField(b, "Галерея", GalleryText(c));
                AddDocField(b, "Голос и музыка", AudioText(c));
                AddDocField(b, "Отец", LookupName(characters, Text(c, "fatherId")));
                AddDocField(b, "Мать", LookupName(characters, Text(c, "motherId")));
                AddDocField(b, "Супруги", LookupNames(characters, c, "spouseIds"));
                AddDocField(b, "Дети", ChildrenText(characters, Text(c, "id")));
                AddDocField(b, "Создан", DateText(Text(c, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(c, "updatedAt")));
                AddDocParagraph(b, "", 8, false, null);
            }

            // D&D sheets
            object[] dndSheets = Arr(data, "dndSheets");
            if (dndSheets.Length > 0)
            {
                AddDocPageBreak(b);
                AddDocHeading(b, "Листы D&D");
                foreach (object sheetObject in dndSheets)
                {
                    Dictionary<string, object> sheet = sheetObject as Dictionary<string, object>;
                    if (sheet == null) continue;
                    AddDocSubheading(b, FirstNonEmpty(Text(sheet, "name"), "Лист без имени"));
                    AddDocField(b, "Издание", Text(sheet, "edition"));
                    AddDocField(b, "Класс", Text(sheet, "className"));
                    AddDocField(b, "Подкласс", Text(sheet, "subclass"));
                    AddDocField(b, "Уровень", Text(sheet, "level"));
                    AddDocField(b, "Вид / раса", Text(sheet, "species"));
                    AddDocField(b, "Предыстория", Text(sheet, "background"));
                    AddDocField(b, "Мировоззрение", Text(sheet, "alignment"));
                    Dictionary<string, object> abilities = Map(sheet, "abilities");
                    AddDocField(b, "Сила", Text(abilities, "str"));
                    AddDocField(b, "Ловкость", Text(abilities, "dex"));
                    AddDocField(b, "Телосложение", Text(abilities, "con"));
                    AddDocField(b, "Интеллект", Text(abilities, "int"));
                    AddDocField(b, "Мудрость", Text(abilities, "wis"));
                    AddDocField(b, "Харизма", Text(abilities, "cha"));
                    AddDocField(b, "Бонус владения", Text(sheet, "proficiency"));
                    AddDocField(b, "Класс брони", Text(sheet, "ac"));
                    AddDocField(b, "Хиты", Text(sheet, "hpCurrent") + " / " + Text(sheet, "hpMax"));
                    AddDocField(b, "Скорость", Text(sheet, "speed"));
                    AddDocField(b, "Кости хитов", Text(sheet, "hitDice"));
                    AddDocField(b, "Спасброски", JoinArray(sheet, "saves"));
                    AddDocField(b, "Навыки", JoinArray(sheet, "skills"));
                    AddDocField(b, "Снаряжение", Text(sheet, "equipment"));
                    AddDocField(b, "Заклинания", Text(sheet, "spells"));
                    AddDocField(b, "Умения и особенности", Text(sheet, "features"));
                    AddDocField(b, "Заметки", Text(sheet, "notes"));
                    AddDocParagraph(b, "", 8, false, null);
                }
            }

            // Regions
            AddDocPageBreak(b);
            AddDocHeading(b, "Регионы");
            foreach (Dictionary<string, object> r in Arr(data, "regions"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(r, "name"), "Без названия"));
                AddDocField(b, "Тип", Text(r, "type"));
                AddDocField(b, "Климат", Text(r, "climate"));
                AddDocField(b, "Описание", Text(r, "description"));
                AddDocField(b, "Локации", NamesByRegion(locations, Text(r, "id")));
                AddDocField(b, "Фракции", NamesByRegion(factions, Text(r, "id")));
                AddDocField(b, "Метки", JoinArray(r, "tags"));
                AddDocField(b, "Создан", DateText(Text(r, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(r, "updatedAt")));
            }

            // Locations
            AddDocPageBreak(b);
            AddDocHeading(b, "Локации");
            foreach (Dictionary<string, object> l in Arr(data, "locations"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(l, "name"), "Без названия"));
                AddDocField(b, "Тип", Text(l, "type"));
                AddDocField(b, "Регион", FirstNonEmpty(LookupName(regions, Text(l, "regionId")), Text(l, "region")));
                AddDocField(b, "Описание", Text(l, "description"));
                AddDocField(b, "Жители", NamesByLocation(characters, Text(l, "id")));
                AddDocField(b, "Фракции", NamesByLocation(factions, Text(l, "id")));
                AddDocField(b, "Метки", JoinArray(l, "tags"));
                AddDocField(b, "Создан", DateText(Text(l, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(l, "updatedAt")));
            }

            // Factions
            AddDocPageBreak(b);
            AddDocHeading(b, "Фракции");
            foreach (Dictionary<string, object> f in Arr(data, "factions"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(f, "name"), "Без названия"));
                AddDocField(b, "Тип", Text(f, "type"));
                AddDocField(b, "Статус", Text(f, "status"));
                AddDocField(b, "Регион", LookupName(regions, Text(f, "regionId")));
                AddDocField(b, "Локация", LookupName(locations, Text(f, "locationId")));
                AddDocField(b, "Лидер", LookupName(characters, Text(f, "leaderId")));
                AddDocField(b, "Кредо", Text(f, "ideology"));
                AddDocField(b, "Описание", Text(f, "description"));
                AddDocField(b, "Метки", JoinArray(f, "tags"));
                AddDocField(b, "Создан", DateText(Text(f, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(f, "updatedAt")));
            }

            // Races
            AddDocPageBreak(b);
            AddDocHeading(b, "Расы");
            foreach (Dictionary<string, object> r in Arr(data, "races"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(r, "name"), "Без названия"));
                AddDocField(b, "Тип", Text(r, "type"));
                AddDocField(b, "Черты", Text(r, "traits"));
                AddDocField(b, "Описание", Text(r, "description"));
                AddDocField(b, "Представители", NamesByRace(characters, Text(r, "id")));
                AddDocField(b, "Метки", JoinArray(r, "tags"));
                AddDocField(b, "Создан", DateText(Text(r, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(r, "updatedAt")));
            }

            // Events
            AddDocPageBreak(b);
            AddDocHeading(b, "Хронология");
            foreach (Dictionary<string, object> e in Arr(data, "events"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(e, "title"), "Без названия"));
                AddDocField(b, "Дата", Text(e, "dateText"));
                AddDocField(b, "Эпоха", Text(e, "era"));
                AddDocField(b, "Тип", EventTypeText(Text(e, "type")));
                AddDocField(b, "Место", LookupName(locations, Text(e, "locationId")));
                AddDocField(b, "Участники", LookupNames(characters, e, "participantIds"));
                AddDocField(b, "Описание", Text(e, "description"));
                AddDocField(b, "Создан", DateText(Text(e, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(e, "updatedAt")));
            }

            // Lore
            AddDocPageBreak(b);
            AddDocHeading(b, "Лор");
            foreach (Dictionary<string, object> article in Arr(data, "lore"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(article, "title"), "Без названия"));
                AddDocField(b, "Категория", Text(article, "category"));
                AddDocField(b, "Источник", FirstNonEmpty(LookupName(books, Text(article, "sourceId")), Text(article, "sourceTitle")));
                AddDocField(b, "Суть", Text(article, "summary"));
                AddDocField(b, "Текст", Text(article, "content"));
                AddDocField(b, "Метки", JoinArray(article, "tags"));
                AddDocField(b, "Создан", DateText(Text(article, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(article, "updatedAt")));
            }

            // Library
            AddDocPageBreak(b);
            AddDocHeading(b, "Библиотека");
            foreach (Dictionary<string, object> book in Arr(data, "books"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(book, "title"), "Без названия"));
                AddDocField(b, "Тип", Text(book, "type"));
                AddDocField(b, "Автор", Text(book, "author"));
                AddDocField(b, "Год", Text(book, "year"));
                AddDocField(b, "Описание", Text(book, "description"));
                AddDocField(b, "Метки", JoinArray(book, "tags"));
                AddDocField(b, "Создан", DateText(Text(book, "createdAt")));
                AddDocField(b, "Обновлён", DateText(Text(book, "updatedAt")));
            }

            // Notes
            AddDocPageBreak(b);
            AddDocHeading(b, "Заметки");
            foreach (Dictionary<string, object> note in Arr(data, "notes"))
            {
                AddDocSubheading(b, FirstNonEmpty(Text(note, "title"), "Без названия"));
                AddDocField(b, "Цвет", NoteColorText(Text(note, "color")));
                AddDocField(b, "Закреплена", string.Equals(Str(note, "pinned"), "true", StringComparison.OrdinalIgnoreCase) ? "Да" : "Нет");
                AddDocField(b, "Текст", Text(note, "content"));
                AddDocField(b, "Создана", DateText(Text(note, "createdAt")));
                AddDocField(b, "Обновлена", DateText(Text(note, "updatedAt")));
            }

            AddDocParagraph(b, "", 10, false, null);
            AddDocParagraph(b, "Экспортировано из Chronica · автор: Vetarion", 16, false, "9A7B45");
            b.Append("<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\"/>");
            b.Append("<w:pgMar w:top=\"1134\" w:right=\"1134\" w:bottom=\"1134\" w:left=\"1134\" w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/>");
            b.Append("</w:sectPr></w:body></w:document>");
            return b.ToString();
        }

        private static void AddDocParagraph(StringBuilder b, string text, int size, bool bold, string color)
        {
            if (text == null) return;
            string[] lines = text.Replace("\r\n", "\n").Split('\n');
            for (int i = 0; i < lines.Length; i++)
            {
                b.Append("<w:p><w:pPr><w:spacing w:after=\"90\"/></w:pPr><w:r><w:rPr>");
                if (bold) b.Append("<w:b/>");
                b.Append("<w:sz w:val=\"").Append(size).Append("\"/><w:szCs w:val=\"").Append(size).Append("\"/>");
                if (!string.IsNullOrEmpty(color)) b.Append("<w:color w:val=\"").Append(color).Append("\"/>");
                b.Append("</w:rPr><w:t xml:space=\"preserve\">").Append(Escape(lines[i])).Append("</w:t></w:r></w:p>");
            }
        }

        private static void AddDocHeading(StringBuilder b, string text)
        {
            AddDocParagraph(b, text, 34, true, "8A6B34");
        }

        private static void AddDocSubheading(StringBuilder b, string text)
        {
            AddDocParagraph(b, text, 28, true, "3A3127");
        }

        private static void AddDocField(StringBuilder b, string label, string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            AddDocParagraph(b, label + ": " + value, 21, false, null);
        }

        private static void AddDocPageBreak(StringBuilder b)
        {
            b.Append("<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>");
        }

        private static void AddEntry(ZipArchive zip, string name, string content)
        {
            ZipArchiveEntry entry = zip.CreateEntry(name, CompressionLevel.Optimal);
            using (Stream stream = entry.Open())
            using (StreamWriter writer = new StreamWriter(stream, new UTF8Encoding(false)))
            {
                writer.Write(content);
            }
        }

        /* ======================= XLSX ======================= */

        private static void ExportXlsx(Dictionary<string, object> data, string path)
        {
            List<string> names = new List<string>();
            List<List<string[]>> sheets = new List<List<string[]>>();
            BuildSheets(data, names, sheets);

            using (ZipArchive zip = ZipFile.Open(path, ZipArchiveMode.Create))
            {
                StringBuilder types = new StringBuilder();
                types.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
                types.Append("<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">");
                types.Append("<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>");
                types.Append("<Default Extension=\"xml\" ContentType=\"application/xml\"/>");
                types.Append("<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>");
                for (int i = 0; i < sheets.Count; i++)
                    types.Append("<Override PartName=\"/xl/worksheets/sheet").Append(i + 1)
                         .Append(".xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>");
                types.Append("</Types>");
                AddEntry(zip, "[Content_Types].xml", types.ToString());

                AddEntry(zip, "_rels/.rels",
                    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
                    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                    "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
                    "</Relationships>");

                StringBuilder workbook = new StringBuilder();
                workbook.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
                workbook.Append("<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets>");
                for (int i = 0; i < names.Count; i++)
                {
                    workbook.Append("<sheet name=\"").Append(EscapeAttribute(names[i]))
                            .Append("\" sheetId=\"").Append(i + 1)
                            .Append("\" r:id=\"rId").Append(i + 1).Append("\"/>");
                }
                workbook.Append("</sheets></workbook>");
                AddEntry(zip, "xl/workbook.xml", workbook.ToString());

                StringBuilder rels = new StringBuilder();
                rels.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
                rels.Append("<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">");
                for (int i = 0; i < names.Count; i++)
                {
                    rels.Append("<Relationship Id=\"rId").Append(i + 1)
                        .Append("\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet")
                        .Append(i + 1).Append(".xml\"/>");
                }
                rels.Append("</Relationships>");
                AddEntry(zip, "xl/_rels/workbook.xml.rels", rels.ToString());

                for (int i = 0; i < sheets.Count; i++)
                {
                    AddEntry(zip, "xl/worksheets/sheet" + (i + 1) + ".xml", BuildSheet(sheets[i]));
                }
            }
        }

        private static void BuildSheets(Dictionary<string, object> data, List<string> names, List<List<string[]>> sheets)
        {
            Dictionary<string, object> world = Map(data, "world");
            Dictionary<string, Dictionary<string, object>> regions = Index(Arr(data, "regions"));
            Dictionary<string, Dictionary<string, object>> races = Index(Arr(data, "races"));
            Dictionary<string, Dictionary<string, object>> locations = Index(Arr(data, "locations"));
            Dictionary<string, Dictionary<string, object>> factions = Index(Arr(data, "factions"));
            Dictionary<string, Dictionary<string, object>> characters = Index(Arr(data, "characters"));

            List<string[]> worldRows = new List<string[]>();
            worldRows.Add(new string[] { "Поле", "Значение" });
            worldRows.Add(new string[] { "Название", Text(world, "name") });
            worldRows.Add(new string[] { "Жанр", Text(world, "genre") });
            worldRows.Add(new string[] { "Эпоха", Text(world, "era") });
            worldRows.Add(new string[] { "Текущий год", Text(world, "currentYear") });
            worldRows.Add(new string[] { "Девиз", Text(world, "tagline") });
            worldRows.Add(new string[] { "Описание", Text(world, "description") });
            worldRows.Add(new string[] { "Создан", DateText(Text(world, "createdAt")) });
            worldRows.Add(new string[] { "Обновлён", DateText(Text(world, "updatedAt")) });
            names.Add("Мир");
            sheets.Add(worldRows);

            List<string[]> characterRows = new List<string[]>();
            characterRows.Add(new string[] { "Имя", "Титул", "Роль", "Пол", "Раса", "Возраст", "Статус", "Фракция", "Локация", "Регион", "Цитата", "Внешность", "История", "Характер", "Метки", "Палитра", "Галерея", "Аудио", "Отец", "Мать", "Супруги", "Дети", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> c in Arr(data, "characters"))
            {
                Dictionary<string, object> location = Lookup(locations, Text(c, "locationId"));
                characterRows.Add(new string[] {
                    Text(c, "name"), Text(c, "title"), Text(c, "role"), Text(c, "gender"),
                    FirstNonEmpty(LookupName(races, Text(c, "raceId")), Text(c, "race")), Text(c, "age"), Text(c, "status"),
                    LookupName(factions, Text(c, "factionId")), LookupName(locations, Text(c, "locationId")),
                    location == null ? "" : LookupName(regions, Text(location, "regionId")),
                    Text(c, "quote"), Text(c, "appearance"), Text(c, "description"), Text(c, "personality"),
                    JoinArray(c, "tags"), JoinArray(c, "palette"), GalleryText(c), AudioText(c),
                    LookupName(characters, Text(c, "fatherId")), LookupName(characters, Text(c, "motherId")),
                    LookupNames(characters, c, "spouseIds"), ChildrenText(characters, Text(c, "id")),
                    DateText(Text(c, "createdAt")), DateText(Text(c, "updatedAt"))
                });
            }
            names.Add("Персонажи");
            sheets.Add(characterRows);

            List<string[]> dndRows = new List<string[]>();
            dndRows.Add(new string[] { "Имя", "Издание", "Класс", "Подкласс", "Уровень", "Вид", "Предыстория", "Мировоззрение", "Сила", "Ловкость", "Телосложение", "Интеллект", "Мудрость", "Харизма", "Бонус владения", "AC", "Хиты", "Скорость", "Кости хитов", "Спасброски", "Навыки", "Снаряжение", "Заклинания", "Умения", "Заметки", "Обновлён" });
            foreach (object sheetObject in Arr(data, "dndSheets"))
            {
                Dictionary<string, object> sheet = sheetObject as Dictionary<string, object>;
                if (sheet == null) continue;
                Dictionary<string, object> abilities = Map(sheet, "abilities");
                dndRows.Add(new string[] {
                    Text(sheet, "name"), Text(sheet, "edition"), Text(sheet, "className"), Text(sheet, "subclass"),
                    Text(sheet, "level"), Text(sheet, "species"), Text(sheet, "background"), Text(sheet, "alignment"),
                    Text(abilities, "str"), Text(abilities, "dex"), Text(abilities, "con"),
                    Text(abilities, "int"), Text(abilities, "wis"), Text(abilities, "cha"),
                    Text(sheet, "proficiency"), Text(sheet, "ac"),
                    Text(sheet, "hpCurrent") + " / " + Text(sheet, "hpMax"), Text(sheet, "speed"), Text(sheet, "hitDice"),
                    JoinArray(sheet, "saves"), JoinArray(sheet, "skills"), Text(sheet, "equipment"),
                    Text(sheet, "spells"), Text(sheet, "features"), Text(sheet, "notes"), DateText(Text(sheet, "updatedAt"))
                });
            }
            if (dndRows.Count > 1)
            {
                names.Add("Листы D&D");
                sheets.Add(dndRows);
            }

            List<string[]> regionRows = new List<string[]>();
            regionRows.Add(new string[] { "Название", "Тип", "Климат", "Описание", "Метки", "Локации", "Фракции", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> r in Arr(data, "regions"))
            {
                regionRows.Add(new string[] {
                    Text(r, "name"), Text(r, "type"), Text(r, "climate"), Text(r, "description"),
                    JoinArray(r, "tags"), NamesByRegion(locations, Text(r, "id")),
                    NamesByRegion(factions, Text(r, "id")), DateText(Text(r, "createdAt")), DateText(Text(r, "updatedAt"))
                });
            }
            names.Add("Регионы");
            sheets.Add(regionRows);

            List<string[]> locationRows = new List<string[]>();
            locationRows.Add(new string[] { "Название", "Тип", "Регион", "Описание", "Метки", "Жители", "Фракции", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> l in Arr(data, "locations"))
            {
                locationRows.Add(new string[] {
                    Text(l, "name"), Text(l, "type"),
                    FirstNonEmpty(LookupName(regions, Text(l, "regionId")), Text(l, "region")), Text(l, "description"),
                    JoinArray(l, "tags"), NamesByLocation(characters, Text(l, "id")),
                    NamesByLocation(factions, Text(l, "id")), DateText(Text(l, "createdAt")), DateText(Text(l, "updatedAt"))
                });
            }
            names.Add("Локации");
            sheets.Add(locationRows);

            List<string[]> factionRows = new List<string[]>();
            factionRows.Add(new string[] { "Название", "Тип", "Статус", "Регион", "Локация", "Лидер", "Кредо", "Описание", "Метки", "Участники", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> f in Arr(data, "factions"))
            {
                factionRows.Add(new string[] {
                    Text(f, "name"), Text(f, "type"), Text(f, "status"),
                    LookupName(regions, Text(f, "regionId")), LookupName(locations, Text(f, "locationId")),
                    LookupName(characters, Text(f, "leaderId")), Text(f, "ideology"), Text(f, "description"),
                    JoinArray(f, "tags"), NamesByFaction(characters, Text(f, "id")),
                    DateText(Text(f, "createdAt")), DateText(Text(f, "updatedAt"))
                });
            }
            names.Add("Фракции");
            sheets.Add(factionRows);

            List<string[]> raceRows = new List<string[]>();
            raceRows.Add(new string[] { "Название", "Тип", "Черты", "Описание", "Метки", "Представители", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> r in Arr(data, "races"))
            {
                raceRows.Add(new string[] {
                    Text(r, "name"), Text(r, "type"), Text(r, "traits"), Text(r, "description"),
                    JoinArray(r, "tags"), NamesByRace(characters, Text(r, "id")),
                    DateText(Text(r, "createdAt")), DateText(Text(r, "updatedAt"))
                });
            }
            names.Add("Расы");
            sheets.Add(raceRows);

            List<string[]> eventRows = new List<string[]>();
            eventRows.Add(new string[] { "Название", "Дата", "Год", "Эпоха", "Тип", "Место", "Участники", "Описание", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> e in Arr(data, "events"))
            {
                eventRows.Add(new string[] {
                    Text(e, "title"), Text(e, "dateText"), Text(e, "sortYear"), Text(e, "era"),
                    EventTypeText(Text(e, "type")), LookupName(locations, Text(e, "locationId")),
                    LookupNames(characters, e, "participantIds"), Text(e, "description"),
                    DateText(Text(e, "createdAt")), DateText(Text(e, "updatedAt"))
                });
            }
            names.Add("События");
            sheets.Add(eventRows);

            List<string[]> loreRows = new List<string[]>();
            loreRows.Add(new string[] { "Заголовок", "Категория", "Источник", "Кратко", "Текст", "Метки", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> article in Arr(data, "lore"))
            {
                loreRows.Add(new string[] {
                    Text(article, "title"), Text(article, "category"), Text(article, "sourceTitle"), Text(article, "summary"),
                    Text(article, "content"), JoinArray(article, "tags"),
                    DateText(Text(article, "createdAt")), DateText(Text(article, "updatedAt"))
                });
            }
            names.Add("Лор");
            sheets.Add(loreRows);

            List<string[]> bookRows = new List<string[]>();
            bookRows.Add(new string[] { "Название", "Тип", "Автор", "Год", "Описание", "Метки", "Создан", "Обновлён" });
            foreach (Dictionary<string, object> book in Arr(data, "books"))
            {
                bookRows.Add(new string[] {
                    Text(book, "title"), Text(book, "type"), Text(book, "author"), Text(book, "year"),
                    Text(book, "description"), JoinArray(book, "tags"),
                    DateText(Text(book, "createdAt")), DateText(Text(book, "updatedAt"))
                });
            }
            names.Add("Библиотека");
            sheets.Add(bookRows);

            List<string[]> noteRows = new List<string[]>();
            noteRows.Add(new string[] { "Заголовок", "Текст", "Цвет", "Закреплена", "Создана", "Обновлена" });
            foreach (Dictionary<string, object> note in Arr(data, "notes"))
            {
                noteRows.Add(new string[] {
                    Text(note, "title"), Text(note, "content"), NoteColorText(Text(note, "color")),
                    string.Equals(Str(note, "pinned"), "true", StringComparison.OrdinalIgnoreCase) ? "Да" : "Нет",
                    DateText(Text(note, "createdAt")), DateText(Text(note, "updatedAt"))
                });
            }
            names.Add("Заметки");
            sheets.Add(noteRows);
        }

        private static string BuildSheet(List<string[]> rows)
        {
            StringBuilder b = new StringBuilder();
            b.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
            b.Append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
            for (int r = 0; r < rows.Count; r++)
            {
                b.Append("<row r=\"").Append(r + 1).Append("\">");
                string[] row = rows[r];
                for (int c = 0; c < row.Length; c++)
                {
                    string value = row[c] ?? "";
                    b.Append("<c r=\"").Append(ColumnRef(c)).Append(r + 1).Append("\" t=\"inlineStr\"><is><t xml:space=\"preserve\">")
                     .Append(Escape(value)).Append("</t></is></c>");
                }
                b.Append("</row>");
            }
            b.Append("</sheetData></worksheet>");
            return b.ToString();
        }

        private static string ColumnRef(int zeroBased)
        {
            int value = zeroBased + 1;
            string result = "";
            while (value > 0)
            {
                int mod = (value - 1) % 26;
                result = (char)('A' + mod) + result;
                value = (value - 1) / 26;
            }
            return result;
        }

        /* ======================= helpers ======================= */

        private static Dictionary<string, Dictionary<string, object>> Index(object[] items)
        {
            Dictionary<string, Dictionary<string, object>> map = new Dictionary<string, Dictionary<string, object>>();
            for (int i = 0; i < items.Length; i++)
            {
                Dictionary<string, object> item = items[i] as Dictionary<string, object>;
                if (item == null) continue;
                string id = Text(item, "id");
                if (!string.IsNullOrEmpty(id)) map[id] = item;
            }
            return map;
        }

        private static object[] Arr(Dictionary<string, object> data, string key)
        {
            object value;
            if (data == null || !data.TryGetValue(key, out value)) return new object[0];
            return AsArray(value);
        }

        private static object[] AsArray(object value)
        {
            if (value == null) return new object[0];
            object[] array = value as object[];
            if (array != null) return array;
            IEnumerable sequence = value as IEnumerable;
            if (sequence == null) return new object[0];
            List<object> list = new List<object>();
            foreach (object item in sequence) list.Add(item);
            return list.ToArray();
        }

        private static Dictionary<string, object> Map(Dictionary<string, object> data, string key)
        {
            object value;
            if (data == null || !data.TryGetValue(key, out value)) return new Dictionary<string, object>();
            return value as Dictionary<string, object> ?? new Dictionary<string, object>();
        }

        private static string Str(Dictionary<string, object> data, string key)
        {
            object value;
            if (data == null || !data.TryGetValue(key, out value) || value == null) return "";
            return Convert.ToString(value, CultureInfo.InvariantCulture);
        }

        private static string Text(Dictionary<string, object> data, string key)
        {
            return Str(data, key);
        }

        private static string JoinArray(Dictionary<string, object> data, string key)
        {
            object value;
            if (data == null || !data.TryGetValue(key, out value)) return "";
            object[] array = AsArray(value);
            if (array.Length > 0)
            {
                List<string> parts = new List<string>();
                for (int i = 0; i < array.Length; i++)
                {
                    string text = Convert.ToString(array[i], CultureInfo.InvariantCulture);
                    if (!string.IsNullOrWhiteSpace(text)) parts.Add(text.Trim());
                }
                return string.Join(", ", parts.ToArray());
            }
            return Convert.ToString(value, CultureInfo.InvariantCulture) ?? "";
        }

        private static Dictionary<string, object> Lookup(Dictionary<string, Dictionary<string, object>> map, string id)
        {
            Dictionary<string, object> item;
            return !string.IsNullOrEmpty(id) && map.TryGetValue(id, out item) ? item : null;
        }

        private static string LookupName(Dictionary<string, Dictionary<string, object>> map, string id)
        {
            Dictionary<string, object> item = Lookup(map, id);
            if (item == null) return "";
            return FirstNonEmpty(Text(item, "name"), Text(item, "title"));
        }

        private static string FirstNonEmpty(string first, string second)
        {
            return string.IsNullOrWhiteSpace(first) ? (second ?? "") : first;
        }

        private static string LookupNames(Dictionary<string, Dictionary<string, object>> map, Dictionary<string, object> item, string key)
        {
            object value;
            if (item == null || !item.TryGetValue(key, out value)) return "";
            object[] array = AsArray(value);
            if (array.Length == 0) return "";
            List<string> names = new List<string>();
            for (int i = 0; i < array.Length; i++)
            {
                string name = LookupName(map, Convert.ToString(array[i], CultureInfo.InvariantCulture));
                if (!string.IsNullOrEmpty(name)) names.Add(name);
            }
            return string.Join(", ", names.ToArray());
        }

        private static string ChildrenText(Dictionary<string, Dictionary<string, object>> characters, string id)
        {
            if (string.IsNullOrEmpty(id)) return "";
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, Dictionary<string, object>> pair in characters)
            {
                if (Text(pair.Value, "fatherId") == id || Text(pair.Value, "motherId") == id)
                    names.Add(Text(pair.Value, "name"));
            }
            names.Sort(StringComparer.CurrentCultureIgnoreCase);
            return string.Join(", ", names.ToArray());
        }

        private static string NamesByRegion(Dictionary<string, Dictionary<string, object>> map, string regionId)
        {
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, Dictionary<string, object>> pair in map)
            {
                if (Text(pair.Value, "regionId") == regionId) names.Add(Text(pair.Value, "name"));
            }
            names.Sort(StringComparer.CurrentCultureIgnoreCase);
            return string.Join(", ", names.ToArray());
        }

        private static string NamesByLocation(Dictionary<string, Dictionary<string, object>> map, string locationId)
        {
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, Dictionary<string, object>> pair in map)
            {
                if (Text(pair.Value, "locationId") == locationId) names.Add(Text(pair.Value, "name"));
            }
            names.Sort(StringComparer.CurrentCultureIgnoreCase);
            return string.Join(", ", names.ToArray());
        }

        private static string NamesByFaction(Dictionary<string, Dictionary<string, object>> map, string factionId)
        {
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, Dictionary<string, object>> pair in map)
            {
                if (Text(pair.Value, "factionId") == factionId) names.Add(Text(pair.Value, "name"));
            }
            names.Sort(StringComparer.CurrentCultureIgnoreCase);
            return string.Join(", ", names.ToArray());
        }

        private static string NamesByRace(Dictionary<string, Dictionary<string, object>> map, string raceId)
        {
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, Dictionary<string, object>> pair in map)
            {
                if (Text(pair.Value, "raceId") == raceId) names.Add(Text(pair.Value, "name"));
            }
            names.Sort(StringComparer.CurrentCultureIgnoreCase);
            return string.Join(", ", names.ToArray());
        }

        private static string GalleryText(Dictionary<string, object> character)
        {
            object value;
            if (!character.TryGetValue("gallery", out value)) return "";
            object[] array = AsArray(value);
            if (array.Length == 0) return "";
            return array.Length + " " + (array.Length == 1 ? "изображение" : (array.Length > 1 && array.Length < 5 ? "изображения" : "изображений"));
        }

        private static string AudioText(Dictionary<string, object> character)
        {
            object value;
            if (!character.TryGetValue("audio", out value)) return "";
            object[] array = AsArray(value);
            if (array.Length == 0) return "";
            List<string> parts = new List<string>();
            for (int i = 0; i < array.Length; i++)
            {
                Dictionary<string, object> track = array[i] as Dictionary<string, object>;
                if (track == null) continue;
                string title = Text(track, "title");
                string kind = Text(track, "kind") == "music" ? "музыка" : "голос";
                parts.Add((string.IsNullOrWhiteSpace(title) ? "Аудио" : title) + " (" + kind + ")");
            }
            return string.Join(", ", parts.ToArray());
        }

        private static string EventTypeText(string type)
        {
            switch ((type ?? "").ToLowerInvariant())
            {
                case "battle": return "Битва";
                case "politics": return "Политика";
                case "magic": return "Магия";
                case "disaster": return "Катастрофа";
                case "discovery": return "Открытие";
                case "union": return "Союз";
                case "death": return "Смерть";
                case "birth": return "Рождение";
                default: return "Другое";
            }
        }

        private static string NoteColorText(string color)
        {
            switch ((color ?? "").ToLowerInvariant())
            {
                case "sage": return "Шалфей";
                case "rose": return "Роза";
                case "blue": return "Лазурь";
                default: return "Золото";
            }
        }

        private static string DateText(string iso)
        {
            if (string.IsNullOrWhiteSpace(iso)) return "";
            DateTimeOffset value;
            if (DateTimeOffset.TryParse(iso, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out value))
                return value.ToLocalTime().ToString("dd.MM.yyyy HH:mm");
            return iso;
        }

        private static string Escape(string value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            return value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");
        }

        private static string EscapeAttribute(string value)
        {
            return Escape(value).Replace("\"", "&quot;");
        }
    }
}
