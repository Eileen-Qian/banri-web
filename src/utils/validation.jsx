const phonePattern = /^09\d{8}$/;

export const emailValidation = (t) => ({
  required: t("validation.emailRequired"),
  pattern: {
    value: /^\S+@\S+$/i,
    message: t("validation.emailFormat"),
  },
});

export const passwordValidation = (t) => ({
  required: t("validation.passwordRequired"),
  minLength: {
    value: 6,
    message: t("validation.passwordMinLength"),
  },
});

export const taiwanPhoneValidation = (t) => ({
  required: t("validation.phoneRequired"),
  pattern: {
    value: phonePattern,
    message: t("validation.phoneFormat"),
  },
});

export const nameValidation = (t) => ({
  required: t("validation.nameRequired"),
});

export const addressValidation = (t) => ({
  required: t("validation.addressRequired"),
});
