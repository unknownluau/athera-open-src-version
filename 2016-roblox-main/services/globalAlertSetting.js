const alertSettingType = {
    hide: '1',
    show: '2',
    default: '2',
};

const isLocalStorageAvailable = (() => {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return true;
})();

const getGlobalAlertSetting = () => {
    if (!isLocalStorageAvailable) return alertSettingType.default;
    const savedSetting = localStorage.getItem('rbx_global_alert_setting');
    return Object.values(alertSettingType).includes(savedSetting) ? savedSetting : alertSettingType.default;
};

const setGlobalAlertSetting = (setting) => {
    if (!isLocalStorageAvailable || !Object.values(alertSettingType).includes(setting)) return;

    localStorage.setItem('rbx_global_alert_setting', setting);
};

export { alertSettingType, getGlobalAlertSetting, setGlobalAlertSetting };
