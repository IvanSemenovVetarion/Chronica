# Публикация Chronica на GitHub

Инструкция для первого релиза. Репозиторий уже создан и пуст:

```
https://github.com/IvanSemenovVetarion/Chronica
```

Не создавайте второй репозиторий с тем же именем. Ссылки в README, на странице
`docs/index.html` и в настройках приложения уже указывают на него. Если вы
переименуете репозиторий, замените `Chronica` в ссылках.

## 0. Что уже подготовлено

- `README.md` — главная страница проекта;
- `docs/` — красивый сайт для GitHub Pages;
- `LICENSE` — MIT для оригинального кода;
- `THIRD_PARTY_NOTICES.md`, `licenses/` — лицензии WebView2 и шрифтов;
- `TRADEMARKS.md` — правила использования названия и логотипа;
- `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`;
- `.gitignore` — не пропускает `dist/`, `build/`, `backups/` и данные.

## 1. Установите Git или GitHub Desktop

Если Git ещё не установлен, проще всего поставить **Git for Windows**:

```text
https://git-scm.com/download/win
```

Для первого проекта также удобен **GitHub Desktop**:

```text
https://desktop.github.com/
```

Войдите в аккаунт `IvanSemenovVetarion`.

Если используете Git для Windows, задайте имя и почту:

```bat
git config --global user.name "Ivan Semenov"
git config --global user.email "ваша-почта@example.com"
```

## 2. Загрузите папку проекта

### Через командную строку — рекомендую

```bat
cd "C:\Users\210\Documents\Проект по умолчанию\Mifarium"
git init
git add .
git status
git commit -m "Chronica 2.0.0"
git branch -M main
git remote add origin https://github.com/IvanSemenovVetarion/Chronica.git
git push -u origin main
```

Перед `git commit` проверьте `git status`: в списке **не должно быть**
`dist/`, `build/`, `backups/`, `experimental/` и папок с данными.

### Через GitHub Desktop

1. **File → Add local repository**.
2. Выберите папку `Mifarium`.
3. Если GitHub Desktop предложит создать локальный репозиторий — согласитесь.
4. Проверьте список изменений: `dist/`, `build/`, `backups/` и данные не
   должны попасть в коммит.
5. Внизу введите сообщение `Chronica 2.0.0` и нажмите **Commit to main**.
6. Откройте **Repository → Repository settings → Remote** и добавьте remote
   с именем `origin`:
   `https://github.com/IvanSemenovVetarion/Chronica.git`.
7. Нажмите **Push origin** (не «Publish repository» — репозиторий уже создан).

## 3. Включите GitHub Pages

1. Откройте репозиторий → **Settings → Pages**.
2. Source: **Deploy from a branch**.
3. Branch: `main`, folder: **`/docs`**.
4. Нажмите **Save**.

Через 1–3 минуты страница будет доступна по адресу:

```
https://ivansemenovvetarion.github.io/Chronica/
```

Ссылки уже указывают на `IvanSemenovVetarion/Chronica`. Если вы измените имя репозитория, обновите `og:url`, `og:image` и ссылки в `docs/index.html`, а также ссылки в `README.md`.

Дополнительно в **Settings → General**:

- добавьте описание репозитория:
  `A quiet local-first worldbuilding workshop for Windows`;
- в поле **Website** укажите:
  `https://ivansemenovvetarion.github.io/Chronica/`;
- укажите темы: `worldbuilding`, `desktop-app`, `csharp`, `javascript`,
  `fantasy`, `windows`, `writing`, `worldbuilding-tool`;
- загрузите **Social preview** — можно взять `docs/assets/app-dashboard.jpg`.

## 4. Соберите релиз

В Windows:

```bat
build.cmd
build-android.cmd
```

Появятся:

```
dist\Chronica\Chronica.exe
dist\ChronicaSetup.exe
dist\Chronica-portable.zip
dist\Chronica-Android-2.0.1.apk
```

Убедитесь, что в `dist\Chronica` нет папки `ChronicaData`, а в архиве нет
ваших личных миров.

## 5. Опубликуйте релиз

1. Откройте репозиторий → **Releases → Draft a new release**.
2. Tag: `v2.0.1`.
3. Title: `Chronica 2.0.1`.
4. Вставьте описание из [`CHANGELOG.md`](CHANGELOG.md).
5. Прикрепите файлы:
   - `ChronicaSetup.exe`;
   - `Chronica-portable.zip`;
   - `Chronica-Android-2.0.1.apk`.
6. Нажмите **Publish release**.

После этого заработают прямые ссылки:

```
https://github.com/IvanSemenovVetarion/Chronica/releases/latest/download/ChronicaSetup.exe
https://github.com/IvanSemenovVetarion/Chronica/releases/latest/download/Chronica-portable.zip
https://github.com/IvanSemenovVetarion/Chronica/releases/latest/download/Chronica-Android-2.0.1.apk
```

> Не загружайте `ChronicaData`, `settings.json`, `backups/` и тестовые сборки.
> В текущем публичном релизе — только классическая Chronica.

## 6. Настройте обновления в приложении

В Chronica откройте **Настройки → Обновления** и укажите:

```
IvanSemenovVetarion/Chronica
```

Нажмите «Сохранить», затем «Проверить обновления». Для проверки нужен
опубликованный релиз с тегом, который больше текущей версии.

## 7. Финальный чек-лист

- [ ] Репозиторий публичный;
- [ ] В репозитории нет `dist/`, `backups/`, `ChronicaData/`;
- [ ] README и `docs/index.html` открываются без ошибок;
- [ ] GitHub Pages включён из папки `/docs`;
- [ ] В релизе `v2.0.1` есть установщик и portable ZIP;
- [ ] Ссылки на скачивание ведут на правильный репозиторий;
- [ ] В настройках приложения указан правильный `owner/repo`;
- [ ] Проверено, что установщик запускается на чистой Windows 10/11.

## 8. Если что-то не так

**GitHub Desktop не видит изменения.** Проверьте, что добавлена именно папка
`Mifarium`, а не её родительская папка.

**Слишком большой репозиторий.** Убедитесь, что `dist/` и `backups/` не
добавлены. Если они уже попали в коммит, удалите их из индекса:

```bat
git rm -r --cached dist build backups
git commit -m "Remove build artifacts"
```

**Сайт выглядит без стилей.** Откройте DevTools → Network и проверьте, что
`style.css`, `assets/app-dashboard.jpg` и шрифты загружаются. GitHub Pages
чувствителен к регистру имён файлов.

**Ссылка на скачивание 404.** Проверьте, что релиз опубликован, тег начинается
с `v`, а имена файлов точно совпадают.
