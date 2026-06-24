export const isUrl = (value: null): boolean => {
    try {
        if (!value) {
            return false;
        }

        if (['string', 'object'].includes(typeof value)) {
            new URL(value);

            return true;
        }

        return false;
    } catch (error) {
        return false;
    }
};

export const ifUrl = (value: null): URL | null => {
    try {
        if (isUrl(value)) {
            return new URL(`${value}`);
        }

        return null;
    } catch (error) {
        return null;
    }
};
