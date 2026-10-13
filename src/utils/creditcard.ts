import { card as creditCard, withTypes } from "creditcards";

const customCardTypes = [
  {
    name: "Mir",
    pattern: /^220[0-4]\d{12}$/,
    eagerPattern: /^220/,
    groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
    digits: 16,
    cvcLength: 3,
  },
  {
    name: "Upi",
    pattern: /^62|^81/,
    eagerPattern: /^62|^81/,
    groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
    digits: 16,
    cvcLength: 3,
  },
  {
    name: "GCLOCAL",
    eagerPattern: /^6017/,
    groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
    digits: 16,
    cvcLength: 3,
  },
  {
    name: "PROSTIR",
    eagerPattern: /^9804/,
    groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
    digits: 16,
    cvcLength: 3,
  },
  {
    name: "American express debit",
    eagerPattern: /^37/,
    groupPattern: /(\d{1,4})(\d{1,4})?(\d{1,4})?(\d{1,4})?(\d{1,3})?/,
    digits: 16,
    cvcLength: 3,
  },
  {
    name: "MAESTRO",
    eagerPattern:
      /^(5(018|0[23]|[68]|[9]|[7])|6[37]|60111|60115|60117([56]|7[56])|60118[0-5]|64[0-3]|66|65)/,
    groupPattern: /(\d{1,4})(\\d{1,4})?(\\d{1,4})?(\\d{1,4})?(\\d{1,3})?/,
  },
];

const types = [...customCardTypes, ...creditCard.types].reduce(
  (accumulator: any, value: any) => {
    const modifiedName = { name: value.name.toUpperCase().replace(/\s/g, "_") };

    value.test = function (number, eager) {
      return this[eager ? "eagerPattern" : "pattern"].test(number);
    };

    value.group = function (number) {
      return (number.match(this.groupPattern) || []).slice(1).filter(Boolean);
    };

    return [...accumulator, { ...value, ...modifiedName }];
  },
  []
);

const { card, expiration, cvc } = withTypes(types);

function getBrand(pan, brands, defaultBrand) {
  if (!pan) {
    return Object.values(brands);
  }
  const brand = getCardBrandName(pan);

  return brand && brands[brand]
    ? [brands[brand]]
    : Array.isArray(defaultBrand)
    ? defaultBrand
    : [defaultBrand];
}

function getDefaultBrand(pan, brands, defaultBrand) {
  if (!pan) {
    return [defaultBrand];
  }
  const brand = getCardBrandName(pan);

  return brand && brands[brand]
    ? [brands[brand]]
    : Array.isArray(defaultBrand)
    ? defaultBrand
    : [defaultBrand];
}

const getCardBrandName = (pan) => card.type(pan, true);

export { card, expiration, cvc, getBrand, getDefaultBrand, getCardBrandName };