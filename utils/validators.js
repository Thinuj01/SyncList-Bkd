const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validateRequired = (fields) => {
    const missing = [];
    Object.entries(fields).forEach(([key, value]) => {
        if (!value || value.trim() === '') {
            missing.push(key);
        }
    });
    return missing;
};

module.exports = {
    validateEmail,
    validatePassword,
    validateRequired
};