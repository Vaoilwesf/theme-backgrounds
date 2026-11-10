// Theme Backgrounds — прикрепляет фон к теме и ставит его при переключении темы.
import { background_settings } from '../../../backgrounds.js';

const KEY = 'themeBackgrounds';
const ctx = () => SillyTavern.getContext();
const store = () => (ctx().extensionSettings[KEY] ??= { map: {} });
const currentTheme = () => ctx().powerUserSettings.theme;
const urlOf = file => `url("backgrounds/${encodeURIComponent(file)}")`;
const BTN = '<div data-action="pk-theme-pin" class="jg-button pk-tb-pin fa-solid fa-thumbtack fa-fw pointer" title="Прикрепить к текущей теме"></div>';

let lastTheme;
const markStyle = document.createElement('style');
document.head.append(markStyle);

// Подсветка фона, прикреплённого к текущей теме (без перебора миниатюр)
function mark() {
    const file = store().map[currentTheme()];
    const sel = file ? `.bg_example[custom="false"][bgfile="${CSS.escape(file)}"]` : '';
    markStyle.textContent = sel ? `${sel} .pk-tb-pin { color: var(--SmartThemeQuoteColor); } ${sel} .pk-tb-badge { display: block; }` : '';
}

// Ставит фон так же, как обычный выбор фона; замочек чата по-прежнему главнее
function setBackground(file) {
    const url = urlOf(file);
    if (background_settings.url === url) return;
    if (!ctx().chatMetadata?.custom_background) $('#bg1').css('background-image', url);
    background_settings.name = file;
    background_settings.url = url;
    $('.bg_example.selected-background').removeClass('selected-background');
    $('.bg_example').filter(function () { return $(this).data('url') === url; }).addClass('selected-background');
    ctx().saveSettingsDebounced();
}

function onThemeChange() {
    const theme = currentTheme();
    if (theme === lastTheme) return;
    lastTheme = theme;
    const file = store().map[theme];
    if (file) setBackground(file);
    mark();
}

// Кнопка и значок в каждой миниатюре (и в шаблоне, чтобы новые миниатюры получали их сами)
function addButtons() {
    document.querySelectorAll('.bg_example').forEach(thumb => {
        if (thumb.querySelector('.pk-tb-pin')) return;
        thumb.querySelector('.jg-menu')?.insertAdjacentHTML('afterbegin', BTN);
        thumb.insertAdjacentHTML('beforeend', '<i class="pk-tb-badge fa-solid fa-thumbtack"></i>');
    });
}

function onPinClick(e) {
    e.stopPropagation();
    const thumb = this.closest('.bg_example');
    const file = thumb?.getAttribute('bgfile');
    const theme = currentTheme();
    if (!file) return;
    if (!theme) return toastr.warning('Сначала выберите тему');
    const map = store().map;
    if (map[theme] === file) {
        delete map[theme];
        toastr.info(`Фон откреплён от темы «${theme}»`);
    } else {
        map[theme] = file;
        setBackground(file);
        toastr.success(`Фон прикреплён к теме «${theme}»`);
    }
    thumb.classList.remove('mobile-menu-open');
    mark();
    ctx().saveSettingsDebounced();
}

jQuery(() => {
    addButtons();
    lastTheme = currentTheme();
    mark();
    $(document).on('click', '.pk-tb-pin', onPinClick);
    $(document).on('change', '#themes', () => setTimeout(onThemeChange));
    const { eventSource, eventTypes } = ctx();
    eventSource.on(eventTypes.SETTINGS_UPDATED, onThemeChange);
    eventSource.on(eventTypes.APP_READY, () => { addButtons(); lastTheme = currentTheme(); mark(); });
});
