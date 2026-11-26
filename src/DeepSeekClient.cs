using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;

namespace Mifarium
{
    internal sealed class DeepSeekClient
    {
        private const string Endpoint = "https://api.deepseek.com/chat/completions";
        private readonly string _apiKey;
        private readonly string _model;
        private readonly JavaScriptSerializer _json;

        public DeepSeekClient(string apiKey, string model)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("API-ключ DeepSeek не задан. Откройте настройки и добавьте ключ.");
            _apiKey = apiKey.Trim();
            _model = model == "deepseek-reasoner" ? "deepseek-reasoner" : "deepseek-chat";
            _json = AppStorage.CreateSerializer();
        }

        public Dictionary<string, object> Extract(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new InvalidOperationException("Вставьте текст старых чатов.");
            if (text.Length < 20)
                throw new InvalidOperationException("Текст слишком короткий для разбора.");
            if (text.Length > 60000)
                throw new InvalidOperationException("Текст слишком длинный. Разбейте переписку на части до 60 000 символов.");

            Dictionary<string, object> payload = new Dictionary<string, object>();
            payload["model"] = _model;
            payload["temperature"] = 0.15;
            payload["max_tokens"] = 8000;
            payload["stream"] = false;
            if (_model == "deepseek-chat")
            {
                Dictionary<string, object> responseFormat = new Dictionary<string, object>();
                responseFormat["type"] = "json_object";
                payload["response_format"] = responseFormat;
            }

            List<Dictionary<string, object>> messages = new List<Dictionary<string, object>>();
            messages.Add(Message("system", SystemPrompt()));
            messages.Add(Message("user", "Разбери следующую переписку и верни только JSON:\n\n" + text));
            payload["messages"] = messages;

            string requestJson = _json.Serialize(payload);
            string responseJson = Post(requestJson);
            Dictionary<string, object> response = null;
            try
            {
                response = _json.Deserialize<Dictionary<string, object>>(responseJson);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("DeepSeek вернул неожиданный ответ. Попробуйте ещё раз.", ex);
            }
            if (response == null)
                throw new InvalidOperationException("DeepSeek вернул пустой ответ.");

            object choicesValue;
            if (!response.TryGetValue("choices", out choicesValue))
                throw new InvalidOperationException("В ответе DeepSeek нет результата.");
            object[] choices = ToArray(choicesValue);
            if (choices.Length == 0)
                throw new InvalidOperationException("DeepSeek не вернул вариантов ответа.");
            Dictionary<string, object> choice = choices[0] as Dictionary<string, object>;
            Dictionary<string, object> message = choice == null ? null : GetMap(choice, "message");
            string content = message == null ? null : GetString(message, "content");
            if (string.IsNullOrWhiteSpace(content))
                throw new InvalidOperationException("DeepSeek вернул пустой текст. Попробуйте другую модель или сократите переписку.");

            string json = ExtractJson(content);
            Dictionary<string, object> data = null;
            try
            {
                data = _json.Deserialize<Dictionary<string, object>>(json);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("DeepSeek вернул ответ не в формате JSON. Попробуйте ещё раз или выберите DeepSeek Chat.", ex);
            }
            if (data == null)
                throw new InvalidOperationException("Не удалось разобрать JSON из ответа DeepSeek.");

            Dictionary<string, object> result = new Dictionary<string, object>();
            result["data"] = data;
            result["model"] = _model;
            object usage;
            if (response.TryGetValue("usage", out usage)) result["usage"] = usage;
            return result;
        }

        private string Post(string body)
        {
            ServicePointManager.SecurityProtocol = ServicePointManager.SecurityProtocol | SecurityProtocolType.Tls12;
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(Endpoint);
            request.Method = "POST";
            request.ContentType = "application/json; charset=utf-8";
            request.Accept = "application/json";
            request.UserAgent = "Chronica/2.0 (Windows)";
            request.Headers["Authorization"] = "Bearer " + _apiKey;
            request.Timeout = 120000;
            request.ReadWriteTimeout = 120000;
            request.KeepAlive = false;

            byte[] bytes = Encoding.UTF8.GetBytes(body);
            request.ContentLength = bytes.Length;
            try
            {
                using (Stream stream = request.GetRequestStream())
                {
                    stream.Write(bytes, 0, bytes.Length);
                }
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                using (Stream stream = response.GetResponseStream())
                using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (WebException ex)
            {
                string details = ReadErrorBody(ex);
                HttpWebResponse response = ex.Response as HttpWebResponse;
                int status = response == null ? 0 : (int)response.StatusCode;
                if (status == 401)
                    throw new InvalidOperationException("DeepSeek отклонил API-ключ. Проверьте ключ в настройках.", ex);
                if (status == 402)
                    throw new InvalidOperationException("На счёте DeepSeek недостаточно средств.", ex);
                if (status == 429)
                    throw new InvalidOperationException("Слишком много запросов к DeepSeek. Подождите немного и попробуйте снова.", ex);
                if (status == 400)
                    throw new InvalidOperationException("DeepSeek отклонил запрос: " + details, ex);
                if (ex.Status == WebExceptionStatus.Timeout)
                    throw new InvalidOperationException("DeepSeek не ответил вовремя. Попробуйте сократить текст или повторить позже.", ex);
                throw new InvalidOperationException(
                    "Не удалось связаться с DeepSeek" + (details.Length > 0 ? ": " + details : ". Проверьте интернет и ключ."), ex);
            }
        }

        private string ReadErrorBody(WebException ex)
        {
            try
            {
                if (ex.Response == null) return string.Empty;
                using (Stream stream = ex.Response.GetResponseStream())
                using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
                {
                    string text = reader.ReadToEnd();
                    if (string.IsNullOrWhiteSpace(text)) return string.Empty;
                    Dictionary<string, object> map = null;
                    try { map = _json.Deserialize<Dictionary<string, object>>(text); }
                    catch { }
                    if (map != null)
                    {
                        Dictionary<string, object> error = GetMap(map, "error");
                        string message = error == null ? null : GetString(error, "message");
                        if (!string.IsNullOrEmpty(message)) return message;
                    }
                    return text.Length > 280 ? text.Substring(0, 277) + "…" : text;
                }
            }
            catch
            {
                return string.Empty;
            }
        }

        private static string ExtractJson(string content)
        {
            string text = content.Trim();
            int start = text.IndexOf('{');
            int end = text.LastIndexOf('}');
            if (start < 0 || end <= start)
                throw new InvalidOperationException("В ответе DeepSeek нет JSON-объекта.");
            return text.Substring(start, end - start + 1);
        }

        private static Dictionary<string, object> Message(string role, string content)
        {
            Dictionary<string, object> message = new Dictionary<string, object>();
            message["role"] = role;
            message["content"] = content;
            return message;
        }

        private static object[] ToArray(object value)
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

        private static Dictionary<string, object> GetMap(Dictionary<string, object> map, string key)
        {
            object value;
            if (map == null || !map.TryGetValue(key, out value)) return null;
            return value as Dictionary<string, object>;
        }

        private static string GetString(Dictionary<string, object> map, string key)
        {
            object value;
            if (map == null || !map.TryGetValue(key, out value)) return null;
            return value == null ? null : Convert.ToString(value);
        }

        private static string SystemPrompt()
        {
            return
                "Ты — аккуратный архивариус фэнтезийного мира. Твоя задача — извлечь из старой переписки " +
                "только те сведения, которые в ней действительно есть, и вернуть их строго в виде одного JSON-объекта. " +
                "Не придумывай новых фактов, имён и событий. Если сведений о чём-то нет — оставь пустую строку, " +
                "пустой массив или не добавляй запись. Объединяй повторяющиеся упоминания одной сущности. " +
                "Пиши описания по-русски, имена собственные сохраняй так, как они даны в переписке. " +
                "Ответ должен быть только JSON, без markdown, пояснений и комментариев.\n\n" +
                "Схема ответа:\n" +
                "{\n" +
                "  \"world\": {\"name\": \"\", \"genre\": \"\", \"era\": \"\", \"currentYear\": \"\", \"tagline\": \"\", \"description\": \"\"},\n" +
                "  \"regions\": [{\"name\": \"\", \"type\": \"\", \"climate\": \"\", \"description\": \"\", \"tags\": []}],\n" +
                "  \"races\": [{\"name\": \"\", \"type\": \"\", \"traits\": \"\", \"description\": \"\", \"tags\": []}],\n" +
                "  \"locations\": [{\"name\": \"\", \"type\": \"\", \"region\": \"\", \"description\": \"\", \"tags\": []}],\n" +
                "  \"factions\": [{\"name\": \"\", \"type\": \"\", \"status\": \"\", \"region\": \"\", \"location\": \"\", \"leader\": \"\", \"ideology\": \"\", \"description\": \"\", \"tags\": []}],\n" +
                "  \"characters\": [{\"name\": \"\", \"title\": \"\", \"role\": \"\", \"race\": \"\", \"gender\": \"\", \"age\": \"\", \"status\": \"\", \"faction\": \"\", \"location\": \"\", \"quote\": \"\", \"appearance\": \"\", \"description\": \"\", \"personality\": \"\", \"tags\": [], \"father\": \"\", \"mother\": \"\", \"spouses\": [], \"children\": []}],\n" +
                "  \"events\": [{\"title\": \"\", \"dateText\": \"\", \"sortYear\": 0, \"era\": \"\", \"type\": \"\", \"location\": \"\", \"participants\": [], \"description\": \"\"}],\n" +
                "  \"lore\": [{\"title\": \"\", \"category\": \"\", \"summary\": \"\", \"content\": \"\", \"tags\": []}],\n" +
                "  \"notes\": [{\"title\": \"\", \"content\": \"\", \"color\": \"gold\", \"pinned\": false}]\n" +
                "}\n\n" +
                "Допустимые значения type у регионов: Королевство, Провинция, Долины, Горы, Лесной край, Пустошь, Острова, Побережье, Священные земли, Дикие земли, Руины, Другое. " +
                "У рас: Смертные, Древние, Одарённые, Звери, Небожители, Созданные, Полулюди, Другое. " +
                "У локаций: Столица, Город, Крепость, Деревня, Долина, Лес, Горы, Пустошь, Озеро, Море, Остров, Руина, Святилище, Портал, Другое. " +
                "У фракций: Королевский дом, Знатный род, Тайный орден, Религиозный орден, Гильдия, Наёмное братство, Ковен, Племя, Союз, Другое. " +
                "У событий: battle, politics, magic, disaster, discovery, union, death, birth, other. " +
                "У лора: История, Магия, Религия, Артефакты, Бестиарий, Культура, География, Персоналии, Другое. " +
                "gender: Женский, Мужской, Иной, Не указан. color заметки: gold, sage, rose, blue. " +
                "Связи (father, mother, spouses, children, leader, participants) указывай именами, а не идентификаторами. " +
                "sortYear — целое число для сортировки, 0 если год неизвестен.";
        }
    }
}
