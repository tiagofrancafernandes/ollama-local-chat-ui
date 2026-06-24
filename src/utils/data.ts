export const isObject = (value: any): boolean => {
    return value && typeof value === 'object' && !Array.isArray(value);
};

export const isArray = (value: any): boolean => {
    return value && typeof value === 'object' && Array.isArray(value);
};

export const isString = (value: any): boolean => {
    return typeof value === 'string';
};

export const isNumeric = (value: any): boolean => {
    return !isNaN(Number(value));
};

export const isUrl = (value: URL | string | null | undefined): boolean => {
    try {
        if (!value) {
            return false;
        }

        if (isObject(value)) {
            return value instanceof URL;
        }

        if (isString(value)) {
            new URL(value);
            return true;
        }

        return false;
    } catch (error) {
        return false;
    }
};

export const ifUrl = (value: URL | string | null | undefined, toString: boolean = false): URL | string | null => {
    try {
        if (value && isUrl(value)) {
            value = isObject(value) ? value : new URL(`${value}`);
            return toString ? value?.toString() : value;
        }

        return null;
    } catch (error) {
        return null;
    }
};

export const formatBytes = (bytes: any) => {
    const FIFTY_MB = 50 * 1024 * 1024; // 52,428,800 bytes

    if (!isNumeric(bytes) || bytes < FIFTY_MB) {
        return '';
    }

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    // Calcula o valor final com uma casa decimal
    const formattedValue = (bytes / Math.pow(1024, i)).toFixed(1);

    return `${formattedValue} ${sizes[i]}`;
};
